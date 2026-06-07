using Healthcare.API.Models.DTOs;
using Healthcare.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Healthcare.API.Controllers
{
    [ApiController]
    [Route("api/vitals")]
    [Authorize]
    public class VitalsController : ControllerBase
    {
        private readonly IVitalService _vitalService;

        public VitalsController(IVitalService vitalService)
        {
            _vitalService = vitalService;
        }

        private int? GetCurrentUserId()
        {
            var val = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(val, out var id) ? id : null;
        }

        private string GetCurrentUserRole()
        {
            return User.FindFirstValue(ClaimTypes.Role) ?? "";
        }

        [HttpPost]
        public async Task<IActionResult> CreateVital([FromBody] CreateVitalDto dto)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();
            
            var role = GetCurrentUserRole();
            
            // Patient can only submit if IsHomeReading is true
            if (role.Equals("Patient", StringComparison.OrdinalIgnoreCase))
            {
                if (!dto.IsHomeReading)
                    return Forbid();
            }

            try
            {
                var vital = await _vitalService.CreateVitalAsync(dto, userId.Value, role);
                return CreatedAtAction(nameof(GetVital), new { id = vital.Id }, vital);
            }
            catch (System.ComponentModel.DataAnnotations.ValidationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetVital(int id)
        {
            try
            {
                var vital = await _vitalService.GetVitalAsync(id);
                return Ok(vital);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateVital(int id, [FromBody] UpdateVitalDto dto)
        {
            var userId = GetCurrentUserId();
            var role = GetCurrentUserRole();

            // Patients cannot edit
            if (role.Equals("Patient", StringComparison.OrdinalIgnoreCase))
                return Forbid();

            if (userId == null) return Unauthorized();

            try
            {
                var vital = await _vitalService.UpdateVitalAsync(id, dto, userId.Value);
                return Ok(vital);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (System.ComponentModel.DataAnnotations.ValidationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/verify")]
        [Authorize(Roles = "Doctor,doctor")]
        public async Task<IActionResult> VerifyVital(int id)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            try
            {
                var vital = await _vitalService.VerifyVitalAsync(id, userId.Value);
                return Ok(vital);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }
    }
}
