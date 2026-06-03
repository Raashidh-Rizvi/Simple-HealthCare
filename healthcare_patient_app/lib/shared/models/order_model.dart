class Order {
  final int id;
  final String orderType;
  final String description;
  final String? createdAt;

  Order({
    required this.id,
    required this.orderType,
    required this.description,
    this.createdAt,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'] ?? 0,
      orderType: json['orderType'] ?? '',
      description: json['description'] ?? '',
      createdAt: json['createdAt'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'orderType': orderType,
      'description': description,
      'createdAt': createdAt,
    };
  }
}
