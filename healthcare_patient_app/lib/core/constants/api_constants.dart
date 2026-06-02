class ApiConstants {
  // Use 10.0.2.2 for Android Emulator, localhost for iOS/Web, or your physical IP for real devices.
  // We're setting localhost as default since you are running on Edge (Web).
  static const String baseUrl = 'http://localhost:5207/api';
  
  // Auth
  static const String login = '$baseUrl/auth/login';
  static const String register = '$baseUrl/auth/register';

  // Doctors
  static const String doctors = '$baseUrl/doctors';

  // Appointments
  static const String appointments = '$baseUrl/appointments';
  static const String myAppointments = '$baseUrl/appointments/me';
}
