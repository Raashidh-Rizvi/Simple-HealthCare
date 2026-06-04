import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-wrapper">

      <!-- Header -->
      <div class="admin-header">
        <div>
          <h1 class="admin-title">Admin Portal</h1>
          <p class="admin-subtitle">Hospital Management System</p>
        </div>
        <button class="btn btn-outline btn-sm" (click)="logout()" id="admin-logout-btn">Sign Out</button>
      </div>

      <!-- Stats Row -->
      <div class="stats-row" *ngIf="report">
        <div class="stat-card" id="stat-today">
          <div class="stat-icon">📅</div>
          <div class="stat-num">{{ report.todayTotal }}</div>
          <div class="stat-label">Today's Appointments</div>
        </div>
        <div class="stat-card" id="stat-doctors">
          <div class="stat-icon">👨‍⚕️</div>
          <div class="stat-num">{{ report.totalActiveDoctors }}</div>
          <div class="stat-label">Active Doctors</div>
        </div>
        <div class="stat-card" id="stat-patients">
          <div class="stat-icon">🏥</div>
          <div class="stat-num">{{ report.totalPatients }}</div>
          <div class="stat-label">Total Patients</div>
        </div>
        <div class="stat-card" id="stat-upcoming">
          <div class="stat-icon">📋</div>
          <div class="stat-num">{{ report.upcomingWeek }}</div>
          <div class="stat-label">Upcoming (7 days)</div>
        </div>
        <div class="stat-card" id="stat-all">
          <div class="stat-icon">📊</div>
          <div class="stat-num">{{ report.totalAppointmentsAllTime }}</div>
          <div class="stat-label">All-Time Appointments</div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-nav">
        <button *ngFor="let tab of tabs" class="tab-btn" [class.active]="activeTab === tab.key"
          (click)="setTab(tab.key)" [id]="'tab-' + tab.key">
          {{ tab.icon }} {{ tab.label }}
        </button>
      </div>

      <!-- Tab: Doctors -->
      <div *ngIf="activeTab === 'doctors'" class="tab-content glass-card" id="doctors-tab">
        <div class="tab-toolbar">
          <h3 class="tab-title">Manage Doctors</h3>
          <button class="btn btn-primary btn-sm" (click)="showAddDoctor = !showAddDoctor" id="toggle-add-doctor-btn">
            {{ showAddDoctor ? '✕ Cancel' : '+ Add Doctor' }}
          </button>
        </div>

        <!-- Add Doctor Form -->
        <div *ngIf="showAddDoctor" class="add-form" id="add-doctor-form">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">First Name</label>
              <input class="form-control" [(ngModel)]="newDoctor.firstName" id="doctor-firstname" placeholder="John">
            </div>
            <div class="form-group">
              <label class="form-label">Last Name</label>
              <input class="form-control" [(ngModel)]="newDoctor.lastName" id="doctor-lastname" placeholder="Doe">
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-control" [(ngModel)]="newDoctor.email" id="doctor-email" type="email" placeholder="doctor@hospital.com">
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input class="form-control" [(ngModel)]="newDoctor.password" id="doctor-password" type="password" placeholder="Temporary password">
            </div>
            <div class="form-group">
              <label class="form-label">Specialization</label>
              <input class="form-control" [(ngModel)]="newDoctor.specialization" id="doctor-spec" placeholder="e.g. Cardiologist">
            </div>
            <div class="form-group">
              <label class="form-label">License Number</label>
              <input class="form-control" [(ngModel)]="newDoctor.licenseNumber" id="doctor-license" placeholder="LIC-XXXX-001">
            </div>
            <div class="form-group">
              <label class="form-label">Experience (years)</label>
              <input class="form-control" [(ngModel)]="newDoctor.experienceYears" id="doctor-exp" type="number" placeholder="5">
            </div>
            <div class="form-group">
              <label class="form-label">Consultation Fee (₹)</label>
              <input class="form-control" [(ngModel)]="newDoctor.consultationFee" id="doctor-fee" type="number" placeholder="500">
            </div>
          </div>
          <button class="btn btn-success mt-4" (click)="createDoctor()" id="create-doctor-btn">Create Doctor</button>
        </div>

        <!-- Doctors Table -->
        <div class="table-wrap">
          <div *ngIf="loadingDoctors" class="loading-msg">Loading doctors...</div>
          <table *ngIf="!loadingDoctors && doctors.length > 0" class="admin-table" id="doctors-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Specialization</th>
                <th>License</th>
                <th>Exp</th>
                <th>Fee</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let doc of doctors" [id]="'doctor-row-' + doc.id">
                <td>
                  <div class="name-cell">
                    <div class="avatar-sm">{{ doc.firstName[0] }}{{ doc.lastName[0] }}</div>
                    <div>
                      <div class="cell-name">Dr. {{ doc.firstName }} {{ doc.lastName }}</div>
                      <div class="cell-sub">{{ doc.email }}</div>
                    </div>
                  </div>
                </td>
                <td>{{ doc.specialization }}</td>
                <td class="cell-sub">{{ doc.licenseNumber || '—' }}</td>
                <td>{{ doc.experienceYears > 0 ? doc.experienceYears + ' yrs' : '—' }}</td>
                <td>{{ doc.consultationFee > 0 ? '₹' + doc.consultationFee : '—' }}</td>
                <td>
                  <span class="status-pill" [class.active]="doc.status === 'Active'" [class.inactive]="doc.status !== 'Active'">
                    {{ doc.status }}
                  </span>
                </td>
                <td class="action-cell">
                  <button *ngIf="doc.status === 'Active'" class="btn btn-danger btn-xs"
                    (click)="deactivateDoctor(doc.id)" [id]="'deactivate-' + doc.id">Deactivate</button>
                  <button *ngIf="doc.status !== 'Active'" class="btn btn-success btn-xs"
                    (click)="activateDoctor(doc.id)" [id]="'activate-' + doc.id">Activate</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div *ngIf="!loadingDoctors && doctors.length === 0" class="empty-msg">No doctors found.</div>
        </div>
      </div>

      <!-- Tab: Patients -->
      <div *ngIf="activeTab === 'patients'" class="tab-content glass-card" id="patients-tab">
        <div class="tab-toolbar">
          <h3 class="tab-title">All Patients</h3>
          <span class="count-badge">{{ patients.length }} registered</span>
        </div>
        <div class="table-wrap">
          <div *ngIf="loadingPatients" class="loading-msg">Loading patients...</div>
          <table *ngIf="!loadingPatients && patients.length > 0" class="admin-table" id="patients-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Gender</th>
                <th>Blood Group</th>
                <th>DOB</th>
                <th>Appointments</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of patients" [id]="'patient-row-' + p.id">
                <td>
                  <div class="cell-name">{{ p.firstName }} {{ p.lastName }}</div>
                </td>
                <td class="cell-sub">{{ p.email }}</td>
                <td>{{ p.gender || '—' }}</td>
                <td>
                  <span *ngIf="p.bloodGroup" class="badge-blood">{{ p.bloodGroup }}</span>
                  <span *ngIf="!p.bloodGroup">—</span>
                </td>
                <td class="cell-sub">{{ p.dateOfBirth | date:'dd MMM yyyy' }}</td>
                <td><span class="count-pill">{{ p.appointmentCount }}</span></td>
              </tr>
            </tbody>
          </table>
          <div *ngIf="!loadingPatients && patients.length === 0" class="empty-msg">No patients found.</div>
        </div>
      </div>

      <!-- Tab: Appointments -->
      <div *ngIf="activeTab === 'appointments'" class="tab-content glass-card" id="appointments-tab">
        <div class="tab-toolbar">
          <h3 class="tab-title">All Appointments</h3>
        </div>

        <!-- Filters -->
        <div class="filter-row">
          <input type="date" class="form-control filter-input" [(ngModel)]="aptFilter.date" id="filter-date" placeholder="Filter by date">
          <select class="form-control filter-input" [(ngModel)]="aptFilter.status" id="filter-status">
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="NoShow">No-Show</option>
            <option value="Rejected">Rejected</option>
          </select>
          <button class="btn btn-primary btn-sm" (click)="loadAdminAppointments()" id="filter-apply-btn">Apply</button>
          <button class="btn btn-outline btn-sm" (click)="clearFilters()" id="filter-clear-btn">Clear</button>
        </div>

        <div class="table-wrap">
          <div *ngIf="loadingAppointments" class="loading-msg">Loading appointments...</div>
          <table *ngIf="!loadingAppointments && adminAppointments.length > 0" class="admin-table" id="appointments-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let apt of adminAppointments" [id]="'apt-row-' + apt.id">
                <td class="cell-sub">#{{ apt.id }}</td>
                <td>{{ apt.patientName }}</td>
                <td>
                  <div class="cell-name">Dr. {{ apt.doctorName }}</div>
                  <div class="cell-sub">{{ apt.specialization }}</div>
                </td>
                <td class="cell-sub">{{ apt.appointmentDate | date:'dd MMM yyyy' }}</td>
                <td class="cell-sub">{{ apt.startTime }} – {{ apt.endTime }}</td>
                <td>
                  <span class="status-pill" [ngClass]="'status-' + apt.status.toLowerCase()">{{ apt.status }}</span>
                </td>
                <td class="cell-sub">{{ apt.reason || '—' }}</td>
                <td>
                  <button class="btn btn-danger btn-xs" (click)="deleteAppointment(apt.id)"
                    [id]="'delete-apt-' + apt.id">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div *ngIf="!loadingAppointments && adminAppointments.length === 0" class="empty-msg">No appointments match your filters.</div>
        </div>
      </div>

      <!-- Tab: Reports -->
      <div *ngIf="activeTab === 'reports'" class="tab-content glass-card" id="reports-tab">
        <div class="tab-toolbar">
          <h3 class="tab-title">Summary Report</h3>
          <div class="flex gap-2 items-center">
            <input type="date" class="form-control filter-input" [(ngModel)]="reportDate" id="report-date-input">
            <button class="btn btn-primary btn-sm" (click)="loadReport()" id="refresh-report-btn">Refresh</button>
          </div>
        </div>

        <div *ngIf="report" class="report-content">
          <h4 class="report-section-title">Appointments by Status — {{ report.date }}</h4>
          <div class="status-breakdown">
            <div *ngFor="let s of report.byStatus" class="status-item" [id]="'status-' + s.status.toLowerCase()">
              <span class="status-label-sm" [ngClass]="'status-' + s.status.toLowerCase()">{{ s.status }}</span>
              <div class="status-bar-wrap">
                <div class="status-bar" [style.width]="getBarWidth(s.count, report.todayTotal)"></div>
              </div>
              <span class="status-count">{{ s.count }}</span>
            </div>
          </div>

          <div class="audit-section mt-6">
            <div class="flex justify-between items-center mb-3">
              <h4 class="report-section-title">Audit Log</h4>
              <button class="btn btn-outline btn-sm" (click)="loadAudit()" id="load-audit-btn">Load Audit</button>
            </div>
            <div *ngIf="auditLogs.length === 0" class="empty-msg">Click "Load Audit" to view logs.</div>
            <div *ngIf="auditLogs.length > 0" class="table-wrap">
              <table class="admin-table" id="audit-table">
                <thead>
                  <tr><th>Entity</th><th>ID</th><th>Action</th><th>By User</th><th>Timestamp</th><th>Details</th></tr>
                </thead>
                <tbody>
                  <tr *ngFor="let log of auditLogs">
                    <td>{{ log.entityName }}</td>
                    <td>#{{ log.entityId }}</td>
                    <td><span class="audit-action">{{ log.action }}</span></td>
                    <td class="cell-sub">User #{{ log.performedByUserId }}</td>
                    <td class="cell-sub">{{ log.timestamp | date:'dd MMM HH:mm' }}</td>
                    <td class="cell-sub">{{ log.details || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Schedules -->
      <div *ngIf="activeTab === 'schedules'" class="tab-content glass-card" id="schedules-tab">
        <div class="tab-toolbar">
          <h3 class="tab-title">Doctor Availability Schedules</h3>
        </div>
        <div class="table-wrap">
          <div *ngIf="loadingSchedules" class="loading-msg">Loading schedules...</div>
          <table *ngIf="!loadingSchedules && schedules.length > 0" class="admin-table" id="schedules-table">
            <thead>
              <tr><th>Doctor</th><th>Day</th><th>Start</th><th>End</th><th>Slot Duration</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of schedules" [id]="'schedule-row-' + s.id">
                <td>Dr. {{ s.doctorName }}</td>
                <td>{{ getDayName(s.dayOfWeek) }}</td>
                <td>{{ s.startTime }}</td>
                <td>{{ s.endTime }}</td>
                <td>{{ s.slotDurationMinutes }} min</td>
              </tr>
            </tbody>
          </table>
          <div *ngIf="!loadingSchedules && schedules.length === 0" class="empty-msg">No schedules configured.</div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .admin-wrapper {
      max-width: 1280px;
      margin: 0 auto;
      padding: 1.5rem;
    }
    .admin-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .admin-title { font-size: 1.75rem; font-weight: 800; margin: 0; }
    .admin-subtitle { color: var(--text-muted, #94a3b8); font-size: 0.875rem; margin: 0.2rem 0 0; }

    /* Stats */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .stat-card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      padding: 1.25rem;
      text-align: center;
    }
    .stat-icon { font-size: 1.5rem; margin-bottom: 0.5rem; }
    .stat-num { font-size: 2rem; font-weight: 800; color: var(--primary, #6366f1); }
    .stat-label { font-size: 0.75rem; color: var(--text-muted, #94a3b8); margin-top: 0.25rem; }

    /* Tabs */
    .tab-nav {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    .tab-btn {
      padding: 0.5rem 1rem;
      border: 2px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      background: transparent;
      color: var(--text-muted, #94a3b8);
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;
    }
    .tab-btn:hover { border-color: var(--primary, #6366f1); color: var(--primary, #6366f1); }
    .tab-btn.active {
      border-color: var(--primary, #6366f1);
      background: rgba(99,102,241,0.15);
      color: var(--primary, #6366f1);
      font-weight: 600;
    }
    .tab-content { padding: 1.5rem; }

    /* Toolbar */
    .tab-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .tab-title { font-size: 1.1rem; font-weight: 700; margin: 0; }

    /* Add form */
    .add-form {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 1.25rem;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 0.75rem;
    }

    /* Table */
    .table-wrap { overflow-x: auto; }
    .admin-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .admin-table th {
      text-align: left;
      padding: 0.75rem 1rem;
      background: rgba(255,255,255,0.05);
      color: var(--text-muted, #94a3b8);
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .admin-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      vertical-align: middle;
    }
    .admin-table tr:hover td { background: rgba(255,255,255,0.03); }

    .name-cell { display: flex; align-items: center; gap: 0.75rem; }
    .avatar-sm {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.8rem; color: white;
      flex-shrink: 0;
    }
    .cell-name { font-weight: 600; }
    .cell-sub { color: var(--text-muted, #94a3b8); font-size: 0.8rem; }
    .action-cell { display: flex; gap: 0.5rem; }

    /* Status pills */
    .status-pill {
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .status-pill.active { background: rgba(34,197,94,0.15); color: #22c55e; }
    .status-pill.inactive { background: rgba(239,68,68,0.15); color: #f87171; }
    .status-pending { background: rgba(245,158,11,0.15); color: #fbbf24; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.75rem; }
    .status-confirmed { background: rgba(99,102,241,0.15); color: #818cf8; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.75rem; }
    .status-completed { background: rgba(34,197,94,0.15); color: #22c55e; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.75rem; }
    .status-cancelled, .status-rejected, .status-noshow { background: rgba(239,68,68,0.15); color: #f87171; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.75rem; }

    /* Filter row */
    .filter-row { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1rem; align-items: center; }
    .filter-input { max-width: 200px; }

    /* Report */
    .report-section-title { font-size: 1rem; font-weight: 600; margin: 0 0 1rem; }
    .status-breakdown { display: flex; flex-direction: column; gap: 0.5rem; }
    .status-item { display: flex; align-items: center; gap: 0.75rem; }
    .status-label-sm { min-width: 100px; font-size: 0.8rem; font-weight: 600; }
    .status-bar-wrap { flex: 1; background: rgba(255,255,255,0.06); border-radius: 4px; height: 8px; overflow: hidden; }
    .status-bar { height: 100%; background: var(--primary, #6366f1); border-radius: 4px; transition: width 0.5s; }
    .status-count { min-width: 30px; text-align: right; font-weight: 700; }
    .audit-action { background: rgba(99,102,241,0.15); color: var(--primary, #6366f1); padding: 0.1rem 0.5rem; border-radius: 4px; font-size: 0.75rem; }
    .audit-section { border-top: 1px solid rgba(255,255,255,0.08); padding-top: 1rem; }

    /* Misc */
    .count-badge { background: rgba(99,102,241,0.15); color: var(--primary, #6366f1); padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.8rem; font-weight: 600; }
    .count-pill { background: rgba(255,255,255,0.08); padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.8rem; }
    .badge-blood { background: rgba(239,68,68,0.15); color: #f87171; padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700; }
    .loading-msg, .empty-msg { padding: 2rem; text-align: center; color: var(--text-muted, #94a3b8); }
    .mt-4 { margin-top: 1rem; }
    .mt-6 { margin-top: 1.5rem; }
    .flex { display: flex; }
    .gap-2 { gap: 0.5rem; }
    .items-center { align-items: center; }
    .btn-sm { font-size: 0.8rem; padding: 0.4rem 0.9rem; }
  `]
})
export class AdminDashboardComponent implements OnInit {

  tabs = [
    { key: 'doctors', label: 'Doctors', icon: '👨‍⚕️' },
    { key: 'patients', label: 'Patients', icon: '🏥' },
    { key: 'appointments', label: 'Appointments', icon: '📋' },
    { key: 'schedules', label: 'Schedules', icon: '🗓️' },
    { key: 'reports', label: 'Reports', icon: '📊' }
  ];

  activeTab = 'doctors';
  report: any = null;
  auditLogs: any[] = [];
  reportDate = new Date().toISOString().split('T')[0];

  // Doctors
  doctors: any[] = [];
  loadingDoctors = false;
  showAddDoctor = false;
  newDoctor = { firstName: '', lastName: '', email: '', password: '', specialization: '', licenseNumber: '', experienceYears: 0, consultationFee: 0 };

  // Patients
  patients: any[] = [];
  loadingPatients = false;

  // Appointments
  adminAppointments: any[] = [];
  loadingAppointments = false;
  aptFilter = { date: '', status: '' };

  // Schedules
  schedules: any[] = [];
  loadingSchedules = false;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadDoctors();
    this.loadReport();
  }

  setTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'doctors' && this.doctors.length === 0) this.loadDoctors();
    if (tab === 'patients' && this.patients.length === 0) this.loadPatients();
    if (tab === 'appointments' && this.adminAppointments.length === 0) this.loadAdminAppointments();
    if (tab === 'schedules' && this.schedules.length === 0) this.loadSchedules();
    if (tab === 'reports') this.loadReport();
  }

  loadDoctors() {
    this.loadingDoctors = true;
    this.api.getAdminDoctors().subscribe({
      next: (data) => { this.doctors = data; this.loadingDoctors = false; },
      error: () => { this.loadingDoctors = false; }
    });
  }

  createDoctor() {
    if (!this.newDoctor.firstName || !this.newDoctor.email || !this.newDoctor.password || !this.newDoctor.specialization) {
      alert('Please fill in all required fields.');
      return;
    }
    this.api.createAdminDoctor(this.newDoctor).subscribe({
      next: () => {
        this.showAddDoctor = false;
        this.newDoctor = { firstName: '', lastName: '', email: '', password: '', specialization: '', licenseNumber: '', experienceYears: 0, consultationFee: 0 };
        this.loadDoctors();
      },
      error: (err) => alert(err.error?.message || 'Failed to create doctor')
    });
  }

  deactivateDoctor(id: number) {
    if (!confirm('Deactivate this doctor?')) return;
    this.api.updateAdminDoctorStatus(id, 'Inactive').subscribe({
      next: () => this.loadDoctors(),
      error: (err) => alert(err.error?.message || 'Failed')
    });
  }

  activateDoctor(id: number) {
    this.api.updateAdminDoctorStatus(id, 'Active').subscribe({
      next: () => this.loadDoctors(),
      error: (err) => alert(err.error?.message || 'Failed')
    });
  }

  loadPatients() {
    this.loadingPatients = true;
    this.api.getAdminPatients().subscribe({
      next: (data) => { this.patients = data; this.loadingPatients = false; },
      error: () => { this.loadingPatients = false; }
    });
  }

  loadAdminAppointments() {
    this.loadingAppointments = true;
    const filters: any = {};
    if (this.aptFilter.date) filters.date = this.aptFilter.date;
    if (this.aptFilter.status) filters.status = this.aptFilter.status;
    this.api.getAdminAppointments(filters).subscribe({
      next: (data) => { this.adminAppointments = data; this.loadingAppointments = false; },
      error: () => { this.loadingAppointments = false; }
    });
  }

  clearFilters() {
    this.aptFilter = { date: '', status: '' };
    this.loadAdminAppointments();
  }

  deleteAppointment(id: number) {
    if (!confirm(`Delete appointment #${id}? This is irreversible.`)) return;
    this.api.deleteAdminAppointment(id).subscribe({
      next: () => { this.adminAppointments = this.adminAppointments.filter(a => a.id !== id); },
      error: (err) => alert(err.error?.message || 'Failed to delete')
    });
  }

  loadSchedules() {
    this.loadingSchedules = true;
    this.api.getAdminSchedules().subscribe({
      next: (data) => { this.schedules = data; this.loadingSchedules = false; },
      error: () => { this.loadingSchedules = false; }
    });
  }

  loadReport() {
    this.api.getAdminSummaryReport(this.reportDate).subscribe({
      next: (data) => { this.report = data; },
      error: (err) => console.error('Failed to load report', err)
    });
  }

  loadAudit() {
    this.api.getAdminAuditLogs().subscribe({
      next: (data) => { this.auditLogs = data; },
      error: (err) => console.error('Failed to load audit', err)
    });
  }

  getBarWidth(count: number, total: number): string {
    if (!total || !count) return '0%';
    return Math.round((count / total) * 100) + '%';
  }

  getDayName(day: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day] || 'Unknown';
  }

  logout() {
    localStorage.clear();
    window.location.href = '/login';
  }
}
