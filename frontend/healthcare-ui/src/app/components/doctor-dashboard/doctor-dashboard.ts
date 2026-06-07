import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
          <div class="nav-item text-danger" style="margin-top: auto;" (click)="logout()">
            <span class="nav-icon">🚪</span> Logout
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
            <div class="action-icon cursor-pointer" (click)="navigate('notifications')">🔔<span class="icon-badge">3</span></div>
            <div class="action-icon cursor-pointer" (click)="navigate('messages')">✉️<span class="icon-badge">1</span></div>
            <div class="action-icon text-danger cursor-pointer" title="Emergency Alerts" (click)="navigate('notifications')">⚠️</div>
            <div class="doctor-profile-sm ml-4 pl-4 border-l border-gray-700">
              <div class="doc-avatar">{{ doctorInitials }}</div>
              <div class="flex-col">
                <span class="text-sm font-bold">{{ doctorName }}</span>
                <span class="text-xs text-muted">{{ doctorSpecialization }}</span>
              </div>
            </div>
          </div>
        </header>

        <!-- DASHBOARD VIEW -->
        <div class="dashboard-content" *ngIf="!inConsultation && activeNav === 'dashboard'">
          
          <!-- KPI Row -->
          <div class="kpi-grid">
            <div class="glass-card kpi-card border-t-4 border-primary cursor-pointer" (click)="navigate('schedule')">
              <span class="kpi-title">Today's Appointments</span>
              <span class="kpi-value">{{ todayAppointmentsCount }}</span>
              <span class="kpi-trend">Dynamic schedule count</span>
            </div>
            <div class="glass-card kpi-card border-t-4 border-accent cursor-pointer" (click)="navigate('queue')">
              <span class="kpi-title">Waiting Patients</span>
              <span class="kpi-value">{{ mockQueue.length }}</span>
              <span class="kpi-trend text-accent">Checked-in queue</span>
            </div>
            <div class="glass-card kpi-card border-t-4 border-secondary cursor-pointer" (click)="navigate('schedule')">
              <span class="kpi-title">Completed Consultations</span>
              <span class="kpi-value">{{ completedTodayCount }}</span>
              <span class="kpi-trend">Completed today</span>
            </div>
            <div class="glass-card kpi-card border-t-4 border-danger cursor-pointer" (click)="navigate('notifications')">
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
                <h3 class="m-0">Schedule for {{ selectedDate | date:'fullDate' }}</h3>
                <div class="flex gap-2">
                   <button class="btn btn-outline btn-xs" (click)="changeDay(-1)">Previous Day</button>
                   <button class="btn btn-outline btn-xs" (click)="changeDay(1)">Next Day</button>
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
              <button class="btn btn-primary" (click)="searchRecords()">Search</button>
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
              <button class="btn btn-secondary" (click)="joinRoom()">Join Active Room</button>
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
                <h4 class="m-0 text-primary mb-2">Personal Information</h4>
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
                <button class="btn btn-primary mt-2" (click)="saveSettings()">Save Settings</button>
              </div>

              <!-- Password Change Section -->
              <div class="flex-col gap-4">
                <h4 class="m-0 text-primary mb-2">Security</h4>
                <div class="form-group">
                  <label class="form-label">Current Password</label>
                  <input type="password" class="form-control" placeholder="Enter current password">
                </div>
                <div class="form-group">
                  <label class="form-label">New Password</label>
                  <input type="password" class="form-control" placeholder="Enter new password">
                </div>
                <div class="form-group">
                  <label class="form-label">Confirm New Password</label>
                  <input type="password" class="form-control" placeholder="Confirm new password">
                </div>
                <button class="btn btn-secondary mt-2" (click)="changePassword()">Update Password</button>
              </div>
            </div>
          </div>
        </div>

        <!-- NOTIFICATIONS VIEW -->
        <div class="dashboard-content" *ngIf="!inConsultation && activeNav === 'notifications'">
          <div class="glass-card">
            <h3 class="m-0 mb-6">Notifications</h3>
            <div class="flex-col gap-4">
              <div class="inner-card border-l-4 border-danger" style="border-left-width: 4px; border-left-color: var(--danger);">
                <div class="flex justify-between items-center mb-2">
                  <h4 class="m-0 text-danger flex items-center gap-2">⚠️ Emergency Alert</h4>
                  <span class="text-xs text-muted">10 mins ago</span>
                </div>
                <p class="text-sm text-main m-0">Critical Alert: Code Blue in Ward A. Immediate assistance required.</p>
              </div>
              <div class="inner-card border-l-4 border-accent" style="border-left-width: 4px; border-left-color: var(--accent);">
                <div class="flex justify-between items-center mb-2">
                  <h4 class="m-0 text-accent flex items-center gap-2">🔬 Lab Results</h4>
                  <span class="text-xs text-muted">1 hour ago</span>
                </div>
                <p class="text-sm text-main m-0">Abnormal Lab - John Smith: HbA1c levels elevated (8.2%).</p>
              </div>
              <div class="inner-card border-l-4 border-primary" style="border-left-width: 4px; border-left-color: var(--primary);">
                <div class="flex justify-between items-center mb-2">
                  <h4 class="m-0 text-primary flex items-center gap-2">📅 System</h4>
                  <span class="text-xs text-muted">2 hours ago</span>
                </div>
                <p class="text-sm text-main m-0">Schedule updated: 2 new appointments added for tomorrow.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- MESSAGES VIEW -->
        <div class="dashboard-content" *ngIf="!inConsultation && activeNav === 'messages'">
          <div class="glass-card">
            <h3 class="m-0 mb-6">Messages</h3>
            <div class="flex-col gap-4">
              <div class="inner-card">
                <div class="flex justify-between items-center mb-2">
                  <h4 class="m-0 font-bold">Dr. Emily Chen (Neurology)</h4>
                  <span class="text-xs text-muted">Today, 08:30 AM</span>
                </div>
                <p class="text-sm text-main m-0 mb-3">Hi Dr. Smith, I reviewed the MRI for patient Sarah Lee. Can we discuss the findings during the lunch break?</p>
                <div class="flex gap-2">
                   <button class="btn btn-primary btn-xs">Reply</button>
                   <button class="btn btn-outline btn-xs">Mark as Read</button>
                </div>
              </div>
              <div class="inner-card opacity-70">
                <div class="flex justify-between items-center mb-2">
                  <h4 class="m-0 font-bold text-muted">Admin Team</h4>
                  <span class="text-xs text-muted">Yesterday</span>
                </div>
                <p class="text-sm text-muted m-0 mb-3">Reminder: The monthly staff meeting has been rescheduled to Friday at 3:00 PM in Conference Room B.</p>
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

  // Doctor Details
  doctorName = '';
  doctorInitials = '';
  doctorSpecialization = 'General Medicine';

  // View State
  inConsultation = false;
  activePatient: any = null;
  activePatientVitals: any = null;
  activePatientHistory: any[] = [];
  activeEncounterId: number | null = null;

  // Selected date for viewing schedule
  selectedDate: Date = new Date();

  // Dynamic Data
  appointments: any[] = [];
  todayAppointmentsCount = 0;
  completedTodayCount = 0;

  mockSchedule: any[] = [];
  mockQueue: any[] = [];

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.doctorName = localStorage.getItem('name') || 'Doctor';
    const names = this.doctorName.replace(/^(Dr\.\s*|Dr\s+)/i, '').split(' ');
    this.doctorInitials = names.map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'CP';
    
    // Prefix name with Dr. if not already present
    if (!this.doctorName.toLowerCase().startsWith('dr.')) {
      this.doctorName = 'Dr. ' + this.doctorName;
    }

    this.loadAppointments();

    this.timer = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  loadAppointments() {
    this.api.getMyAppointments().subscribe({
      next: (data) => {
        this.appointments = data;
        
        // Dynamically find doctor's specialization if available
        if (data && data.length > 0) {
          const firstWithSpec = data.find((a: any) => a.specialization);
          if (firstWithSpec) {
            this.doctorSpecialization = firstWithSpec.specialization;
          }
        }
        
        this.processAppointments();
      },
      error: (err) => {
        console.error('Failed to load appointments', err);
      }
    });
  }

  isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  processAppointments() {
    const today = new Date();
    
    // 1. Today's counts
    const todayApts = this.appointments.filter(a => this.isSameDay(new Date(a.appointmentDate), today));
    this.todayAppointmentsCount = todayApts.length;
    this.completedTodayCount = todayApts.filter(a => a.status === 'Completed').length;

    // 2. Build schedule for selectedDate
    this.mockSchedule = this.appointments
      .filter(a => this.isSameDay(new Date(a.appointmentDate), this.selectedDate))
      .map(a => {
        let displayStatus = a.status;
        if (displayStatus === 'Confirmed' || displayStatus === 'Pending') {
          if (a.encounterStatus === 'CheckedIn' || a.encounterStatus === 'VitalsRecorded') {
            displayStatus = 'Waiting';
          } else if (a.encounterStatus === 'InConsultation') {
            displayStatus = 'Emergency';
          }
        }
        return {
          id: a.id,
          time: a.startTime,
          name: a.patientName,
          reason: a.reason || 'No reason specified',
          status: displayStatus,
          patientId: a.patientId,
          encounterId: a.encounterId,
          encounterStatus: a.encounterStatus,
          vitals: a.vitals,
          notes: a.notes,
          appointmentDate: a.appointmentDate
        };
      })
      .sort((a, b) => a.time.localeCompare(b.time));

    // 3. Build queue for today (Checked-in or VitalsRecorded, not Completed)
    this.mockQueue = this.appointments
      .filter(a => this.isSameDay(new Date(a.appointmentDate), today) && 
                   a.encounterId && 
                   a.encounterStatus !== 'Completed')
      .map(a => {
        let priority = 'Normal';
        const reasonLower = (a.reason || '').toLowerCase();
        if (reasonLower.includes('chest pain') || reasonLower.includes('emergency') || reasonLower.includes('severe')) {
          priority = 'Emergency';
        } else if (reasonLower.includes('fever') || reasonLower.includes('pain') || reasonLower.includes('breath')) {
          priority = 'Urgent';
        }
        return {
          token: `P-${a.id}`,
          name: a.patientName,
          waitMins: 12, // Average display
          priority: priority,
          encounterId: a.encounterId,
          appointment: a
        };
      });
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
      'settings': 'Settings',
      'notifications': 'Notifications',
      'messages': 'Messages'
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
    if (!apt.encounterId) {
      alert('Patient has not checked in at reception yet.');
      return;
    }

    this.api.startConsultation(apt.encounterId).subscribe({
      next: () => {
        this.activePatient = {
          id: 'PT' + apt.patientId + '992',
          name: apt.name,
          age: 45, // default
          gender: 'Male', // default
          allergies: ['Penicillin'],
          conditions: []
        };
        
        if (apt.vitals && apt.vitals.length > 0) {
          const v = apt.vitals[apt.vitals.length - 1];
          this.activePatientVitals = {
            bp: (v.bloodPressureSystolic && v.bloodPressureDiastolic) ? `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}` : '120/80',
            pulse: v.heartRate || '75',
            temp: v.temperature || '98.6',
            weight: v.weight ? `${v.weight} lbs` : '150 lbs'
          };
        } else {
          this.activePatientVitals = { bp: '120/80', pulse: '75', temp: '98.6', weight: '150 lbs' };
        }

        this.activePatientHistory = this.appointments
          .filter(a => a.patientId === apt.patientId && a.status === 'Completed')
          .map(a => ({
            date: new Date(a.appointmentDate).toLocaleDateString(),
            type: 'General',
            diagnosis: a.notes || 'Routine checkup. Consultation completed.'
          }));

        this.activeEncounterId = apt.encounterId;
        this.inConsultation = true;
      },
      error: (err) => {
        alert('Failed to start consultation: ' + (err.error?.message || err.message));
      }
    });
  }

  endConsultation() {
    this.inConsultation = false;
    this.activePatient = null;
    this.activeEncounterId = null;
    this.loadAppointments();
  }

  completeConsultation(event: any) {
    const encounterId = this.activeEncounterId;
    if (!encounterId) return;

    const notesSummary = `Chief Complaint: ${event.notes.chiefComplaint}\nHPI: ${event.notes.hpi}\nPlan: ${event.notes.plan}`;
    const diagnosis = event.notes.assessment;

    const orders = [];
    if (event.prescriptions && event.prescriptions.length > 0) {
      for (const rx of event.prescriptions) {
        orders.push({
          orderType: 'Pharmacy',
          description: `${rx.name} ${rx.dosage} - ${rx.frequency} for ${rx.duration}`
        });
      }
    }
    if (event.orderedLabs && event.orderedLabs.length > 0) {
      for (const lab of event.orderedLabs) {
        orders.push({
          orderType: 'Lab',
          description: lab
        });
      }
    }

    const payload = {
      notes: notesSummary,
      diagnosis: diagnosis,
      orders: orders
    };

    this.api.completeConsultation(encounterId, payload).subscribe({
      next: () => {
        alert('Consultation completed successfully!');
        this.endConsultation();
      },
      error: (err) => {
        alert('Failed to complete consultation: ' + (err.error?.message || err.message));
      }
    });
  }

  showAlert(msg: string) {
    alert(msg);
  }

  changeDay(offset: number) {
    const newDate = new Date(this.selectedDate);
    newDate.setDate(newDate.getDate() + offset);
    this.selectedDate = newDate;
    this.processAppointments();
  }

  searchRecords() {
    alert('Searching records... No matches found.');
  }

  joinRoom() {
    alert('Joining telemedicine room... Waiting for patient.');
  }

  saveSettings() {
    alert('Settings saved successfully!');
  }

  changePassword() {
    alert('Password updated successfully!');
  }

  logout() {
    if(confirm('Are you sure you want to log out?')) {
      localStorage.removeItem('token');
      this.router.navigate(['/login']);
    }
  }
}
