using System.ComponentModel.DataAnnotations;
using Healthcare.API.Data;
using Healthcare.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Healthcare.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AppointmentsController : ControllerBase
    {
        private readonly HealthcareDbContext _context;

        public AppointmentsController(HealthcareDbContext context)
        {
            _context = context;
        }

        // ─── DTOs ────────────────────────────────────────────────────────────────

        public class CreateAppointmentDto
        {
            public int DoctorId { get; set; }
            public DateTime AppointmentDate { get; set; }
            public TimeSpan StartTime { get; set; }
            public TimeSpan EndTime { get; set; }
            public string Type { get; set; } = "In-Person";
            public string? Reason { get; set; }
            public string? Notes { get; set; }
        }

        public class RescheduleAppointmentDto
        {
            public DateTime AppointmentDate { get; set; }
            public TimeSpan StartTime { get; set; }
            public TimeSpan EndTime { get; set; }
            public string? Reason { get; set; }
        }

        public class UpdateStatusDto
        {
            public required string Status { get; set; }
        }


        // ─── Helper ──────────────────────────────────────────────────────────────

        private int? GetCurrentUserId()
        {
            var val = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(val, out var id) ? id : null;
        }

        private async Task CreateNotificationAsync(int userId, string type, string message)
        {
            _context.Notifications.Add(new Notification
            {
                UserId = userId,
                Type = type,
                Message = message,
                SentAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
        }

        private async Task WriteAuditAsync(string entity, int entityId, string action, int performedBy, string? details = null)
        {
            _context.AuditLogs.Add(new AuditLog
            {
                EntityName = entity,
                EntityId = entityId,
                Action = action,
                PerformedByUserId = performedBy,
                Timestamp = DateTime.UtcNow,
                Details = details
            });
            await _context.SaveChangesAsync();
        }

        // ─── GET available slots ──────────────────────────────────────────────────

        /// <summary>
        /// Returns available time slots for a doctor on a given date.
        /// Slot generation algorithm:
        ///   1. Find DoctorAvailability for DayOfWeek
        ///   2. Check DoctorBlockedDates for the date
        ///   3. Generate slots (start → end − duration, step = duration)
        ///   4. Remove already-booked slots (Pending|Confirmed)
        ///   5. Remove past slots if date is today
        /// </summary>
        [HttpGet("available-slots")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAvailableSlots([FromQuery] int doctorId, [FromQuery] DateTime date)
        {
            var dateOnly = date.Date;
            var dayOfWeek = dateOnly.DayOfWeek;

            // 1. Find availability for that day
            var availability = await _context.DoctorAvailabilities
                .FirstOrDefaultAsync(da => da.DoctorId == doctorId && da.DayOfWeek == dayOfWeek);

            if (availability == null)
                return Ok(new { slots = new List<object>(), message = "Doctor not available on this day" });

            // 2. Check blocked dates
            var isBlocked = await _context.DoctorBlockedDates
                .AnyAsync(bd => bd.DoctorId == doctorId && bd.BlockedDate.Date == dateOnly);

            if (isBlocked)
                return Ok(new { slots = new List<object>(), message = "Doctor is not available on this date (blocked)" });

            // 3. Generate all slots
            var allSlots = new List<(TimeSpan Start, TimeSpan End)>();
            var slotDuration = TimeSpan.FromMinutes(availability.SlotDurationMinutes);
            var current = availability.StartTime;
            while (current + slotDuration <= availability.EndTime)
            {
                allSlots.Add((current, current + slotDuration));
                current += slotDuration;
            }

            // 4. Fetch booked start times
            var bookedSlots = await _context.Appointments
                .Where(a => a.DoctorId == doctorId
                         && a.AppointmentDate.Date == dateOnly
                         && (a.Status == "Pending" || a.Status == "Confirmed"))
                .Select(a => a.StartTime)
                .ToListAsync();

            // 5. Remove past slots if today; return ALL with isBooked flag so frontend can show them
            var now = DateTime.Now.TimeOfDay;
            var isToday = dateOnly == DateTime.Now.Date;

            var available = allSlots
                .Where(s => !isToday || s.Start > now)
                .Select(s => new
                {
                    startTime = s.Start.ToString(@"hh\:mm"),
                    endTime = s.End.ToString(@"hh\:mm"),
                    startTimeSpan = s.Start,
                    endTimeSpan = s.End,
                    isBooked = bookedSlots.Contains(s.Start)
                })
                .ToList();

            return Ok(new { slots = available });
        }

        // ─── POST /api/appointments — Book (transaction-safe, DB-enforced) ────────

        [HttpPost]
        public async Task<IActionResult> CreateAppointment([FromBody] CreateAppointmentDto dto)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
            if (patient == null) return BadRequest(new { message = "Only patients can create appointments" });

            var startTime = dto.StartTime;
            var endTime = dto.EndTime;

            // If StartTime/EndTime are not provided (e.g. from Flutter), extract from AppointmentDate.TimeOfDay
            if (startTime == TimeSpan.Zero && dto.AppointmentDate.TimeOfDay != TimeSpan.Zero)
            {
                startTime = dto.AppointmentDate.TimeOfDay;
                endTime = startTime.Add(TimeSpan.FromMinutes(30)); // default 30-min slot
            }

            // Begin transaction — prevents race conditions
            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Re-check slot inside the transaction (second layer of protection)
                var conflict = await _context.Appointments.AnyAsync(a =>
                    a.DoctorId == dto.DoctorId
                    && a.AppointmentDate.Date == dto.AppointmentDate.Date
                    && a.StartTime == startTime
                    && (a.Status == "Pending" || a.Status == "Confirmed"));

                if (conflict)
                {
                    await transaction.RollbackAsync();
                    return Conflict(new { message = "This time slot has just been booked by another patient. Please choose a different slot." });
                }

                var appointment = new Appointment
                {
                    DoctorId = dto.DoctorId,
                    PatientId = patient.Id,
                    AppointmentDate = dto.AppointmentDate.Date,
                    StartTime = startTime,
                    EndTime = endTime,
                    Status = "Pending",
                    Type = dto.Type,
                    Reason = dto.Reason,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Appointments.Add(appointment);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Notify patient
                await CreateNotificationAsync(userId.Value, "Booking",
                    $"Your appointment with Doctor ID {dto.DoctorId} on {dto.AppointmentDate:dd MMM yyyy} at {dto.StartTime:hh\\:mm} has been submitted and is pending confirmation.");

                // Audit
                await WriteAuditAsync("Appointment", appointment.Id, "Created", userId.Value,
                    $"PatientId={patient.Id}, DoctorId={dto.DoctorId}, Date={dto.AppointmentDate:yyyy-MM-dd}, Slot={dto.StartTime}");

                return Ok(new { message = "Appointment created successfully", appointment.Id });
            }
            catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("UX_Doctor_TimeSlot") == true)
            {
                await transaction.RollbackAsync();
                return Conflict(new { message = "This time slot is already booked. Please choose a different slot." });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // ─── GET /api/appointments/me ─────────────────────────────────────────────

        [HttpGet("me")]
        public async Task<IActionResult> GetMyAppointments()
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return Unauthorized();

            if (user.Role.Equals("Doctor", StringComparison.OrdinalIgnoreCase))
            {
                var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.UserId == userId);
                if (doctor == null) return NotFound();

                var rawDoctor = await _context.Appointments
                    .Include(a => a.Patient).ThenInclude(p => p!.User)
                    .Include(a => a.Encounter).ThenInclude(e => e!.Vitals)
                    .Include(a => a.Encounter).ThenInclude(e => e!.Orders)
                    .Where(a => a.DoctorId == doctor.Id)
                    .OrderBy(a => a.AppointmentDate).ThenBy(a => a.StartTime)
                    .ToListAsync();

                var appointments = rawDoctor.Select(a => new
                {
                    a.Id,
                    AppointmentDate = a.AppointmentDate.Date,
                    StartTime = a.StartTime.ToString(@"hh\:mm"),
                    EndTime = a.EndTime.ToString(@"hh\:mm"),
                    a.Status,
                    a.Type,
                    a.Reason,
                    Notes = a.Encounter?.Notes,
                    Diagnosis = a.Encounter?.Diagnosis,
                    a.CreatedAt,
                    PatientName = a.Patient!.User!.FirstName + " " + a.Patient.User.LastName,
                    PatientId = a.PatientId,
                    DateOfBirth = a.Patient.DateOfBirth,
                    Gender = a.Patient.Gender,
                    BloodGroup = a.Patient.BloodGroup,
                    Phone = a.Patient.PhoneNumber,
                    Allergies = a.Patient.Allergies,
                    Conditions = a.Patient.Conditions,
                    EncounterId = a.Encounter?.Id,
                    EncounterStatus = a.Encounter?.Status,
                    Vitals = (a.Encounter?.Vitals ?? new List<Vital>()).Select(v => new
                    {
                        v.Id, v.HeartRate, v.BloodPressureSystolic, v.BloodPressureDiastolic, v.Temperature, Weight = v.WeightKg, v.RecordedAt
                    }).ToList(),
                    Orders = (a.Encounter?.Orders ?? new List<Order>()).Select(o => new
                    {
                        o.Id, o.OrderType, o.Description, o.CreatedAt
                    }).ToList()
                }).ToList();

                return Ok(appointments);
            }
            else if (user.Role.Equals("Patient", StringComparison.OrdinalIgnoreCase))
            {
                var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
                if (patient == null) return NotFound();

                var rawPatient = await _context.Appointments
                    .Include(a => a.Doctor).ThenInclude(d => d!.User)
                    .Include(a => a.Encounter).ThenInclude(e => e!.Vitals)
                    .Include(a => a.Encounter).ThenInclude(e => e!.Orders)
                    .Where(a => a.PatientId == patient.Id)
                    .OrderByDescending(a => a.AppointmentDate).ThenBy(a => a.StartTime)
                    .ToListAsync();


                var appointments = rawPatient.Select(a => new
                {
                    a.Id,
                    AppointmentDate = a.AppointmentDate.Date,
                    StartTime = a.StartTime.ToString(@"hh\:mm"),
                    EndTime = a.EndTime.ToString(@"hh\:mm"),
                    a.Status,
                    a.Type,
                    a.Reason,
                    Notes = a.Encounter?.Notes,
                    Diagnosis = a.Encounter?.Diagnosis,
                    a.CreatedAt,
                    a.DoctorId,
                    DoctorName = a.Doctor!.User!.FirstName + " " + a.Doctor.User.LastName,
                    Specialization = a.Doctor.Specialization,
                    ConsultationFee = a.Doctor.ConsultationFee,
                    EncounterId = a.Encounter?.Id,
                    EncounterStatus = a.Encounter?.Status,
                    Vitals = (a.Encounter?.Vitals ?? new List<Vital>()).Select(v => new
                    {
                        v.Id, v.HeartRate, v.BloodPressureSystolic, v.BloodPressureDiastolic, v.Temperature, Weight = v.WeightKg, v.RecordedAt
                    }).ToList(),
                    Orders = (a.Encounter?.Orders ?? new List<Order>()).Select(o => new
                    {
                        o.Id, o.OrderType, o.Description, o.CreatedAt
                    }).ToList()
                }).ToList();

                return Ok(appointments);
            }

            return BadRequest();
        }

        // ─── GET /api/appointments/today (For Reception/Nurse) ──────────────────

        [HttpGet("today")]
        [Authorize(Roles = "Receptionist,Nurse,Admin")]
        public async Task<IActionResult> GetTodayAppointments()
        {
            var today = DateTime.UtcNow.Date;
            
            var appointments = await _context.Appointments
                .Include(a => a.Doctor).ThenInclude(d => d!.User)
                .Include(a => a.Patient).ThenInclude(p => p!.User)
                .Include(a => a.Encounter)
                .Where(a => a.AppointmentDate.Date == today)
                .OrderBy(a => a.StartTime)
                .Select(a => new
                {
                    a.Id,
                    a.AppointmentDate,
                    StartTime = a.StartTime.ToString(@"hh\:mm"),
                    EndTime = a.EndTime.ToString(@"hh\:mm"),
                    a.Status,
                    a.Type,
                    a.Reason,
                    a.CreatedAt,
                    DoctorName = a.Doctor!.User!.FirstName + " " + a.Doctor.User.LastName,
                    Specialization = a.Doctor.Specialization,
                    PatientName = a.Patient!.User!.FirstName + " " + a.Patient.User.LastName,
                    PatientId = a.PatientId,
                    EncounterId = a.Encounter != null ? a.Encounter.Id : (int?)null,
                    EncounterStatus = a.Encounter != null ? a.Encounter.Status : null
                })
                .ToListAsync();

            return Ok(appointments);
        }

        // ─── PUT /api/appointments/{id}/cancel ────────────────────────────────────

        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> CancelAppointment(int id)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var appointment = await _context.Appointments
                .Include(a => a.Patient).ThenInclude(p => p!.User)
                .Include(a => a.Doctor).ThenInclude(d => d!.User)
                .FirstOrDefaultAsync(a => a.Id == id);
            if (appointment == null) return NotFound();

            if (appointment.Status == "Completed" || appointment.Status == "Cancelled")
                return BadRequest(new { message = $"Cannot cancel an appointment with status '{appointment.Status}'" });

            appointment.Status = "Cancelled";
            await _context.SaveChangesAsync();

            // Notify patient
            if (appointment.Patient?.UserId != null)
                await CreateNotificationAsync(appointment.Patient.UserId, "Cancellation",
                    $"Your appointment on {appointment.AppointmentDate:dd MMM yyyy} at {appointment.StartTime:hh\\:mm} has been cancelled.");

            await WriteAuditAsync("Appointment", appointment.Id, "Cancelled", userId.Value);

            return Ok(new { message = "Appointment cancelled" });
        }

        // ─── PUT /api/appointments/{id}/reschedule ────────────────────────────────

        [HttpPut("{id}/reschedule")]
        public async Task<IActionResult> RescheduleAppointment(int id, [FromBody] RescheduleAppointmentDto dto)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var appointment = await _context.Appointments
                    .Include(a => a.Patient)
                    .FirstOrDefaultAsync(a => a.Id == id);
                if (appointment == null) return NotFound();

                if (appointment.Status == "Completed" || appointment.Status == "Cancelled")
                    return BadRequest(new { message = "Cannot reschedule a completed or cancelled appointment" });

                // Check the new slot is free
                var conflict = await _context.Appointments.AnyAsync(a =>
                    a.DoctorId == appointment.DoctorId
                    && a.AppointmentDate.Date == dto.AppointmentDate.Date
                    && a.StartTime == dto.StartTime
                    && a.Id != id
                    && (a.Status == "Pending" || a.Status == "Confirmed"));

                if (conflict)
                {
                    await transaction.RollbackAsync();
                    return Conflict(new { message = "The new time slot is already booked. Please choose a different slot." });
                }

                // Cancel old and rebook (atomic)
                appointment.Status = "Cancelled";
                await _context.SaveChangesAsync();

                var newAppointment = new Appointment
                {
                    DoctorId = appointment.DoctorId,
                    PatientId = appointment.PatientId,
                    AppointmentDate = dto.AppointmentDate.Date,
                    StartTime = dto.StartTime,
                    EndTime = dto.EndTime,
                    Status = "Pending",
                    Type = appointment.Type,
                    Reason = dto.Reason ?? appointment.Reason,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Appointments.Add(newAppointment);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                if (appointment.Patient?.UserId != null)
                    await CreateNotificationAsync(appointment.Patient.UserId, "Booking",
                        $"Your appointment has been rescheduled to {dto.AppointmentDate:dd MMM yyyy} at {dto.StartTime:hh\\:mm}.");

                await WriteAuditAsync("Appointment", newAppointment.Id, "Rescheduled", userId.Value,
                    $"OriginalAppointmentId={id}");

                return Ok(new { message = "Appointment rescheduled", newAppointmentId = newAppointment.Id });
            }
            catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("UX_Doctor_TimeSlot") == true)
            {
                await transaction.RollbackAsync();
                return Conflict(new { message = "That time slot is already booked." });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // ─── Doctor actions ───────────────────────────────────────────────────────

        [HttpPut("{id}/confirm")]
        [Authorize(Roles = "Doctor,doctor")]
        public async Task<IActionResult> ConfirmAppointment(int id)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var appointment = await _context.Appointments
                .Include(a => a.Patient)
                .FirstOrDefaultAsync(a => a.Id == id);
            if (appointment == null) return NotFound();
            if (appointment.Status != "Pending")
                return BadRequest(new { message = "Only pending appointments can be confirmed" });

            appointment.Status = "Confirmed";
            await _context.SaveChangesAsync();

            if (appointment.Patient?.UserId != null)
                await CreateNotificationAsync(appointment.Patient.UserId, "Booking",
                    $"Your appointment on {appointment.AppointmentDate:dd MMM yyyy} at {appointment.StartTime:hh\\:mm} has been confirmed by your doctor.");

            await WriteAuditAsync("Appointment", appointment.Id, "Confirmed", userId.Value);
            return Ok(new { message = "Appointment confirmed" });
        }

        [HttpPut("{id}/reject")]
        [Authorize(Roles = "Doctor,doctor")]
        public async Task<IActionResult> RejectAppointment(int id)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var appointment = await _context.Appointments
                .Include(a => a.Patient)
                .FirstOrDefaultAsync(a => a.Id == id);
            if (appointment == null) return NotFound();
            if (appointment.Status != "Pending")
                return BadRequest(new { message = "Only pending appointments can be rejected" });

            appointment.Status = "Rejected";
            await _context.SaveChangesAsync();

            if (appointment.Patient?.UserId != null)
                await CreateNotificationAsync(appointment.Patient.UserId, "Cancellation",
                    $"Your appointment on {appointment.AppointmentDate:dd MMM yyyy} at {appointment.StartTime:hh\\:mm} was rejected by your doctor.");

            await WriteAuditAsync("Appointment", appointment.Id, "Rejected", userId.Value);
            return Ok(new { message = "Appointment rejected" });
        }

        [HttpPut("{id}/complete")]
        [Authorize(Roles = "Doctor,doctor")]
        public async Task<IActionResult> CompleteAppointment(int id)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();
            if (appointment.Status != "Confirmed")
                return BadRequest(new { message = "Only confirmed appointments can be marked as completed" });

            appointment.Status = "Completed";
            await _context.SaveChangesAsync();
            await WriteAuditAsync("Appointment", appointment.Id, "Completed", userId.Value);
            return Ok(new { message = "Appointment completed" });
        }

        [HttpPut("{id}/no-show")]
        [Authorize(Roles = "Doctor,doctor")]
        public async Task<IActionResult> MarkNoShow(int id)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();
            if (appointment.Status != "Confirmed")
                return BadRequest(new { message = "Only confirmed appointments can be marked as no-show" });

            appointment.Status = "NoShow";
            await _context.SaveChangesAsync();
            await WriteAuditAsync("Appointment", appointment.Id, "NoShow", userId.Value);
            return Ok(new { message = "Appointment marked as no-show" });
        }

        // ─── Status (legacy) ─────────────────────────────────────────────────────

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusDto dto)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();

            appointment.Status = dto.Status;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Status updated" });
        }



        // ─── Notifications ────────────────────────────────────────────────────────

        [HttpGet("notifications")]
        public async Task<IActionResult> GetMyNotifications()
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.SentAt)
                .Take(50)
                .ToListAsync();

            return Ok(notifications);
        }

        [HttpPut("notifications/{notificationId}/read")]
        public async Task<IActionResult> MarkNotificationRead(int notificationId)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);
            if (notification == null) return NotFound();

            notification.IsRead = true;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Marked as read" });
        }

        [HttpPut("notifications/read-all")]
        public async Task<IActionResult> MarkAllNotificationsRead()
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));

            return Ok(new { message = "All marked as read" });
        }


    }
}
