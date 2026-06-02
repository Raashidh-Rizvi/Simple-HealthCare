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
    public class CareProvidersController : ControllerBase
    {
        private readonly HealthcareDbContext _context;

        public CareProvidersController(HealthcareDbContext context)
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
        public async Task<IActionResult> GetCareProviders()
        {
            var doctor = await GetCurrentDoctorAsync();
            if (doctor == null) return Unauthorized();

            var providers = await _context.CareProviders
                .Where(cp => cp.DoctorId == doctor.Id)
                .ToListAsync();

            return Ok(providers);
        }

        [HttpPost]
        public async Task<IActionResult> CreateCareProvider([FromBody] CareProviderDto dto)
        {
            var doctor = await GetCurrentDoctorAsync();
            if (doctor == null) return Unauthorized();

            var provider = new CareProvider
            {
                DoctorId = doctor.Id,
                Name = dto.Name,
                Role = dto.Role,
                PhoneNumber = dto.PhoneNumber
            };

            _context.CareProviders.Add(provider);
            await _context.SaveChangesAsync();

            return Ok(provider);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCareProvider(int id)
        {
            var doctor = await GetCurrentDoctorAsync();
            if (doctor == null) return Unauthorized();

            var provider = await _context.CareProviders.FirstOrDefaultAsync(cp => cp.Id == id && cp.DoctorId == doctor.Id);
            if (provider == null) return NotFound();

            _context.CareProviders.Remove(provider);
            await _context.SaveChangesAsync();

            return Ok();
        }
    }

    public class CareProviderDto
    {
        public required string Name { get; set; }
        public required string Role { get; set; }
        public string? PhoneNumber { get; set; }
    }
}
