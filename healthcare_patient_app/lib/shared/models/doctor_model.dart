class Doctor {
  final int id;
  final String specialization;
  final String firstName;
  final String lastName;
  final String email;
  final String consultationType;

  Doctor({
    required this.id,
    required this.specialization,
    required this.firstName,
    required this.lastName,
    required this.email,
    this.consultationType = 'Both',
  });

  factory Doctor.fromJson(Map<String, dynamic> json) {
    return Doctor(
      id: json['id'] ?? 0,
      specialization: json['specialization'] ?? '',
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      email: json['email'] ?? '',
      consultationType: json['consultationType'] ?? 'Both',
    );
  }
}
