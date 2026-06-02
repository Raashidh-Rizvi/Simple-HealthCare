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
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Doctor>()
                .HasOne(d => d.User)
                .WithMany()
                .HasForeignKey(d => d.UserId);

            modelBuilder.Entity<Patient>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId);

            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Doctor)
                .WithMany(d => d.Appointments)
                .HasForeignKey(a => a.DoctorId);

            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Patient)
                .WithMany(p => p.Appointments)
                .HasForeignKey(a => a.PatientId)
                .OnDelete(DeleteBehavior.Restrict); // Prevent multiple cascade paths

            modelBuilder.Entity<Vital>()
                .HasOne(v => v.Appointment)
                .WithMany(a => a.Vitals)
                .HasForeignKey(v => v.AppointmentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Order>()
                .HasOne(o => o.Appointment)
                .WithMany(a => a.Orders)
                .HasForeignKey(o => o.AppointmentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CareProvider>()
                .HasOne(cp => cp.Doctor)
                .WithMany(d => d.CareProviders)
                .HasForeignKey(cp => cp.DoctorId);

            modelBuilder.Entity<ScheduleSlot>()
                .HasOne(s => s.Doctor)
                .WithMany(d => d.ScheduleSlots)
                .HasForeignKey(s => s.DoctorId);
        }
    }
}
