# RISK SCORING ENGINE

## AI-Powered Patient Risk Stratification System (RPM Platform)

---

## 1. Overview

The Risk Scoring Engine is responsible for converting raw patient health data into a **single, interpretable clinical risk score (0–100)**.

It acts as the **central prioritization layer** of the RPM platform, enabling:

- Early identification of high-risk patients
- Clinical workload prioritization
- Alert severity calibration
- Deterioration prediction support
- Population health segmentation

---

## 2. Core Objective

Transform complex multi-dimensional patient data into:

```text id="rs1"
Risk Score → 0 to 100
Risk Level → Low / Medium / High / Critical
```

This simplifies clinical decision-making and improves response efficiency.

---

## 3. Risk Scoring Architecture

```text id="rs2"
RPM Readings
      ↓
Feature Extraction Layer
      ↓
Risk Feature Builder
      ↓
Scoring Engine (Rules + ML)
      ↓
Normalization Layer
      ↓
Risk Classification
      ↓
Risk Output Store
      ↓
Alert + Dashboard Integration
```

---

## 4. Risk Input Factors

The risk engine considers four major dimensions:

---

## 4.1 Vital Sign Risk

Key physiological indicators:

- Blood Pressure (systolic/diastolic)
- Blood Glucose
- Heart Rate
- SpO2
- Weight changes

### Risk Signals:

- High variability
- Out-of-range values
- Rapid deterioration trends

---

## 4.2 Trend-Based Risk

Longitudinal analysis:

- Increasing BP trends
- Rising glucose patterns
- Progressive weight gain
- Declining oxygen saturation

---

## 4.3 Clinical History Risk

Patient background conditions:

- Diabetes
- Hypertension
- COPD
- Congestive Heart Failure (CHF)
- Obesity

Each condition contributes weighted risk.

---

## 4.4 Behavioral Risk

Patient engagement indicators:

- Missed readings
- Device non-compliance
- Irregular monitoring
- Missed clinical appointments

---

## 5. Risk Scoring Models

The system evolves in three stages:

---

## 5.1 Phase 1: Rule-Based Scoring (MVP)

Simple weighted scoring system:

```python id="rs3"
risk_score =
    bp_score +
    glucose_score +
    spO2_score +
    trend_score +
    condition_score +
    behavior_score
```

### Example Weights:

| Factor     | Weight |
| ---------- | ------ |
| BP         | 25     |
| Glucose    | 20     |
| SpO2       | 20     |
| Trend      | 15     |
| Conditions | 10     |
| Behavior   | 10     |

---

## 5.2 Phase 2: Statistical Risk Model

Adds:

- Z-score deviation
- Moving average distance
- Standard deviation analysis

### Formula Concept:

```text id="rs4"
Risk = (Deviation from baseline × Weight)
     + (Trend acceleration factor)
```

---

## 5.3 Phase 3: Machine Learning Model

Advanced predictive modeling:

- XGBoost
- Random Forest
- Logistic Regression

### Outputs:

- Hospitalization probability
- Deterioration likelihood
- 30-day risk forecast

---

## 6. Risk Score Normalization

All scores are normalized to:

```text id="rs5"
0 → 100 scale
```

### Mapping:

| Score  | Level    |
| ------ | -------- |
| 0–25   | Low      |
| 26–50  | Medium   |
| 51–75  | High     |
| 76–100 | Critical |

---

## 7. Risk Calculation Pipeline

```text id="rs6"
RPM Readings
      ↓
Feature Aggregation
      ↓
Patient Baseline Comparison
      ↓
Trend Analysis Integration
      ↓
Weighted Scoring Engine
      ↓
Normalization (0–100)
      ↓
Risk Classification
      ↓
Storage + Alert Trigger
```

---

## 8. Output Schema

```sql id="rs7"
CREATE TABLE ai_risk_scores (
    id UUID PRIMARY KEY,
    patient_id UUID,

    risk_score INT,
    risk_level VARCHAR(20),

    risk_factors JSONB,

    trend_contribution NUMERIC,
    vitals_contribution NUMERIC,
    behavior_contribution NUMERIC,

    calculated_at TIMESTAMP
);
```

---

## 9. Risk Factor Breakdown

Each score includes explainability.

### Example Output

```json id="rs8"
{
  "risk_score": 82,
  "risk_level": "HIGH",
  "breakdown": {
    "vitals": 35,
    "trend": 20,
    "conditions": 15,
    "behavior": 12
  },
  "top_factors": [
    "Increasing BP trend",
    "High glucose variability",
    "Missed 3 readings"
  ]
}
```

---

## 10. Dynamic Risk Adjustment

The system continuously updates risk scores based on:

- New RPM readings
- Alert generation
- Trend changes
- Clinical interventions

### Example:

```text id="rs9"
Before: 65 (Medium)
After BP spike: 84 (High)
```

---

## 11. Patient Personalization

Risk scoring is adapted per patient:

### Baseline Adjustments:

- Age
- Chronic conditions
- Historical averages

### Example:

| Patient | BP Baseline | Risk Threshold |
| ------- | ----------- | -------------- |
| A       | 120         | 150            |
| B       | 140         | 170            |

---

## 12. Integration with Alert Engine

Risk score directly influences alerts:

### Mapping:

- 0–25 → No alerts
- 26–50 → Low priority alerts
- 51–75 → High priority alerts
- 76–100 → Critical alerts

---

## 13. Integration with Deterioration Engine

Risk score acts as a **leading indicator** for:

- Hospitalization risk
- Disease progression
- Emergency events

---

## 14. Real-Time Risk Flow

```text id="rs10"
New RPM Data
      ↓
Feature Update
      ↓
Risk Recalculation
      ↓
Score Change Detection
      ↓
Alert Engine Trigger (if needed)
      ↓
Dashboard Update
```

---

## 15. Key Metrics

### Clinical Metrics

- Predictive accuracy
- Early detection rate
- False positive rate

---

### Operational Metrics

- Risk update latency
- Patient coverage
- Alert correlation accuracy

---

## 16. Performance Optimization

- Incremental updates (no full recomputation)
- Cached baseline comparisons
- Batch scoring for historical data
- Async processing via queues

---

## 17. Safety & Clinical Guardrails

- Risk score is advisory only
- No automated treatment decisions
- Requires clinical validation
- Fully auditable scoring logic
- Explainability required for all outputs

---

## 18. Future Enhancements

- Predictive hospitalization scoring
- Reinforcement learning risk adjustment
- Population-level risk clustering
- Disease-specific scoring models
- AI-driven personalized thresholds

---

## 19. Summary

The Risk Scoring Engine:

- Converts complex RPM data into a single clinical metric
- Prioritizes patient care efficiently
- Enables early intervention strategies
- Powers alerts and deterioration detection
- Forms the backbone of RPM intelligence

It is the **central decision-support layer of the entire AI RPM system**.
