import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
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

  // ─── Auth ──────────────────────────────────────────────────────────────────

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, credentials);
  }

  register(details: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, details);
  }

  // ─── Patient Profile ────────────────────────────────────────────────────────

  getPatientProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/patients/me`, { headers: this.getHeaders() });
  }

  updatePatientProfile(profile: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/patients/me`, profile, { headers: this.getHeaders() });
  }

  searchPatients(query: string): Observable<any> {
    const params = new HttpParams().set('query', query);
    return this.http.get(`${this.apiUrl}/patients/search`, { headers: this.getHeaders(), params });
  }

  getAllPatients(): Observable<any> {
    return this.http.get(`${this.apiUrl}/patients/all`, { headers: this.getHeaders() });
  }

  // ─── Doctor Profile ─────────────────────────────────────────────────────────

  getDoctorProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/doctors/me`, { headers: this.getHeaders() });
  }

  updateDoctorProfile(profile: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/doctors/me`, profile, { headers: this.getHeaders() });
  }

  // ─── Doctors ───────────────────────────────────────────────────────────────

  getDoctors(specialization?: string): Observable<any> {
    let params = new HttpParams();
    if (specialization) params = params.set('specialization', specialization);
    return this.http.get(`${this.apiUrl}/doctors`, { headers: this.getHeaders(), params });
  }

  getDoctorDetail(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/doctors/${id}`, { headers: this.getHeaders() });
  }

  getDoctorAvailability(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/doctors/${id}/availability`, { headers: this.getHeaders() });
  }

  // ─── Appointments ──────────────────────────────────────────────────────────

  getMyAppointments(): Observable<any> {
    return this.http.get(`${this.apiUrl}/appointments/me`, { headers: this.getHeaders() });
  }

  getTodayAppointments(): Observable<any> {
    return this.http.get(`${this.apiUrl}/appointments/today`, { headers: this.getHeaders() });
  }

  getAvailableSlots(doctorId: number, date: string): Observable<any> {
    const params = new HttpParams().set('doctorId', doctorId).set('date', date);
    return this.http.get(`${this.apiUrl}/appointments/available-slots`, { params });
  }

  bookAppointment(details: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/appointments`, details, { headers: this.getHeaders() });
  }

  cancelAppointment(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/appointments/${id}/cancel`, {}, { headers: this.getHeaders() });
  }

  rescheduleAppointment(id: number, details: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/appointments/${id}/reschedule`, details, { headers: this.getHeaders() });
  }

  confirmAppointment(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/appointments/${id}/confirm`, {}, { headers: this.getHeaders() });
  }

  rejectAppointment(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/appointments/${id}/reject`, {}, { headers: this.getHeaders() });
  }

  completeAppointment(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/appointments/${id}/complete`, {}, { headers: this.getHeaders() });
  }

  markNoShow(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/appointments/${id}/no-show`, {}, { headers: this.getHeaders() });
  }

  getNotifications(): Observable<any> {
    return this.http.get(`${this.apiUrl}/appointments/notifications`, { headers: this.getHeaders() });
  }

  markNotificationRead(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/appointments/notifications/${id}/read`, {}, { headers: this.getHeaders() });
  }

  markAllNotificationsRead(): Observable<any> {
    return this.http.put(`${this.apiUrl}/appointments/notifications/read-all`, {}, { headers: this.getHeaders() });
  }

  // ─── Schedules / Availability ──────────────────────────────────────────────

  getScheduleSlots(): Observable<any> {
    return this.http.get(`${this.apiUrl}/schedules`, { headers: this.getHeaders() });
  }

  createScheduleSlot(details: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/schedules`, details, { headers: this.getHeaders() });
  }

  deleteScheduleSlot(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/schedules/${id}`, { headers: this.getHeaders() });
  }

  getAvailability(): Observable<any> {
    return this.http.get(`${this.apiUrl}/schedules/availability`, { headers: this.getHeaders() });
  }

  createAvailability(details: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/schedules/availability`, details, { headers: this.getHeaders() });
  }

  deleteAvailability(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/schedules/availability/${id}`, { headers: this.getHeaders() });
  }

  getBlockedDates(): Observable<any> {
    return this.http.get(`${this.apiUrl}/schedules/blocked-dates`, { headers: this.getHeaders() });
  }

  addBlockedDate(details: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/schedules/blocked-dates`, details, { headers: this.getHeaders() });
  }

  removeBlockedDate(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/schedules/blocked-dates/${id}`, { headers: this.getHeaders() });
  }

  // ─── Care Providers ────────────────────────────────────────────────────────

  getCareProviders(): Observable<any> {
    return this.http.get(`${this.apiUrl}/careproviders`, { headers: this.getHeaders() });
  }

  createCareProvider(details: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/careproviders`, details, { headers: this.getHeaders() });
  }

  deleteCareProvider(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/careproviders/${id}`, { headers: this.getHeaders() });
  }

  // ─── Encounters / Vitals / Consultation ────────────────────────────────────

  getTodayEncounters(): Observable<any> {
    return this.http.get(`${this.apiUrl}/encounters/today`, { headers: this.getHeaders() });
  }

  checkInEncounter(appointmentId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/encounters/check-in`, { appointmentId }, { headers: this.getHeaders() });
  }

  addVitals(encounterId: number, vitals: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/encounters/${encounterId}/vitals`, vitals, { headers: this.getHeaders() });
  }

  startConsultation(encounterId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/encounters/${encounterId}/consultation/start`, {}, { headers: this.getHeaders() });
  }

  saveConsultation(encounterId: number, details: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/encounters/${encounterId}/consultation/save`, details, { headers: this.getHeaders() });
  }

  completeConsultation(encounterId: number, details: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/encounters/${encounterId}/consultation/complete`, details, { headers: this.getHeaders() });
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  getAdminDoctors(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/doctors`, { headers: this.getHeaders() });
  }

  createAdminDoctor(details: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/doctors`, details, { headers: this.getHeaders() });
  }

  updateAdminDoctorStatus(id: number, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/doctors/${id}/status`, { status }, { headers: this.getHeaders() });
  }

  deleteAdminDoctor(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/doctors/${id}`, { headers: this.getHeaders() });
  }

  getAdminPatients(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/patients`, { headers: this.getHeaders() });
  }

  getAdminAppointments(filters?: { date?: string; status?: string; doctorId?: number }): Observable<any> {
    let params = new HttpParams();
    if (filters?.date) params = params.set('date', filters.date);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.doctorId) params = params.set('doctorId', filters.doctorId);
    return this.http.get(`${this.apiUrl}/admin/appointments`, { headers: this.getHeaders(), params });
  }

  deleteAdminAppointment(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/appointments/${id}`, { headers: this.getHeaders() });
  }

  getAdminSummaryReport(date?: string): Observable<any> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    return this.http.get(`${this.apiUrl}/admin/reports/summary`, { headers: this.getHeaders(), params });
  }

  getAdminAuditLogs(page = 1): Observable<any> {
    const params = new HttpParams().set('page', page);
    return this.http.get(`${this.apiUrl}/admin/reports/audit`, { headers: this.getHeaders(), params });
  }

  getAdminSchedules(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/schedules`, { headers: this.getHeaders() });
  }
}
