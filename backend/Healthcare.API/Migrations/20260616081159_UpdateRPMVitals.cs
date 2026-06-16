using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Healthcare.API.Migrations
{
    /// <inheritdoc />
    public partial class UpdateRPMVitals : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Vitals");

            migrationBuilder.CreateTable(
                name: "PatientVitalAnalytics",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PatientId = table.Column<int>(type: "integer", nullable: false),
                    MetricType = table.Column<int>(type: "integer", nullable: false),
                    RollingAverage7Day = table.Column<decimal>(type: "numeric(8,2)", nullable: true),
                    TrendSlope = table.Column<decimal>(type: "numeric(8,2)", nullable: true),
                    DeviationFromBaseline = table.Column<decimal>(type: "numeric(8,2)", nullable: true),
                    VariabilityIndex = table.Column<decimal>(type: "numeric(8,2)", nullable: true),
                    CalculatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PatientVitalAnalytics", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PatientVitalAnalytics_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PatientVitals",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PatientId = table.Column<int>(type: "integer", nullable: false),
                    EncounterId = table.Column<int>(type: "integer", nullable: true),
                    MetricType = table.Column<int>(type: "integer", nullable: false),
                    Value = table.Column<decimal>(type: "numeric(8,2)", nullable: false),
                    Unit = table.Column<string>(type: "text", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    DeviceSource = table.Column<string>(type: "text", nullable: true),
                    RecordedBy = table.Column<string>(type: "text", nullable: false),
                    Metadata = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PatientVitals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PatientVitals_Encounters_EncounterId",
                        column: x => x.EncounterId,
                        principalTable: "Encounters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_PatientVitals_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PatientVitalAnalytics_PatientId_MetricType",
                table: "PatientVitalAnalytics",
                columns: new[] { "PatientId", "MetricType" });

            migrationBuilder.CreateIndex(
                name: "IX_PatientVitals_EncounterId",
                table: "PatientVitals",
                column: "EncounterId");

            migrationBuilder.CreateIndex(
                name: "IX_PatientVitals_MetricType",
                table: "PatientVitals",
                column: "MetricType");

            migrationBuilder.CreateIndex(
                name: "IX_PatientVitals_PatientId_Timestamp",
                table: "PatientVitals",
                columns: new[] { "PatientId", "Timestamp" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PatientVitalAnalytics");

            migrationBuilder.DropTable(
                name: "PatientVitals");

            migrationBuilder.CreateTable(
                name: "Vitals",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EncounterId = table.Column<int>(type: "integer", nullable: true),
                    PatientId = table.Column<int>(type: "integer", nullable: false),
                    RecordedById = table.Column<int>(type: "integer", nullable: true),
                    VerifiedById = table.Column<int>(type: "integer", nullable: true),
                    BMI = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    BloodPressureDiastolic = table.Column<int>(type: "integer", nullable: true),
                    BloodPressureSystolic = table.Column<int>(type: "integer", nullable: true),
                    BloodSugar = table.Column<decimal>(type: "numeric(6,2)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    HeartRate = table.Column<int>(type: "integer", nullable: true),
                    HeightCm = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    OxygenSaturation = table.Column<int>(type: "integer", nullable: true),
                    PainScore = table.Column<int>(type: "integer", nullable: true),
                    RecordedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    RespiratoryRate = table.Column<int>(type: "integer", nullable: true),
                    Source = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Temperature = table.Column<decimal>(type: "numeric(4,2)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    VerifiedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    WeightKg = table.Column<decimal>(type: "numeric(5,2)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vitals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Vitals_Encounters_EncounterId",
                        column: x => x.EncounterId,
                        principalTable: "Encounters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Vitals_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Vitals_Users_RecordedById",
                        column: x => x.RecordedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Vitals_Users_VerifiedById",
                        column: x => x.VerifiedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Vitals_EncounterId",
                table: "Vitals",
                column: "EncounterId");

            migrationBuilder.CreateIndex(
                name: "IX_Vitals_PatientId",
                table: "Vitals",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_Vitals_RecordedById",
                table: "Vitals",
                column: "RecordedById");

            migrationBuilder.CreateIndex(
                name: "IX_Vitals_VerifiedById",
                table: "Vitals",
                column: "VerifiedById");
        }
    }
}
