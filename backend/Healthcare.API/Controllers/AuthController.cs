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

        /// <summary>Patient self-registration DTO – no role field; role is always Patient.</summary>
        public class PatientRegisterDto
        {
            public required string Email { get; set; }
            public required string Password { get; set; }
            public required string FirstName { get; set; }
            public required string LastName { get; set; }
        }

        /// <summary>Admin-only doctor registration DTO. Caller must supply X-Admin-Email and X-Admin-Password headers.</summary>
        public class DoctorRegisterDto
        {
            public required string Email { get; set; }
            public required string Password { get; set; }
            public required string FirstName { get; set; }
            public required string LastName { get; set; }
            public string Specialization { get; set; } = "General";
        }

        // ──────────────────────────────────────────────────────────────
        // POST api/auth/login
        // ──────────────────────────────────────────────────────────────
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null || user.PasswordHash != dto.Password)
                return Unauthorized(new { message = "Invalid email or password" });

            var token = GenerateJwtToken(user);
            return Ok(new { token, user.Role, user.FirstName, user.LastName });
        }

        // ──────────────────────────────────────────────────────────────
        // POST api/auth/register   (patients self-register)
        // ──────────────────────────────────────────────────────────────
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] PatientRegisterDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest(new { message = "Email already in use" });

            var user = new User
            {
                Email = dto.Email,
                PasswordHash = dto.Password,
                Role = "Patient",
                FirstName = dto.FirstName,
                LastName = dto.LastName
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var patient = new Patient { UserId = user.Id, DateOfBirth = DateTime.UtcNow.Date };
            _context.Patients.Add(patient);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Patient registered successfully" });
        }

        // ──────────────────────────────────────────────────────────────
        // POST api/auth/register-doctor   (admin only)
        //   Requires headers:
        //     X-Admin-Email: <Admin__Email from .env>
        //     X-Admin-Password: <Admin__Password from .env>
        // ──────────────────────────────────────────────────────────────
        [HttpPost("register-doctor")]
        public async Task<IActionResult> RegisterDoctor([FromBody] DoctorRegisterDto dto)
        {
            // Validate admin credentials from request headers
            var adminEmail = _configuration["Admin:Email"];
            var adminPassword = _configuration["Admin:Password"];

            Request.Headers.TryGetValue("X-Admin-Email", out var suppliedEmail);
            Request.Headers.TryGetValue("X-Admin-Password", out var suppliedPassword);

            if (string.IsNullOrWhiteSpace(adminEmail) || string.IsNullOrWhiteSpace(adminPassword))
                return StatusCode(503, new { message = "Admin credentials are not configured on the server." });

            if (suppliedEmail != adminEmail || suppliedPassword != adminPassword)
                return Unauthorized(new { message = "Invalid admin credentials. Only admins can register doctors." });

            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest(new { message = "Email already in use" });

            var user = new User
            {
                Email = dto.Email,
                PasswordHash = dto.Password,
                Role = "Doctor",
                FirstName = dto.FirstName,
                LastName = dto.LastName
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var doctor = new Doctor
            {
                UserId = user.Id,
                Specialization = string.IsNullOrWhiteSpace(dto.Specialization) ? "General" : dto.Specialization
            };
            _context.Doctors.Add(doctor);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Doctor registered successfully" });
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

