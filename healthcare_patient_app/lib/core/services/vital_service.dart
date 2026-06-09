import '../../shared/models/vital_model.dart';
import '../constants/api_constants.dart';
import 'api_client.dart';

class VitalService {
  final ApiClient _apiClient = ApiClient();

  Future<bool> addVital(int appointmentId, Vital vital) async {
    try {
      final response = await _apiClient.dio.post(
        '${ApiConstants.appointments}/$appointmentId/vitals',
        data: vital.toJson(),
      );
      return response.statusCode == 200;
    } catch (e) {
      print('Error adding vital: $e');
      throw Exception('Failed to add vital');
    }
  }

  Future<List<Vital>> getPatientVitals(int patientId) async {
    try {
      final response = await _apiClient.dio.get('${ApiConstants.baseUrl}/patients/$patientId/vitals');
      if (response.statusCode == 200) {
        List<dynamic> data = response.data;
        return data.map((json) => Vital.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error getting vitals: $e');
      return [];
    }
  }
}
