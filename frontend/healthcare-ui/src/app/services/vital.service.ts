import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateVitalDto {
  encounterId: number;
  patientId: number;
  heightCm?: number;
  weightKg?: number;
  temperature?: number;
  heartRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  bloodSugar?: number;
  painScore?: number;
  notes?: string;
  isHomeReading: boolean;
}

export interface UpdateVitalDto {
  heightCm?: number;
  weightKg?: number;
  temperature?: number;
  heartRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  bloodSugar?: number;
  painScore?: number;
  notes?: string;
}

export interface VitalResponseDto {
  id: number;
  encounterId: number;
  patientId: number;
  patientName: string;
  recordedByName?: string;
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
  temperature?: number;
  heartRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  bloodSugar?: number;
  painScore?: number;
  notes?: string;
  recordedAt: string;
  verifiedByName?: string;
  verifiedAt?: string;
  status: string;
  source: string;
}

@Injectable({
  providedIn: 'root'
})
export class VitalService {
  private apiUrl = 'http://localhost:5207/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // --- Vitals Management ---

  createVital(dto: CreateVitalDto): Observable<VitalResponseDto> {
    return this.http.post<VitalResponseDto>(`${this.apiUrl}/vitals`, dto, { headers: this.getHeaders() });
  }

  getVital(id: number): Observable<VitalResponseDto> {
    return this.http.get<VitalResponseDto>(`${this.apiUrl}/vitals/${id}`, { headers: this.getHeaders() });
  }

  updateVital(id: number, dto: UpdateVitalDto): Observable<VitalResponseDto> {
    return this.http.put<VitalResponseDto>(`${this.apiUrl}/vitals/${id}`, dto, { headers: this.getHeaders() });
  }

  verifyVital(id: number): Observable<VitalResponseDto> {
    return this.http.post<VitalResponseDto>(`${this.apiUrl}/vitals/${id}/verify`, {}, { headers: this.getHeaders() });
  }

  // --- Patient Specific Vitals ---

  getPatientVitals(patientId: number, sourceFilter?: string): Observable<VitalResponseDto[]> {
    let params = new HttpParams();
    if (sourceFilter) params = params.set('sourceFilter', sourceFilter);
    return this.http.get<VitalResponseDto[]>(`${this.apiUrl}/patients/${patientId}/vitals`, { headers: this.getHeaders(), params });
  }

  getPatientVitalsHistory(patientId: number): Observable<VitalResponseDto[]> {
    return this.http.get<VitalResponseDto[]>(`${this.apiUrl}/patients/${patientId}/vitals/history`, { headers: this.getHeaders() });
  }

  getPatientVitalsTrends(patientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/patients/${patientId}/vitals/trends`, { headers: this.getHeaders() });
  }
}
