using Healthcare.API.Data;
using Healthcare.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Healthcare.API.Controllers
{
    [ApiController]
    [Route("api/encounters")]
    [Authorize]
    public class EncountersController : ControllerBase
    {
        private readonly HealthcareDbContext _context;

        public EncountersController(HealthcareDbContext context)
        {
            _context = context;
        }

        private int? GetCurrentUserId()
        {
            var val = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(val, out var id) ? id : null;
        }

        public class CheckInDto
        {
            public int AppointmentId { get; set; }
        }

        [HttpPost("check-in")]
        public async Task<IActionResult> CheckIn([FromBody] CheckInDto dto)
        {
            var appointment = await _context.Appointments
                .Include(a => a.Encounter)
                .FirstOrDefaultAsync(a => a.Id == dto.AppointmentId);

            if (appointment == null) return NotFound(new { message = "Appointment not found" });
            if (appointment.Status != "Confirmed" && appointment.Status != "Pending")
                return BadRequest(new { message = $"Cannot check in appointment with status {appointment.Status}" });

            if (appointment.Encounter != null)
                return BadRequest(new { message = "Patient is already checked in for this appointment" });

            var encounter = new Encounter
            {
                AppointmentId = appointment.Id,
                PatientId = appointment.PatientId,
                DoctorId = appointment.DoctorId,
                CheckInTime = DateTime.UtcNow,
                Status = "CheckedIn"
            };

            _context.Encounters.Add(encounter);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Checked in successfully", encounterId = encounter.Id });
        }



        [HttpPut("{id}/consultation/start")]
        [Authorize(Roles = "Doctor,doctor")]
        public async Task<IActionResult> StartConsultation(int id)
        {
            var encounter = await _context.Encounters.FirstOrDefaultAsync(e => e.Id == id);
            if (encounter == null) return NotFound();

            if (encounter.Status == "Completed")
                return BadRequest(new { message = "Consultation already completed" });

            encounter.ConsultationStartTime = DateTime.UtcNow;
            encounter.Status = "InConsultation";

            await _context.SaveChangesAsync();
            return Ok(new { message = "Consultation started" });
        }

        public class CompleteConsultationDto
        {
            public string? Notes { get; set; }
            public string? Diagnosis { get; set; }
            public List<OrderDto>? Orders { get; set; }
        }

        [HttpPut("{id}/consultation/complete")]
        [Authorize(Roles = "Doctor,doctor")]
        public async Task<IActionResult> CompleteConsultation(int id, [FromBody] CompleteConsultationDto dto)
        {
            var encounter = await _context.Encounters
                .Include(e => e.Orders)
                .Include(e => e.Appointment)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (encounter == null) return NotFound();

            encounter.Notes = dto.Notes;
            encounter.Diagnosis = dto.Diagnosis;
            encounter.ConsultationEndTime = DateTime.UtcNow;
            encounter.Status = "Completed";

            if (encounter.Appointment != null)
            {
                encounter.Appointment.Status = "Completed";
            }

            if (dto.Orders != null && dto.Orders.Any())
            {
                foreach (var o in dto.Orders)
                {
                    encounter.Orders.Add(new Order
                    {
                        OrderType = o.OrderType,
                        Description = o.Description,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Consultation completed successfully" });
        }

        [HttpGet("today")]
        public async Task<IActionResult> GetTodayEncounters()
        {
            var today = DateTime.UtcNow.Date;
            
            var encounters = await _context.Encounters
                .Include(e => e.Patient).ThenInclude(p => p!.User)
                .Include(e => e.Doctor).ThenInclude(d => d!.User)
                .Include(e => e.Appointment)
                .Where(e => e.CheckInTime != null && e.CheckInTime.Value.Date == today)
                .Select(e => new
                {
                    e.Id,
                    e.AppointmentId,
                    e.CheckInTime,
                    e.Status,
                    PatientName = e.Patient!.User!.FirstName + " " + e.Patient.User.LastName,
                    DoctorName = e.Doctor!.User!.FirstName + " " + e.Doctor.User.LastName,
                    AppointmentTime = e.Appointment != null ? e.Appointment.StartTime.ToString(@"hh\:mm") : null
                })
                .OrderBy(e => e.CheckInTime)
                .ToListAsync();

            return Ok(encounters);
        }
    }


    public class OrderDto
    {
        public required string OrderType { get; set; }
        public required string Description { get; set; }
    }
}
