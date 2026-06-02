namespace Healthcare.API.Models
{
    public class User
    {
        public int Id { get; set; }
        public required string Email { get; set; }
        public required string PasswordHash { get; set; }
        public required string Role { get; set; } // "Doctor" or "Patient"
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
    }

    public class Doctor
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }
        public required string Specialization { get; set; }
        public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
        public ICollection<CareProvider> CareProviders { get; set; } = new List<CareProvider>();
        public ICollection<ScheduleSlot> ScheduleSlots { get; set; } = new List<ScheduleSlot>();
    }

    public class Patient
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string? PhoneNumber { get; set; }
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
        public required string Status { get; set; } // "start", "complete", "cancel"
        public string? Notes { get; set; }

        public ICollection<Vital> Vitals { get; set; } = new List<Vital>();
        public ICollection<Order> Orders { get; set; } = new List<Order>();
    }

    public class Vital
    {
        public int Id { get; set; }
        public int AppointmentId { get; set; }
        public Appointment? Appointment { get; set; }
        public string? HeartRate { get; set; }
        public string? BloodPressure { get; set; }
        public string? Temperature { get; set; }
        public string? Weight { get; set; }
        public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
    }

    public class Order
    {
        public int Id { get; set; }
        public int AppointmentId { get; set; }
        public Appointment? Appointment { get; set; }
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
