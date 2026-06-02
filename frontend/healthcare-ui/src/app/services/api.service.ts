import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:5207/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, credentials);
  }

  register(details: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, details);
  }

  getDoctors(): Observable<any> {
    return this.http.get(`${this.apiUrl}/doctors`, { headers: this.getHeaders() });
  }

  getMyAppointments(): Observable<any> {
    return this.http.get(`${this.apiUrl}/appointments/me`, { headers: this.getHeaders() });
  }

  bookAppointment(details: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/appointments`, details, { headers: this.getHeaders() });
  }

  getCareProviders(): Observable<any> {
    return this.http.get(`${this.apiUrl}/careproviders`, { headers: this.getHeaders() });
  }

  createCareProvider(details: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/careproviders`, details, { headers: this.getHeaders() });
  }

  deleteCareProvider(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/careproviders/${id}`, { headers: this.getHeaders() });
  }

  getScheduleSlots(): Observable<any> {
    return this.http.get(`${this.apiUrl}/schedules`, { headers: this.getHeaders() });
  }

  createScheduleSlot(details: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/schedules`, details, { headers: this.getHeaders() });
  }

  deleteScheduleSlot(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/schedules/${id}`, { headers: this.getHeaders() });
  }

  addVitals(appointmentId: number, vitals: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/appointments/${appointmentId}/vitals`, vitals, { headers: this.getHeaders() });
  }

  saveConsultation(appointmentId: number, details: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/appointments/${appointmentId}/consultation`, details, { headers: this.getHeaders() });
  }
}
