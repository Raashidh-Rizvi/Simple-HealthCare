using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Healthcare.API.Migrations
{
    /// <inheritdoc />
    public partial class AddEncounters : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Appointments_AppointmentId",
                table: "Orders");

            migrationBuilder.DropForeignKey(
                name: "FK_Vitals_Appointments_AppointmentId",
                table: "Vitals");

            // We will drop Notes AFTER we migrate it.

            // Don't rename BloodPressure to RespiratoryRate, that's incorrect mapping by EF
            migrationBuilder.DropColumn(
                name: "BloodPressure",
                table: "Vitals");
            
            migrationBuilder.AddColumn<string>(
                name: "RespiratoryRate",
                table: "Vitals",
                type: "text",
                nullable: true);

            migrationBuilder.RenameColumn(
                name: "AppointmentId",
                table: "Vitals",
                newName: "EncounterId");

            migrationBuilder.RenameIndex(
                name: "IX_Vitals_AppointmentId",
                table: "Vitals",
                newName: "IX_Vitals_EncounterId");

            migrationBuilder.RenameColumn(
                name: "AppointmentId",
                table: "Orders",
                newName: "EncounterId");

            migrationBuilder.RenameIndex(
                name: "IX_Orders_AppointmentId",
                table: "Orders",
                newName: "IX_Orders_EncounterId");

            migrationBuilder.AddColumn<string>(
                name: "BMI",
                table: "Vitals",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BloodPressureDiastolic",
                table: "Vitals",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BloodPressureSystolic",
                table: "Vitals",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BloodSugar",
                table: "Vitals",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Height",
                table: "Vitals",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsHomeReading",
                table: "Vitals",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "OxygenSaturation",
                table: "Vitals",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RecordedBy",
                table: "Vitals",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Encounters",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AppointmentId = table.Column<int>(type: "integer", nullable: false),
                    PatientId = table.Column<int>(type: "integer", nullable: false),
                    DoctorId = table.Column<int>(type: "integer", nullable: false),
                    CheckInTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ConsultationStartTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ConsultationEndTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    Diagnosis = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Encounters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Encounters_Appointments_AppointmentId",
                        column: x => x.AppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Encounters_Doctors_DoctorId",
                        column: x => x.DoctorId,
                        principalTable: "Doctors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Encounters_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            // ─── DATA MIGRATION SQL ───
            // 1. Create an Encounter for every existing Appointment.
            //    We map the Appointment.Id -> Encounter.AppointmentId, and copy Notes.
            migrationBuilder.Sql(@"
                INSERT INTO ""Encounters"" (""AppointmentId"", ""PatientId"", ""DoctorId"", ""Status"", ""Notes"")
                SELECT ""Id"", ""PatientId"", ""DoctorId"", 
                       CASE WHEN ""Status"" = 'Completed' THEN 'Completed' ELSE 'CheckIn' END,
                       ""Notes""
                FROM ""Appointments"";
            ");

            // 2. Map Vitals' EncounterId to the Encounter.Id instead of Appointment.Id
            // The existing Vitals.EncounterId column actually contains the old AppointmentId.
            migrationBuilder.Sql(@"
                UPDATE ""Vitals"" v
                SET ""EncounterId"" = e.""Id""
                FROM ""Encounters"" e
                WHERE v.""EncounterId"" = e.""AppointmentId"";
            ");

            // 3. Map Orders' EncounterId to the Encounter.Id instead of Appointment.Id
            // The existing Orders.EncounterId column actually contains the old AppointmentId.
            migrationBuilder.Sql(@"
                UPDATE ""Orders"" o
                SET ""EncounterId"" = e.""Id""
                FROM ""Encounters"" e
                WHERE o.""EncounterId"" = e.""AppointmentId"";
            ");
            // ──────────────────────────

            // NOW we can drop the Notes column from Appointments
            migrationBuilder.DropColumn(
                name: "Notes",
                table: "Appointments");

            migrationBuilder.CreateIndex(
                name: "IX_Encounters_AppointmentId",
                table: "Encounters",
                column: "AppointmentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Encounters_DoctorId",
                table: "Encounters",
                column: "DoctorId");

            migrationBuilder.CreateIndex(
                name: "IX_Encounters_PatientId",
                table: "Encounters",
                column: "PatientId");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Encounters_EncounterId",
                table: "Orders",
                column: "EncounterId",
                principalTable: "Encounters",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Vitals_Encounters_EncounterId",
                table: "Vitals",
                column: "EncounterId",
                principalTable: "Encounters",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Encounters_EncounterId",
                table: "Orders");

            migrationBuilder.DropForeignKey(
                name: "FK_Vitals_Encounters_EncounterId",
                table: "Vitals");

            migrationBuilder.DropTable(
                name: "Encounters");

            migrationBuilder.DropColumn(
                name: "BMI",
                table: "Vitals");

            migrationBuilder.DropColumn(
                name: "BloodPressureDiastolic",
                table: "Vitals");

            migrationBuilder.DropColumn(
                name: "BloodPressureSystolic",
                table: "Vitals");

            migrationBuilder.DropColumn(
                name: "BloodSugar",
                table: "Vitals");

            migrationBuilder.DropColumn(
                name: "Height",
                table: "Vitals");

            migrationBuilder.DropColumn(
                name: "IsHomeReading",
                table: "Vitals");

            migrationBuilder.DropColumn(
                name: "OxygenSaturation",
                table: "Vitals");

            migrationBuilder.DropColumn(
                name: "RecordedBy",
                table: "Vitals");

            migrationBuilder.RenameColumn(
                name: "RespiratoryRate",
                table: "Vitals",
                newName: "BloodPressure");

            migrationBuilder.RenameColumn(
                name: "EncounterId",
                table: "Vitals",
                newName: "AppointmentId");

            migrationBuilder.RenameIndex(
                name: "IX_Vitals_EncounterId",
                table: "Vitals",
                newName: "IX_Vitals_AppointmentId");

            migrationBuilder.RenameColumn(
                name: "EncounterId",
                table: "Orders",
                newName: "AppointmentId");

            migrationBuilder.RenameIndex(
                name: "IX_Orders_EncounterId",
                table: "Orders",
                newName: "IX_Orders_AppointmentId");

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "Appointments",
                type: "text",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Appointments_AppointmentId",
                table: "Orders",
                column: "AppointmentId",
                principalTable: "Appointments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Vitals_Appointments_AppointmentId",
                table: "Vitals",
                column: "AppointmentId",
                principalTable: "Appointments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
