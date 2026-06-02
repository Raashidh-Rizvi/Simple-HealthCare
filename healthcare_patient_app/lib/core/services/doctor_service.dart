import '../../shared/models/doctor_model.dart';
import '../constants/api_constants.dart';
import 'api_client.dart';

class DoctorService {
  final ApiClient _apiClient = ApiClient();

  Future<List<Doctor>> getDoctors() async {
    try {
      final response = await _apiClient.dio.get(ApiConstants.doctors);
      if (response.statusCode == 200) {
        List<dynamic> data = response.data;
        return data.map((json) => Doctor.fromJson(json)).toList();
      }
    } catch (e) {
      print('Error fetching doctors: $e');
      throw Exception('Failed to load doctors');
    }
    return [];
  }
}
