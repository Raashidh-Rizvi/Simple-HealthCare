import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../core/services/appointment_service.dart';
import '../../shared/models/appointment_model.dart';
import '../../main.dart';

class MyAppointmentsScreen extends StatefulWidget {
  const MyAppointmentsScreen({super.key});

  @override
  State<MyAppointmentsScreen> createState() => _MyAppointmentsScreenState();
}

class _MyAppointmentsScreenState extends State<MyAppointmentsScreen> {
  final AppointmentService _appointmentService = AppointmentService();
  List<Appointment> _appointments = [];
  bool _isLoading = true;
  String _searchQuery = '';
  String _filterStatus = '';
  String _sortBy = 'dateDesc';

  List<Appointment> get _filteredAppointments {
    List<Appointment> result = List.from(_appointments);
    
    if (_sortBy == 'dateDesc') {
      result.sort((a, b) => b.appointmentDate.compareTo(a.appointmentDate));
    } else if (_sortBy == 'dateAsc') {
      result.sort((a, b) => a.appointmentDate.compareTo(b.appointmentDate));
    } else if (_sortBy == 'doctorAsc') {
      result.sort((a, b) => (a.doctorName ?? '').compareTo(b.doctorName ?? ''));
    } else if (_sortBy == 'doctorDesc') {
      result.sort((a, b) => (b.doctorName ?? '').compareTo(a.doctorName ?? ''));
    }
    
    if (_filterStatus.isNotEmpty) {
      result = result.where((apt) => apt.status.toLowerCase() == _filterStatus.toLowerCase()).toList();
    }

    if (_searchQuery.isNotEmpty) {
      final query = _searchQuery.toLowerCase();
      result = result.where((apt) {
        final docName = apt.doctorName?.toLowerCase() ?? '';
        final spec = apt.specialization?.toLowerCase() ?? '';
        final status = apt.status.toLowerCase();
        return docName.contains(query) || spec.contains(query) || status.contains(query);
      }).toList();
    }
    return result;
  }

  List<Appointment> get _topAppointments {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final tomorrow = today.add(const Duration(days: 1));

    final todayAppointments = _appointments.where((apt) => 
      apt.appointmentDate.isAfter(today.subtract(const Duration(seconds: 1))) && 
      apt.appointmentDate.isBefore(tomorrow)
    ).toList();
    
    if (todayAppointments.isNotEmpty) {
      todayAppointments.sort((a, b) => a.appointmentDate.compareTo(b.appointmentDate));
      return todayAppointments;
    }

    final upcoming = _appointments.where((apt) => 
      apt.appointmentDate.isAfter(now) && 
      (apt.status.toLowerCase() == 'pending' || apt.status.toLowerCase() == 'confirmed' || apt.status.toLowerCase() == 'scheduled')
    ).toList();
    
    upcoming.sort((a, b) => a.appointmentDate.compareTo(b.appointmentDate));
    return upcoming.take(2).toList();
  }

  @override
  void initState() {
    super.initState();
    _loadAppointments();
  }

  Future<void> _loadAppointments() async {
    try {
      final appointments = await _appointmentService.getMyAppointments();
      setState(() {
        _appointments = appointments;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to load appointments')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('My Appointments',
            style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : CustomScrollView(
              slivers: [
                if (_topAppointments.isNotEmpty)
                  SliverToBoxAdapter(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                          child: Text(
                            'Upcoming Appointments',
                            style: GoogleFonts.outfit(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: PremiumColors.primary,
                            ),
                          ),
                        ),
                        ..._topAppointments.map((apt) => _buildNextAppointmentCard(apt)),
                      ],
                    ),
                  ),
                SliverToBoxAdapter(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                    child: Row(
                      children: [
                        _buildFilterChip('All', ''),
                        const SizedBox(width: 8),
                        _buildFilterChip('Pending', 'Pending'),
                        const SizedBox(width: 8),
                        _buildFilterChip('Confirmed', 'Confirmed'),
                        const SizedBox(width: 8),
                        _buildFilterChip('Completed', 'Completed'),
                        const SizedBox(width: 8),
                        _buildFilterChip('Cancelled', 'Cancelled'),
                      ],
                    ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            decoration: InputDecoration(
                              hintText: 'Search by doctor, specialty...',
                              prefixIcon: const Icon(Icons.search),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              contentPadding: const EdgeInsets.symmetric(vertical: 0),
                            ),
                            onChanged: (value) {
                              setState(() {
                                _searchQuery = value;
                              });
                            },
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey.shade400),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _sortBy,
                              onChanged: (value) => setState(() => _sortBy = value!),
                              items: const [
                                DropdownMenuItem(value: 'dateDesc', child: Text('Newest')),
                                DropdownMenuItem(value: 'dateAsc', child: Text('Oldest')),
                                DropdownMenuItem(value: 'doctorAsc', child: Text('Doc A-Z')),
                                DropdownMenuItem(value: 'doctorDesc', child: Text('Doc Z-A')),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                _filteredAppointments.isEmpty
                    ? const SliverFillRemaining(
                        child: Center(child: Text('No appointments found')),
                      )
                    : SliverPadding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        sliver: SliverList(
                          delegate: SliverChildBuilderDelegate(
                            (context, index) {
                              final apt = _filteredAppointments[index];
                              return Card(
                                margin: const EdgeInsets.only(bottom: 16),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16)),
                                elevation: 2,
                                child: ListTile(
                                  contentPadding: const EdgeInsets.all(16),
                                  title: Text('Dr. ${apt.doctorName ?? 'Unknown'}',
                                      style:
                                          GoogleFonts.inter(fontWeight: FontWeight.bold)),
                                  subtitle: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const SizedBox(height: 4),
                                      Text(
                                          DateFormat('MMM dd, yyyy - hh:mm a')
                                              .format(apt.appointmentDate),
                                          style: GoogleFonts.inter(
                                              color: PremiumColors.primary)),
                                      const SizedBox(height: 4),
                                      Text('Status: ${apt.status.toUpperCase()}',
                                          style: GoogleFonts.inter(
                                              fontWeight: FontWeight.w500,
                                              color: (apt.status.toLowerCase() == 'completed' ||
                                                      apt.status.toLowerCase() == 'confirmed' ||
                                                      apt.status.toLowerCase() == 'scheduled' ||
                                                      apt.status.toLowerCase() == 'complete')
                                                  ? Colors.green
                                                  : Colors.orange)),
                                    ],
                                  ),
                                  trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                                  onTap: () => _showAppointmentDetails(context, apt),
                                ),
                              );
                            },
                            childCount: _filteredAppointments.length,
                          ),
                        ),
                      ),
              ],
            ),
    );
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
                      if (apt.type == 'Video Consultation' && (apt.status.toLowerCase() == 'confirmed' || apt.status.toLowerCase() == 'pending') && apt.encounterId == null) ...[
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
                      if (apt.type == 'Video Consultation' && apt.encounterId != null && apt.status.toLowerCase() != 'completed') ...[
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () {
                              Navigator.pop(context);
                              // Join room functionality
                              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Join Room coming soon.')));
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: PremiumColors.primary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              elevation: 0,
                            ),
                            child: Text('Join Room', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
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

  Widget _buildNextAppointmentCard(Appointment apt) {
    return GestureDetector(
      onTap: () => _showAppointmentDetails(context, apt),
      child: Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [PremiumColors.primary, PremiumColors.secondary],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: PremiumColors.primary.withValues(alpha: 0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.calendar_today, color: Colors.white, size: 20),
              const SizedBox(width: 8),
              Text(
                'Upcoming Appointment',
                style: GoogleFonts.outfit(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Dr. ${apt.doctorName ?? 'Unknown'}',
            style: GoogleFonts.outfit(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 22,
            ),
          ),
          if (apt.specialization != null)
            Text(
              apt.specialization!,
              style: GoogleFonts.inter(
                color: Colors.white.withValues(alpha: 0.9),
                fontSize: 14,
              ),
            ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Date',
                    style: GoogleFonts.inter(
                      color: Colors.white.withValues(alpha: 0.7),
                      fontSize: 12,
                    ),
                  ),
                  Text(
                    DateFormat('MMM dd, yyyy').format(apt.appointmentDate),
                    style: GoogleFonts.inter(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Time',
                    style: GoogleFonts.inter(
                      color: Colors.white.withValues(alpha: 0.7),
                      fontSize: 12,
                    ),
                  ),
                  Text(
                    DateFormat('hh:mm a').format(apt.appointmentDate),
                    style: GoogleFonts.inter(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _filterStatus == value;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          _filterStatus = value;
        });
      },
      backgroundColor: Colors.transparent,
      selectedColor: PremiumColors.primary.withValues(alpha: 0.15),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(
          color: isSelected ? PremiumColors.primary : Colors.grey.withValues(alpha: 0.2),
        ),
      ),
      labelStyle: TextStyle(
        color: isSelected ? PremiumColors.primary : Theme.of(context).textTheme.bodyMedium?.color,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
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
      Navigator.pop(context); // close modal
      setState(() => _isLoading = true);
      try {
        await _appointmentService.cancelAppointment(apt.id);
        await _loadAppointments();
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Appointment cancelled.')));
      } catch (e) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to cancel appointment.')));
      }
    }
  }

  Future<void> _checkIn(BuildContext context, Appointment apt) async {
    Navigator.pop(context);
    setState(() => _isLoading = true);
    try {
      await _appointmentService.checkInEncounter(apt.id);
      await _loadAppointments();
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Checked in successfully.')));
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to check in.')));
    }
  }

  void _showRescheduleDialog(BuildContext context, Appointment apt) {
    DateTime? selectedDate;
    List<Map<String, dynamic>> slots = [];
    Map<String, dynamic>? selectedSlot;
    bool loadingSlots = false;
    bool rescheduling = false;
    final reasonController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            Future<void> loadSlots(DateTime date) async {
              setModalState(() {
                loadingSlots = true;
                slots = [];
                selectedSlot = null;
              });
              try {
                if (apt.doctorId != null) {
                  final fetchedSlots = await _appointmentService.getAvailableSlots(apt.doctorId!, date);
                  setModalState(() {
                    slots = fetchedSlots;
                  });
                }
              } catch (e) {
                print(e);
              } finally {
                setModalState(() {
                  loadingSlots = false;
                });
              }
            }

            return Container(
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(28),
                  topRight: Radius.circular(28),
                ),
              ),
              padding: EdgeInsets.only(
                left: 24,
                right: 24,
                top: 24,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
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
                    Text(
                      'Reschedule Appointment',
                      style: GoogleFonts.outfit(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Dr. ${apt.doctorName ?? 'Unknown'}',
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        color: Theme.of(context).textTheme.bodySmall?.color,
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Select New Date',
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: PremiumColors.primary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    InkWell(
                      onTap: () async {
                        final date = await showDatePicker(
                          context: context,
                          initialDate: DateTime.now().add(const Duration(days: 1)),
                          firstDate: DateTime.now(),
                          lastDate: DateTime.now().add(const Duration(days: 60)),
                        );
                        if (date != null) {
                          setModalState(() => selectedDate = date);
                          loadSlots(date);
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                        decoration: BoxDecoration(
                          border: Border.all(color: Theme.of(context).dividerColor),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              selectedDate != null
                                  ? DateFormat('EEEE, MMM dd, yyyy').format(selectedDate!)
                                  : 'Tap to select a date',
                              style: GoogleFonts.inter(fontSize: 16),
                            ),
                            const Icon(Icons.calendar_today, size: 20, color: PremiumColors.primary),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    if (selectedDate != null) ...[
                      Text(
                        'Select Time Slot',
                        style: GoogleFonts.outfit(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: PremiumColors.primary,
                        ),
                      ),
                      const SizedBox(height: 12),
                      if (loadingSlots)
                        const Center(child: CircularProgressIndicator())
                      else if (slots.isEmpty)
                        Text(
                          'No available slots for this date.',
                          style: GoogleFonts.inter(color: Colors.red),
                        )
                      else
                        Wrap(
                          spacing: 12,
                          runSpacing: 12,
                          children: slots.map((slot) {
                            final isBooked = slot['isBooked'] == true;
                            final isSelected = selectedSlot == slot;
                            return InkWell(
                              onTap: isBooked
                                  ? null
                                  : () {
                                      setModalState(() {
                                        selectedSlot = slot;
                                      });
                                    },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? PremiumColors.primary
                                      : isBooked
                                          ? Colors.grey[200]
                                          : Colors.transparent,
                                  border: Border.all(
                                    color: isSelected
                                        ? PremiumColors.primary
                                        : isBooked
                                            ? Colors.grey[300]!
                                            : Theme.of(context).dividerColor,
                                  ),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  slot['startTime'] ?? '',
                                  style: GoogleFonts.inter(
                                    color: isSelected
                                        ? Colors.white
                                        : isBooked
                                            ? Colors.grey[400]
                                            : Theme.of(context).textTheme.bodyLarge?.color,
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                    decoration: isBooked ? TextDecoration.lineThrough : null,
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      const SizedBox(height: 24),
                    ],
                    Text(
                      'Reason (Optional)',
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: PremiumColors.primary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: reasonController,
                      decoration: InputDecoration(
                        hintText: 'Enter reason for rescheduling',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      maxLines: 2,
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: selectedSlot == null || rescheduling
                            ? null
                            : () async {
                                setModalState(() => rescheduling = true);
                                try {
                                  await _appointmentService.rescheduleAppointment(
                                    apt.id,
                                    selectedDate!,
                                    selectedSlot!['startTime'],
                                    selectedSlot!['endTime'],
                                    reasonController.text.trim().isEmpty ? null : reasonController.text.trim(),
                                  );
                                  Navigator.pop(context); // Close modal
                                  _loadAppointments();
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Appointment rescheduled successfully.')),
                                  );
                                } catch (e) {
                                  setModalState(() => rescheduling = false);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Failed to reschedule appointment.')),
                                  );
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: PremiumColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 0,
                        ),
                        child: rescheduling
                            ? const SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                              )
                            : Text(
                                'Confirm Reschedule',
                                style: GoogleFonts.inter(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
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
}

