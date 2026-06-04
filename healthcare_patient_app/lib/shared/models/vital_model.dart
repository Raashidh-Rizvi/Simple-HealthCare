class Vital {
  final String? heartRate;
  final int? bloodPressureSystolic;
  final int? bloodPressureDiastolic;
  final String? temperature;
  final String? weight;
  final String? recordedAt;
  final bool? isHomeReading;

  Vital({
    this.heartRate,
    this.bloodPressureSystolic,
    this.bloodPressureDiastolic,
    this.temperature,
    this.weight,
    this.recordedAt,
    this.isHomeReading,
  });

  factory Vital.fromJson(Map<String, dynamic> json) {
    return Vital(
      heartRate: json['heartRate']?.toString(),
      bloodPressureSystolic: json['bloodPressureSystolic'],
      bloodPressureDiastolic: json['bloodPressureDiastolic'],
      temperature: json['temperature']?.toString(),
      weight: json['weight']?.toString(),
      recordedAt: json['recordedAt'],
      isHomeReading: json['isHomeReading'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'heartRate': heartRate,
      'bloodPressureSystolic': bloodPressureSystolic,
      'bloodPressureDiastolic': bloodPressureDiastolic,
      'temperature': temperature,
      'weight': weight,
      'isHomeReading': isHomeReading ?? false,
    };
  }
}
