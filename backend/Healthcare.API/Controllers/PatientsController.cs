using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Healthcare.API.Data;
using Healthcare.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Healthcare.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PatientsController : ControllerBase
    {
        private readonly HealthcareDbContext _context;

        public PatientsController(HealthcareDbContext context)
        {
            _context = context;
        }

        private int? GetCurrentUserId()
        {
            var val = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(val, out var id) ? id : null;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var patient = await _context.Patients
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (patient == null) return NotFound(new { message = "Patient profile not found" });

            return Ok(new
            {
                patient.Id,
                patient.UserId,
                Email = patient.User?.Email,
                FirstName = patient.User?.FirstName,
                LastName = patient.User?.LastName,
                Phone = patient.User?.Phone,
                DateOfBirth = patient.DateOfBirth.ToString("yyyy-MM-dd"),
                PhoneNumber = patient.PhoneNumber,
                Gender = patient.Gender,
                BloodGroup = patient.BloodGroup
            });
        }

        [HttpPut("me")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateProfileDto dto)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var patient = await _context.Patients
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (patient == null) return NotFound(new { message = "Patient profile not found" });

            // Update User details
            if (patient.User != null)
            {
                if (!string.IsNullOrWhiteSpace(dto.FirstName))
                    patient.User.FirstName = dto.FirstName;
                if (!string.IsNullOrWhiteSpace(dto.LastName))
                    patient.User.LastName = dto.LastName;
                if (dto.Phone != null)
                    patient.User.Phone = dto.Phone;
            }

            // Update Patient details
            if (dto.DateOfBirth != null && DateTime.TryParse(dto.DateOfBirth, out var dob))
            {
                patient.DateOfBirth = dob.Date;
            }
            if (dto.PhoneNumber != null)
                patient.PhoneNumber = dto.PhoneNumber;
            if (dto.Gender != null)
                patient.Gender = dto.Gender;
            if (dto.BloodGroup != null)
                patient.BloodGroup = dto.BloodGroup;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Profile updated successfully" });
        }

        public class UpdateProfileDto
        {
            public string? FirstName { get; set; }
            public string? LastName { get; set; }
            public string? Phone { get; set; }
            public string? DateOfBirth { get; set; }
            public string? PhoneNumber { get; set; }
            public string? Gender { get; set; }
            public string? BloodGroup { get; set; }
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchPatients([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
                return BadRequest(new { message = "Search query is required." });

            var q = query.ToLower();
            var patients = await _context.Patients
                .Include(p => p.User)
                .Where(p => (p.User != null && p.User.FirstName.ToLower().Contains(q)) || 
                            (p.User != null && p.User.LastName.ToLower().Contains(q)) || 
                            p.Id.ToString() == q ||
                            (p.PhoneNumber != null && p.PhoneNumber.Contains(q)))
                .Select(p => new {
                    p.Id,
                    FirstName = p.User != null ? p.User.FirstName : "",
                    LastName = p.User != null ? p.User.LastName : "",
                    Name = p.User != null ? p.User.FirstName + " " + p.User.LastName : "Unknown",
                    Age = DateTime.Now.Year - p.DateOfBirth.Year,
                    Gender = p.Gender ?? "Unknown",
                    Phone = p.PhoneNumber ?? (p.User != null ? p.User.Phone : ""),
                    p.UserId
                })
                .Take(20)
                .ToListAsync();

            return Ok(patients);
        }

        [HttpGet("all")]
        [Authorize(Roles = "Admin,admin,Doctor,doctor,Nurse,nurse,Receptionist,receptionist")]
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
                    FirstName = p.User != null ? p.User.FirstName : "Unknown",
                    LastName = p.User != null ? p.User.LastName : "Unknown",
                    Email = p.User != null ? p.User.Email : "Unknown",
                    UserStatus = p.User != null ? p.User.Status : "Unknown",
                    AppointmentCount = p.Appointments.Count
                })
                .ToListAsync();

            return Ok(patients);
        }
    }
}
