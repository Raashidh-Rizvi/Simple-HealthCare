using Healthcare.API.Data;
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
        public async Task<IActionResult> GetDoctors()
        {
            var doctors = await _context.Doctors
                .Include(d => d.User)
                .Select(d => new
                {
                    d.Id,
                    d.Specialization,
                    FirstName = d.User!.FirstName,
                    LastName = d.User!.LastName,
                    Email = d.User!.Email
                })
                .ToListAsync();

            return Ok(doctors);
        }
    }
}
