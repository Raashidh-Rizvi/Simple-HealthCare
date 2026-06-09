import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';

import 'features/auth/auth_provider.dart';
import 'features/auth/login_screen.dart';
import 'features/dashboard/patient_dashboard_screen.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
      ],
      child: const HealthcarePatientApp(),
    ),
  );
}

class PremiumColors {
  static const Color primary = Color(0xFF6366F1); // Indigo 500
  static const Color secondary = Color(0xFF10B981); // Emerald 500
  static const Color accent = Color(0xFFF59E0B); // Amber 500
  static const Color danger = Color(0xFFEF4444); // Red 500

  // Dark Mode Base
  static const Color backgroundDark = Color(0xFF020617); // Slate 950
  static const Color surfaceDark = Color(0xFF0F172A); // Slate 900
  static const Color textMainDark = Color(0xFFF8FAFC); // Slate 50
  static const Color textMutedDark = Color(0xFF94A3B8); // Slate 400

  // Light Mode Base
  static const Color backgroundLight = Color(0xFFF8FAFC); // Slate 50
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color textMainLight = Color(0xFF0F172A); // Slate 900
  static const Color textMutedLight = Color(0xFF475569); // Slate 600

  // Aliases for compatibility
  static const Color textDark = textMainLight;
  static const Color textLight = textMainDark;
}

class ThemeProvider with ChangeNotifier {
  bool _isDarkMode = true;
  bool get isDarkMode => _isDarkMode;

  void toggleTheme() {
    _isDarkMode = !_isDarkMode;
    notifyListeners();
  }
}

class PremiumTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      brightness: Brightness.light,
      primaryColor: PremiumColors.primary,
      scaffoldBackgroundColor: PremiumColors.backgroundLight,
      cardColor: PremiumColors.surfaceLight,
      colorScheme: const ColorScheme.light(
        primary: PremiumColors.primary,
        secondary: PremiumColors.secondary,
        surface: PremiumColors.surfaceLight,
        error: PremiumColors.danger,
      ),
      textTheme: GoogleFonts.interTextTheme().apply(
        bodyColor: PremiumColors.textMainLight,
        displayColor: PremiumColors.textMainLight,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: IconThemeData(color: PremiumColors.textMainLight),
        titleTextStyle: TextStyle(color: PremiumColors.textMainLight, fontSize: 20, fontWeight: FontWeight.w600),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: PremiumColors.surfaceLight,
        indicatorColor: PremiumColors.primary.withValues(alpha: 0.2),
        labelTextStyle: WidgetStateProperty.all(const TextStyle(color: PremiumColors.textMainLight)),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) return const IconThemeData(color: PremiumColors.primary);
          return const IconThemeData(color: PremiumColors.textMutedLight);
        }),
      ),
      useMaterial3: true,
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      primaryColor: PremiumColors.primary,
      scaffoldBackgroundColor: PremiumColors.backgroundDark,
      cardColor: PremiumColors.surfaceDark,
      colorScheme: const ColorScheme.dark(
        primary: PremiumColors.primary,
        secondary: PremiumColors.secondary,
        surface: PremiumColors.surfaceDark,
        error: PremiumColors.danger,
      ),
      textTheme: GoogleFonts.interTextTheme().apply(
        bodyColor: PremiumColors.textMainDark,
        displayColor: PremiumColors.textMainDark,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: IconThemeData(color: PremiumColors.textMainDark),
        titleTextStyle: TextStyle(color: PremiumColors.textMainDark, fontSize: 20, fontWeight: FontWeight.w600),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: PremiumColors.surfaceDark,
        indicatorColor: PremiumColors.primary.withValues(alpha: 0.2),
        labelTextStyle: WidgetStateProperty.all(const TextStyle(color: PremiumColors.textMainDark)),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) return const IconThemeData(color: PremiumColors.primary);
          return const IconThemeData(color: PremiumColors.textMutedDark);
        }),
      ),
      useMaterial3: true,
    );
  }
}

class HealthcarePatientApp extends StatelessWidget {
  const HealthcarePatientApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        return MaterialApp(
          title: 'Healthcare Patient Portal',
          debugShowCheckedModeBanner: false,
          theme: PremiumTheme.lightTheme,
          darkTheme: PremiumTheme.darkTheme,
          themeMode: themeProvider.isDarkMode ? ThemeMode.dark : ThemeMode.light,
          home: const AuthWrapper(),
        );
      },
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  bool _isChecking = true;
  bool _isLoggedIn = false;

  @override
  void initState() {
    super.initState();
    _checkStatus();
  }

  void _checkStatus() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final status = await authProvider.checkLoginStatus();
    setState(() {
      _isLoggedIn = status;
      _isChecking = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isChecking) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    return _isLoggedIn ? const PatientDashboardScreen() : const LoginScreen();
  }
}
