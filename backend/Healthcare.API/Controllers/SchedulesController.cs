using System.Security.Claims;
using Healthcare.API.Data;
using Healthcare.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Healthcare.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Doctor")]
    public class SchedulesController : ControllerBase
    {
        private readonly HealthcareDbContext _context;

        public SchedulesController(HealthcareDbContext context)
        {
            _context = context;
        }

        private async Task<Doctor?> GetCurrentDoctorAsync()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return null;
            return await _context.Doctors.FirstOrDefaultAsync(d => d.UserId == userId);
        }

        [HttpGet]
        public async Task<IActionResult> GetScheduleSlots()
        {
            var doctor = await GetCurrentDoctorAsync();
            if (doctor == null) return Unauthorized();

            var slots = await _context.ScheduleSlots
                .Where(s => s.DoctorId == doctor.Id)
                .OrderBy(s => s.DayOfWeek)
                .ThenBy(s => s.StartTime)
                .ToListAsync();

            return Ok(slots);
        }

        [HttpPost]
        public async Task<IActionResult> CreateScheduleSlot([FromBody] ScheduleSlotDto dto)
        {
            var doctor = await GetCurrentDoctorAsync();
            if (doctor == null) return Unauthorized();

            var slot = new ScheduleSlot
            {
                DoctorId = doctor.Id,
                DayOfWeek = dto.DayOfWeek,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                IsAvailable = dto.IsAvailable
            };

            _context.ScheduleSlots.Add(slot);
            await _context.SaveChangesAsync();

            return Ok(slot);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteScheduleSlot(int id)
        {
            var doctor = await GetCurrentDoctorAsync();
            if (doctor == null) return Unauthorized();

            var slot = await _context.ScheduleSlots.FirstOrDefaultAsync(s => s.Id == id && s.DoctorId == doctor.Id);
            if (slot == null) return NotFound();

            _context.ScheduleSlots.Remove(slot);
            await _context.SaveChangesAsync();

            return Ok();
        }
    }

    public class ScheduleSlotDto
    {
        public DayOfWeek DayOfWeek { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public bool IsAvailable { get; set; }
    }
}
