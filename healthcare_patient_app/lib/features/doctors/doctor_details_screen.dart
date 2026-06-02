import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../shared/models/doctor_model.dart';
import '../../main.dart';
import '../appointments/book_appointment_screen.dart';
import '../../shared/widgets/primary_button.dart';

class DoctorDetailsScreen extends StatelessWidget {
  final Doctor doctor;

  const DoctorDetailsScreen({super.key, required this.doctor});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Doctor Details',
            style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textDark,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            CircleAvatar(
              backgroundColor: AppColors.primary.withValues(alpha: 0.1),
              radius: 60,
              child: Text(
                doctor.firstName[0] + doctor.lastName[0],
                style: const TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.bold,
                    fontSize: 36),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Dr. ${doctor.firstName} ${doctor.lastName}',
              style:
                  GoogleFonts.outfit(fontSize: 28, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              doctor.specialization,
              style:
                  GoogleFonts.inter(fontSize: 18, color: AppColors.textLight),
            ),
            const SizedBox(height: 32),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 10,
                      offset: const Offset(0, 4)),
                ],
              ),
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.email_outlined,
                        color: AppColors.primary),
                    title: Text(doctor.email, style: GoogleFonts.inter()),
                  ),
                  const Divider(),
                  ListTile(
                    leading:
                        const Icon(Icons.access_time, color: AppColors.primary),
                    title: Text('Available Mon - Fri, 9:00 AM - 5:00 PM',
                        style: GoogleFonts.inter()),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
            SizedBox(
              width: double.infinity,
              child: PrimaryButton(
                text: 'Book Appointment',
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) =>
                          BookAppointmentScreen(doctor: doctor),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
