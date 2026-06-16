namespace Healthcare.API.Models
{
    public class User
    {
        public int Id { get; set; }
        public required string Email { get; set; }
        public required string PasswordHash { get; set; }
        public required string Role { get; set; } // "Doctor", "Patient", "Admin"
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public string? Phone { get; set; }
        public string Status { get; set; } = "Active"; // Active | Inactive
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class Doctor
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }
        public required string Specialization { get; set; }
        public string? LicenseNumber { get; set; }
        public int ExperienceYears { get; set; }
        public decimal ConsultationFee { get; set; }
        public string ConsultationType { get; set; } = "Both"; // "Video", "Hospital", "Both"
        public string Status { get; set; } = "Active"; // Active | Inactive
        public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
        public ICollection<CareProvider> CareProviders { get; set; } = new List<CareProvider>();
        public ICollection<ScheduleSlot> ScheduleSlots { get; set; } = new List<ScheduleSlot>();
        public ICollection<DoctorAvailability> Availabilities { get; set; } = new List<DoctorAvailability>();
        public ICollection<DoctorBlockedDate> BlockedDates { get; set; } = new List<DoctorBlockedDate>();
    }

    public class Patient
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Gender { get; set; } // Male | Female | Other
        public string? BloodGroup { get; set; } // A+, B-, O+, etc.
        public List<string>? Allergies { get; set; } = new();
        public List<string>? Conditions { get; set; } = new();
        public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    }

    public class Appointment
    {
        public int Id { get; set; }
        public int DoctorId { get; set; }
        public Doctor? Doctor { get; set; }
        public int PatientId { get; set; }
        public Patient? Patient { get; set; }
        public DateTime AppointmentDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        // Status: Pending | Confirmed | Cancelled | Completed | NoShow | Rejected
        public string Status { get; set; } = "Pending";
        public string Type { get; set; } = "In-Person";
        public string? Reason { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public Encounter? Encounter { get; set; }
    }

    public class DoctorAvailability
    {
        public int Id { get; set; }
        public int DoctorId { get; set; }
        public Doctor? Doctor { get; set; }
        public DayOfWeek DayOfWeek { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public int SlotDurationMinutes { get; set; } = 30;
    }

    public class DoctorBlockedDate
    {
        public int Id { get; set; }
        public int DoctorId { get; set; }
        public Doctor? Doctor { get; set; }
        public DateTime BlockedDate { get; set; }
        public string? Reason { get; set; }
    }

    public class Notification
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }
        public required string Type { get; set; } // Booking | Reminder | Cancellation
        public required string Message { get; set; }
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
        public bool IsRead { get; set; } = false;
    }

    public class AuditLog
    {
        public int Id { get; set; }
        public required string EntityName { get; set; }
        public int EntityId { get; set; }
        public required string Action { get; set; } // Created | Updated | Cancelled | Deleted
        public int PerformedByUserId { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string? Details { get; set; }
    }

    public enum MetricType
    {
        BP_SYS,
        BP_DIA,
        SPO2,
        GLUCOSE,
        HEART_RATE,
        WEIGHT,
        TEMP,
        RESPIRATORY_RATE
    }

    public class PatientVital
    {
        public int Id { get; set; }
        
        public int PatientId { get; set; }
        public Patient? Patient { get; set; }
        
        public int? EncounterId { get; set; }
        public Encounter? Encounter { get; set; }
        
        public MetricType MetricType { get; set; }
        public decimal Value { get; set; }
        public required string Unit { get; set; }
        public DateTime Timestamp { get; set; }
        public string? DeviceSource { get; set; }
        public string RecordedBy { get; set; } = "System"; // Patient/Doctor/Device/System
        public string? Metadata { get; set; } // JSON string
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class PatientVitalAnalytics
    {
        public int Id { get; set; }
        
        public int PatientId { get; set; }
        public Patient? Patient { get; set; }
        
        public MetricType MetricType { get; set; }
        
        public decimal? RollingAverage7Day { get; set; }
        public decimal? TrendSlope { get; set; }
        public decimal? DeviationFromBaseline { get; set; }
        public decimal? VariabilityIndex { get; set; }
        
        public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
    }

    public class Encounter
    {
        public int Id { get; set; }
        public int AppointmentId { get; set; }
        public Appointment? Appointment { get; set; }
        public int PatientId { get; set; }
        public Patient? Patient { get; set; }
        public int DoctorId { get; set; }
        public Doctor? Doctor { get; set; }
        
        public DateTime? CheckInTime { get; set; }
        public DateTime? ConsultationStartTime { get; set; }
        public DateTime? ConsultationEndTime { get; set; }
        
        public string Status { get; set; } = "CheckIn"; // CheckIn, VitalsCompleted, InConsultation, Completed
        
        public string? Notes { get; set; }
        public string? Diagnosis { get; set; }

        public ICollection<PatientVital> Vitals { get; set; } = new List<PatientVital>();
        public ICollection<Order> Orders { get; set; } = new List<Order>();
    }

    public class Order
    {
        public int Id { get; set; }
        public int EncounterId { get; set; }
        public Encounter? Encounter { get; set; }
        public required string OrderType { get; set; } // e.g. "Lab", "Pharmacy"
        public required string Description { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class CareProvider
    {
        public int Id { get; set; }
        public int DoctorId { get; set; }
        public Doctor? Doctor { get; set; }
        public required string Name { get; set; }
        public required string Role { get; set; } // e.g. Nurse, Assistant
        public string? PhoneNumber { get; set; }
    }

    public class ScheduleSlot
    {
        public int Id { get; set; }
        public int DoctorId { get; set; }
        public Doctor? Doctor { get; set; }
        public DayOfWeek DayOfWeek { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public bool IsAvailable { get; set; } = true;
    }
}
