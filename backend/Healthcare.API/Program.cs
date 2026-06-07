using System.Text;
using Healthcare.API.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

// Configure EF Core with Postgres
builder.Services.AddDbContext<HealthcareDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<Healthcare.API.Services.IVitalService, Healthcare.API.Services.VitalService>();

// Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey!))
        };
    });

builder.Services.AddAuthorization();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// ─── Seed Database ────────────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<HealthcareDbContext>();

    // Seed Admin user
    if (!context.Users.Any(u => u.Role == "Admin"))
    {
        var adminUser = new Healthcare.API.Models.User
        {
            FirstName = "System",
            LastName = "Admin",
            Email = "admin@hospital.com",
            PasswordHash = "admin123",
            Role = "Admin",
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(adminUser);
        context.SaveChanges();
    }

    // Seed Receptionist
    if (!context.Users.Any(u => u.Role == "Receptionist"))
    {
        var receptionistUser = new Healthcare.API.Models.User
        {
            FirstName = "Front",
            LastName = "Desk",
            Email = "reception@hospital.com",
            PasswordHash = "reception123",
            Role = "Receptionist",
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(receptionistUser);
        context.SaveChanges();
    }

    // Seed Nurse
    if (!context.Users.Any(u => u.Role == "Nurse"))
    {
        var nurseUser = new Healthcare.API.Models.User
        {
            FirstName = "Night",
            LastName = "Nurse",
            Email = "nurse@hospital.com",
            PasswordHash = "nurse123",
            Role = "Nurse",
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(nurseUser);
        context.SaveChanges();
    }

    // Seed Doctors
    if (!context.Doctors.Any())
    {
        var docUser1 = new Healthcare.API.Models.User
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@hospital.com",
            PasswordHash = "password123",
            Role = "Doctor",
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };
        var docUser2 = new Healthcare.API.Models.User
        {
            FirstName = "Jane",
            LastName = "Smith",
            Email = "jane.smith@hospital.com",
            PasswordHash = "password123",
            Role = "Doctor",
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };

        context.Users.AddRange(docUser1, docUser2);
        context.SaveChanges();

        var doc1 = new Healthcare.API.Models.Doctor
        {
            UserId = docUser1.Id,
            Specialization = "Cardiologist",
            LicenseNumber = "LIC-CARD-001",
            ExperienceYears = 12,
            ConsultationFee = 150.00m,
            Status = "Active"
        };
        var doc2 = new Healthcare.API.Models.Doctor
        {
            UserId = docUser2.Id,
            Specialization = "Dermatologist",
            LicenseNumber = "LIC-DERM-002",
            ExperienceYears = 8,
            ConsultationFee = 120.00m,
            Status = "Active"
        };

        context.Doctors.AddRange(doc1, doc2);
        context.SaveChanges();

        // Seed DoctorAvailability (Mon–Fri, 09:00–17:00, 30-min slots)
        var workdays = new[] { DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday };
        foreach (var doctor in new[] { doc1, doc2 })
        {
            foreach (var day in workdays)
            {
                context.DoctorAvailabilities.Add(new Healthcare.API.Models.DoctorAvailability
                {
                    DoctorId = doctor.Id,
                    DayOfWeek = day,
                    StartTime = new TimeSpan(9, 0, 0),
                    EndTime = new TimeSpan(17, 0, 0),
                    SlotDurationMinutes = 30
                });
            }
        }
        context.SaveChanges();
    }
}

app.Run();
