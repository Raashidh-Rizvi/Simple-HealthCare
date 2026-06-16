# DATABASE DESIGN

## AI-Powered RPM Platform Database Architecture

---

## 1. Overview

The database architecture is designed to support:

* Real-time RPM data ingestion
* AI-driven analytics
* Clinical workflows (RPM + CCM)
* Alerting and risk scoring
* Audit and compliance tracking
* LLM-generated clinical documentation

It is optimized for:

* High write throughput (device data)
* Time-series queries
* Patient-centric queries
* AI feature extraction
* Regulatory compliance (auditability)

---

## 2. Database Technology Stack

### Primary Database

* PostgreSQL (Core relational store)

### Extensions

* pgvector (AI embeddings + semantic search)
* TimescaleDB (optional for time-series optimization)

### Cache Layer

* Redis (real-time alerts, sessions, queues)

---

## 3. High-Level Data Architecture

```text id="dbarch1"
RPM Devices → Ingestion Service → PostgreSQL
                                   ↓
                           AI Processing Layer
                                   ↓
                        AI Output Tables (Insights)
                                   ↓
                    Clinical Dashboards / APIs
```

---

## 4. Core Database Schema

---

## 4.1 Patients Table

Stores patient demographic and clinical identity information.

```sql id="p1"
CREATE TABLE patients (
    id UUID PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(20),
    phone VARCHAR(30),
    email VARCHAR(150),

    address TEXT,
    emergency_contact TEXT,

    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

## 4.2 RPM Readings Table (Core Table)

Stores all device-generated health data.

```sql id="r1"
CREATE TABLE rpm_readings (
    id UUID PRIMARY KEY,
    patient_id UUID REFERENCES patients(id),

    metric_type VARCHAR(50),  -- BP_SYS, BP_DIA, GLUCOSE, SPO2, WEIGHT
    value NUMERIC,

    unit VARCHAR(20),

    source_device VARCHAR(100),

    recorded_at TIMESTAMP,
    created_at TIMESTAMP
);
```

### Example Data

| Metric | Value |
| ------ | ----- |
| BP_SYS | 145   |
| BP_DIA | 92    |
| SPO2   | 95    |

---

## 4.3 Patient Baselines Table

Used for anomaly detection and personalization.

```sql id="b1"
CREATE TABLE patient_baselines (
    id UUID PRIMARY KEY,
    patient_id UUID REFERENCES patients(id),

    metric_type VARCHAR(50),

    avg_value NUMERIC,
    min_value NUMERIC,
    max_value NUMERIC,
    std_dev NUMERIC,

    updated_at TIMESTAMP
);
```

---

## 4.4 Trend Analysis Table

Stores AI-generated trend insights.

```sql id="t1"
CREATE TABLE ai_trends (
    id UUID PRIMARY KEY,
    patient_id UUID REFERENCES patients(id),

    metric_type VARCHAR(50),
    trend_direction VARCHAR(20), -- increasing, decreasing, stable

    slope_value NUMERIC,
    confidence NUMERIC,

    period_days INT,

    created_at TIMESTAMP
);
```

---

## 4.5 Anomaly Detection Table

Stores detected abnormal events.

```sql id="a1"
CREATE TABLE ai_anomalies (
    id UUID PRIMARY KEY,
    patient_id UUID REFERENCES patients(id),

    metric_type VARCHAR(50),

    anomaly_type VARCHAR(50), -- spike, drop, deviation
    severity VARCHAR(20),     -- low, medium, high, critical

    value NUMERIC,
    baseline_value NUMERIC,

    reason TEXT,

    created_at TIMESTAMP
);
```

---

## 4.6 Risk Scoring Table

Stores patient risk scores over time.

```sql id="rsk1"
CREATE TABLE ai_risk_scores (
    id UUID PRIMARY KEY,
    patient_id UUID REFERENCES patients(id),

    risk_score INT, -- 0–100
    risk_level VARCHAR(20), -- low, medium, high, critical

    contributing_factors JSONB,

    calculated_at TIMESTAMP
);
```

---

## 4.7 Alert Table (Smart Alerts Engine)

```sql id="al1"
CREATE TABLE ai_alerts (
    id UUID PRIMARY KEY,
    patient_id UUID REFERENCES patients(id),

    alert_type VARCHAR(50),
    severity VARCHAR(20),

    priority_score INT,

    message TEXT,

    status VARCHAR(20), -- open, acknowledged, resolved

    created_at TIMESTAMP,
    resolved_at TIMESTAMP
);
```

---

## 4.8 Early Deterioration Table

```sql id="d1"
CREATE TABLE ai_deterioration_events (
    id UUID PRIMARY KEY,
    patient_id UUID REFERENCES patients(id),

    condition_suspected VARCHAR(100),

    risk_level VARCHAR(20),

    confidence NUMERIC,

    triggering_factors JSONB,

    created_at TIMESTAMP
);
```

---

## 4.9 AI Patient Summary Table

Stores generated clinical summaries.

```sql id="s1"
CREATE TABLE ai_patient_summaries (
    id UUID PRIMARY KEY,
    patient_id UUID REFERENCES patients(id),

    summary TEXT,

    key_insights JSONB,

    generated_at TIMESTAMP
);
```

---

## 4.10 Clinical Notes Table

Stores AI-generated documentation.

```sql id="n1"
CREATE TABLE ai_clinical_notes (
    id UUID PRIMARY KEY,
    patient_id UUID REFERENCES patients(id),

    note_type VARCHAR(50), -- SOAP, RPM_MONTHLY

    content TEXT,

    approved BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP
);
```

---

## 4.11 RPM Engagement Table

Tracks patient participation.

```sql id="e1"
CREATE TABLE rpm_engagement (
    id UUID PRIMARY KEY,
    patient_id UUID REFERENCES patients(id),

    readings_uploaded INT,
    missed_readings INT,

    adherence_score NUMERIC,

    period_start TIMESTAMP,
    period_end TIMESTAMP
);
```

---

## 4.12 Audit Logs Table (Compliance)

Critical for healthcare systems.

```sql id="au1"
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,

    user_id UUID,
    action VARCHAR(100),

    entity_type VARCHAR(50),
    entity_id UUID,

    metadata JSONB,

    timestamp TIMESTAMP
);
```

---

## 5. Indexing Strategy

### Performance Indexes

```sql id="idx1"
CREATE INDEX idx_rpm_patient_time
ON rpm_readings(patient_id, recorded_at DESC);
```

```sql id="idx2"
CREATE INDEX idx_alert_patient_status
ON ai_alerts(patient_id, status);
```

```sql id="idx3"
CREATE INDEX idx_risk_patient_time
ON ai_risk_scores(patient_id, calculated_at DESC);
```

---

## 6. Time-Series Optimization

For high-volume RPM data:

* Partition rpm_readings by month
* Optional TimescaleDB hypertables
* Batch inserts for device streams

---

## 7. AI Data Strategy

### Raw Data Layer

* rpm_readings

### Feature Layer

* baselines
* engagement
* derived metrics

### Intelligence Layer

* trends
* anomalies
* risk scores

### Insight Layer

* summaries
* clinical notes
* alerts

---

## 8. Data Flow Model

```text id="flowdb"
Device Data
   ↓
rpm_readings
   ↓
Feature Engine
   ↓
AI Processing
   ↓
ai_* tables (insights)
   ↓
Dashboards / APIs
```

---

## 9. Data Retention Strategy

### Hot Data (0–3 months)

* RPM readings
* alerts

### Warm Data (3–24 months)

* summaries
* risk scores

### Cold Data (archive)

* historical analytics
* compliance storage

---

## 10. Security & Compliance Design

### Encryption

* At rest (AES-256)
* In transit (TLS 1.2+)

### Access Control

* Role-based access
* Patient-level data isolation

### Auditability

Every action stored in:

* audit_logs

---

## 11. Scalability Considerations

* Read replicas for analytics
* Partitioned tables for RPM data
* Redis caching for dashboards
* Async AI processing pipeline

---

## 12. Future Database Extensions

### CCM Module Tables

* care_plans
* monthly_reviews
* care_activities

### AI Expansion Tables

* hospitalization_predictions
* population_health_clusters
* digital_twins

---

## 13. Summary

This database design enables:

* High-volume RPM ingestion
* Real-time AI analytics
* Clinical decision support
* Regulatory compliance
* Scalable healthcare AI platform architecture

It forms the **data backbone of the entire RPM + AI ecosystem**.
