import 'vital_model.dart';
import 'order_model.dart';

class Appointment {
  final int id;
  final int? doctorId;
  final String? doctorName;
  final int? patientId;
  final String? patientName;
  final String? specialization;
  final DateTime appointmentDate;
  final String status;
  final String? notes;
  final String? type;
  final int? encounterId;
  final String? startTime;
  final String? endTime;
  final String? reason;
  final double? consultationFee;
  final List<Vital> vitals;
  final List<Order> orders;

  Appointment({
    required this.id,
    this.doctorId,
    this.doctorName,
    this.patientId,
    this.patientName,
    this.specialization,
    required this.appointmentDate,
    required this.status,
    this.notes,
    this.type,
    this.encounterId,
    this.startTime,
    this.endTime,
    this.reason,
    this.consultationFee,
    required this.vitals,
    required this.orders,
  });

  factory Appointment.fromJson(Map<String, dynamic> json) {
    var vitalsList = json['vitals'] as List? ?? [];
    List<Vital> vitals = vitalsList.map((i) => Vital.fromJson(i)).toList();

    var ordersList = json['orders'] as List? ?? [];
    List<Order> orders = ordersList.map((i) => Order.fromJson(i)).toList();

    return Appointment(
      id: json['id'] ?? 0,
      doctorId: json['doctorId'],
      doctorName: json['doctorName'],
      patientId: json['patientId'],
      patientName: json['patientName'],
      specialization: json['specialization'],
      appointmentDate: DateTime.parse(json['appointmentDate']),
      status: json['status'] ?? '',
      notes: json['notes'],
      type: json['type'],
      encounterId: json['encounterId'],
      startTime: json['startTime'],
      endTime: json['endTime'],
      reason: json['reason'],
      consultationFee: json['consultationFee'] != null ? (json['consultationFee'] as num).toDouble() : null,
      vitals: vitals,
      orders: orders,
    );
  }
}

