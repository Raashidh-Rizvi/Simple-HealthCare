import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../../main.dart';
import '../../../main.dart';
import '../../../core/services/appointment_service.dart';
import '../../../shared/models/appointment_model.dart';
import '../../../shared/models/vital_model.dart';
import '../../../core/services/patient_service.dart';
import '../../../core/services/vital_service.dart';

class OverviewTab extends StatefulWidget {
  const OverviewTab({super.key});

  @override
  State<OverviewTab> createState() => _OverviewTabState();
}

class _OverviewTabState extends State<OverviewTab> {
  final AppointmentService _appointmentService = AppointmentService();
  final PatientService _patientService = PatientService();
  final VitalService _vitalService = VitalService();
  List<Appointment> _appointments = [];
  Vital? _latestVital;
  String _patientName = 'Patient';
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      Vital? latest;
      final profile = await _patientService.getPatientProfile();
      if (profile != null) {
        _patientName = '${profile['firstName'] ?? ''} ${profile['lastName'] ?? ''}'.trim();
        if (_patientName.isEmpty) _patientName = 'Patient';
        
        final vitals = await _vitalService.getPatientVitals(profile['id']);
        if (vitals.isNotEmpty) {
          latest = vitals.first;
        }
      }

      final appointments = await _appointmentService.getMyAppointments();

      setState(() {
        _appointments = appointments;
        _latestVital = latest;
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading overview data: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  int get _upcomingCount => _appointments.where((a) => a.status.toLowerCase() == 'pending' || a.status.toLowerCase() == 'confirmed' || a.status.toLowerCase() == 'scheduled').length;
  int get _completedCount => _appointments.where((a) => a.status.toLowerCase() == 'completed' || a.status.toLowerCase() == 'complete').length;

  List<Appointment> get _upcomingAppointments {
    final upcoming = _appointments.where((a) => a.status.toLowerCase() == 'pending' || a.status.toLowerCase() == 'confirmed' || a.status.toLowerCase() == 'scheduled').toList();
    upcoming.sort((a, b) => a.appointmentDate.compareTo(b.appointmentDate));
    return upcoming;
  }

  Appointment? get _todayOrTomorrowAppointment {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final dayAfterTomorrow = today.add(const Duration(days: 2));

    for (var apt in _upcomingAppointments) {
      if (apt.appointmentDate.isAfter(today.subtract(const Duration(seconds: 1))) && 
          apt.appointmentDate.isBefore(dayAfterTomorrow)) {
        return apt;
      }
    }
    return null;
  }

  List<Appointment> get _nextFewAppointments {
    final todayOrTomorrow = _todayOrTomorrowAppointment;
    final allUpcoming = _upcomingAppointments;
    if (todayOrTomorrow != null) {
      allUpcoming.removeWhere((a) => a.id == todayOrTomorrow.id);
    }
    return allUpcoming.take(3).toList();
  }

  String _getRiskLevel(Vital? vital) {
    if (vital == null) return 'Normal';
    
    int sys = vital.bloodPressureSystolic ?? 0;
    int dia = vital.bloodPressureDiastolic ?? 0;
    int hr = int.tryParse(vital.heartRate ?? '0') ?? 0;
    double temp = double.tryParse(vital.temperature ?? '0') ?? 0.0;
    
    if (sys >= 180 || dia >= 120) return 'Critical';
    if (sys >= 140 || dia >= 90) return 'High';
    if (sys > 0 && (sys < 90 || dia < 60)) return 'Low';
    if (hr > 120 || (hr > 0 && hr < 50)) return 'Critical';
    if (hr > 100 || (hr > 0 && hr < 60)) return 'Abnormal';
    if (temp > 39.5 || (temp > 0 && temp < 35)) return 'Critical';
    if (temp > 37.5) return 'High';
    // O2 not in Vital model but let's assume if we had it:
    return 'Normal';
  }

  Color _getRiskColor(String riskLevel) {
    switch (riskLevel) {
      case 'Normal':
        return Colors.green;
      case 'Elevated':
      case 'Warning':
        return Colors.orange;
      case 'Critical':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  void _showAppointmentDetails(BuildContext context, Appointment apt) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(28),
              topRight: Radius.circular(28),
            ),
          ),
          padding: const EdgeInsets.all(24),
          child: DraggableScrollableSheet(
            expand: false,
            initialChildSize: 0.7,
            minChildSize: 0.5,
            maxChildSize: 0.95,
            builder: (context, scrollController) {
              return ListView(
                controller: scrollController,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      margin: const EdgeInsets.only(bottom: 20),
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Dr. ${apt.doctorName ?? 'Unknown'}',
                              style: GoogleFonts.outfit(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              apt.specialization ?? 'Specialist',
                              style: GoogleFonts.inter(
                                fontSize: 16,
                                color: Theme.of(context).textTheme.bodySmall?.color,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: (apt.status.toLowerCase() == 'completed' ||
                                  apt.status.toLowerCase() == 'confirmed' ||
                                  apt.status.toLowerCase() == 'scheduled' ||
                                  apt.status.toLowerCase() == 'complete')
                              ? Colors.green.withValues(alpha: 0.1)
                              : Colors.orange.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          apt.status.toUpperCase(),
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: (apt.status.toLowerCase() == 'completed' ||
                                    apt.status.toLowerCase() == 'confirmed' ||
                                    apt.status.toLowerCase() == 'scheduled' ||
                                    apt.status.toLowerCase() == 'complete')
                                ? Colors.green
                                : Colors.orange,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 32),
                  _buildSectionTitle('Appointment Date'),
                  const SizedBox(height: 8),
                  Text(
                    DateFormat('EEEE, MMMM dd, yyyy - hh:mm a')
                        .format(apt.appointmentDate),
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 24),
                  _buildSectionTitle('Consultation Notes'),
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Theme.of(context).dividerColor),
                    ),
                    child: Text(
                      apt.notes == null || apt.notes!.isEmpty
                          ? 'No consultation notes recorded.'
                          : apt.notes!,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        height: 1.5,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  _buildSectionTitle('Vitals History'),
                  const SizedBox(height: 8),
                  if (apt.vitals.isEmpty)
                    Text(
                      'No vitals recorded.',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: Theme.of(context).textTheme.bodySmall?.color,
                        fontStyle: FontStyle.italic,
                      ),
                    )
                  else
                    ...apt.vitals.map((vital) {
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: BorderSide(color: Theme.of(context).dividerColor),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (vital.recordedAt != null) ...[
                                Text(
                                  'Recorded: ${DateFormat('MMM dd, yyyy hh:mm a').format(DateTime.parse(vital.recordedAt!))}',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    color: Theme.of(context).textTheme.bodySmall?.color,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 8),
                              ],
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  _buildVitalItem('Heart Rate',
                                      '${vital.heartRate ?? "--"} bpm'),
                                  _buildVitalItem('Blood Pressure',
                                      '${vital.bloodPressureSystolic ?? "--"}/${vital.bloodPressureDiastolic ?? "--"} mmHg'),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  _buildVitalItem('Temperature',
                                      '${vital.temperature ?? "--"} °F'),
                                  _buildVitalItem('Weight',
                                      '${vital.weight ?? "--"} lbs'),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                  const SizedBox(height: 24),
                  _buildSectionTitle('Prescriptions & Orders'),
                  const SizedBox(height: 8),
                  if (apt.orders.isEmpty)
                    Text(
                      'No orders or prescriptions recorded.',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: PremiumColors.textLight,
                        fontStyle: FontStyle.italic,
                      ),
                    )
                  else
                    ...apt.orders.map((order) {
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: BorderSide(color: Colors.grey[100]!),
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 8),
                          title: Text(
                            order.orderType,
                            style: GoogleFonts.inter(
                              fontWeight: FontWeight.bold,
                              color: PremiumColors.primary,
                            ),
                          ),
                          subtitle: Text(
                            order.description,
                            style: GoogleFonts.inter(),
                          ),
                          trailing: order.createdAt != null
                              ? Text(
                                  DateFormat('MMM dd').format(
                                      DateTime.parse(order.createdAt!)),
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    color: Theme.of(context).textTheme.bodySmall?.color,
                                  ),
                                )
                              : null,
                        ),
                      );
                    }),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      if (apt.status.toLowerCase() == 'pending' || apt.status.toLowerCase() == 'confirmed') ...[
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => _cancelAppointment(context, apt),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: PremiumColors.danger,
                              side: const BorderSide(color: PremiumColors.danger),
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: Text('Cancel', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                          ),
                        ),
                        const SizedBox(width: 12),
                      ],
                      if (apt.status.toLowerCase() == 'pending') ...[
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () {
                              Navigator.pop(context);
                              _showRescheduleDialog(context, apt);
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: PremiumColors.primary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              elevation: 0,
                            ),
                            child: Text('Reschedule', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                      if (apt.status.toLowerCase() == 'confirmed') ...[
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () => _checkIn(context, apt),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: PremiumColors.secondary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              elevation: 0,
                            ),
                            child: Text('Check In (Video)', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Theme.of(context).cardColor,
                      foregroundColor: Theme.of(context).textTheme.bodyLarge?.color,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(color: Theme.of(context).dividerColor),
                      ),
                      elevation: 0,
                    ),
                    child: Text(
                      'Close',
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        );
      },
    );
  }

  Future<void> _cancelAppointment(BuildContext context, Appointment apt) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel Appointment'),
        content: Text('Are you sure you want to cancel your appointment with Dr. ${apt.doctorName}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('No')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Yes', style: TextStyle(color: PremiumColors.danger))),
        ],
      ),
    );

    if (confirm == true) {
      if (mounted) Navigator.pop(context); // close modal
      setState(() => _isLoading = true);
      try {
        await _appointmentService.cancelAppointment(apt.id);
        await _loadData();
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Appointment cancelled.')));
      } catch (e) {
        setState(() => _isLoading = false);
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to cancel appointment.')));
      }
    }
  }

  Future<void> _checkIn(BuildContext context, Appointment apt) async {
    if (mounted) Navigator.pop(context);
    setState(() => _isLoading = true);
    try {
      await _appointmentService.checkInEncounter(apt.id);
      await _loadData();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Checked in successfully.')));
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to check in.')));
    }
  }

  void _showRescheduleDialog(BuildContext context, Appointment apt) {
    // Basic stub for reschedule
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Reschedule flow coming soon.')));
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.outfit(
        fontSize: 16,
        fontWeight: FontWeight.bold,
        color: PremiumColors.primary,
        letterSpacing: 0.5,
      ),
    );
  }

  Widget _buildVitalItem(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            color: Theme.of(context).textTheme.bodySmall?.color,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return RefreshIndicator(
      onRefresh: _loadData,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Welcome back,\n$_patientName',
              style: GoogleFonts.outfit(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                height: 1.2,
              ),
            ),
            const SizedBox(height: 24),
            
            // KPI Grid
            Row(
              children: [
                Expanded(
                  child: _buildKpiCard(
                    'Upcoming',
                    '$_upcomingCount',
                    Icons.event,
                    PremiumColors.primary,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildKpiCard(
                    'Completed',
                    '$_completedCount',
                    Icons.check_circle_outline,
                    PremiumColors.secondary,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildKpiCard(
                    'Total',
                    '${_appointments.length}',
                    Icons.analytics_outlined,
                    PremiumColors.accent,
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 24),
            Text(
              "Today's / Tomorrow's Appointment",
              style: GoogleFonts.outfit(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            _buildTodayTomorrowAppointmentCard(isDark),
            
            const SizedBox(height: 24),
            Text(
              'Next Appointments',
              style: GoogleFonts.outfit(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            _buildNextAppointmentsList(isDark),
            
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Health Summary',
                  style: GoogleFonts.outfit(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (_latestVital != null && _getRiskLevel(_latestVital) != 'Normal')
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: _getRiskColor(_getRiskLevel(_latestVital)).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: _getRiskColor(_getRiskLevel(_latestVital)).withValues(alpha: 0.3)),
                    ),
                    child: Text(
                      'Status: ${_getRiskLevel(_latestVital)}',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: _getRiskColor(_getRiskLevel(_latestVital)),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            _buildHealthSummaryCard(isDark),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildKpiCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border(top: BorderSide(color: color, width: 4)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: GoogleFonts.outfit(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 12,
              color: Theme.of(context).textTheme.bodySmall?.color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTodayTomorrowAppointmentCard(bool isDark) {
    if (_todayOrTomorrowAppointment == null) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Center(
          child: Text(
            'No appointments scheduled for today or tomorrow.',
            style: GoogleFonts.inter(color: Theme.of(context).textTheme.bodySmall?.color),
          ),
        ),
      );
    }
    return GestureDetector(
      onTap: () => _showAppointmentDetails(context, _todayOrTomorrowAppointment!),
      child: _buildAppointmentCard(_todayOrTomorrowAppointment!, isDark),
    );
  }

  Widget _buildNextAppointmentsList(bool isDark) {
    final nextAppts = _nextFewAppointments;
    if (nextAppts.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Center(
          child: Text(
            'No further upcoming appointments.',
            style: GoogleFonts.inter(color: Theme.of(context).textTheme.bodySmall?.color),
          ),
        ),
      );
    }

    return Column(
      children: nextAppts.map((apt) => Padding(
        padding: const EdgeInsets.only(bottom: 12.0),
        child: GestureDetector(
          onTap: () => _showAppointmentDetails(context, apt),
          child: _buildAppointmentCard(apt, isDark),
        ),
      )).toList(),
    );
  }

  Widget _buildAppointmentCard(Appointment apt, bool isDark) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: PremiumColors.primary.withValues(alpha: 0.2)),
        boxShadow: [
          BoxShadow(
            color: PremiumColors.primary.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Dr. ${apt.doctorName}',
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: PremiumColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  apt.status.toUpperCase(),
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: PremiumColors.primary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            '${apt.specialization ?? "Specialist"} • Consultation',
            style: GoogleFonts.inter(
              fontSize: 14,
              color: PremiumColors.primary,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.calendar_today, size: 14, color: PremiumColors.primary),
                  const SizedBox(width: 4),
                  Text(
                    DateFormat('MMM dd, yyyy').format(apt.appointmentDate),
                    style: GoogleFonts.inter(fontSize: 13),
                  ),
                ],
              ),
              Row(
                children: [
                  const Icon(Icons.access_time, size: 14, color: PremiumColors.primary),
                  const SizedBox(width: 4),
                  Text(
                    DateFormat('hh:mm a').format(apt.appointmentDate), // using date as start time roughly
                    style: GoogleFonts.inter(fontSize: 13),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHealthSummaryCard(bool isDark) {
    if (_latestVital == null) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Center(
          child: Text(
            'No health data available.',
            style: GoogleFonts.inter(color: Theme.of(context).textTheme.bodySmall?.color),
          ),
        ),
      );
    }

    final v = _latestVital!;
    final dateStr = v.recordedAt != null ? DateFormat('MMM dd').format(DateTime.parse(v.recordedAt!)) : 'Unknown';

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          _buildVitalRow('🩸', 'Blood Pressure', '${v.bloodPressureSystolic ?? "--"}/${v.bloodPressureDiastolic ?? "--"}', 'Last reading: $dateStr'),
          const Divider(height: 1, indent: 16, endIndent: 16),
          _buildVitalRow('❤️', 'Heart Rate', '${v.heartRate ?? "--"} bpm', 'Last reading: $dateStr'),
          const Divider(height: 1, indent: 16, endIndent: 16),
          _buildVitalRow('🌡️', 'Temperature', '${v.temperature ?? "--"}', 'Last reading: $dateStr'),
          const Divider(height: 1, indent: 16, endIndent: 16),
          _buildVitalRow('⚖️', 'Weight', '${v.weight ?? "--"}', 'Last reading: $dateStr'),
        ],
      ),
    );
  }

  Widget _buildVitalRow(String emoji, String title, String value, String subtitle) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 24)),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                Text(
                  subtitle,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: Theme.of(context).textTheme.bodySmall?.color,
                  ),
                ),
              ],
            ),
          ),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
