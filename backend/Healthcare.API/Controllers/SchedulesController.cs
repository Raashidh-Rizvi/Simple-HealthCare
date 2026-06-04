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
    [Authorize(Roles = "Doctor,doctor")]
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

        // ─── Schedule Slots (legacy) ──────────────────────────────────────────────

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

        // ─── Doctor Availability (new) ────────────────────────────────────────────

        [HttpGet("availability")]
        public async Task<IActionResult> GetAvailability()
        {
            var doctor = await GetCurrentDoctorAsync();
            if (doctor == null) return Unauthorized();

            var availability = await _context.DoctorAvailabilities
                .Where(da => da.DoctorId == doctor.Id)
                .OrderBy(da => da.DayOfWeek)
                .Select(da => new
                {
                    da.Id,
                    da.DayOfWeek,
                    StartTime = da.StartTime.ToString(@"hh\:mm"),
                    EndTime = da.EndTime.ToString(@"hh\:mm"),
                    da.SlotDurationMinutes
                })
                .ToListAsync();

            return Ok(availability);
        }

        [HttpPost("availability")]
        public async Task<IActionResult> CreateAvailability([FromBody] AvailabilityDto dto)
        {
            var doctor = await GetCurrentDoctorAsync();
            if (doctor == null) return Unauthorized();

            // Remove existing availability for that day to avoid duplicates
            var existing = await _context.DoctorAvailabilities
                .FirstOrDefaultAsync(da => da.DoctorId == doctor.Id && da.DayOfWeek == dto.DayOfWeek);
            if (existing != null)
                _context.DoctorAvailabilities.Remove(existing);

            var availability = new DoctorAvailability
            {
                DoctorId = doctor.Id,
                DayOfWeek = dto.DayOfWeek,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                SlotDurationMinutes = dto.SlotDurationMinutes > 0 ? dto.SlotDurationMinutes : 30
            };

            _context.DoctorAvailabilities.Add(availability);
            await _context.SaveChangesAsync();

            return Ok(availability);
        }

        [HttpDelete("availability/{id}")]
        public async Task<IActionResult> DeleteAvailability(int id)
        {
            var doctor = await GetCurrentDoctorAsync();
            if (doctor == null) return Unauthorized();

            var da = await _context.DoctorAvailabilities
                .FirstOrDefaultAsync(x => x.Id == id && x.DoctorId == doctor.Id);
            if (da == null) return NotFound();

            _context.DoctorAvailabilities.Remove(da);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Availability removed" });
        }

        // ─── Blocked Dates ────────────────────────────────────────────────────────

        [HttpGet("blocked-dates")]
        public async Task<IActionResult> GetBlockedDates()
        {
            var doctor = await GetCurrentDoctorAsync();
            if (doctor == null) return Unauthorized();

            var blocked = await _context.DoctorBlockedDates
                .Where(bd => bd.DoctorId == doctor.Id)
                .OrderBy(bd => bd.BlockedDate)
                .Select(bd => new
                {
                    bd.Id,
                    bd.BlockedDate,
                    bd.Reason
                })
                .ToListAsync();

            return Ok(blocked);
        }

        [HttpPost("blocked-dates")]
        public async Task<IActionResult> AddBlockedDate([FromBody] BlockedDateDto dto)
        {
            var doctor = await GetCurrentDoctorAsync();
            if (doctor == null) return Unauthorized();

            var blocked = new DoctorBlockedDate
            {
                DoctorId = doctor.Id,
                BlockedDate = dto.BlockedDate.Date,
                Reason = dto.Reason
            };

            _context.DoctorBlockedDates.Add(blocked);
            await _context.SaveChangesAsync();

            return Ok(blocked);
        }

        [HttpDelete("blocked-dates/{id}")]
        public async Task<IActionResult> RemoveBlockedDate(int id)
        {
            var doctor = await GetCurrentDoctorAsync();
            if (doctor == null) return Unauthorized();

            var bd = await _context.DoctorBlockedDates
                .FirstOrDefaultAsync(x => x.Id == id && x.DoctorId == doctor.Id);
            if (bd == null) return NotFound();

            _context.DoctorBlockedDates.Remove(bd);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Blocked date removed" });
        }
    }

    // ─── DTOs ────────────────────────────────────────────────────────────────────

    public class ScheduleSlotDto
    {
        public DayOfWeek DayOfWeek { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public bool IsAvailable { get; set; }
    }

    public class AvailabilityDto
    {
        public DayOfWeek DayOfWeek { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public int SlotDurationMinutes { get; set; } = 30;
    }

    public class BlockedDateDto
    {
        public DateTime BlockedDate { get; set; }
        public string? Reason { get; set; }
    }
}
