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
    public class DoctorsController : ControllerBase
    {
        private readonly HealthcareDbContext _context;

        public DoctorsController(HealthcareDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetDoctors([FromQuery] string? specialization)
        {
            var query = _context.Doctors
                .Include(d => d.User)
                .Where(d => d.Status == "Active")
                .AsQueryable();

            if (!string.IsNullOrEmpty(specialization))
                query = query.Where(d => d.Specialization.ToLower().Contains(specialization.ToLower()));

            var doctors = await query
                .Select(d => new
                {
                    d.Id,
                    d.Specialization,
                    d.LicenseNumber,
                    d.ExperienceYears,
                    d.ConsultationFee,
                    d.Status,
                    FirstName = d.User!.FirstName,
                    LastName = d.User.LastName,
                    Email = d.User.Email
                })
                .ToListAsync();

            return Ok(doctors);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDoctor(int id)
        {
            var doctor = await _context.Doctors
                .Include(d => d.User)
                .Include(d => d.Availabilities)
                .Where(d => d.Id == id)
                .Select(d => new
                {
                    d.Id,
                    d.Specialization,
                    d.LicenseNumber,
                    d.ExperienceYears,
                    d.ConsultationFee,
                    d.Status,
                    FirstName = d.User!.FirstName,
                    LastName = d.User.LastName,
                    Email = d.User.Email,
                    Phone = d.User.Phone,
                    Availabilities = d.Availabilities.Select(a => new
                    {
                        a.Id,
                        a.DayOfWeek,
                        StartTime = a.StartTime.ToString(@"hh\:mm"),
                        EndTime = a.EndTime.ToString(@"hh\:mm"),
                        a.SlotDurationMinutes
                    }).ToList()
                })
                .FirstOrDefaultAsync();

            if (doctor == null) return NotFound();
            return Ok(doctor);
        }

        [HttpGet("{id}/availability")]
        public async Task<IActionResult> GetDoctorAvailability(int id)
        {
            var availability = await _context.DoctorAvailabilities
                .Where(da => da.DoctorId == id)
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

        private int? GetCurrentUserId()
        {
            var val = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(val, out var id) ? id : null;
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMyProfile()
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var doctor = await _context.Doctors
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.UserId == userId);

            if (doctor == null) return NotFound(new { message = "Doctor profile not found" });

            return Ok(new
            {
                doctor.Id,
                doctor.UserId,
                Email = doctor.User?.Email,
                FirstName = doctor.User?.FirstName,
                LastName = doctor.User?.LastName,
                Phone = doctor.User?.Phone,
                doctor.Specialization,
                doctor.LicenseNumber,
                doctor.ExperienceYears,
                doctor.ConsultationFee
            });
        }

        [HttpPut("me")]
        [Authorize]
        public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateDoctorProfileDto dto)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var doctor = await _context.Doctors
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.UserId == userId);

            if (doctor == null) return NotFound(new { message = "Doctor profile not found" });

            // Update User details
            if (doctor.User != null)
            {
                if (!string.IsNullOrWhiteSpace(dto.FirstName))
                    doctor.User.FirstName = dto.FirstName;
                if (!string.IsNullOrWhiteSpace(dto.LastName))
                    doctor.User.LastName = dto.LastName;
                if (dto.Phone != null)
                    doctor.User.Phone = dto.Phone;
            }

            // Update Doctor details
            if (!string.IsNullOrWhiteSpace(dto.Specialization))
                doctor.Specialization = dto.Specialization;
            if (dto.LicenseNumber != null)
                doctor.LicenseNumber = dto.LicenseNumber;
            if (dto.ExperienceYears != null)
                doctor.ExperienceYears = dto.ExperienceYears.Value;
            if (dto.ConsultationFee != null)
                doctor.ConsultationFee = dto.ConsultationFee.Value;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Profile updated successfully" });
        }

        public class UpdateDoctorProfileDto
        {
            public string? FirstName { get; set; }
            public string? LastName { get; set; }
            public string? Phone { get; set; }
            public string? Specialization { get; set; }
            public string? LicenseNumber { get; set; }
            public int? ExperienceYears { get; set; }
            public decimal? ConsultationFee { get; set; }
        }
    }
}
