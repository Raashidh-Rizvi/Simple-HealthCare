import '../../shared/models/appointment_model.dart';
import '../constants/api_constants.dart';
import 'api_client.dart';

class AppointmentService {
  final ApiClient _apiClient = ApiClient();

  Future<bool> createAppointment(
      int doctorId, DateTime date, String? notes) async {
    try {
      final response = await _apiClient.dio.post(
        ApiConstants.appointments,
        data: {
          'doctorId': doctorId,
          'appointmentDate': date.toIso8601String(),
          'notes': notes,
        },
      );
      return response.statusCode == 200;
    } catch (e) {
      print('Error booking appointment: $e');
      throw Exception('Failed to book appointment');
    }
  }

  Future<List<Appointment>> getMyAppointments() async {
    try {
      final response = await _apiClient.dio.get(ApiConstants.myAppointments);
      if (response.statusCode == 200) {
        List<dynamic> data = response.data;
        return data.map((json) => Appointment.fromJson(json)).toList();
      }
    } catch (e) {
      print('Error fetching appointments: $e');
      throw Exception('Failed to load appointments');
    }
    return [];
  }
}
