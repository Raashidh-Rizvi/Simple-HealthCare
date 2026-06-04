import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { SpeechRecognitionService } from '../../services/speech-recognition.service';
import { ConsultationWorkspaceComponent } from './consultation-workspace/consultation-workspace';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ConsultationWorkspaceComponent],
  providers: [DatePipe],
  template: `
    <div class="dashboard-shell">
      <!-- Left Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo">
            <span class="text-primary">✚</span> HealthPro
          </div>
        </div>
        <nav class="sidebar-nav">
          <div class="nav-item" [class.active]="activeNav === 'dashboard'" (click)="navigate('dashboard')">
            <span class="nav-icon">📊</span> Dashboard
          </div>
          <div class="nav-item" [class.active]="activeNav === 'schedule'" (click)="navigate('schedule')">
            <span class="nav-icon">📅</span> Today's Schedule
          </div>
          <div class="nav-item" [class.active]="activeNav === 'queue'" (click)="navigate('queue')">
            <span class="nav-icon">👥</span> Patient Queue
          </div>
          <div class="nav-item" [class.active]="activeNav === 'records'" (click)="navigate('records')">
            <span class="nav-icon">📁</span> Medical Records
          </div>
          <div class="nav-item" [class.active]="activeNav === 'telemedicine'" (click)="navigate('telemedicine')">
            <span class="nav-icon">💻</span> Telemedicine
          </div>
          <div class="nav-item" [class.active]="activeNav === 'settings'" (click)="navigate('settings')">
            <span class="nav-icon">⚙️</span> Settings
          </div>
        </nav>
      </aside>

      <!-- Main Area -->
      <main class="main-area">
        <!-- Top Bar -->
        <header class="top-bar">
          <div class="top-bar-left">
            <h2 class="m-0 font-bold" *ngIf="!inConsultation">{{ getNavTitle() }}</h2>
            <h2 class="m-0 font-bold text-primary" *ngIf="inConsultation">Consultation Workspace</h2>
          </div>
          <div class="top-bar-right">
            <span class="current-time">{{ currentTime | date:'shortTime' }}</span>
            <div class="action-icon">🔔<span class="icon-badge">3</span></div>
            <div class="action-icon">✉️<span class="icon-badge">1</span></div>
            <div class="action-icon text-danger" title="Emergency Alerts">⚠️</div>
            <div class="doctor-profile-sm ml-4 pl-4 border-l border-gray-700">
              <div class="doc-avatar">DS</div>
              <div class="flex-col">
                <span class="text-sm font-bold">Dr. Smith</span>
                <span class="text-xs text-muted">Cardiology</span>
              </div>
            </div>
          </div>
        </header>

        <!-- DASHBOARD VIEW -->
        <div class="dashboard-content" *ngIf="!inConsultation && activeNav === 'dashboard'">
          
          <!-- KPI Row -->
          <div class="kpi-grid">
            <div class="glass-card kpi-card border-t-4 border-primary">
              <span class="kpi-title">Today's Appointments</span>
              <span class="kpi-value">24</span>
              <span class="kpi-trend">↑ 2 from yesterday</span>
            </div>
            <div class="glass-card kpi-card border-t-4 border-accent">
              <span class="kpi-title">Waiting Patients</span>
              <span class="kpi-value">8</span>
              <span class="kpi-trend text-accent">Average wait: 12 min</span>
            </div>
            <div class="glass-card kpi-card border-t-4 border-secondary">
              <span class="kpi-title">Completed Consultations</span>
              <span class="kpi-value">12</span>
              <span class="kpi-trend">50% of daily load</span>
            </div>
            <div class="glass-card kpi-card border-t-4 border-danger">
              <span class="kpi-title">Pending Lab Reviews</span>
              <span class="kpi-value">5</span>
              <span class="kpi-trend text-danger">3 critical results</span>
            </div>
          </div>

          <div class="content-grid">
            <!-- Left Column: Schedule -->
            <div class="flex-col gap-6">
              <div class="glass-card">
                <div class="flex justify-between items-center mb-4">
                  <h3 class="m-0">Today's Schedule</h3>
                  <button class="btn btn-outline btn-xs" (click)="navigate('schedule')">View All</button>
                </div>
                
                <div class="flex-col gap-3">
                  <div *ngFor="let apt of mockSchedule" class="inner-card flex justify-between items-center p-3">
                    <div class="flex gap-4 items-center">
                      <div class="text-main font-bold" style="width: 60px;">{{ apt.time }}</div>
                      <div>
                        <div class="font-semibold">{{ apt.name }}</div>
                        <div class="text-xs text-muted">{{ apt.reason }}</div>
                      </div>
                    </div>
                    <div class="flex items-center gap-4">
                      <span class="badge" [ngClass]="getBadgeClass(apt.status)">{{ apt.status }}</span>
                      <button *ngIf="apt.status === 'Waiting' || apt.status === 'Emergency'" class="btn btn-primary btn-xs" (click)="startConsultation(apt)">Consult</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column: Queue & Alerts -->
            <div class="flex-col gap-6">
              <!-- Live Queue -->
              <div class="glass-card">
                <div class="flex justify-between items-center mb-4">
                  <h3 class="m-0">Patient Queue</h3>
                  <button class="btn btn-outline btn-xs" (click)="navigate('queue')">Manage Queue</button>
                </div>
                <div class="queue-list">
                  <div *ngFor="let q of mockQueue" class="inner-card queue-item" [ngClass]="q.priority.toLowerCase()">
                    <div class="flex gap-4 items-center">
                      <div class="token-badge">{{ q.token }}</div>
                      <div class="queue-info">
                        <h4>{{ q.name }}</h4>
                        <span class="queue-wait">Waiting {{ q.waitMins }} min • {{ q.priority }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Clinical Alerts -->
              <div class="glass-card border-danger">
                <h3 class="m-0 mb-4 text-danger flex items-center gap-2">⚠️ Clinical Alerts</h3>
                <div class="flex-col gap-3">
                  <div class="inner-card bg-red-900 bg-opacity-20 border-red-800 p-3">
                    <strong class="text-sm text-danger block mb-1">Critical BP - Sarah Lee</strong>
                    <span class="text-xs text-muted">BP measured 160/100 at triage.</span>
                  </div>
                  <div class="inner-card bg-yellow-900 bg-opacity-20 border-yellow-800 p-3">
                    <strong class="text-sm text-accent block mb-1">Abnormal Lab - John Smith</strong>
                    <span class="text-xs text-muted">HbA1c levels elevated (8.2%).</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- SCHEDULE VIEW -->
        <div class="dashboard-content" *ngIf="!inConsultation && activeNav === 'schedule'">
           <div class="glass-card">
              <div class="flex justify-between items-center mb-6">
                <h3 class="m-0">Full Day Schedule</h3>
                <div class="flex gap-2">
                   <button class="btn btn-outline btn-xs">Previous Day</button>
                   <button class="btn btn-outline btn-xs">Next Day</button>
                </div>
              </div>
              <div class="flex-col gap-3">
                <div *ngFor="let apt of mockSchedule" class="inner-card flex justify-between items-center p-4">
                  <div class="flex gap-6 items-center">
                    <div class="text-main font-bold text-lg w-20">{{ apt.time }}</div>
                    <div>
                      <div class="font-semibold text-lg">{{ apt.name }}</div>
                      <div class="text-sm text-muted mt-1">Reason: {{ apt.reason }}</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-4">
                    <span class="badge" [ngClass]="getBadgeClass(apt.status)">{{ apt.status }}</span>
                    <button *ngIf="apt.status === 'Waiting' || apt.status === 'Emergency'" class="btn btn-primary" (click)="startConsultation(apt)">Start Consultation</button>
                  </div>
                </div>
              </div>
           </div>
        </div>

        <!-- PATIENT QUEUE VIEW -->
        <div class="dashboard-content" *ngIf="!inConsultation && activeNav === 'queue'">
           <div class="glass-card">
              <h3 class="m-0 mb-6">Live Patient Queue</h3>
              <div class="grid grid-cols-3 gap-6">
                 <!-- Emergency Column -->
                 <div class="flex-col gap-4">
                   <h4 class="text-danger flex items-center justify-between">
                     <span>Emergency</span>
                     <span class="badge badge-danger">1</span>
                   </h4>
                   <div *ngFor="let q of mockQueue" [hidden]="q.priority !== 'Emergency'" class="inner-card queue-item emergency p-4">
                      <div class="token-badge text-3xl mb-2">{{ q.token }}</div>
                      <h4 class="m-0">{{ q.name }}</h4>
                      <div class="text-xs text-muted mt-1">Waiting {{ q.waitMins }} min</div>
                   </div>
                 </div>
                 
                 <!-- Urgent Column -->
                 <div class="flex-col gap-4">
                   <h4 class="text-accent flex items-center justify-between">
                     <span>Urgent</span>
                     <span class="badge badge-warning">1</span>
                   </h4>
                   <div *ngFor="let q of mockQueue" [hidden]="q.priority !== 'Urgent'" class="inner-card queue-item urgent p-4">
                      <div class="token-badge text-3xl mb-2">{{ q.token }}</div>
                      <h4 class="m-0">{{ q.name }}</h4>
                      <div class="text-xs text-muted mt-1">Waiting {{ q.waitMins }} min</div>
                   </div>
                 </div>

                 <!-- Normal Column -->
                 <div class="flex-col gap-4">
                   <h4 class="text-primary flex items-center justify-between">
                     <span>Normal</span>
                     <span class="badge badge-primary">1</span>
                   </h4>
                   <div *ngFor="let q of mockQueue" [hidden]="q.priority !== 'Normal'" class="inner-card queue-item normal p-4">
                      <div class="token-badge text-3xl mb-2">{{ q.token }}</div>
                      <h4 class="m-0">{{ q.name }}</h4>
                      <div class="text-xs text-muted mt-1">Waiting {{ q.waitMins }} min</div>
                   </div>
                 </div>
              </div>
           </div>
        </div>

        <!-- RECORDS VIEW -->
        <div class="dashboard-content" *ngIf="!inConsultation && activeNav === 'records'">
          <div class="glass-card">
            <h3 class="m-0 mb-6">Medical Records Search</h3>
            <div class="flex gap-4 mb-6">
              <input type="text" class="form-control" placeholder="Search patient by name, ID, or phone...">
              <button class="btn btn-primary">Search</button>
            </div>
            <div class="inner-card p-8 text-center text-muted">
              <span class="text-4xl mb-4 block">🗂️</span>
              Enter a patient's details to view their complete medical history, lab reports, and imaging.
            </div>
          </div>
        </div>

        <!-- TELEMEDICINE VIEW -->
        <div class="dashboard-content" *ngIf="!inConsultation && activeNav === 'telemedicine'">
          <div class="glass-card">
            <div class="flex justify-between items-center mb-6">
              <h3 class="m-0">Telemedicine Sessions</h3>
              <button class="btn btn-secondary">Join Active Room</button>
            </div>
            <div class="grid grid-cols-2 gap-6">
               <div class="inner-card">
                 <div class="text-center p-6">
                    <div class="text-4xl mb-4">🎥</div>
                    <h4 class="mb-2">Virtual Waiting Room</h4>
                    <p class="text-sm text-muted mb-4">0 patients currently waiting online.</p>
                 </div>
               </div>
               <div class="inner-card">
                 <h4 class="mb-4">Upcoming Video Calls</h4>
                 <div class="text-sm text-muted p-4 text-center">No video consultations scheduled for today.</div>
               </div>
            </div>
          </div>
        </div>

        <!-- SETTINGS VIEW -->
        <div class="dashboard-content" *ngIf="!inConsultation && activeNav === 'settings'">
          <div class="glass-card">
            <h3 class="m-0 mb-6">Profile & Settings</h3>
            <div class="grid grid-cols-2 gap-8">
              <div class="flex-col gap-4">
                <div class="form-group">
                  <label class="form-label">Full Name</label>
                  <input type="text" class="form-control" value="Dr. John Smith" disabled>
                </div>
                <div class="form-group">
                  <label class="form-label">Specialty</label>
                  <input type="text" class="form-control" value="Cardiology" disabled>
                </div>
                <div class="form-group">
                  <label class="form-label">Email Notification Preferences</label>
                  <select class="form-control">
                    <option>All Alerts</option>
                    <option>Critical Only</option>
                    <option>None</option>
                  </select>
                </div>
                <button class="btn btn-primary">Save Settings</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Consultation Workspace View -->
        <div class="dashboard-content" *ngIf="inConsultation && activePatient">
          <app-consultation-workspace 
            [patient]="activePatient"
            [vitals]="activePatientVitals"
            [history]="activePatientHistory"
            (onCancel)="endConsultation()"
            (onComplete)="completeConsultation($event)">
          </app-consultation-workspace>
        </div>
      </main>
    </div>
  `,
  styleUrl: './doctor-dashboard.css'
})
export class DoctorDashboardComponent implements OnInit, OnDestroy {
  activeNav = 'dashboard';
  currentTime = new Date();
  private timer: any;

  // View State
  inConsultation = false;
  activePatient: any = null;
  activePatientVitals: any = null;
  activePatientHistory: any[] = [];

  // Mock Data
  mockSchedule = [
    { id: 1, time: '09:00', name: 'John Smith', reason: 'Follow-up (Diabetes)', status: 'Completed' },
    { id: 2, time: '09:30', name: 'Sarah Lee', reason: 'Hypertension Evaluation', status: 'Waiting' },
    { id: 3, time: '10:00', name: 'Ahmed Khan', reason: 'General Checkup', status: 'Confirmed' },
    { id: 4, time: '10:30', name: 'David Silva', reason: 'Chest Pain', status: 'Emergency' }
  ];

  mockQueue = [
    { token: '101', name: 'David Silva', waitMins: 5, priority: 'Emergency' },
    { token: '102', name: 'Sarah Lee', waitMins: 12, priority: 'Urgent' },
    { token: '103', name: 'Maria Garcia', waitMins: 7, priority: 'Normal' }
  ];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.timer = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  navigate(nav: string) {
    if (this.inConsultation) {
      if(confirm('You are in an active consultation. Are you sure you want to leave? Notes will be lost.')) {
        this.inConsultation = false;
        this.activePatient = null;
      } else {
        return;
      }
    }
    this.activeNav = nav;
  }

  getNavTitle(): string {
    const titles: any = {
      'dashboard': 'Dashboard',
      'schedule': 'Schedule',
      'queue': 'Patient Queue',
      'records': 'Medical Records',
      'telemedicine': 'Telemedicine',
      'settings': 'Settings'
    };
    return titles[this.activeNav] || 'Dashboard';
  }

  getBadgeClass(status: string): string {
    switch (status) {
      case 'Completed': return 'badge-success';
      case 'Waiting': return 'badge-accent';
      case 'Emergency': return 'badge-danger';
      case 'Confirmed': return 'badge-primary';
      default: return 'badge-muted';
    }
  }

  startConsultation(apt: any) {
    // Setup mock data for the workspace based on the appointment
    this.activePatient = {
      id: 'PT' + apt.id + '992',
      name: apt.name,
      age: 45,
      gender: 'Male',
      allergies: ['Penicillin', 'Peanuts'],
      conditions: ['Type 2 Diabetes', 'Hypertension']
    };
    
    this.activePatientVitals = {
      bp: apt.name === 'Sarah Lee' ? '160/100' : '120/80',
      pulse: '75',
      temp: '98.4',
      weight: '78kg'
    };

    this.activePatientHistory = [
      { date: '12 May 2026', type: 'General', diagnosis: 'Routine checkup. BP normal.' },
      { date: '04 Mar 2026', type: 'Lab Review', diagnosis: 'HbA1c slightly elevated.' }
    ];

    this.inConsultation = true;
  }

  endConsultation() {
    this.inConsultation = false;
    this.activePatient = null;
  }

  completeConsultation(notes: any) {
    console.log('Consultation completed with notes:', notes);
    // In a real app, send this to the API
    alert('Consultation saved successfully!');
    
    // Update local mock state
    if (this.activePatient) {
       const apt = this.mockSchedule.find(a => a.name === this.activePatient.name);
       if (apt) apt.status = 'Completed';
       this.mockQueue = this.mockQueue.filter(q => q.name !== this.activePatient.name);
    }
    
    this.endConsultation();
  }
}
