# API SPECIFICATION

## AI-Powered RPM Platform REST API

---

## 1. Overview

This document defines the **REST API layer** for the RPM + AI healthcare platform.

The API provides access to:

- Patient management
- RPM data ingestion
- AI analytics (trends, risk, anomalies)
- Alerts and notifications
- Clinical summaries and notes
- Deterioration predictions

---

## 2. Base URL

```text id="api1"
https://api.your-rpm-platform.com/v1
```

---

## 3. Authentication

### Method: JWT Bearer Token

All requests require authentication:

```http id="api2"
Authorization: Bearer <token>
```

---

## 4. Roles & Permissions

| Role    | Access                      |
| ------- | --------------------------- |
| Admin   | Full system access          |
| Doctor  | Clinical data + AI insights |
| Nurse   | Alerts + patient monitoring |
| Patient | Personal RPM data           |

---

## 5. Core API Modules

---

# 5.1 Patient APIs

---

## Create Patient

```http id="p1"
POST /patients
```

### Request Body

```json id="p2"
{
  "first_name": "John",
  "last_name": "Smith",
  "date_of_birth": "1965-01-01",
  "gender": "male",
  "phone": "+123456789",
  "email": "john@example.com"
}
```

---

## Get Patient

```http id="p3"
GET /patients/{patient_id}
```

---

## List Patients

```http id="p4"
GET /patients?limit=50&offset=0
```

---

# 5.2 RPM Data APIs

---

## Submit RPM Reading

```http id="r1"
POST /rpm/readings
```

### Request Body

```json id="r2"
{
  "patient_id": "uuid",
  "metric_type": "BP_SYS",
  "value": 145,
  "unit": "mmHg",
  "timestamp": "2026-06-16T10:00:00Z"
}
```

---

## Get Patient Readings

```http id="r3"
GET /rpm/readings/{patient_id}
```

---

## Get Latest Readings

```http id="r4"
GET /rpm/readings/{patient_id}/latest
```

---

# 5.3 AI Analytics APIs

---

## Get Trend Analysis

```http id="a1"
GET /ai/trends/{patient_id}
```

### Response

```json id="a2"
{
  "metric": "blood_pressure",
  "trend": "increasing",
  "change_rate": 12,
  "confidence": 0.91
}
```

---

## Get Anomalies

```http id="a3"
GET /ai/anomalies/{patient_id}
```

---

## Get Risk Score

```http id="a4"
GET /ai/risk/{patient_id}
```

### Response

```json id="a5"
{
  "risk_score": 82,
  "risk_level": "HIGH"
}
```

---

## Get Early Deterioration Risk

```http id="a6"
GET /ai/deterioration/{patient_id}
```

---

## Generate AI Patient Summary

```http id="a7"
POST /ai/summary/{patient_id}
```

---

## Generate Clinical Notes

```http id="a8"
POST /ai/notes/{patient_id}
```

### Request

```json id="a9"
{
  "note_type": "SOAP"
}
```

---

# 5.4 Alert APIs

---

## Get Alerts

```http id="al1"
GET /alerts/{patient_id}
```

---

## Acknowledge Alert

```http id="al2"
POST /alerts/{alert_id}/acknowledge
```

---

## Resolve Alert

```http id="al3"
POST /alerts/{alert_id}/resolve
```

---

## Get Critical Alerts

```http id="al4"
GET /alerts?severity=CRITICAL
```

---

# 5.5 Risk APIs

---

## Get Risk History

```http id="rk1"
GET /risk/{patient_id}
```

---

## Recalculate Risk

```http id="rk2"
POST /risk/{patient_id}/recalculate
```

---

# 5.6 Deterioration APIs

---

## Get Deterioration Risk

```http id="d1"
GET /deterioration/{patient_id}
```

---

## Get Deterioration Events

```http id="d2"
GET /deterioration/events/{patient_id}
```

---

# 5.7 Dashboard APIs

---

## Clinical Dashboard Overview

```http id="db1"
GET /dashboard/clinical
```

### Response

```json id="db2"
{
  "critical_patients": 12,
  "high_risk_patients": 45,
  "active_alerts": 32
}
```

---

## Patient Overview Dashboard

```http id="db3"
GET /dashboard/patient/{patient_id}
```

---

# 5.8 Notification APIs

---

## Send Notification

```http id="n1"
POST /notifications/send
```

### Request

```json id="n2"
{
  "patient_id": "uuid",
  "type": "sms",
  "message": "Please check your BP reading"
}
```

---

# 6. Webhooks (Real-Time Events)

---

## RPM Reading Event

```http id="w1"
POST /webhooks/rpm-reading
```

---

## Alert Event

```http id="w2"
POST /webhooks/alert-triggered
```

---

## Risk Update Event

```http id="w3"
POST /webhooks/risk-updated
```

---

# 7. AI Processing APIs (Internal)

---

## Trigger AI Pipeline

```http id="ai1"
POST /ai/process/{patient_id}
```

---

## Batch Processing

```http id="ai2"
POST /ai/process/batch
```

---

# 8. Error Handling

---

## Standard Error Format

```json id="err1"
{
  "error": "InvalidRequest",
  "message": "Missing patient_id",
  "status": 400
}
```

---

## Common Status Codes

| Code | Meaning      |
| ---- | ------------ |
| 200  | Success      |
| 201  | Created      |
| 400  | Bad Request  |
| 401  | Unauthorized |
| 403  | Forbidden    |
| 404  | Not Found    |
| 500  | Server Error |

---

# 9. Rate Limiting

- 100 requests / minute per user
- Burst protection enabled
- AI endpoints: 20 requests / minute

---

# 10. Security Standards

- JWT Authentication
- Role-based access control (RBAC)
- TLS encryption
- Audit logging on all endpoints
- PHI-safe response handling

---

# 11. Versioning Strategy

All APIs use versioning:

```text id="v1"
 /v1/...
```

Future versions:

- /v2 (AI enhancements)
- /v3 (predictive care APIs)

---

# 12. Performance Strategy

- Cached patient summaries
- Async AI processing
- Background job queues
- Pagination on all list endpoints

---

# 13. Future API Extensions

### Planned Modules

- CCM APIs (care plans, monthly reviews)
- Voice AI APIs
- Population Health APIs
- Predictive Hospitalization APIs
- Insurance/Billing APIs (RPM CPT automation)

---

# 14. Summary

This API layer provides:

- Full clinical system control
- AI-powered insights access
- Real-time RPM ingestion
- Alert and risk management
- Scalable healthcare integration

It acts as the **core communication bridge between AI, clinical users, and devices**.
