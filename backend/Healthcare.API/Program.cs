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

// Seed Database
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<HealthcareDbContext>();
    if (!context.Doctors.Any())
    {
        var docUser1 = new Healthcare.API.Models.User
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@hospital.com",
            PasswordHash = "password123", 
            Role = "Doctor"
        };
        var docUser2 = new Healthcare.API.Models.User
        {
            FirstName = "Jane",
            LastName = "Smith",
            Email = "jane.smith@hospital.com",
            PasswordHash = "password123",
            Role = "Doctor"
        };

        context.Users.AddRange(docUser1, docUser2);
        context.SaveChanges();

        var doc1 = new Healthcare.API.Models.Doctor
        {
            UserId = docUser1.Id,
            Specialization = "Cardiologist"
        };
        var doc2 = new Healthcare.API.Models.Doctor
        {
            UserId = docUser2.Id,
            Specialization = "Dermatologist"
        };

        context.Doctors.AddRange(doc1, doc2);
        context.SaveChanges();
    }
}

app.Run();
