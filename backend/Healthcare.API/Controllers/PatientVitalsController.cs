using Healthcare.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Healthcare.API.Controllers
{
    [ApiController]
    [Route("api/patients/{patientId}/vitals")]
    [Authorize]
    public class PatientVitalsController : ControllerBase
    {
        private readonly IVitalService _vitalService;

        public PatientVitalsController(IVitalService vitalService)
        {
            _vitalService = vitalService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllVitals(int patientId, [FromQuery] string? sourceFilter)
        {
            var vitals = await _vitalService.GetPatientVitalsAsync(patientId, sourceFilter);
            return Ok(vitals);
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetVitalsHistory(int patientId)
        {
            // History might have different formatting or filters. For now, it returns all vitals.
            var vitals = await _vitalService.GetPatientVitalsAsync(patientId);
            return Ok(vitals);
        }

        [HttpGet("trends")]
        public async Task<IActionResult> GetVitalsTrends(int patientId)
        {
            // The frontend needs data grouped by dates or just a flat list ordered by date.
            // We can reuse the same service method since it orders by RecordedAt descending.
            var vitals = await _vitalService.GetPatientVitalsAsync(patientId);
            
            var trendsData = vitals.Select(v => new
            {
                RecordedAt = v.RecordedAt,
                v.WeightKg,
                v.BMI,
                v.Temperature,
                v.HeartRate,
                v.BloodPressureSystolic,
                v.BloodPressureDiastolic,
                v.BloodSugar,
                v.OxygenSaturation
            }).OrderBy(v => v.RecordedAt).ToList();

            return Ok(trendsData);
        }
    }
}
