import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../core/services/appointment_service.dart';
import '../../shared/models/vital_model.dart';
import '../../main.dart';
import 'add_vital_screen.dart';
import '../../shared/models/appointment_model.dart';

class VitalHistoryScreen extends StatefulWidget {
  const VitalHistoryScreen({super.key});

  @override
  State<VitalHistoryScreen> createState() => _VitalHistoryScreenState();
}

class _VitalHistoryScreenState extends State<VitalHistoryScreen> {
  final AppointmentService _appointmentService = AppointmentService();
  List<Appointment> _appointments = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadVitals();
  }

  Future<void> _loadVitals() async {
    try {
      final appointments = await _appointmentService.getMyAppointments();
      setState(() {
        _appointments = appointments;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to load vitals')));
    }
  }

  @override
  Widget build(BuildContext context) {
    // Extract all vitals
    List<Map<String, dynamic>> allVitals = [];
    for (var apt in _appointments) {
      for (var v in apt.vitals) {
        allVitals.add({'vital': v, 'appointmentId': apt.id, 'doctorName': apt.doctorName});
      }
    }
    // Sort by recordedAt descending (most recent first)
    allVitals.sort((a, b) {
      final va = a['vital'] as Vital;
      final vb = b['vital'] as Vital;
      if (va.recordedAt == null || vb.recordedAt == null) return 0;
      return DateTime.parse(vb.recordedAt!).compareTo(DateTime.parse(va.recordedAt!));
    });

    return Scaffold(
      appBar: AppBar(
        title: Text('Vital History', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textDark,
        elevation: 0,
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primary,
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
          : allVitals.isEmpty
              ? const Center(child: Text('No vitals recorded'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: allVitals.length,
                  itemBuilder: (context, index) {
                    final item = allVitals[index];
                    final vital = item['vital'] as Vital;
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
                                  style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: AppColors.primary),
                                ),
                                Text('Dr. ${item['doctorName']}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textLight)),
                              ],
                            ),
                            const Divider(),
                            _buildVitalRow(Icons.favorite, 'Heart Rate', vital.heartRate != null && vital.heartRate!.isNotEmpty ? '${vital.heartRate} bpm' : 'N/A'),
                            _buildVitalRow(Icons.bloodtype, 'Blood Pressure', vital.bloodPressure != null && vital.bloodPressure!.isNotEmpty ? '${vital.bloodPressure} mmHg' : 'N/A'),
                            _buildVitalRow(Icons.thermostat, 'Temperature', vital.temperature != null && vital.temperature!.isNotEmpty ? '${vital.temperature}°F' : 'N/A'),
                            _buildVitalRow(Icons.monitor_weight, 'Weight', vital.weight != null && vital.weight!.isNotEmpty ? '${vital.weight} lbs' : 'N/A'),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }

  Widget _buildVitalRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppColors.textLight),
          const SizedBox(width: 8),
          Text(label, style: GoogleFonts.inter(color: AppColors.textLight)),
          const Spacer(),
          Text(value, style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
