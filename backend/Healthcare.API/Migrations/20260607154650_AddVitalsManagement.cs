using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Healthcare.API.Migrations
{
    /// <inheritdoc />
    public partial class AddVitalsManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM \"Vitals\";");

            migrationBuilder.DropColumn(
                name: "Height",
                table: "Vitals");

            migrationBuilder.DropColumn(
                name: "IsHomeReading",
                table: "Vitals");

            migrationBuilder.DropColumn(
                name: "RecordedBy",
                table: "Vitals");

            migrationBuilder.RenameColumn(
                name: "Weight",
                table: "Vitals",
                newName: "Notes");

            migrationBuilder.Sql("ALTER TABLE \"Vitals\" ALTER COLUMN \"Temperature\" TYPE numeric(4,2) USING \"Temperature\"::numeric;");

            migrationBuilder.Sql("ALTER TABLE \"Vitals\" ALTER COLUMN \"RespiratoryRate\" TYPE integer USING \"RespiratoryRate\"::integer;");

            migrationBuilder.Sql("ALTER TABLE \"Vitals\" ALTER COLUMN \"OxygenSaturation\" TYPE integer USING \"OxygenSaturation\"::integer;");

            migrationBuilder.Sql("ALTER TABLE \"Vitals\" ALTER COLUMN \"HeartRate\" TYPE integer USING \"HeartRate\"::integer;");

            migrationBuilder.Sql("ALTER TABLE \"Vitals\" ALTER COLUMN \"BloodSugar\" TYPE numeric(6,2) USING \"BloodSugar\"::numeric;");

            migrationBuilder.Sql("ALTER TABLE \"Vitals\" ALTER COLUMN \"BMI\" TYPE numeric(5,2) USING \"BMI\"::numeric;");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Vitals",
                type: "timestamp without time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<decimal>(
                name: "HeightCm",
                table: "Vitals",
                type: "numeric(5,2)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PainScore",
                table: "Vitals",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PatientId",
                table: "Vitals",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "RecordedById",
                table: "Vitals",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Source",
                table: "Vitals",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Vitals",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Vitals",
                type: "timestamp without time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "VerifiedAt",
                table: "Vitals",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "VerifiedById",
                table: "Vitals",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "WeightKg",
                table: "Vitals",
                type: "numeric(5,2)",
                nullable: true);

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

            migrationBuilder.AddForeignKey(
                name: "FK_Vitals_Patients_PatientId",
                table: "Vitals",
                column: "PatientId",
                principalTable: "Patients",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Vitals_Users_RecordedById",
                table: "Vitals",
                column: "RecordedById",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Vitals_Users_VerifiedById",
                table: "Vitals",
                column: "VerifiedById",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Vitals_Patients_PatientId",
                table: "Vitals");

            migrationBuilder.DropForeignKey(
                name: "FK_Vitals_Users_RecordedById",
                table: "Vitals");

            migrationBuilder.DropForeignKey(
                name: "FK_Vitals_Users_VerifiedById",
                table: "Vitals");

            migrationBuilder.DropIndex(
                name: "IX_Vitals_PatientId",
                table: "Vitals");

            migrationBuilder.DropIndex(
                name: "IX_Vitals_RecordedById",
                table: "Vitals");

            migrationBuilder.DropIndex(
                name: "IX_Vitals_VerifiedById",
                table: "Vitals");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Vitals");

            migrationBuilder.DropColumn(
                name: "HeightCm",
                table: "Vitals");

            migrationBuilder.DropColumn(
                name: "PainScore",
                table: "Vitals");

            migrationBuilder.DropColumn(
                name: "PatientId",
                table: "Vitals");

            migrationBuilder.DropColumn(
                name: "RecordedById",
                table: "Vitals");

            migrationBuilder.DropColumn(
                name: "Source",
                table: "Vitals");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Vitals");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Vitals");

            migrationBuilder.DropColumn(
                name: "VerifiedAt",
                table: "Vitals");

            migrationBuilder.DropColumn(
                name: "VerifiedById",
                table: "Vitals");

            migrationBuilder.DropColumn(
                name: "WeightKg",
                table: "Vitals");

            migrationBuilder.RenameColumn(
                name: "Notes",
                table: "Vitals",
                newName: "Weight");

            migrationBuilder.AlterColumn<string>(
                name: "Temperature",
                table: "Vitals",
                type: "text",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(4,2)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "RespiratoryRate",
                table: "Vitals",
                type: "text",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "OxygenSaturation",
                table: "Vitals",
                type: "text",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "HeartRate",
                table: "Vitals",
                type: "text",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "BloodSugar",
                table: "Vitals",
                type: "text",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(6,2)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "BMI",
                table: "Vitals",
                type: "text",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(5,2)",
                oldNullable: true);

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
                name: "RecordedBy",
                table: "Vitals",
                type: "text",
                nullable: true);
        }
    }
}
