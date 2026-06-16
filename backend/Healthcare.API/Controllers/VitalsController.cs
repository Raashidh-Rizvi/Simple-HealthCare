using Healthcare.API.Models.DTOs;
using Healthcare.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;

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

        [HttpPost("record")]
        public async Task<IActionResult> RecordVital([FromBody] RecordVitalDto dto)
        {
            var userId = GetCurrentUserId();
            var role = GetCurrentUserRole();

            try
            {
                var vital = await _vitalService.RecordVitalAsync(dto, role, userId);
                return CreatedAtAction(nameof(GetPatientVitals), new { patient_id = dto.PatientId }, vital);
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{patient_id}")]
        public async Task<IActionResult> GetPatientVitals(int patient_id, [FromQuery] string metric, [FromQuery] string range = "7d")
        {
            if (string.IsNullOrEmpty(metric))
            {
                return BadRequest(new { message = "Metric query parameter is required." });
            }

            try
            {
                var vitals = await _vitalService.GetPatientVitalsAsync(patient_id, metric, range);
                return Ok(vitals);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("latest/{patient_id}")]
        public async Task<IActionResult> GetLatestVitals(int patient_id)
        {
            var vitals = await _vitalService.GetLatestVitalsAsync(patient_id);
            return Ok(vitals);
        }
    }
}
