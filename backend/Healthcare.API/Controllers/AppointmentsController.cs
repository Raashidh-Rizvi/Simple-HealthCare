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
                Status = "Scheduled",
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
                    .Where(a => a.DoctorId == doctor.Id)
                    .OrderBy(a => a.AppointmentDate)
                    .Select(a => new
                    {
                        a.Id,
                        a.AppointmentDate,
                        a.Status,
                        a.Notes,
                        PatientName = a.Patient!.User!.FirstName + " " + a.Patient.User.LastName
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
                    .Where(a => a.PatientId == patient.Id)
                    .OrderBy(a => a.AppointmentDate)
                    .Select(a => new
                    {
                        a.Id,
                        a.AppointmentDate,
                        a.Status,
                        a.Notes,
                        DoctorName = a.Doctor!.User!.FirstName + " " + a.Doctor.User.LastName,
                        Specialization = a.Doctor.Specialization
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
    }
}
