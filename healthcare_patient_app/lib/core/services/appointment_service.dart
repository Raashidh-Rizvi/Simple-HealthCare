import '../../shared/models/appointment_model.dart';
import '../constants/api_constants.dart';
import 'api_client.dart';

class AppointmentService {
  final ApiClient _apiClient = ApiClient();

  Future<bool> createAppointment(
      int doctorId, DateTime date, String? notes, String type) async {
    try {
      final response = await _apiClient.dio.post(
        ApiConstants.appointments,
        data: {
          'doctorId': doctorId,
          'appointmentDate': date.toIso8601String(),
          'notes': notes,
          'type': type,
        },
      );
      return response.statusCode == 200;
    } catch (e) {
      print('Error booking appointment: $e');
      throw Exception('Failed to book appointment');
    }
  }

  Future<List<Map<String, dynamic>>> getAvailableSlots(int doctorId, DateTime date) async {
    try {
      final response = await _apiClient.dio.get(
        ApiConstants.availableSlots,
        queryParameters: {
          'doctorId': doctorId,
          'date': date.toIso8601String(),
        },
      );
      if (response.statusCode == 200) {
        return List<Map<String, dynamic>>.from(response.data['slots']);
      }
    } catch (e) {
      print('Error fetching slots: $e');
    }
    return [];
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

  Future<bool> cancelAppointment(int id) async {
    try {
      final response = await _apiClient.dio.put('${ApiConstants.appointments}/$id/cancel');
      return response.statusCode == 200 || response.statusCode == 204;
    } catch (e) {
      print('Error cancelling appointment: $e');
      throw Exception('Failed to cancel appointment');
    }
  }

  Future<bool> rescheduleAppointment(int id, DateTime newDate, String newStartTime, String newEndTime, String? reason) async {
    try {
      final response = await _apiClient.dio.put(
        '${ApiConstants.appointments}/$id/reschedule',
        data: {
          'appointmentDate': newDate.toIso8601String(),
          'startTime': newStartTime,
          'endTime': newEndTime,
          'reason': reason,
        },
      );
      return response.statusCode == 200 || response.statusCode == 204;
    } catch (e) {
      print('Error rescheduling appointment: $e');
      throw Exception('Failed to reschedule appointment');
    }
  }

  Future<Map<String, dynamic>?> checkInEncounter(int appointmentId) async {
    try {
      final response = await _apiClient.dio.post(
        '${ApiConstants.baseUrl}/encounters/check-in',
        data: {'appointmentId': appointmentId},
      );
      if (response.statusCode == 200) {
        return response.data;
      }
    } catch (e) {
      print('Error checking in: $e');
      throw Exception('Failed to check in');
    }
    return null;
  }

  Future<List<Map<String, dynamic>>> getNotifications() async {
    try {
      final response = await _apiClient.dio.get('${ApiConstants.appointments}/notifications');
      if (response.statusCode == 200) {
        return List<Map<String, dynamic>>.from(response.data);
      }
    } catch (e) {
      print('Error fetching notifications: $e');
    }
    return [];
  }

  Future<bool> markNotificationRead(int id) async {
    try {
      final response = await _apiClient.dio.put('${ApiConstants.appointments}/notifications/$id/read');
      return response.statusCode == 200 || response.statusCode == 204;
    } catch (e) {
      print('Error marking notification read: $e');
      return false;
    }
  }

  Future<bool> markAllNotificationsRead() async {
    try {
      final response = await _apiClient.dio.put('${ApiConstants.appointments}/notifications/read-all');
      return response.statusCode == 200 || response.statusCode == 204;
    } catch (e) {
      print('Error marking all notifications read: $e');
      return false;
    }
  }
}
