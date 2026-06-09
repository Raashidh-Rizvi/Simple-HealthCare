import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../main.dart';
import '../vitals/vital_history_screen.dart';

class HealthRecordsScreen extends StatefulWidget {
  const HealthRecordsScreen({super.key});

  @override
  State<HealthRecordsScreen> createState() => _HealthRecordsScreenState();
}

class _HealthRecordsScreenState extends State<HealthRecordsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final List<Map<String, dynamic>> _medicalHistory = [
    { 'date': '2025-11-10', 'condition': 'Hypertension', 'doctor': 'Dr. Smith', 'notes': 'Prescribed Amlodipine 5mg.' },
    { 'date': '2025-06-15', 'condition': 'Type 2 Diabetes', 'doctor': 'Dr. Lee', 'notes': 'Started Metformin 500mg.' }
  ];

  final List<Map<String, dynamic>> _labReports = [
    { 'date': '2026-05-20', 'test': 'Complete Blood Count (CBC)', 'result': 'Normal', 'status': 'Final' },
    { 'date': '2026-05-20', 'test': 'Lipid Panel', 'result': 'Elevated LDL', 'status': 'Final' },
    { 'date': '2026-02-10', 'test': 'HbA1c', 'result': '6.8%', 'status': 'Final' }
  ];

  final List<Map<String, dynamic>> _imagingRecords = [
    { 'date': '2026-01-05', 'type': 'Chest X-Ray', 'region': 'Chest', 'result': 'Clear, no abnormalities detected.' },
    { 'date': '2025-08-12', 'type': 'MRI', 'region': 'Brain', 'result': 'No acute intracranial pathology.' }
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Health Records', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: PremiumColors.primary,
          unselectedLabelColor: Theme.of(context).textTheme.bodySmall?.color,
          indicatorColor: PremiumColors.primary,
          tabs: const [
            Tab(text: 'Vitals'),
            Tab(text: 'Medical History'),
            Tab(text: 'Lab Reports'),
            Tab(text: 'Imaging'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Vitals Tab
          const VitalHistoryScreen(),
          
          // Medical History Tab
          _buildMedicalHistoryTab(),
          
          // Labs Tab
          _buildLabReportsTab(),
          
          // Imaging Tab
          _buildImagingTab(),
        ],
      ),
    );
  }

  Widget _buildMedicalHistoryTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _medicalHistory.length,
      itemBuilder: (context, index) {
        final item = _medicalHistory[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item['condition'],
                  style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  '${item['date']} • Diagnosed by ${item['doctor']}',
                  style: GoogleFonts.inter(fontSize: 12, color: Theme.of(context).textTheme.bodySmall?.color),
                ),
                const SizedBox(height: 8),
                Text(item['notes'], style: GoogleFonts.inter(fontSize: 14)),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildLabReportsTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _labReports.length,
      itemBuilder: (context, index) {
        final report = _labReports[index];
        final isNormal = report['result'] == 'Normal';
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            contentPadding: const EdgeInsets.all(16),
            title: Text(report['test'], style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 4),
                Text('${report['date']} • Status: ${report['status']}'),
                const SizedBox(height: 4),
                Text(
                  'Result: ${report['result']}',
                  style: TextStyle(
                    color: isNormal ? PremiumColors.secondary : PremiumColors.accent,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            trailing: OutlinedButton(
              onPressed: () {},
              child: const Text('View PDF'),
            ),
          ),
        );
      },
    );
  }

  Widget _buildImagingTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _imagingRecords.length,
      itemBuilder: (context, index) {
        final image = _imagingRecords[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${image['type']} - ${image['region']}',
                  style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  image['date'],
                  style: GoogleFonts.inter(fontSize: 12, color: Theme.of(context).textTheme.bodySmall?.color),
                ),
                const SizedBox(height: 8),
                Text(image['result'], style: GoogleFonts.inter(fontSize: 14)),
                const SizedBox(height: 12),
                Container(
                  height: 100,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.grey.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey.withValues(alpha: 0.3), style: BorderStyle.solid),
                  ),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.image, size: 32, color: Colors.grey),
                        const SizedBox(height: 8),
                        Text('View Image', style: GoogleFonts.inter(color: Colors.grey)),
                      ],
                    ),
                  ),
                )
              ],
            ),
          ),
        );
      },
    );
  }
}
