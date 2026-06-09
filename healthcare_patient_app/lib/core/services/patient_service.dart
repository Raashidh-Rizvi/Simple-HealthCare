import '../constants/api_constants.dart';
import 'api_client.dart';

class PatientService {
  final ApiClient _apiClient = ApiClient();

  Future<Map<String, dynamic>?> getPatientProfile() async {
    try {
      final response = await _apiClient.dio.get('${ApiConstants.baseUrl}/patients/me');
      if (response.statusCode == 200) {
        return response.data;
      }
    } catch (e) {
      print('Error fetching patient profile: $e');
    }
    return null;
  }

  Future<bool> updatePatientProfile(Map<String, dynamic> profileData) async {
    try {
      final response = await _apiClient.dio.put(
        '${ApiConstants.baseUrl}/patients/me',
        data: profileData,
      );
      return response.statusCode == 200 || response.statusCode == 204;
    } catch (e) {
      print('Error updating patient profile: $e');
      throw Exception('Failed to update profile');
    }
  }
}
