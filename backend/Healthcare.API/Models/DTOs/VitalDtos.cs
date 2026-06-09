namespace Healthcare.API.Models.DTOs
{
    public class CreateVitalDto
    {
        public int? EncounterId { get; set; }
        public int PatientId { get; set; }
        public decimal? HeightCm { get; set; }
        public decimal? WeightKg { get; set; }
        public decimal? Temperature { get; set; }
        public int? HeartRate { get; set; }
        public int? RespiratoryRate { get; set; }
        public int? OxygenSaturation { get; set; }
        public int? BloodPressureSystolic { get; set; }
        public int? BloodPressureDiastolic { get; set; }
        public decimal? BloodSugar { get; set; }
        public int? PainScore { get; set; }
        public string? Notes { get; set; }
        public bool IsHomeReading { get; set; } // Will set Source
    }

    public class UpdateVitalDto
    {
        public decimal? HeightCm { get; set; }
        public decimal? WeightKg { get; set; }
        public decimal? Temperature { get; set; }
        public int? HeartRate { get; set; }
        public int? RespiratoryRate { get; set; }
        public int? OxygenSaturation { get; set; }
        public int? BloodPressureSystolic { get; set; }
        public int? BloodPressureDiastolic { get; set; }
        public decimal? BloodSugar { get; set; }
        public int? PainScore { get; set; }
        public string? Notes { get; set; }
    }

    public class VitalResponseDto
    {
        public int Id { get; set; }
        public int? EncounterId { get; set; }
        public int PatientId { get; set; }
        public string PatientName { get; set; } = string.Empty;
        
        public string? RecordedByName { get; set; }
        
        public decimal? HeightCm { get; set; }
        public decimal? WeightKg { get; set; }
        public decimal? BMI { get; set; }
        public decimal? Temperature { get; set; }
        
        public int? HeartRate { get; set; }
        public int? RespiratoryRate { get; set; }
        public int? OxygenSaturation { get; set; }
        
        public int? BloodPressureSystolic { get; set; }
        public int? BloodPressureDiastolic { get; set; }
        
        public decimal? BloodSugar { get; set; }
        public int? PainScore { get; set; }
        
        public string? Notes { get; set; }
        
        public DateTime RecordedAt { get; set; }
        
        public string? VerifiedByName { get; set; }
        public DateTime? VerifiedAt { get; set; }
        
        public string Status { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty;
    }
}
