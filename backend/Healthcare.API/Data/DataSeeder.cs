using Healthcare.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Healthcare.API.Data
{
    public static class DataSeeder
    {
        public static void Seed(HealthcareDbContext context)
        {
            context.Database.EnsureCreated();

            // ── 1. Users ────────────────────────────────────────────────────────
            if (!context.Users.Any())
            {
                var users = new List<User>
                {
                    // Admin (1)
                    new() { FirstName="System",    LastName="Admin",      Email="admin@hospital.com",          PasswordHash="admin123",      Role="Admin",         Phone="0000000000", Status="Active", CreatedAt=DateTime.UtcNow },
                    // Receptionist (1)
                    new() { FirstName="Front",     LastName="Desk",       Email="reception@hospital.com",      PasswordHash="reception123",  Role="Receptionist",  Phone="1111111111", Status="Active", CreatedAt=DateTime.UtcNow },
                    // Nurses (2)
                    new() { FirstName="Mary",      LastName="Nightingale",Email="nurse1@hospital.com",         PasswordHash="nurse123",      Role="Nurse",         Phone="2221110001", Status="Active", CreatedAt=DateTime.UtcNow },
                    new() { FirstName="Linda",     LastName="Green",      Email="nurse2@hospital.com",         PasswordHash="nurse123",      Role="Nurse",         Phone="2221110002", Status="Active", CreatedAt=DateTime.UtcNow },
                    // Doctors (10) – ids assigned after SaveChanges
                    new() { FirstName="James",     LastName="Carter",     Email="james.carter@hospital.com",   PasswordHash="password123",   Role="Doctor",        Phone="3331110001", Status="Active", CreatedAt=DateTime.UtcNow },
                    new() { FirstName="Sarah",     LastName="Mitchell",   Email="sarah.mitchell@hospital.com", PasswordHash="password123",   Role="Doctor",        Phone="3331110002", Status="Active", CreatedAt=DateTime.UtcNow },
                    new() { FirstName="David",     LastName="Nguyen",     Email="david.nguyen@hospital.com",   PasswordHash="password123",   Role="Doctor",        Phone="3331110003", Status="Active", CreatedAt=DateTime.UtcNow },
                    new() { FirstName="Emily",     LastName="Rogers",     Email="emily.rogers@hospital.com",   PasswordHash="password123",   Role="Doctor",        Phone="3331110004", Status="Active", CreatedAt=DateTime.UtcNow },
                    new() { FirstName="Michael",   LastName="Patel",      Email="michael.patel@hospital.com",  PasswordHash="password123",   Role="Doctor",        Phone="3331110005", Status="Active", CreatedAt=DateTime.UtcNow },
                    new() { FirstName="Jessica",   LastName="Brown",      Email="jessica.brown@hospital.com",  PasswordHash="password123",   Role="Doctor",        Phone="3331110006", Status="Active", CreatedAt=DateTime.UtcNow },
                    new() { FirstName="William",   LastName="Johnson",    Email="william.johnson@hospital.com",PasswordHash="password123",   Role="Doctor",        Phone="3331110007", Status="Active", CreatedAt=DateTime.UtcNow },
                    new() { FirstName="Olivia",    LastName="Kim",        Email="olivia.kim@hospital.com",     PasswordHash="password123",   Role="Doctor",        Phone="3331110008", Status="Active", CreatedAt=DateTime.UtcNow },
                    new() { FirstName="Noah",      LastName="Sharma",     Email="noah.sharma@hospital.com",    PasswordHash="password123",   Role="Doctor",        Phone="3331110009", Status="Active", CreatedAt=DateTime.UtcNow },
                    new() { FirstName="Sophia",    LastName="Williams",   Email="sophia.williams@hospital.com",PasswordHash="password123",   Role="Doctor",        Phone="3331110010", Status="Active", CreatedAt=DateTime.UtcNow },
                    // Patients (10)
                    new() { FirstName="Alice",     LastName="Turner",     Email="alice.turner@mail.com",       PasswordHash="patient123",    Role="Patient",       Phone="4441110001", Status="Active", CreatedAt=DateTime.UtcNow },
                    new() { FirstName="Bob",       LastName="Harris",     Email="bob.harris@mail.com",         PasswordHash="patient123",    Role="Patient",       Phone="4441110002", Status="Active", CreatedAt=DateTime.UtcNow },
                    new() { FirstName="Carol",     LastName="White",      Email="carol.white@mail.com",        PasswordHash="patient123",    Role="Patient",       Phone="4441110003", Status="Active", CreatedAt=DateTime.UtcNow },
                    new() { FirstName="Daniel",    LastName="Lewis",      Email="daniel.lewis@mail.com",       PasswordHash="patient123",    Role="Patient",       Phone="4441110004", Status="Active", CreatedAt=DateTime.UtcNow },
                    new() { FirstName="Eva",       LastName="Martinez",   Email="eva.martinez@mail.com",       PasswordHash="patient123",    Role="Patient",       Phone="4441110005", Status="Active", CreatedAt=DateTime.UtcNow },
                    new() { FirstName="Frank",     LastName="Anderson",   Email="frank.anderson@mail.com",     PasswordHash="patient123",    Role="Patient",       Phone="4441110006", Status="Active", CreatedAt=DateTime.UtcNow },
                    new() { FirstName="Grace",     LastName="Thompson",   Email="grace.thompson@mail.com",     PasswordHash="patient123",    Role="Patient",       Phone="4441110007", Status="Active", CreatedAt=DateTime.UtcNow },
                    new() { FirstName="Henry",     LastName="Garcia",     Email="henry.garcia@mail.com",       PasswordHash="patient123",    Role="Patient",       Phone="4441110008", Status="Active", CreatedAt=DateTime.UtcNow },
                    new() { FirstName="Isla",      LastName="Robinson",   Email="isla.robinson@mail.com",      PasswordHash="patient123",    Role="Patient",       Phone="4441110009", Status="Active", CreatedAt=DateTime.UtcNow },
                    new() { FirstName="Jack",      LastName="Clark",      Email="jack.clark@mail.com",         PasswordHash="patient123",    Role="Patient",       Phone="4441110010", Status="Active", CreatedAt=DateTime.UtcNow },
                };
                context.Users.AddRange(users);
                context.SaveChanges();
            }

            // ── Fetch user IDs by role for subsequent seeds ───────────────────
            var doctorUsers   = context.Users.Where(u => u.Role == "Doctor").OrderBy(u => u.Id).ToList();
            var patientUsers  = context.Users.Where(u => u.Role == "Patient").OrderBy(u => u.Id).ToList();
            var nurseUsers    = context.Users.Where(u => u.Role == "Nurse").OrderBy(u => u.Id).ToList();
            var allUsers      = context.Users.OrderBy(u => u.Id).ToList();

            // ── 2. Doctors ──────────────────────────────────────────────────────
            if (!context.Doctors.Any())
            {
                string[] specs = { "Cardiologist", "Dermatologist", "Neurologist", "Orthopedic", "Pediatrician",
                                   "Psychiatrist",  "Radiologist",   "Oncologist",  "Endocrinologist", "Pulmonologist" };
                string[] types = { "Both", "Hospital", "Video", "Both", "Hospital",
                                   "Video", "Both",     "Hospital","Video",         "Both" };
                var doctors = doctorUsers.Select((u, i) => new Doctor
                {
                    UserId           = u.Id,
                    Specialization   = specs[i % specs.Length],
                    LicenseNumber    = $"LIC-{specs[i % specs.Length].ToUpper()[..4]}-{i + 1:D3}",
                    ExperienceYears  = 5 + (i % 20),
                    ConsultationFee  = 100m + (i % 10) * 25,
                    ConsultationType = types[i % types.Length],
                    Status           = "Active"
                }).ToList();
                context.Doctors.AddRange(doctors);
                context.SaveChanges();
            }

            var seededDoctors = context.Doctors.OrderBy(d => d.Id).ToList();

            // ── 3. DoctorAvailability (10 doctors × Mon–Fri = 50 rows, guard = any()) ──
            if (!context.DoctorAvailabilities.Any())
            {
                var workdays = new[] { DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday,
                                       DayOfWeek.Thursday, DayOfWeek.Friday };
                var avails = new List<DoctorAvailability>();
                foreach (var doc in seededDoctors)
                    foreach (var day in workdays)
                        avails.Add(new DoctorAvailability
                        {
                            DoctorId            = doc.Id,
                            DayOfWeek           = day,
                            StartTime           = new TimeSpan(9, 0, 0),
                            EndTime             = new TimeSpan(17, 0, 0),
                            SlotDurationMinutes = 30
                        });
                context.DoctorAvailabilities.AddRange(avails);
                context.SaveChanges();
            }

            // ── 4. DoctorBlockedDates (10 rows – one per doctor) ────────────────
            if (!context.DoctorBlockedDates.Any())
            {
                string[] blockReasons = { "Conference", "Vacation", "Personal", "Training", "Medical Leave",
                                          "Family Emergency","Workshop","Sick Leave","National Holiday","Hospital Event" };
                var blocked = seededDoctors.Select((d, i) => new DoctorBlockedDate
                {
                    DoctorId    = d.Id,
                    BlockedDate = DateTime.UtcNow.AddDays(30 + i * 7),
                    Reason      = blockReasons[i % blockReasons.Length]
                }).ToList();
                context.DoctorBlockedDates.AddRange(blocked);
                context.SaveChanges();
            }

            // ── 5. Patients ──────────────────────────────────────────────────────
            if (!context.Patients.Any())
            {
                string[] genders   = { "Male","Female","Female","Male","Female","Male","Female","Male","Female","Male" };
                string[] bloods    = { "A+","B+","O+","AB+","A-","B-","O-","AB-","A+","B+" };
                string[][] allergies = {
                    new[]{"Penicillin"},         new[]{"Aspirin","Ibuprofen"}, new[]{"Peanuts"},
                    new[]{"Latex"},              new[]{"Sulfa"},               new string[]{},
                    new[]{"Codeine"},            new[]{"Shellfish"},           new[]{"Bee Stings"},
                    new[]{"Dairy","Gluten"}
                };
                string[][] conditions = {
                    new[]{"Hypertension"},        new[]{"Diabetes Type 2"},     new[]{"Asthma"},
                    new[]{"Hypertension","GERD"}, new[]{"Hypothyroidism"},      new string[]{},
                    new[]{"Depression"},          new[]{"Osteoarthritis"},      new[]{"Anemia"},
                    new[]{"COPD","Heart Failure"}
                };
                var patients = patientUsers.Select((u, i) => new Patient
                {
                    UserId      = u.Id,
                    DateOfBirth = new DateTime(1980 + (i % 40), (i % 12) + 1, (i % 28) + 1),
                    PhoneNumber = u.Phone,
                    Gender      = genders[i % genders.Length],
                    BloodGroup  = bloods[i % bloods.Length],
                    Allergies   = allergies[i % allergies.Length].ToList(),
                    Conditions  = conditions[i % conditions.Length].ToList()
                }).ToList();
                context.Patients.AddRange(patients);
                context.SaveChanges();
            }

            var seededPatients = context.Patients.OrderBy(p => p.Id).ToList();

            // ── 6. ScheduleSlots (10 rows – one per doctor, Saturday) ───────────
            if (!context.ScheduleSlots.Any())
            {
                var slots = seededDoctors.Select((d, i) => new ScheduleSlot
                {
                    DoctorId    = d.Id,
                    DayOfWeek   = DayOfWeek.Saturday,
                    StartTime   = new TimeSpan(9 + (i % 4), 0, 0),
                    EndTime     = new TimeSpan(9 + (i % 4) + 2, 0, 0),
                    IsAvailable = i % 3 != 0
                }).ToList();
                context.ScheduleSlots.AddRange(slots);
                context.SaveChanges();
            }

            // ── 7. CareProviders (10 rows – one per doctor) ─────────────────────
            if (!context.CareProviders.Any())
            {
                string[] cpNames = { "Nurse Anna","Nurse Ben","Nurse Clara","Nurse Derek","Nurse Ellen",
                                     "Nurse Frank","Nurse Greta","Nurse Hiro","Nurse Iris","Nurse Jake" };
                string[] cpRoles = { "Nurse","Assistant","Nurse","Nurse","Assistant",
                                     "Nurse","Assistant","Nurse","Nurse","Assistant" };
                var careProviders = seededDoctors.Select((d, i) => new CareProvider
                {
                    DoctorId    = d.Id,
                    Name        = cpNames[i],
                    Role        = cpRoles[i],
                    PhoneNumber = $"555000{i + 1:D4}"
                }).ToList();
                context.CareProviders.AddRange(careProviders);
                context.SaveChanges();
            }

            // ── 8. Appointments (10 rows) ────────────────────────────────────────
            if (!context.Appointments.Any())
            {
                string[] statuses = { "Confirmed","Confirmed","Confirmed","Confirmed","Confirmed",
                                      "Completed","Completed","Completed","Completed","Completed" };
                string[] reasons  = { "Chest pain follow-up","Skin rash evaluation","Headache assessment",
                                      "Joint pain","Routine child check-up","Anxiety review",
                                      "CT scan interpretation","Chemotherapy consult","Blood sugar review",
                                      "Breathing difficulty" };
                var appts = Enumerable.Range(0, 10).Select(i => new Appointment
                {
                    DoctorId        = seededDoctors[i].Id,
                    PatientId       = seededPatients[i].Id,
                    AppointmentDate = DateTime.UtcNow.Date.AddDays(-(9 - i)),   // spread over past 10 days
                    StartTime       = new TimeSpan(9 + i % 8, 0, 0),
                    EndTime         = new TimeSpan(9 + i % 8, 30, 0),
                    Status          = statuses[i],
                    Type            = i % 2 == 0 ? "In-Person" : "Video",
                    Reason          = reasons[i],
                    CreatedAt       = DateTime.UtcNow.AddDays(-(9 - i) - 3)
                }).ToList();
                context.Appointments.AddRange(appts);
                context.SaveChanges();
            }

            var seededAppts = context.Appointments.OrderBy(a => a.Id).ToList();

            // ── 9. Encounters (10 rows – linked to the 10 Completed/Confirmed appts) ──
            if (!context.Encounters.Any())
            {
                string[] diagnoses = {
                    "Stable angina – medication adjusted",
                    "Eczema – topical steroid prescribed",
                    "Tension headache – physiotherapy recommended",
                    "Knee osteoarthritis – NSAID and physio",
                    "Healthy child – vaccinations up to date",
                    "GAD – CBT referral",
                    "Normal CT – no acute findings",
                    "Cycle 3 chemotherapy administered",
                    "HbA1c 7.2 – diet counselling",
                    "COPD exacerbation – bronchodilator increased"
                };
                var encounters = seededAppts.Select((a, i) => new Encounter
                {
                    AppointmentId          = a.Id,
                    PatientId              = a.PatientId,
                    DoctorId               = a.DoctorId,
                    CheckInTime            = a.AppointmentDate.Add(a.StartTime).AddMinutes(-10),
                    ConsultationStartTime  = a.AppointmentDate.Add(a.StartTime),
                    ConsultationEndTime    = a.AppointmentDate.Add(a.EndTime),
                    Status                 = "Completed",
                    Notes                  = $"Patient presented with {a.Reason}.",
                    Diagnosis              = diagnoses[i % diagnoses.Length]
                }).ToList();
                context.Encounters.AddRange(encounters);
                context.SaveChanges();
            }

            var seededEncounters = context.Encounters.OrderBy(e => e.Id).ToList();
            var nurseUser        = nurseUsers.FirstOrDefault();

            // ── 10. Vitals (1000 rows per patient with risk results) ─────────
            if (context.PatientVitals.Count() < 1000)
            {
                var existingVitals = context.PatientVitals.ToList();
                if (existingVitals.Any())
                {
                    context.PatientVitals.RemoveRange(existingVitals);
                    context.SaveChanges();
                }

                var vitals = new List<PatientVital>();
                var rand = new Random(42);
                
                foreach (var patient in seededPatients)
                {
                    var baseTime = DateTime.UtcNow.AddDays(-100);
                    for (int i = 0; i < 1000; i++)
                    {
                        var ts = baseTime.AddHours(i * 2.4);
                        bool isRisk = rand.NextDouble() < 0.05;

                        int sys = rand.Next(110, 130);
                        int dia = rand.Next(70, 85);
                        int hr = rand.Next(65, 85);
                        int spo2 = rand.Next(95, 100);
                        decimal temp = 36.5m + (decimal)(rand.NextDouble() * 1.0);
                        decimal weight = 70m + (decimal)(rand.NextDouble() * 2.0);
                        int respRate = rand.Next(14, 20);

                        if (isRisk)
                        {
                            sys = rand.Next(140, 180);
                            dia = rand.Next(90, 110);
                            hr = rand.Next(100, 140);
                            spo2 = rand.Next(85, 92);
                            temp = 38.0m + (decimal)(rand.NextDouble() * 2.5);
                            respRate = rand.Next(25, 35);
                        }

                        vitals.Add(new PatientVital { PatientId = patient.Id, MetricType = MetricType.BP_SYS, Value = sys, Unit = "mmHg", Timestamp = ts, RecordedBy = "Device" });
                        vitals.Add(new PatientVital { PatientId = patient.Id, MetricType = MetricType.BP_DIA, Value = dia, Unit = "mmHg", Timestamp = ts, RecordedBy = "Device" });
                        vitals.Add(new PatientVital { PatientId = patient.Id, MetricType = MetricType.HEART_RATE, Value = hr, Unit = "bpm", Timestamp = ts, RecordedBy = "Device" });
                        vitals.Add(new PatientVital { PatientId = patient.Id, MetricType = MetricType.SPO2, Value = spo2, Unit = "%", Timestamp = ts, RecordedBy = "Device" });
                        vitals.Add(new PatientVital { PatientId = patient.Id, MetricType = MetricType.TEMP, Value = Math.Round(temp, 1), Unit = "C", Timestamp = ts, RecordedBy = "Device" });
                        vitals.Add(new PatientVital { PatientId = patient.Id, MetricType = MetricType.WEIGHT, Value = Math.Round(weight, 1), Unit = "kg", Timestamp = ts, RecordedBy = "Device" });
                        vitals.Add(new PatientVital { PatientId = patient.Id, MetricType = MetricType.RESPIRATORY_RATE, Value = respRate, Unit = "breaths/min", Timestamp = ts, RecordedBy = "Device" });
                    }
                }
                
                var batchSize = 1000;
                for (int i = 0; i < vitals.Count; i += batchSize)
                {
                    var batch = vitals.GetRange(i, Math.Min(batchSize, vitals.Count - i));
                    context.PatientVitals.AddRange(batch);
                    context.SaveChanges();
                }
            }

            // ── 11. Orders (10 rows – one per encounter) ─────────────────────────
            if (!context.Orders.Any())
            {
                string[] orderTypes = { "Lab","Pharmacy","Lab","Pharmacy","Lab",
                                        "Pharmacy","Lab","Pharmacy","Lab","Pharmacy" };
                string[] descriptions = {
                    "Full blood count and lipid panel",
                    "Atorvastatin 40mg – 30 days supply",
                    "MRI Brain – rule out tumour",
                    "Ibuprofen 400mg TDS – 7 days",
                    "MMR vaccine administration",
                    "Sertraline 50mg – 30 days",
                    "Chest X-ray follow-up",
                    "Ondansetron 8mg IV",
                    "HbA1c and fasting glucose",
                    "Salbutamol inhaler 100mcg"
                };
                var orders = seededEncounters.Select((enc, i) => new Order
                {
                    EncounterId = enc.Id,
                    OrderType   = orderTypes[i % orderTypes.Length],
                    Description = descriptions[i % descriptions.Length],
                    CreatedAt   = enc.ConsultationEndTime ?? DateTime.UtcNow
                }).ToList();
                context.Orders.AddRange(orders);
                context.SaveChanges();
            }

            // ── 12. Notifications (10 rows) ──────────────────────────────────────
            if (!context.Notifications.Any())
            {
                string[] notifTypes = { "Booking","Reminder","Cancellation","Booking","Reminder",
                                        "Booking","Reminder","Cancellation","Booking","Reminder" };
                var notifications = allUsers.Take(10).Select((u, i) => new Notification
                {
                    UserId    = u.Id,
                    Type      = notifTypes[i],
                    Message   = notifTypes[i] switch
                    {
                        "Booking"      => $"Your appointment on {DateTime.UtcNow.AddDays(i + 1):MMM dd} has been confirmed.",
                        "Reminder"     => $"Reminder: You have an appointment tomorrow at {9 + i % 8}:00.",
                        "Cancellation" => $"Your appointment on {DateTime.UtcNow.AddDays(i - 2):MMM dd} was cancelled.",
                        _              => "You have a new notification."
                    },
                    SentAt    = DateTime.UtcNow.AddMinutes(-i * 30),
                    IsRead    = i % 3 == 0
                }).ToList();
                context.Notifications.AddRange(notifications);
                context.SaveChanges();
            }

            // ── 13. AuditLogs (10 rows) ──────────────────────────────────────────
            if (!context.AuditLogs.Any())
            {
                var adminUser = context.Users.First(u => u.Role == "Admin");
                string[] entities = { "Appointment","Appointment","Patient","Doctor","Encounter",
                                      "Vital","Order","Notification","Appointment","Patient" };
                string[] actions  = { "Created","Confirmed","Created","Created","Completed",
                                      "Verified","Created","Sent","Cancelled","Updated" };
                string[] details  = {
                    "New appointment booked for patient Alice Turner",
                    "Appointment status changed to Confirmed",
                    "New patient profile created",
                    "Doctor profile activated",
                    "Encounter marked as completed",
                    "Vitals verified by nurse",
                    "Lab order raised",
                    "Booking notification sent",
                    "Appointment cancelled by patient",
                    "Patient allergies updated"
                };
                var auditLogs = Enumerable.Range(0, 10).Select(i => new AuditLog
                {
                    EntityName        = entities[i],
                    EntityId          = i + 1,
                    Action            = actions[i],
                    PerformedByUserId = adminUser.Id,
                    Timestamp         = DateTime.UtcNow.AddHours(-(10 - i)),
                    Details           = details[i]
                }).ToList();
                context.AuditLogs.AddRange(auditLogs);
                context.SaveChanges();
            }
        }
    }
}
