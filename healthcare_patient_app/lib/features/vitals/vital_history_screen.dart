import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../core/services/appointment_service.dart';
import '../../shared/models/vital_model.dart';
import '../../main.dart';
import 'add_vital_screen.dart';
import '../../shared/models/appointment_model.dart';
import '../../core/services/patient_service.dart';
import '../../core/services/vital_service.dart';

class VitalHistoryScreen extends StatefulWidget {
  const VitalHistoryScreen({super.key});

  @override
  State<VitalHistoryScreen> createState() => _VitalHistoryScreenState();
}

class _VitalHistoryScreenState extends State<VitalHistoryScreen> {
  final AppointmentService _appointmentService = AppointmentService();
  final PatientService _patientService = PatientService();
  final VitalService _vitalService = VitalService();
  
  List<Appointment> _appointments = [];
  List<Vital> _vitals = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadVitals();
  }

  Future<void> _loadVitals() async {
    try {
      final profile = await _patientService.getPatientProfile();
      List<Vital> vitals = [];
      if (profile != null) {
        vitals = await _vitalService.getPatientVitals(profile['id']);
      }
      final appointments = await _appointmentService.getMyAppointments();
      
      setState(() {
        _appointments = appointments;
        _vitals = vitals;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to load vitals')));
    }
  }

  @override
  Widget build(BuildContext context) {
    // Sort by recordedAt descending (most recent first)
    _vitals.sort((a, b) {
      if (a.recordedAt == null || b.recordedAt == null) return 0;
      return DateTime.parse(b.recordedAt!).compareTo(DateTime.parse(a.recordedAt!));
    });

    return Scaffold(
      appBar: AppBar(
        title: Text('Vital History', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: PremiumColors.primary,
        onPressed: () {
          // Pass the most recent appointment id if available, or let them pick
          if (_appointments.isNotEmpty) {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => AddVitalScreen(appointmentId: _appointments.first.id)),
            ).then((_) => _loadVitals());
          } else {
             ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No appointments available to add vitals to.')));
          }
        },
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _vitals.isEmpty
              ? const Center(child: Text('No vitals recorded'))
              : Column(
                  children: [
                    _buildLatestVitalsSummary(_vitals.first),
                    Expanded(
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _vitals.length,
                        itemBuilder: (context, index) {
                          final vital = _vitals[index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            elevation: 2,
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        vital.recordedAt != null ? DateFormat('MMM dd, yyyy - hh:mm a').format(DateTime.parse(vital.recordedAt!).toLocal()) : 'Unknown Date',
                                        style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: PremiumColors.primary),
                                      ),
                                    ],
                                  ),
                                  _buildVitalRow(Icons.favorite, 'Heart Rate', vital.heartRate != null && vital.heartRate!.isNotEmpty ? '${vital.heartRate} bpm' : 'N/A'),
                                  _buildVitalRow(Icons.bloodtype, 'Blood Pressure', vital.bloodPressureSystolic != null && vital.bloodPressureDiastolic != null ? '${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic} mmHg' : 'N/A'),
                                  _buildVitalRow(Icons.thermostat, 'Temperature', vital.temperature != null && vital.temperature!.isNotEmpty ? '${vital.temperature}°F' : 'N/A'),
                                  _buildVitalRow(Icons.monitor_weight, 'Weight', vital.weight != null && vital.weight!.isNotEmpty ? '${vital.weight} lbs' : 'N/A'),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _buildVitalRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Theme.of(context).textTheme.bodySmall?.color),
          const SizedBox(width: 8),
          Text(label, style: GoogleFonts.inter(color: Theme.of(context).textTheme.bodySmall?.color)),
          const Spacer(),
          Text(value, style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildLatestVitalsSummary(Vital latestVital) {
    final riskLevel = _getRiskLevel(latestVital);
    final riskColor = _getRiskColor(riskLevel);

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: PremiumColors.primary.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: PremiumColors.primary.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Health Summary', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: PremiumColors.primary)),
              if (riskLevel != 'Normal' && riskLevel != 'Unknown')
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: riskColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: riskColor),
                  ),
                  child: Text(
                    'Status: $riskLevel',
                    style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: riskColor),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          _buildVitalRow(Icons.favorite, 'Heart Rate', latestVital.heartRate != null && latestVital.heartRate!.isNotEmpty ? '${latestVital.heartRate} bpm' : 'N/A'),
          _buildVitalRow(Icons.bloodtype, 'Blood Pressure', latestVital.bloodPressureSystolic != null && latestVital.bloodPressureDiastolic != null ? '${latestVital.bloodPressureSystolic}/${latestVital.bloodPressureDiastolic} mmHg' : 'N/A'),
          _buildVitalRow(Icons.thermostat, 'Temperature', latestVital.temperature != null && latestVital.temperature!.isNotEmpty ? '${latestVital.temperature}°C' : 'N/A'),
          _buildVitalRow(Icons.monitor_weight, 'Weight', latestVital.weight != null && latestVital.weight!.isNotEmpty ? '${latestVital.weight} kg' : 'N/A'),
        ],
      ),
    );
  }

  String _getRiskLevel(Vital vital) {
    int criticalCount = 0;
    int warningCount = 0;

    // BP
    if (vital.bloodPressureSystolic != null && vital.bloodPressureDiastolic != null) {
      if (vital.bloodPressureSystolic! >= 180 || vital.bloodPressureDiastolic! >= 120 || vital.bloodPressureSystolic! < 90) {
        criticalCount++;
      } else if (vital.bloodPressureSystolic! >= 140 || vital.bloodPressureDiastolic! >= 90) {
        warningCount++;
      }
    }

    // HR
    if (vital.heartRate != null && vital.heartRate!.isNotEmpty) {
      final hr = int.tryParse(vital.heartRate!);
      if (hr != null) {
        if (hr > 120 || hr < 50) criticalCount++;
        else if (hr > 100 || hr < 60) warningCount++;
      }
    }

    // Temp
    if (vital.temperature != null && vital.temperature!.isNotEmpty) {
      final temp = double.tryParse(vital.temperature!);
      if (temp != null) {
        // Assume celsius
        if (temp >= 39.5 || temp <= 35.0) criticalCount++;
        else if (temp >= 38.0 || temp <= 36.0) warningCount++;
      }
    }

    if (criticalCount > 0) return 'Critical';
    if (warningCount > 0) return 'Warning';
    if (vital.bloodPressureSystolic == null && vital.heartRate == null && vital.temperature == null) return 'Unknown';
    return 'Normal';
  }

  Color _getRiskColor(String level) {
    if (level == 'Critical') return PremiumColors.danger;
    if (level == 'Warning') return PremiumColors.accent;
    return PremiumColors.secondary;
  }
}
