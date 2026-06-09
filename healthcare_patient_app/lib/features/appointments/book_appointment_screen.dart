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
  Map<String, dynamic>? _selectedSlot;
  List<Map<String, dynamic>> _slots = [];
  bool _isLoadingSlots = false;
  bool _isLoading = false;
  String? _selectedType;

  @override
  void initState() {
    super.initState();
    if (widget.doctor.consultationType == 'Video') {
      _selectedType = 'Video';
    } else if (widget.doctor.consultationType == 'Hospital') {
      _selectedType = 'In-Person';
    }
  }

  void _loadSlots() async {
    if (_selectedDate == null) return;
    setState(() {
      _isLoadingSlots = true;
      _selectedSlot = null;
    });

    final slots = await _appointmentService.getAvailableSlots(widget.doctor.id, _selectedDate!);
    if (mounted) {
      setState(() {
        _slots = slots;
        _isLoadingSlots = false;
      });
    }
  }

  void _bookAppointment() async {
    if (_selectedDate == null || _selectedSlot == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select date and time slot')));
      return;
    }
    if (_selectedType == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select consultation type')));
      return;
    }

    setState(() => _isLoading = true);

    final timeParts = _selectedSlot!['startTimeSpan'].split(':');
    final appointmentDate = DateTime(
      _selectedDate!.year,
      _selectedDate!.month,
      _selectedDate!.day,
      int.parse(timeParts[0]),
      int.parse(timeParts[1]),
    );

    try {
      final success = await _appointmentService.createAppointment(
        widget.doctor.id,
        appointmentDate,
        _notesController.text,
        _selectedType!,
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
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: Theme.of(context).dividerColor)),
              leading: const Icon(Icons.calendar_today, color: PremiumColors.primary),
              title: Text(_selectedDate == null ? 'Choose Date' : DateFormat('MMM dd, yyyy').format(_selectedDate!)),
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: DateTime.now().add(const Duration(days: 1)),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 30)),
                );
                if (date != null) {
                  setState(() => _selectedDate = date);
                  _loadSlots();
                }
              },
            ),
            const SizedBox(height: 16),

            Text('Consultation Type', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [
                if (widget.doctor.consultationType == 'Both' || widget.doctor.consultationType == 'Hospital')
                  ChoiceChip(
                    label: const Text('Hospital Visit'),
                    selected: _selectedType == 'In-Person',
                    onSelected: (selected) {
                      if (selected) setState(() => _selectedType = 'In-Person');
                    },
                    selectedColor: PremiumColors.primary,
                    labelStyle: TextStyle(color: _selectedType == 'In-Person' ? Colors.white : Theme.of(context).textTheme.bodyMedium?.color),
                  ),
                if (widget.doctor.consultationType == 'Both' || widget.doctor.consultationType == 'Video')
                  ChoiceChip(
                    label: const Text('Video Consultation'),
                    selected: _selectedType == 'Video',
                    onSelected: (selected) {
                      if (selected) setState(() => _selectedType = 'Video');
                    },
                    selectedColor: PremiumColors.primary,
                    labelStyle: TextStyle(color: _selectedType == 'Video' ? Colors.white : Theme.of(context).textTheme.bodyMedium?.color),
                  ),
              ],
            ),
            const SizedBox(height: 16),

            Text('Select Time', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            if (_selectedDate == null)
               Text('Please select a date first', style: GoogleFonts.inter(color: Colors.grey)),
            if (_selectedDate != null && _isLoadingSlots)
               const Center(child: CircularProgressIndicator()),
            if (_selectedDate != null && !_isLoadingSlots && _slots.isEmpty)
               Text('No available slots for this date', style: GoogleFonts.inter(color: Colors.red)),
            if (_selectedDate != null && !_isLoadingSlots && _slots.isNotEmpty)
               Wrap(
                 spacing: 8,
                 runSpacing: 8,
                 children: _slots.map((slot) {
                   final isBooked = slot['isBooked'] == true;
                   final isSelected = _selectedSlot == slot;
                   return ChoiceChip(
                     label: Text(slot['startTime']),
                     selected: isSelected,
                     onSelected: isBooked ? null : (selected) {
                       if (selected) {
                         setState(() => _selectedSlot = slot);
                       }
                     },
                     selectedColor: PremiumColors.primary,
                     labelStyle: TextStyle(
                       color: isSelected ? Colors.white : (isBooked ? Colors.grey : Theme.of(context).textTheme.bodyMedium?.color),
                       decoration: isBooked ? TextDecoration.lineThrough : null,
                     ),
                   );
                 }).toList(),
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
