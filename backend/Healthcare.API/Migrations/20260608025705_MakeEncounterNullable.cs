using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Healthcare.API.Migrations
{
    /// <inheritdoc />
    public partial class MakeEncounterNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Vitals_Encounters_EncounterId",
                table: "Vitals");

            migrationBuilder.AlterColumn<int>(
                name: "EncounterId",
                table: "Vitals",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddForeignKey(
                name: "FK_Vitals_Encounters_EncounterId",
                table: "Vitals",
                column: "EncounterId",
                principalTable: "Encounters",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Vitals_Encounters_EncounterId",
                table: "Vitals");

            migrationBuilder.AlterColumn<int>(
                name: "EncounterId",
                table: "Vitals",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Vitals_Encounters_EncounterId",
                table: "Vitals",
                column: "EncounterId",
                principalTable: "Encounters",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
