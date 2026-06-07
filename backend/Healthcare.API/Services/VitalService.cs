using Healthcare.API.Data;
using Healthcare.API.Models;
using Healthcare.API.Models.DTOs;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace Healthcare.API.Services
{
    public interface IVitalService
    {
        Task<VitalResponseDto> CreateVitalAsync(CreateVitalDto dto, int recordedByUserId, string role);
        Task<VitalResponseDto> GetVitalAsync(int id);
        Task<IEnumerable<VitalResponseDto>> GetPatientVitalsAsync(int patientId, string? sourceFilter = null, int limit = 50);
        Task<VitalResponseDto> UpdateVitalAsync(int id, UpdateVitalDto dto, int updatedByUserId);
        Task<VitalResponseDto> VerifyVitalAsync(int id, int verifiedByUserId);
    }

    public class VitalService : IVitalService
    {
        private readonly HealthcareDbContext _context;

        public VitalService(HealthcareDbContext context)
        {
            _context = context;
        }

        public async Task<VitalResponseDto> CreateVitalAsync(CreateVitalDto dto, int recordedByUserId, string role)
        {
            ValidateVitals(dto.HeightCm, dto.WeightKg, dto.Temperature, dto.HeartRate, dto.RespiratoryRate, dto.OxygenSaturation, dto.BloodPressureSystolic, dto.BloodPressureDiastolic, dto.BloodSugar, dto.PainScore);

            var vital = new Vital
            {
                EncounterId = dto.EncounterId,
                PatientId = dto.PatientId,
                RecordedById = recordedByUserId,
                HeightCm = dto.HeightCm,
                WeightKg = dto.WeightKg,
                Temperature = dto.Temperature,
                HeartRate = dto.HeartRate,
                RespiratoryRate = dto.RespiratoryRate,
                OxygenSaturation = dto.OxygenSaturation,
                BloodPressureSystolic = dto.BloodPressureSystolic,
                BloodPressureDiastolic = dto.BloodPressureDiastolic,
                BloodSugar = dto.BloodSugar,
                PainScore = dto.PainScore,
                Notes = dto.Notes,
                Source = dto.IsHomeReading ? "Patient Submitted" : "Clinical",
                Status = "Pending",
                RecordedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            CalculateBmi(vital);

            _context.Vitals.Add(vital);
            
            // Audit Log
            _context.AuditLogs.Add(new AuditLog
            {
                EntityName = "Vital",
                EntityId = 0, // Will be set after save or just logged as creation
                Action = "Created",
                PerformedByUserId = recordedByUserId,
                Timestamp = DateTime.UtcNow,
                Details = $"Source: {vital.Source}"
            });

            await _context.SaveChangesAsync();

            return await GetVitalAsync(vital.Id);
        }

        public async Task<VitalResponseDto> GetVitalAsync(int id)
        {
            var vital = await _context.Vitals
                .Include(v => v.Patient).ThenInclude(p => p!.User)
                .Include(v => v.RecordedBy)
                .Include(v => v.VerifiedBy)
                .FirstOrDefaultAsync(v => v.Id == id);

            if (vital == null) throw new KeyNotFoundException("Vital not found");

            return MapToResponse(vital);
        }

        public async Task<IEnumerable<VitalResponseDto>> GetPatientVitalsAsync(int patientId, string? sourceFilter = null, int limit = 50)
        {
            var query = _context.Vitals
                .Include(v => v.Patient).ThenInclude(p => p!.User)
                .Include(v => v.RecordedBy)
                .Include(v => v.VerifiedBy)
                .Where(v => v.PatientId == patientId);

            if (!string.IsNullOrEmpty(sourceFilter))
            {
                query = query.Where(v => v.Source == sourceFilter);
            }

            var vitals = await query
                .OrderByDescending(v => v.RecordedAt)
                .Take(limit)
                .ToListAsync();

            return vitals.Select(MapToResponse);
        }

        public async Task<VitalResponseDto> UpdateVitalAsync(int id, UpdateVitalDto dto, int updatedByUserId)
        {
            var vital = await _context.Vitals.FindAsync(id);
            if (vital == null) throw new KeyNotFoundException("Vital not found");

            ValidateVitals(dto.HeightCm, dto.WeightKg, dto.Temperature, dto.HeartRate, dto.RespiratoryRate, dto.OxygenSaturation, dto.BloodPressureSystolic, dto.BloodPressureDiastolic, dto.BloodSugar, dto.PainScore);

            vital.HeightCm = dto.HeightCm ?? vital.HeightCm;
            vital.WeightKg = dto.WeightKg ?? vital.WeightKg;
            vital.Temperature = dto.Temperature ?? vital.Temperature;
            vital.HeartRate = dto.HeartRate ?? vital.HeartRate;
            vital.RespiratoryRate = dto.RespiratoryRate ?? vital.RespiratoryRate;
            vital.OxygenSaturation = dto.OxygenSaturation ?? vital.OxygenSaturation;
            vital.BloodPressureSystolic = dto.BloodPressureSystolic ?? vital.BloodPressureSystolic;
            vital.BloodPressureDiastolic = dto.BloodPressureDiastolic ?? vital.BloodPressureDiastolic;
            vital.BloodSugar = dto.BloodSugar ?? vital.BloodSugar;
            vital.PainScore = dto.PainScore ?? vital.PainScore;
            vital.Notes = dto.Notes ?? vital.Notes;
            
            vital.UpdatedAt = DateTime.UtcNow;

            CalculateBmi(vital);

            _context.AuditLogs.Add(new AuditLog
            {
                EntityName = "Vital",
                EntityId = vital.Id,
                Action = "Updated",
                PerformedByUserId = updatedByUserId,
                Timestamp = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            return await GetVitalAsync(vital.Id);
        }

        public async Task<VitalResponseDto> VerifyVitalAsync(int id, int verifiedByUserId)
        {
            var vital = await _context.Vitals.FindAsync(id);
            if (vital == null) throw new KeyNotFoundException("Vital not found");

            vital.Status = "Verified";
            vital.VerifiedById = verifiedByUserId;
            vital.VerifiedAt = DateTime.UtcNow;
            vital.UpdatedAt = DateTime.UtcNow;

            _context.AuditLogs.Add(new AuditLog
            {
                EntityName = "Vital",
                EntityId = vital.Id,
                Action = "Verified",
                PerformedByUserId = verifiedByUserId,
                Timestamp = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return await GetVitalAsync(vital.Id);
        }

        private void CalculateBmi(Vital vital)
        {
            if (vital.HeightCm.HasValue && vital.WeightKg.HasValue && vital.HeightCm.Value > 0)
            {
                var heightMeters = vital.HeightCm.Value / 100m;
                vital.BMI = Math.Round(vital.WeightKg.Value / (heightMeters * heightMeters), 2);
            }
        }

        private void ValidateVitals(decimal? height, decimal? weight, decimal? temp, int? hr, int? rr, int? o2, int? bps, int? bpd, decimal? sugar, int? pain)
        {
            if (height.HasValue && (height < 50 || height > 250)) throw new ValidationException("Height must be between 50cm and 250cm");
            if (weight.HasValue && (weight < 1 || weight > 500)) throw new ValidationException("Weight must be between 1kg and 500kg");
            if (hr.HasValue && (hr < 20 || hr > 250)) throw new ValidationException("Heart rate must be between 20 and 250");
            if (temp.HasValue && (temp < 30 || temp > 45)) throw new ValidationException("Temperature must be between 30°C and 45°C");
            if (o2.HasValue && (o2 < 50 || o2 > 100)) throw new ValidationException("Oxygen saturation must be between 50% and 100%");
            if (pain.HasValue && (pain < 0 || pain > 10)) throw new ValidationException("Pain score must be between 0 and 10");
        }

        private VitalResponseDto MapToResponse(Vital v)
        {
            return new VitalResponseDto
            {
                Id = v.Id,
                EncounterId = v.EncounterId,
                PatientId = v.PatientId,
                PatientName = v.Patient?.User != null ? $"{v.Patient.User.FirstName} {v.Patient.User.LastName}" : "Unknown",
                RecordedByName = v.RecordedBy != null ? $"{v.RecordedBy.FirstName} {v.RecordedBy.LastName}" : "System",
                HeightCm = v.HeightCm,
                WeightKg = v.WeightKg,
                BMI = v.BMI,
                Temperature = v.Temperature,
                HeartRate = v.HeartRate,
                RespiratoryRate = v.RespiratoryRate,
                OxygenSaturation = v.OxygenSaturation,
                BloodPressureSystolic = v.BloodPressureSystolic,
                BloodPressureDiastolic = v.BloodPressureDiastolic,
                BloodSugar = v.BloodSugar,
                PainScore = v.PainScore,
                Notes = v.Notes,
                RecordedAt = v.RecordedAt,
                VerifiedByName = v.VerifiedBy != null ? $"{v.VerifiedBy.FirstName} {v.VerifiedBy.LastName}" : null,
                VerifiedAt = v.VerifiedAt,
                Status = v.Status,
                Source = v.Source
            };
        }
    }
}
