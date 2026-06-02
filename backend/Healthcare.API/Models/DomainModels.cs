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
        public required string Status { get; set; } // "Scheduled", "Completed", "Cancelled"
        public string? Notes { get; set; }
    }
}
