using Healthcare.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Healthcare.API.Data
{
    public class HealthcareDbContext : DbContext
    {
        public HealthcareDbContext(DbContextOptions<HealthcareDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Doctor> Doctors { get; set; }
        public DbSet<Patient> Patients { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<CareProvider> CareProviders { get; set; }
        public DbSet<ScheduleSlot> ScheduleSlots { get; set; }
        public DbSet<Vital> Vitals { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<Encounter> Encounters { get; set; }
        public DbSet<DoctorAvailability> DoctorAvailabilities { get; set; }
        public DbSet<DoctorBlockedDate> DoctorBlockedDates { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // Doctor
            modelBuilder.Entity<Doctor>()
                .HasOne(d => d.User)
                .WithMany()
                .HasForeignKey(d => d.UserId);

            modelBuilder.Entity<Doctor>()
                .Property(d => d.ConsultationFee)
                .HasColumnType("decimal(10,2)");

            // Patient
            modelBuilder.Entity<Patient>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId);

            // Appointment
            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Doctor)
                .WithMany(d => d.Appointments)
                .HasForeignKey(a => a.DoctorId);

            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Patient)
                .WithMany(p => p.Appointments)
                .HasForeignKey(a => a.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            // *** GOLDEN RULE: Prevent double-booking at DB level ***
            // Unique filtered index: only one active (Pending/Confirmed) appointment
            // per doctor per date per start time slot.
            modelBuilder.Entity<Appointment>()
                .HasIndex(a => new { a.DoctorId, a.AppointmentDate, a.StartTime })
                .IsUnique()
                .HasFilter("\"Status\" IN ('Pending', 'Confirmed')")
                .HasDatabaseName("UX_Doctor_TimeSlot");

            // Encounter
            modelBuilder.Entity<Encounter>()
                .HasOne(e => e.Appointment)
                .WithOne(a => a.Encounter)
                .HasForeignKey<Encounter>(e => e.AppointmentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Encounter>()
                .HasOne(e => e.Patient)
                .WithMany()
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Restrict);
                
            modelBuilder.Entity<Encounter>()
                .HasOne(e => e.Doctor)
                .WithMany()
                .HasForeignKey(e => e.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            // Vital
            modelBuilder.Entity<Vital>()
                .HasOne(v => v.Encounter)
                .WithMany(e => e.Vitals)
                .HasForeignKey(v => v.EncounterId)
                .OnDelete(DeleteBehavior.Cascade);
                
            modelBuilder.Entity<Vital>()
                .HasOne(v => v.Patient)
                .WithMany()
                .HasForeignKey(v => v.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Vital>()
                .HasOne(v => v.RecordedBy)
                .WithMany()
                .HasForeignKey(v => v.RecordedById)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Vital>()
                .HasOne(v => v.VerifiedBy)
                .WithMany()
                .HasForeignKey(v => v.VerifiedById)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Vital>()
                .Property(v => v.HeightCm)
                .HasColumnType("decimal(5,2)");

            modelBuilder.Entity<Vital>()
                .Property(v => v.WeightKg)
                .HasColumnType("decimal(5,2)");

            modelBuilder.Entity<Vital>()
                .Property(v => v.BMI)
                .HasColumnType("decimal(5,2)");

            modelBuilder.Entity<Vital>()
                .Property(v => v.Temperature)
                .HasColumnType("decimal(4,2)");

            modelBuilder.Entity<Vital>()
                .Property(v => v.BloodSugar)
                .HasColumnType("decimal(6,2)");

            // Order
            modelBuilder.Entity<Order>()
                .HasOne(o => o.Encounter)
                .WithMany(e => e.Orders)
                .HasForeignKey(o => o.EncounterId)
                .OnDelete(DeleteBehavior.Cascade);

            // CareProvider
            modelBuilder.Entity<CareProvider>()
                .HasOne(cp => cp.Doctor)
                .WithMany(d => d.CareProviders)
                .HasForeignKey(cp => cp.DoctorId);

            // ScheduleSlot
            modelBuilder.Entity<ScheduleSlot>()
                .HasOne(s => s.Doctor)
                .WithMany(d => d.ScheduleSlots)
                .HasForeignKey(s => s.DoctorId);

            // DoctorAvailability
            modelBuilder.Entity<DoctorAvailability>()
                .HasOne(da => da.Doctor)
                .WithMany(d => d.Availabilities)
                .HasForeignKey(da => da.DoctorId)
                .OnDelete(DeleteBehavior.Cascade);

            // DoctorBlockedDate
            modelBuilder.Entity<DoctorBlockedDate>()
                .HasOne(db => db.Doctor)
                .WithMany(d => d.BlockedDates)
                .HasForeignKey(db => db.DoctorId)
                .OnDelete(DeleteBehavior.Cascade);

            // Notification
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
