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

        public class CreateAppointmentDto
        {
            public int DoctorId { get; set; }
            public DateTime AppointmentDate { get; set; }
            public string? Notes { get; set; }
        }

        public class UpdateStatusDto
        {
            public required string Status { get; set; }
        }

        public class ConsultationDataDto
        {
            public required string Status { get; set; }
            public string? Notes { get; set; }
            public List<VitalDto>? Vitals { get; set; }
            public List<OrderDto>? Orders { get; set; }
        }

        public class VitalDto
        {
            [RegularExpression(@"^\d{2,3}$", ErrorMessage = "Heart rate must be a valid number")]
            public string? HeartRate { get; set; }
            [RegularExpression(@"^\d{2,3}\/\d{2,3}$", ErrorMessage = "Blood pressure must be in format SYS/DIA")]
            public string? BloodPressure { get; set; }
            [RegularExpression(@"^\d{2,3}(\.\d{1,2})?$", ErrorMessage = "Temperature must be a valid number")]
            public string? Temperature { get; set; }
            [RegularExpression(@"^\d{2,3}(\.\d{1,2})?$", ErrorMessage = "Weight must be a valid number")]
            public string? Weight { get; set; }
        }

        public class OrderDto
        {
            public required string OrderType { get; set; }
            public required string Description { get; set; }
        }

        [HttpPost]
        public async Task<IActionResult> CreateAppointment([FromBody] CreateAppointmentDto dto)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out var userId)) return Unauthorized();

            var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
            if (patient == null) return BadRequest(new { message = "Only patients can create appointments" });

            var appointment = new Appointment
            {
                DoctorId = dto.DoctorId,
                PatientId = patient.Id,
                AppointmentDate = dto.AppointmentDate,
                Status = "start",
                Notes = dto.Notes
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Appointment created successfully", appointment.Id });
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMyAppointments()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out var userId)) return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return Unauthorized();

            if (user.Role.ToLower() == "doctor")
            {
                var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.UserId == userId);
                if (doctor == null) return NotFound();

                var appointments = await _context.Appointments
                    .Include(a => a.Patient)
                    .ThenInclude(p => p!.User)
                    .Include(a => a.Vitals)
                    .Where(a => a.DoctorId == doctor.Id)
                    .OrderBy(a => a.AppointmentDate)
                    .Select(a => new
                    {
                        a.Id,
                        a.AppointmentDate,
                        a.Status,
                        a.Notes,
                        PatientName = a.Patient!.User!.FirstName + " " + a.Patient.User.LastName,
                        Vitals = a.Vitals.OrderByDescending(v => v.RecordedAt).ToList()
                    })
                    .ToListAsync();
                
                return Ok(appointments);
            }
            else if (user.Role.ToLower() == "patient")
            {
                var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
                if (patient == null) return NotFound();

                var appointments = await _context.Appointments
                    .Include(a => a.Doctor)
                    .ThenInclude(d => d!.User)
                    .Include(a => a.Vitals)
                    .Where(a => a.PatientId == patient.Id)
                    .OrderBy(a => a.AppointmentDate)
                    .Select(a => new
                    {
                        a.Id,
                        a.AppointmentDate,
                        a.Status,
                        a.Notes,
                        DoctorName = a.Doctor!.User!.FirstName + " " + a.Doctor.User.LastName,
                        Specialization = a.Doctor.Specialization,
                        Vitals = a.Vitals.OrderByDescending(v => v.RecordedAt).ToList()
                    })
                    .ToListAsync();

                return Ok(appointments);
            }

            return BadRequest();
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusDto dto)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();

            appointment.Status = dto.Status;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Status updated" });
        }

        [HttpPost("{id}/consultation")]
        public async Task<IActionResult> SaveConsultation(int id, [FromBody] ConsultationDataDto dto)
        {
            var appointment = await _context.Appointments
                .Include(a => a.Vitals)
                .Include(a => a.Orders)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (appointment == null) return NotFound();

            appointment.Status = dto.Status;
            appointment.Notes = dto.Notes;

            if (dto.Vitals != null && dto.Vitals.Any())
            {
                foreach (var v in dto.Vitals)
                {
                    appointment.Vitals.Add(new Vital
                    {
                        HeartRate = v.HeartRate,
                        BloodPressure = v.BloodPressure,
                        Temperature = v.Temperature,
                        Weight = v.Weight,
                        RecordedAt = DateTime.UtcNow
                    });
                }
            }

            if (dto.Orders != null && dto.Orders.Any())
            {
                foreach (var o in dto.Orders)
                {
                    appointment.Orders.Add(new Order
                    {
                        OrderType = o.OrderType,
                        Description = o.Description,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Consultation saved successfully" });
        }

        [HttpPost("{id}/vitals")]
        public async Task<IActionResult> AddVitals(int id, [FromBody] VitalDto dto)
        {
            var appointment = await _context.Appointments
                .Include(a => a.Vitals)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (appointment == null) return NotFound();

            var vital = new Vital
            {
                HeartRate = dto.HeartRate,
                BloodPressure = dto.BloodPressure,
                Temperature = dto.Temperature,
                Weight = dto.Weight,
                RecordedAt = DateTime.UtcNow
            };
            
            appointment.Vitals.Add(vital);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Vitals added successfully", vital });
        }
    }
}
