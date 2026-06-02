import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../core/services/appointment_service.dart';
import '../../shared/models/doctor_model.dart';
import '../../shared/widgets/primary_button.dart';
import '../../shared/widgets/custom_text_field.dart';
import '../../main.dart';

class BookAppointmentScreen extends StatefulWidget {
  final Doctor doctor;

  const BookAppointmentScreen({super.key, required this.doctor});

  @override
  State<BookAppointmentScreen> createState() => _BookAppointmentScreenState();
}

class _BookAppointmentScreenState extends State<BookAppointmentScreen> {
  final AppointmentService _appointmentService = AppointmentService();
  final _notesController = TextEditingController();
  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;
  bool _isLoading = false;

  void _bookAppointment() async {
    if (_selectedDate == null || _selectedTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select date and time')));
      return;
    }

    setState(() => _isLoading = true);

    final appointmentDate = DateTime(
      _selectedDate!.year,
      _selectedDate!.month,
      _selectedDate!.day,
      _selectedTime!.hour,
      _selectedTime!.minute,
    );

    try {
      final success = await _appointmentService.createAppointment(
        widget.doctor.id,
        appointmentDate,
        _notesController.text,
      );

      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Appointment Booked!')));
        Navigator.pop(context); // back to details
        Navigator.pop(context); // back to list
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to book appointment')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Book Appointment', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textDark,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Doctor: Dr. ${widget.doctor.firstName} ${widget.doctor.lastName}',
                style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 24),
            
            Text('Select Date', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            ListTile(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: Colors.grey.shade300)),
              leading: const Icon(Icons.calendar_today, color: AppColors.primary),
              title: Text(_selectedDate == null ? 'Choose Date' : DateFormat('MMM dd, yyyy').format(_selectedDate!)),
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: DateTime.now().add(const Duration(days: 1)),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 30)),
                );
                if (date != null) setState(() => _selectedDate = date);
              },
            ),
            const SizedBox(height: 16),

            Text('Select Time', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            ListTile(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: Colors.grey.shade300)),
              leading: const Icon(Icons.access_time, color: AppColors.primary),
              title: Text(_selectedTime == null ? 'Choose Time' : _selectedTime!.format(context)),
              onTap: () async {
                final time = await showTimePicker(context: context, initialTime: const TimeOfDay(hour: 9, minute: 0));
                if (time != null) setState(() => _selectedTime = time);
              },
            ),
            const SizedBox(height: 24),
            
            Text('Notes (Optional)', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            CustomTextField(
              controller: _notesController,
              hintText: 'Any specific concerns?',
              icon: Icons.note_alt_outlined,
            ),
            const SizedBox(height: 40),
            
            SizedBox(
              width: double.infinity,
              child: PrimaryButton(
                text: 'Confirm Booking',
                isLoading: _isLoading,
                onPressed: _bookAppointment,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
