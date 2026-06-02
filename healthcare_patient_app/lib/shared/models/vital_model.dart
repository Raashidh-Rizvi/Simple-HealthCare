class Vital {
  final String? heartRate;
  final String? bloodPressure;
  final String? temperature;
  final String? weight;
  final String? recordedAt;

  Vital({
    this.heartRate,
    this.bloodPressure,
    this.temperature,
    this.weight,
    this.recordedAt,
  });

  factory Vital.fromJson(Map<String, dynamic> json) {
    return Vital(
      heartRate: json['heartRate'],
      bloodPressure: json['bloodPressure'],
      temperature: json['temperature'],
      weight: json['weight'],
      recordedAt: json['recordedAt'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'heartRate': heartRate,
      'bloodPressure': bloodPressure,
      'temperature': temperature,
      'weight': weight,
    };
  }
}
