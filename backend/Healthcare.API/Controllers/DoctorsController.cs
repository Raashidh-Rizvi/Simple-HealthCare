using Healthcare.API.Data;
using Healthcare.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
    }
}
