import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../main.dart';
import '../../core/services/patient_service.dart';

class ProfileSettingsScreen extends StatefulWidget {
  const ProfileSettingsScreen({super.key});

  @override
  State<ProfileSettingsScreen> createState() => _ProfileSettingsScreenState();
}

class _ProfileSettingsScreenState extends State<ProfileSettingsScreen> {
  final PatientService _patientService = PatientService();
  bool _isLoading = true;
  
  final _formKey = GlobalKey<FormState>();
  String _firstName = '';
  String _lastName = '';
  String _email = '';
  String _phone = '';
  String _dateOfBirth = '';
  String _gender = '';
  String _bloodGroup = '';

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final profile = await _patientService.getPatientProfile();
    if (profile != null) {
      setState(() {
        _firstName = profile['firstName'] ?? '';
        _lastName = profile['lastName'] ?? '';
        _email = profile['email'] ?? '';
        _phone = profile['phone'] ?? profile['phoneNumber'] ?? '';
        _dateOfBirth = profile['dateOfBirth'] ?? '';
        _gender = profile['gender'] ?? '';
        _bloodGroup = profile['bloodGroup'] ?? '';
      });
    }
    setState(() => _isLoading = false);
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();
    
    setState(() => _isLoading = true);
    
    try {
      await _patientService.updatePatientProfile({
        'firstName': _firstName,
        'lastName': _lastName,
        'email': _email,
        'phoneNumber': _phone,
        'dateOfBirth': _dateOfBirth,
        'gender': _gender,
        'bloodGroup': _bloodGroup,
      });
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile updated successfully!')));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to update profile.')));
    }
    
    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('Profile & Settings', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Personal Information', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: PremiumColors.primary)),
              const SizedBox(height: 16),
              
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      initialValue: _firstName,
                      decoration: const InputDecoration(labelText: 'First Name', border: OutlineInputBorder()),
                      onSaved: (val) => _firstName = val ?? '',
                      validator: (val) => val == null || val.isEmpty ? 'Required' : null,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextFormField(
                      initialValue: _lastName,
                      decoration: const InputDecoration(labelText: 'Last Name', border: OutlineInputBorder()),
                      onSaved: (val) => _lastName = val ?? '',
                      validator: (val) => val == null || val.isEmpty ? 'Required' : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              
              TextFormField(
                initialValue: _email,
                decoration: const InputDecoration(labelText: 'Email Address', border: OutlineInputBorder()),
                enabled: false, // Email usually read-only
              ),
              const SizedBox(height: 16),
              
              TextFormField(
                initialValue: _phone,
                decoration: const InputDecoration(labelText: 'Phone', border: OutlineInputBorder()),
                onSaved: (val) => _phone = val ?? '',
              ),
              const SizedBox(height: 16),
              
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      initialValue: _dateOfBirth.length > 10 ? _dateOfBirth.substring(0, 10) : _dateOfBirth,
                      decoration: const InputDecoration(labelText: 'Date of Birth (YYYY-MM-DD)', border: OutlineInputBorder()),
                      onSaved: (val) => _dateOfBirth = val ?? '',
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: ['Male', 'Female', 'Other'].contains(_gender) ? _gender : null,
                      decoration: const InputDecoration(labelText: 'Gender', border: OutlineInputBorder()),
                      items: ['Male', 'Female', 'Other'].map((String value) {
                        return DropdownMenuItem<String>(
                          value: value,
                          child: Text(value),
                        );
                      }).toList(),
                      onChanged: (newValue) {
                        setState(() { _gender = newValue!; });
                      },
                      onSaved: (val) => _gender = val ?? '',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              
              DropdownButtonFormField<String>(
                initialValue: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].contains(_bloodGroup) ? _bloodGroup : null,
                decoration: const InputDecoration(labelText: 'Blood Group', border: OutlineInputBorder()),
                items: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((String value) {
                  return DropdownMenuItem<String>(
                    value: value,
                    child: Text(value),
                  );
                }).toList(),
                onChanged: (newValue) {
                  setState(() { _bloodGroup = newValue!; });
                },
                onSaved: (val) => _bloodGroup = val ?? '',
              ),
              const SizedBox(height: 32),
              
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _saveProfile,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.all(16),
                    backgroundColor: PremiumColors.primary,
                    foregroundColor: Colors.white,
                  ),
                  child: Text('Save Changes', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ),
              
              const SizedBox(height: 48),
              Text('Security', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: PremiumColors.primary)),
              const SizedBox(height: 16),
              TextFormField(
                decoration: const InputDecoration(labelText: 'Current Password', border: OutlineInputBorder()),
                obscureText: true,
              ),
              const SizedBox(height: 16),
              TextFormField(
                decoration: const InputDecoration(labelText: 'New Password', border: OutlineInputBorder()),
                obscureText: true,
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Password updated successfully!')));
                  },
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.all(16),
                  ),
                  child: Text('Update Password', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
