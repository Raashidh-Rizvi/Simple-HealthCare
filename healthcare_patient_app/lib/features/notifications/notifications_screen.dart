import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../main.dart';
import '../../core/services/appointment_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final AppointmentService _appointmentService = AppointmentService();
  List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    final notifs = await _appointmentService.getNotifications();
    setState(() {
      _notifications = notifs;
      _isLoading = false;
    });
  }

  Future<void> _markAsRead(Map<String, dynamic> n) async {
    if (n['isRead'] == true) return;
    final success = await _appointmentService.markNotificationRead(n['id']);
    if (success) {
      setState(() {
        n['isRead'] = true;
      });
    }
  }

  Future<void> _markAllAsRead() async {
    final success = await _appointmentService.markAllNotificationsRead();
    if (success) {
      setState(() {
        for (var n in _notifications) {
          n['isRead'] = true;
        }
      });
    }
  }

  Color _getNotificationColor(String? type) {
    switch (type?.toLowerCase()) {
      case 'booking': return PremiumColors.primary;
      case 'cancellation': return PremiumColors.danger;
      case 'reminder': return PremiumColors.accent;
      default: return PremiumColors.secondary;
    }
  }

  IconData _getNotificationIcon(String? type) {
    switch (type?.toLowerCase()) {
      case 'booking': return Icons.event_available;
      case 'cancellation': return Icons.cancel;
      case 'reminder': return Icons.access_alarm;
      default: return Icons.notifications;
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasUnread = _notifications.any((n) => !(n['isRead'] ?? false));

    return Scaffold(
      appBar: AppBar(
        title: Text('Notifications', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        actions: [
          if (hasUnread)
            TextButton(
              onPressed: _markAllAsRead,
              child: Text(
                'Mark All Read',
                style: GoogleFonts.inter(color: PremiumColors.primary, fontWeight: FontWeight.bold),
              ),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _notifications.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.notifications_none, size: 64, color: Theme.of(context).textTheme.bodySmall?.color),
                      const SizedBox(height: 16),
                      Text('All Caught Up!', style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      Text("You don't have any notifications right now.", style: GoogleFonts.inter(color: Theme.of(context).textTheme.bodySmall?.color)),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _notifications.length,
                  itemBuilder: (context, index) {
                    final n = _notifications[index];
                    final isRead = n['isRead'] ?? false;
                    final color = _getNotificationColor(n['type']);
                    
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(
                          color: isRead ? Colors.transparent : color.withValues(alpha: 0.5),
                          width: isRead ? 0 : 1.5,
                        ),
                      ),
                      child: InkWell(
                        onTap: () => _markAsRead(n),
                        borderRadius: BorderRadius.circular(12),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: color.withValues(alpha: 0.1),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(_getNotificationIcon(n['type']), color: color, size: 24),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          n['type'] ?? 'Notification',
                                          style: GoogleFonts.inter(
                                            color: color,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        if (!isRead)
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: PremiumColors.danger,
                                              borderRadius: BorderRadius.circular(10),
                                            ),
                                            child: const Text(
                                              'NEW',
                                              style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                            ),
                                          ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      n['message'] ?? '',
                                      style: GoogleFonts.inter(
                                        fontSize: 14,
                                        fontWeight: isRead ? FontWeight.normal : FontWeight.w600,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      n['sentAt'] != null ? DateFormat('MMM dd, yyyy - hh:mm a').format(DateTime.parse(n['sentAt'])) : '',
                                      style: GoogleFonts.inter(
                                        fontSize: 12,
                                        color: Theme.of(context).textTheme.bodySmall?.color,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
