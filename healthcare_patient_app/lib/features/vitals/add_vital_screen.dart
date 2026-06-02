import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/services/vital_service.dart';
import '../../shared/models/vital_model.dart';
import '../../shared/widgets/primary_button.dart';
import '../../shared/widgets/custom_text_field.dart';
import '../../main.dart';

class AddVitalScreen extends StatefulWidget {
  final int appointmentId;

  const AddVitalScreen({super.key, required this.appointmentId});

  @override
  State<AddVitalScreen> createState() => _AddVitalScreenState();
}

class _AddVitalScreenState extends State<AddVitalScreen> {
  final VitalService _vitalService = VitalService();
  final _heartRateController = TextEditingController();
  final _bloodPressureController = TextEditingController();
  final _temperatureController = TextEditingController();
  final _weightController = TextEditingController();
  bool _isLoading = false;

  void _submitVitals() async {
    setState(() => _isLoading = true);

    final vital = Vital(
      heartRate: _heartRateController.text,
      bloodPressure: _bloodPressureController.text,
      temperature: _temperatureController.text,
      weight: _weightController.text,
    );

    try {
      final success = await _vitalService.addVital(widget.appointmentId, vital);
      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Vitals added successfully')));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to add vitals')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Add Vitals', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textDark,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            CustomTextField(
              controller: _heartRateController,
              hintText: 'Heart Rate (bpm)',
              icon: Icons.favorite_border,
            ),
            const SizedBox(height: 16),
            CustomTextField(
              controller: _bloodPressureController,
              hintText: 'Blood Pressure (e.g., 120/80)',
              icon: Icons.bloodtype_outlined,
            ),
            const SizedBox(height: 16),
            CustomTextField(
              controller: _temperatureController,
              hintText: 'Temperature (°F or °C)',
              icon: Icons.thermostat_outlined,
            ),
            const SizedBox(height: 16),
            CustomTextField(
              controller: _weightController,
              hintText: 'Weight (lbs or kg)',
              icon: Icons.monitor_weight_outlined,
            ),
            const SizedBox(height: 40),
            SizedBox(
              width: double.infinity,
              child: PrimaryButton(
                text: 'Save Vitals',
                isLoading: _isLoading,
                onPressed: _submitVitals,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
