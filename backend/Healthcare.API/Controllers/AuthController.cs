using Healthcare.API.Data;
using Healthcare.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Healthcare.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly HealthcareDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(HealthcareDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public class LoginDto { public required string Email { get; set; } public required string Password { get; set; } }
        public class RegisterDto { public required string Email { get; set; } public required string Password { get; set; } public required string Role { get; set; } public required string FirstName { get; set; } public required string LastName { get; set; } public string? Specialization { get; set; } }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null || user.PasswordHash != dto.Password) return Unauthorized(new { message = "Invalid email or password" });

            var token = GenerateJwtToken(user);
            return Ok(new { token, user.Role, user.FirstName, user.LastName });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email)) return BadRequest(new { message = "Email already in use" });

            var userRole = dto.Role.ToLower() == "doctor" ? "Doctor" : "Patient";
            var user = new User { Email = dto.Email, PasswordHash = dto.Password, Role = userRole, FirstName = dto.FirstName, LastName = dto.LastName };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            if (dto.Role.ToLower() == "doctor")
            {
                var doctor = new Doctor { UserId = user.Id, Specialization = string.IsNullOrWhiteSpace(dto.Specialization) ? "General" : dto.Specialization };
                _context.Doctors.Add(doctor);
                await _context.SaveChangesAsync();
            }
            else if (dto.Role.ToLower() == "patient")
            {
                var patient = new Patient { UserId = user.Id, DateOfBirth = DateTime.UtcNow.Date };
                _context.Patients.Add(patient);
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "User registered successfully" });
        }

        private string GenerateJwtToken(User user)
        {
            var claims = new[] {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                _configuration["Jwt:Issuer"],
                _configuration["Jwt:Audience"],
                claims,
                expires: DateTime.Now.AddDays(7),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
