using Healthcare.API.Data;
using Healthcare.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Healthcare.API.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin,admin")]
    public class AdminController : ControllerBase
    {
        private readonly HealthcareDbContext _context;

        public AdminController(HealthcareDbContext context)
        {
            _context = context;
        }

        private int? GetCurrentUserId()
        {
            var val = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(val, out var id) ? id : null;
        }

        // ─── Doctors ──────────────────────────────────────────────────────────────

        [HttpGet("doctors")]
        public async Task<IActionResult> GetAllDoctors()
        {
            var doctors = await _context.Doctors
                .Include(d => d.User)
                .Select(d => new
                {
                    d.Id,
                    d.Specialization,
                    d.LicenseNumber,
                    d.ExperienceYears,
                    d.ConsultationFee,
                    d.Status,
                    d.UserId,
                    FirstName = d.User!.FirstName,
                    LastName = d.User.LastName,
                    Email = d.User.Email,
                    Phone = d.User.Phone,
                    UserStatus = d.User.Status
                })
                .ToListAsync();

            return Ok(doctors);
        }

        public class CreateDoctorDto
        {
            public required string FirstName { get; set; }
            public required string LastName { get; set; }
            public required string Email { get; set; }
            public required string Password { get; set; }
            public required string Specialization { get; set; }
            public string? LicenseNumber { get; set; }
            public int ExperienceYears { get; set; }
            public decimal ConsultationFee { get; set; }
            public string? Phone { get; set; }
        }

        [HttpPost("doctors")]
        public async Task<IActionResult> CreateDoctor([FromBody] CreateDoctorDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest(new { message = "Email already in use" });

            var user = new User
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                PasswordHash = dto.Password,
                Role = "Doctor",
                Phone = dto.Phone,
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var doctor = new Doctor
            {
                UserId = user.Id,
                Specialization = dto.Specialization,
                LicenseNumber = dto.LicenseNumber,
                ExperienceYears = dto.ExperienceYears,
                ConsultationFee = dto.ConsultationFee,
                Status = "Active"
            };
            _context.Doctors.Add(doctor);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Doctor created", doctorId = doctor.Id });
        }

        [HttpPut("doctors/{id}/status")]
        public async Task<IActionResult> UpdateDoctorStatus(int id, [FromBody] UpdateStatusDto dto)
        {
            var doctor = await _context.Doctors.Include(d => d.User).FirstOrDefaultAsync(d => d.Id == id);
            if (doctor == null) return NotFound();

            doctor.Status = dto.Status;
            if (doctor.User != null) doctor.User.Status = dto.Status;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Doctor status updated" });
        }

        [HttpDelete("doctors/{id}")]
        public async Task<IActionResult> DeleteDoctor(int id)
        {
            var doctor = await _context.Doctors.Include(d => d.User).FirstOrDefaultAsync(d => d.Id == id);
            if (doctor == null) return NotFound();

            // Soft delete: deactivate
            doctor.Status = "Inactive";
            if (doctor.User != null) doctor.User.Status = "Inactive";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Doctor deactivated" });
        }

        // ─── Patients ─────────────────────────────────────────────────────────────

        [HttpGet("patients")]
        public async Task<IActionResult> GetAllPatients()
        {
            var patients = await _context.Patients
                .Include(p => p.User)
                .Select(p => new
                {
                    p.Id,
                    p.DateOfBirth,
                    p.PhoneNumber,
                    p.Gender,
                    p.BloodGroup,
                    FirstName = p.User!.FirstName,
                    LastName = p.User.LastName,
                    Email = p.User.Email,
                    UserStatus = p.User.Status,
                    AppointmentCount = p.Appointments.Count
                })
                .ToListAsync();

            return Ok(patients);
        }

        // ─── Appointments ─────────────────────────────────────────────────────────

        [HttpGet("appointments")]
        public async Task<IActionResult> GetAllAppointments(
            [FromQuery] DateTime? date,
            [FromQuery] string? status,
            [FromQuery] int? doctorId)
        {
            var query = _context.Appointments
                .Include(a => a.Doctor).ThenInclude(d => d!.User)
                .Include(a => a.Patient).ThenInclude(p => p!.User)
                .Include(a => a.Encounter)
                .AsQueryable();

            if (date.HasValue)
                query = query.Where(a => a.AppointmentDate.Date == date.Value.Date);

            if (!string.IsNullOrEmpty(status))
                query = query.Where(a => a.Status == status);

            if (doctorId.HasValue)
                query = query.Where(a => a.DoctorId == doctorId);

            var appointments = await query
                .OrderByDescending(a => a.AppointmentDate)
                .ThenBy(a => a.StartTime)
                .Select(a => new
                {
                    a.Id,
                    a.AppointmentDate,
                    StartTime = a.StartTime.ToString(@"hh\:mm"),
                    EndTime = a.EndTime.ToString(@"hh\:mm"),
                    a.Status,
                    a.Reason,
                    Notes = a.Encounter != null ? a.Encounter.Notes : null,
                    a.CreatedAt,
                    DoctorName = a.Doctor!.User!.FirstName + " " + a.Doctor.User.LastName,
                    Specialization = a.Doctor.Specialization,
                    PatientName = a.Patient!.User!.FirstName + " " + a.Patient.User.LastName,
                    DoctorId = a.DoctorId,
                    PatientId = a.PatientId
                })
                .ToListAsync();

            return Ok(appointments);
        }

        [HttpDelete("appointments/{id}")]
        public async Task<IActionResult> DeleteAppointment(int id)
        {
            var userId = GetCurrentUserId();
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();

            _context.AuditLogs.Add(new AuditLog
            {
                EntityName = "Appointment",
                EntityId = id,
                Action = "DeletedByAdmin",
                PerformedByUserId = userId ?? 0,
                Timestamp = DateTime.UtcNow,
                Details = $"Admin override delete. Previous status: {appointment.Status}"
            });

            _context.Appointments.Remove(appointment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Appointment deleted by admin" });
        }

        // ─── Reports ──────────────────────────────────────────────────────────────

        [HttpGet("reports/summary")]
        public async Task<IActionResult> GetSummaryReport([FromQuery] DateTime? date)
        {
            var targetDate = (date ?? DateTime.UtcNow).Date;

            var totalToday = await _context.Appointments
                .CountAsync(a => a.AppointmentDate.Date == targetDate);

            var byStatus = await _context.Appointments
                .Where(a => a.AppointmentDate.Date == targetDate)
                .GroupBy(a => a.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            var totalDoctors = await _context.Doctors.CountAsync(d => d.Status == "Active");
            var totalPatients = await _context.Patients.CountAsync();
            var totalAppointmentsAll = await _context.Appointments.CountAsync();

            var upcomingWeek = await _context.Appointments
                .CountAsync(a => a.AppointmentDate.Date >= targetDate
                              && a.AppointmentDate.Date < targetDate.AddDays(7)
                              && (a.Status == "Pending" || a.Status == "Confirmed"));

            return Ok(new
            {
                date = targetDate.ToString("yyyy-MM-dd"),
                todayTotal = totalToday,
                byStatus,
                totalActiveDoctors = totalDoctors,
                totalPatients,
                totalAppointmentsAllTime = totalAppointmentsAll,
                upcomingWeek
            });
        }

        [HttpGet("reports/audit")]
        public async Task<IActionResult> GetAuditLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var logs = await _context.AuditLogs
                .OrderByDescending(l => l.Timestamp)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(logs);
        }

        // ─── Specialties / Schedules ──────────────────────────────────────────────

        [HttpGet("schedules")]
        public async Task<IActionResult> GetAllSchedules()
        {
            var schedules = await _context.DoctorAvailabilities
                .Include(da => da.Doctor).ThenInclude(d => d!.User)
                .Select(da => new
                {
                    da.Id,
                    da.DoctorId,
                    DoctorName = da.Doctor!.User!.FirstName + " " + da.Doctor.User.LastName,
                    da.DayOfWeek,
                    StartTime = da.StartTime.ToString(@"hh\:mm"),
                    EndTime = da.EndTime.ToString(@"hh\:mm"),
                    da.SlotDurationMinutes
                })
                .ToListAsync();

            return Ok(schedules);
        }

        public class UpdateStatusDto
        {
            public required string Status { get; set; }
        }
    }
}
