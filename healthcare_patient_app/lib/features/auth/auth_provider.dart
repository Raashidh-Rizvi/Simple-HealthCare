import 'package:flutter/material.dart';
import '../../core/services/auth_service.dart';
import '../../shared/models/user_model.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  User? _user;
  bool _isLoading = false;

  User? get user => _user;
  bool get isLoading => _isLoading;

  Future<bool> checkLoginStatus() async {
    return await _authService.isLoggedIn();
  }

  Future<String?> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      _user = await _authService.login(email, password);
      _isLoading = false;
      notifyListeners();
      return _user != null ? null : 'Login failed. Please check credentials.';
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      
      // Parse exception message if it starts with "Exception: "
      String msg = e.toString();
      if (msg.startsWith('Exception: ')) {
        msg = msg.substring(11);
      }
      return msg;
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    _user = null;
    notifyListeners();
  }
}
