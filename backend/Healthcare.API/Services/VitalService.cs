using Healthcare.API.Data;
using Healthcare.API.Models;
using Healthcare.API.Models.DTOs;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace Healthcare.API.Services
{
    public interface IVitalService
    {
        Task<PatientVitalResponseDto> RecordVitalAsync(RecordVitalDto dto, string role, int? recordedByUserId);
        Task<VitalVisualizationDto> GetPatientVitalsAsync(int patientId, string metric, string? range = "7d");
        Task<IEnumerable<PatientVitalResponseDto>> GetLatestVitalsAsync(int patientId);
    }

    public class VitalService : IVitalService
    {
        private readonly HealthcareDbContext _context;

        public VitalService(HealthcareDbContext context)
        {
            _context = context;
        }

        public async Task<PatientVitalResponseDto> RecordVitalAsync(RecordVitalDto dto, string role, int? recordedByUserId)
        {
            // 1. Validation Layer
            ValidateVital(dto.MetricType, dto.Value, dto.Timestamp);

            var patientExists = await _context.Patients.AnyAsync(p => p.Id == dto.PatientId);
            if (!patientExists) throw new ValidationException("Patient ID does not exist.");

            // Integrity Rule: Reject duplicate entries within 2 minutes
            var duplicateWindowStart = dto.Timestamp.AddMinutes(-2);
            var duplicateWindowEnd = dto.Timestamp.AddMinutes(2);
            var isDuplicate = await _context.PatientVitals.AnyAsync(v => 
                v.PatientId == dto.PatientId && 
                v.MetricType == dto.MetricType && 
                v.Timestamp >= duplicateWindowStart && 
                v.Timestamp <= duplicateWindowEnd && 
                v.Value == dto.Value);
                
            if (isDuplicate) throw new ValidationException("Duplicate entry detected within short time window.");

            // 2. Store Raw Vital (Append-only)
            var vital = new PatientVital
            {
                PatientId = dto.PatientId,
                EncounterId = dto.EncounterId == 0 ? null : dto.EncounterId,
                MetricType = dto.MetricType,
                Value = dto.Value,
                Unit = dto.Unit,
                Timestamp = dto.Timestamp,
                DeviceSource = dto.DeviceSource,
                Metadata = dto.Metadata,
                RecordedBy = role == "Patient" ? "Patient" : (role == "System" || role == "Device" ? role : "Doctor")
            };

            _context.PatientVitals.Add(vital);
            
            // 3. Prepare data for AI layer
            await ComputeAndSaveAnalytics(dto.PatientId, dto.MetricType, dto.Timestamp, dto.Value);

            // Audit Log
            _context.AuditLogs.Add(new AuditLog
            {
                EntityName = "PatientVital",
                EntityId = 0,
                Action = "Created",
                PerformedByUserId = recordedByUserId ?? 0,
                Timestamp = DateTime.UtcNow,
                Details = $"Recorded {dto.MetricType} = {dto.Value}"
            });

            await _context.SaveChangesAsync();

            return MapToResponse(vital);
        }

        public async Task<VitalVisualizationDto> GetPatientVitalsAsync(int patientId, string metricStr, string? range = "7d")
        {
            if (!Enum.TryParse<MetricType>(metricStr, true, out var metricType))
                throw new ArgumentException("Invalid metric type");

            var query = _context.PatientVitals
                .Where(v => v.PatientId == patientId && v.MetricType == metricType);

            if (range == "7d")
            {
                var startDate = DateTime.UtcNow.AddDays(-7);
                query = query.Where(v => v.Timestamp >= startDate);
            }
            else if (range == "30d")
            {
                var startDate = DateTime.UtcNow.AddDays(-30);
                query = query.Where(v => v.Timestamp >= startDate);
            }

            var vitals = await query
                .OrderBy(v => v.Timestamp)
                .Select(v => new VitalDataPoint { Timestamp = v.Timestamp, Value = v.Value })
                .ToListAsync();

            return new VitalVisualizationDto
            {
                PatientId = patientId,
                Metric = metricStr,
                DataPoints = vitals
            };
        }

        public async Task<IEnumerable<PatientVitalResponseDto>> GetLatestVitalsAsync(int patientId)
        {
            // Get the most recent reading for each metric type
            var latestVitals = await _context.PatientVitals
                .Where(v => v.PatientId == patientId)
                .GroupBy(v => v.MetricType)
                .Select(g => g.OrderByDescending(v => v.Timestamp).FirstOrDefault())
                .ToListAsync();

            return latestVitals.Where(v => v != null).Select(v => MapToResponse(v!));
        }

        private void ValidateVital(MetricType metric, decimal value, DateTime timestamp)
        {
            if (timestamp > DateTime.UtcNow.AddMinutes(5)) // 5 min buffer
                throw new ValidationException("Timestamp cannot be in the future");

            switch (metric)
            {
                case MetricType.SPO2:
                    if (value < 0 || value > 100) throw new ValidationException("SpO2 must be between 0 and 100");
                    break;
                case MetricType.BP_SYS:
                    if (value < 50 || value > 250) throw new ValidationException("BP systolic must be between 50 and 250");
                    break;
                case MetricType.BP_DIA:
                    if (value < 30 || value > 150) throw new ValidationException("BP diastolic must be between 30 and 150");
                    break;
                case MetricType.HEART_RATE:
                    if (value < 30 || value > 220) throw new ValidationException("Heart rate must be between 30 and 220");
                    break;
                case MetricType.GLUCOSE:
                    if (value < 0 || value > 1000) throw new ValidationException("Glucose must be within medically realistic range");
                    break;
                case MetricType.TEMP:
                    if (value < 30 || value > 45) throw new ValidationException("Temperature must be between 30C and 45C");
                    break;
            }
        }

        private async Task ComputeAndSaveAnalytics(int patientId, MetricType metricType, DateTime newTimestamp, decimal newValue)
        {
            // Simple baseline calculation based on last 30 days
            var last30Days = DateTime.UtcNow.AddDays(-30);
            var historicalVitals = await _context.PatientVitals
                .Where(v => v.PatientId == patientId && v.MetricType == metricType && v.Timestamp >= last30Days)
                .OrderBy(v => v.Timestamp)
                .ToListAsync();

            var allValues = historicalVitals.Select(v => v.Value).ToList();
            allValues.Add(newValue);

            var last7DaysValues = historicalVitals
                .Where(v => v.Timestamp >= DateTime.UtcNow.AddDays(-7))
                .Select(v => v.Value).ToList();
            last7DaysValues.Add(newValue);

            decimal? rollingAvg7Day = last7DaysValues.Any() ? last7DaysValues.Average() : null;
            decimal? baseline = allValues.Any() ? allValues.Average() : null;
            decimal? deviation = baseline.HasValue ? newValue - baseline.Value : null;
            
            decimal? trendSlope = null;
            if (last7DaysValues.Count > 1)
            {
                // simplified slope based on first and last in 7 day window
                var firstDate = historicalVitals.FirstOrDefault(v => v.Timestamp >= DateTime.UtcNow.AddDays(-7))?.Timestamp ?? DateTime.UtcNow.AddDays(-7);
                var daysDiff = (decimal)(newTimestamp - firstDate).TotalDays;
                if (daysDiff > 0)
                {
                    trendSlope = (newValue - last7DaysValues.First()) / daysDiff;
                }
            }

            var analytics = new PatientVitalAnalytics
            {
                PatientId = patientId,
                MetricType = metricType,
                RollingAverage7Day = rollingAvg7Day,
                TrendSlope = trendSlope,
                DeviationFromBaseline = deviation,
                VariabilityIndex = 0 // Placeholder for future complex computation
            };
            
            _context.PatientVitalAnalytics.Add(analytics);
        }

        private PatientVitalResponseDto MapToResponse(PatientVital v)
        {
            return new PatientVitalResponseDto
            {
                Id = v.Id,
                PatientId = v.PatientId,
                EncounterId = v.EncounterId,
                MetricType = v.MetricType.ToString(),
                Value = v.Value,
                Unit = v.Unit,
                Timestamp = v.Timestamp,
                DeviceSource = v.DeviceSource,
                RecordedBy = v.RecordedBy,
                CreatedAt = v.CreatedAt
            };
        }
    }
}
