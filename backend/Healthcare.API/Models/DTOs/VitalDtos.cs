namespace Healthcare.API.Models.DTOs
{
    public class RecordVitalDto
    {
        public int PatientId { get; set; }
        public int? EncounterId { get; set; }
        public MetricType MetricType { get; set; }
        public decimal Value { get; set; }
        public string Unit { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string? DeviceSource { get; set; }
        public string? Metadata { get; set; }
    }

    public class PatientVitalResponseDto
    {
        public int Id { get; set; }
        public int PatientId { get; set; }
        public int? EncounterId { get; set; }
        public string MetricType { get; set; } = string.Empty;
        public decimal Value { get; set; }
        public string Unit { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string? DeviceSource { get; set; }
        public string RecordedBy { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class VitalDataPoint
    {
        public DateTime Timestamp { get; set; }
        public decimal Value { get; set; }
    }

    public class VitalVisualizationDto
    {
        public int PatientId { get; set; }
        public string Metric { get; set; } = string.Empty;
        public List<VitalDataPoint> DataPoints { get; set; } = new();
    }
}
