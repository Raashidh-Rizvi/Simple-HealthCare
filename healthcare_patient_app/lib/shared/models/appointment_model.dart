import 'vital_model.dart';

class Appointment {
  final int id;
  final String? doctorName;
  final String? patientName;
  final String? specialization;
  final DateTime appointmentDate;
  final String status;
  final String? notes;
  final List<Vital> vitals;

  Appointment({
    required this.id,
    this.doctorName,
    this.patientName,
    this.specialization,
    required this.appointmentDate,
    required this.status,
    this.notes,
    required this.vitals,
  });

  factory Appointment.fromJson(Map<String, dynamic> json) {
    var vitalsList = json['vitals'] as List? ?? [];
    List<Vital> vitals = vitalsList.map((i) => Vital.fromJson(i)).toList();

    return Appointment(
      id: json['id'] ?? 0,
      doctorName: json['doctorName'],
      patientName: json['patientName'],
      specialization: json['specialization'],
      appointmentDate: DateTime.parse(json['appointmentDate']),
      status: json['status'] ?? '',
      notes: json['notes'],
      vitals: vitals,
    );
  }
}
