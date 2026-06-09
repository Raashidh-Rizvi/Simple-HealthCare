import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { VitalService, VitalResponseDto } from '../../services/vital.service';
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
          <div class="nav-item" [class.active]="activeNav === 'appointments'" (click)="navigate('appointments')">
            <span class="nav-icon">📅</span> Appointments
          </div>
          <div class="nav-item" [class.active]="activeNav === 'schedule'" (click)="navigate('schedule')">
            <span class="nav-icon">🗓️</span> Today's Schedule
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
            <div class="action-icon cursor-pointer" (click)="navigate('notifications')">🔔<span class="icon-badge" *ngIf="unreadCount > 0">{{ unreadCount }}</span></div>
            <div class="action-icon cursor-pointer" (click)="navigate('messages')">✉️<span class="icon-badge">1</span></div>
            <div class="action-icon text-danger cursor-pointer" title="Emergency Alerts" (click)="navigate('notifications')">⚠️</div>
            <div class="doctor-profile-sm ml-4 pl-4 border-l border-gray-700 cursor-pointer" (click)="openProfileModal()">
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
              <span class="kpi-title">Completed Today</span>
              <span class="kpi-value">{{ completedTodayCount }}</span>
              <span class="kpi-trend">Completed today</span>
            </div>
            <div class="glass-card kpi-card border-t-4 border-warning cursor-pointer" (click)="navigate('appointments')">
              <span class="kpi-title">Pending Approval</span>
              <span class="kpi-value">{{ pendingCount }}</span>
              <span class="kpi-trend text-accent">Needs confirmation</span>
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
                
                <div *ngIf="mockSchedule.length === 0" class="text-muted text-sm py-4 text-center">
                  No appointments scheduled for today.
                </div>
                <div class="flex-col gap-3">
                  <div *ngFor="let apt of mockSchedule.slice(0,5)" class="inner-card flex justify-between items-center p-3">
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

            <!-- Right Column: Queue & Pending -->
            <div class="flex-col gap-6">
              <!-- Pending Appointments -->
              <div class="glass-card">
                <div class="flex justify-between items-center mb-4">
                  <h3 class="m-0 text-accent">⏳ Pending Approval</h3>
                  <button class="btn btn-outline btn-xs" (click)="navigate('appointments')">Manage All</button>
                </div>
                <div *ngIf="pendingAppointments.length === 0" class="text-muted text-sm py-2 text-center">
                  No pending appointments.
                </div>
                <div class="flex-col gap-2">
                  <div *ngFor="let apt of pendingAppointments.slice(0,3)" class="inner-card p-3">
                    <div class="flex justify-between items-start mb-2">
                      <div>
                        <strong class="text-sm text-main">{{ apt.patientName }}</strong>
                        <div class="text-xs text-muted">{{ apt.appointmentDate | date:'mediumDate' }} at {{ apt.startTime }}</div>
                      </div>
                      <span class="badge badge-warning">Pending</span>
                    </div>
                    <div class="flex gap-2">
                      <button class="btn btn-xs" style="background: rgba(34,197,94,0.15); color: var(--secondary); border: 1px solid rgba(34,197,94,0.3);" (click)="confirmAppointment(apt)">✓ Confirm</button>
                      <button class="btn btn-xs" style="background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3);" (click)="rejectAppointment(apt)">✕ Reject</button>
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

        <!-- APPOINTMENTS MANAGEMENT VIEW -->
        <div class="dashboard-content" *ngIf="!inConsultation && activeNav === 'appointments'">
          <div class="flex justify-between items-center mb-6">
            <h3 class="m-0 font-bold text-main">Appointment Management</h3>
            <button class="btn btn-outline btn-sm" (click)="loadAppointments()">🔄 Refresh</button>
          </div>

          <!-- Status Filter Tabs -->
          <div class="flex gap-2 mb-4" style="flex-wrap: wrap; justify-content: space-between; align-items: center;">
            <div class="flex gap-2" style="flex-wrap: wrap;">
              <button class="filter-btn" [class.active]="aptFilterStatus === ''" (click)="aptFilterStatus = ''">All ({{ appointments.length }})</button>
              <button class="filter-btn" [class.active]="aptFilterStatus === 'Pending'" (click)="aptFilterStatus = 'Pending'">⏳ Pending ({{ countDoctorByStatus('Pending') }})</button>
              <button class="filter-btn" [class.active]="aptFilterStatus === 'Confirmed'" (click)="aptFilterStatus = 'Confirmed'">✓ Confirmed ({{ countDoctorByStatus('Confirmed') }})</button>
              <button class="filter-btn" [class.active]="aptFilterStatus === 'Completed'" (click)="aptFilterStatus = 'Completed'">✅ Completed ({{ countDoctorByStatus('Completed') }})</button>
              <button class="filter-btn" [class.active]="aptFilterStatus === 'Cancelled'" (click)="aptFilterStatus = 'Cancelled'">❌ Cancelled ({{ countDoctorByStatus('Cancelled') }})</button>
            </div>
            <input type="text" class="form-control" style="max-width: 250px;" placeholder="Search appointments..." [(ngModel)]="aptSearchTerm">
          </div>

          <div class="glass-card">
            <div *ngIf="loadingApts" class="text-muted py-8 text-center">
              <div class="spinner-lg mx-auto mb-3"></div>
              Loading appointments...
            </div>

            <div *ngIf="!loadingApts && filteredDoctorAppointments.length === 0" class="text-muted py-8 text-center">
              <span style="font-size: 3rem;">📅</span>
              <h4 class="mt-4 mb-2 text-main">No Appointments Found</h4>
              <p class="text-sm">{{ aptFilterStatus ? 'No ' + aptFilterStatus + ' appointments.' : 'You have no appointments yet.' }}</p>
            </div>

            <div *ngIf="!loadingApts && filteredDoctorAppointments.length > 0" class="flex-col gap-3">
              <div *ngFor="let apt of filteredDoctorAppointments" class="apt-row inner-card flex justify-between items-center p-4" [class.apt-pending]="apt.status === 'Pending'" [class.apt-confirmed]="apt.status === 'Confirmed'" [class.apt-completed]="apt.status === 'Completed'" [class.apt-cancelled]="apt.status === 'Cancelled' || apt.status === 'Rejected'">
                <!-- Left: Patient Info -->
                <div class="flex gap-4 items-center" style="flex: 1;">
                  <div class="patient-avatar">{{ getInitials(apt.patientName) }}</div>
                  <div>
                    <div class="font-semibold text-main">{{ apt.patientName }}</div>
                    <div class="text-xs text-muted mt-1">📅 {{ apt.appointmentDate | date:'mediumDate' }} &nbsp; ⏰ {{ apt.startTime }} – {{ apt.endTime }} &nbsp; • {{ apt.type }}</div>
                    <div class="text-xs text-muted mt-1" *ngIf="apt.reason">Reason: {{ apt.reason }}</div>
                  </div>
                </div>

                <!-- Middle: Status -->
                <div class="flex-shrink-0 px-4">
                  <span class="badge" [ngClass]="getDoctorBadgeClass(apt.status)">{{ apt.status }}</span>
                </div>

                <!-- Right: Actions -->
                <div class="flex gap-2 flex-shrink-0" style="flex-wrap: wrap;">
                  <!-- Pending actions -->
                  <button *ngIf="apt.status === 'Pending'"
                    class="btn btn-xs" style="background: rgba(34,197,94,0.15); color: var(--secondary); border: 1px solid rgba(34,197,94,0.3);"
                    (click)="confirmAppointment(apt)">✓ Confirm</button>
                  <button *ngIf="apt.status === 'Pending'"
                    class="btn btn-xs" style="background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3);"
                    (click)="rejectAppointment(apt)">✕ Reject</button>

                  <!-- Confirmed actions -->
                  <button *ngIf="apt.status === 'Confirmed'"
                    class="btn btn-primary btn-xs"
                    (click)="startConsultationFromApt(apt)">Start Consult</button>
                  <button *ngIf="apt.status === 'Confirmed'"
                    class="btn btn-xs" style="background: rgba(34,197,94,0.15); color: var(--secondary); border: 1px solid rgba(34,197,94,0.3);"
                    (click)="completeAppointment(apt)">✅ Complete</button>
                  <button *ngIf="apt.status === 'Confirmed'"
                    class="btn btn-xs" style="background: rgba(156,163,175,0.15); color: var(--text-muted); border: 1px solid rgba(156,163,175,0.3);"
                    (click)="markNoShow(apt)">No Show</button>

                  <!-- Cancel for Pending/Confirmed -->
                  <button *ngIf="apt.status === 'Pending' || apt.status === 'Confirmed'"
                    class="btn btn-xs" style="background: rgba(239,68,68,0.08); color: #ef4444; border: 1px solid rgba(239,68,68,0.2);"
                    (click)="cancelAppointmentDoctor(apt)">Cancel</button>
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
              <div *ngIf="mockSchedule.length === 0" class="text-muted text-center py-8">
                <span style="font-size: 2.5rem;">📅</span>
                <p class="mt-3">No appointments for this day.</p>
              </div>
              <div class="flex-col gap-3">
                <div *ngFor="let apt of mockSchedule" class="inner-card flex justify-between items-center p-4" [class.apt-pending]="apt.status === 'Pending'" [class.apt-confirmed]="apt.rawStatus === 'Confirmed'" [class.apt-completed]="apt.rawStatus === 'Completed'">
                  <div class="flex gap-6 items-center">
                    <div class="text-main font-bold text-lg w-20">{{ apt.time }}</div>
                    <div>
                      <div class="font-semibold text-lg">{{ apt.name }} <span class="text-sm font-normal text-primary ml-2">• {{ apt.type }}</span></div>
                      <div class="text-sm text-muted mt-1">Reason: {{ apt.reason }}</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-4">
                    <span class="badge" [ngClass]="getBadgeClass(apt.status)">{{ apt.status }}</span>
                    <button *ngIf="apt.status === 'Waiting' || apt.status === 'Emergency'" class="btn btn-primary" (click)="startConsultation(apt)">Start Consultation</button>
                    <button *ngIf="apt.rawStatus === 'Pending'" class="btn btn-xs" style="background: rgba(34,197,94,0.15); color: var(--secondary); border: 1px solid rgba(34,197,94,0.3);" (click)="confirmAppointmentBySchedule(apt)">✓ Confirm</button>
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
                     <span class="badge badge-danger">{{ getEmergencyCount() }}</span>
                   </h4>
                   <div *ngFor="let q of mockQueue" [hidden]="q.priority !== 'Emergency'" class="inner-card queue-item emergency p-4">
                      <div class="token-badge text-3xl mb-2">{{ q.token }}</div>
                      <h4 class="m-0">{{ q.name }}</h4>
                      <div class="text-xs text-muted mt-1">Waiting {{ q.waitMins }} min</div>
                   </div>
                   <div *ngIf="getEmergencyCount() === 0" class="text-muted text-sm text-center py-4">None</div>
                 </div>
                 
                 <!-- Urgent Column -->
                 <div class="flex-col gap-4">
                   <h4 class="text-accent flex items-center justify-between">
                     <span>Urgent</span>
                     <span class="badge badge-warning">{{ getUrgentCount() }}</span>
                   </h4>
                   <div *ngFor="let q of mockQueue" [hidden]="q.priority !== 'Urgent'" class="inner-card queue-item urgent p-4">
                      <div class="token-badge text-3xl mb-2">{{ q.token }}</div>
                      <h4 class="m-0">{{ q.name }}</h4>
                      <div class="text-xs text-muted mt-1">Waiting {{ q.waitMins }} min</div>
                   </div>
                   <div *ngIf="getUrgentCount() === 0" class="text-muted text-sm text-center py-4">None</div>
                 </div>

                 <!-- Normal Column -->
                 <div class="flex-col gap-4">
                   <h4 class="text-primary flex items-center justify-between">
                     <span>Normal</span>
                     <span class="badge badge-primary">{{ getNormalCount() }}</span>
                   </h4>
                   <div *ngFor="let q of mockQueue" [hidden]="q.priority !== 'Normal'" class="inner-card queue-item normal p-4">
                      <div class="token-badge text-3xl mb-2">{{ q.token }}</div>
                      <h4 class="m-0">{{ q.name }}</h4>
                      <div class="text-xs text-muted mt-1">Waiting {{ q.waitMins }} min</div>
                   </div>
                   <div *ngIf="getNormalCount() === 0" class="text-muted text-sm text-center py-4">None</div>
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
                  <input type="text" class="form-control" [value]="doctorName" disabled>
                </div>
                <div class="form-group">
                  <label class="form-label">Specialty</label>
                  <input type="text" class="form-control" [value]="doctorSpecialization" disabled>
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
            <div class="flex justify-between items-center mb-6">
              <h3 class="m-0 text-main">Notifications</h3>
              <button *ngIf="unreadCount > 0" class="btn btn-outline btn-xs" (click)="markAllAsRead()">Mark All as Read</button>
            </div>
            
            <div *ngIf="notifications.length === 0" class="text-muted py-12 text-center">
              <span style="font-size: 3rem;">🔔</span>
              <h4 class="mt-4 mb-2 text-main">All Caught Up!</h4>
              <p class="max-w-sm mx-auto text-sm">You don't have any notifications right now.</p>
            </div>

            <div *ngIf="notifications.length > 0" class="flex-col gap-4">
              <div *ngFor="let n of notifications" 
                   class="inner-card flex justify-between items-start p-4 hover-lift cursor-pointer mb-3"
                   [class.unread]="!n.isRead"
                   [style.border-left]="'4px solid ' + getNotificationColor(n.type)"
                   (click)="markAsRead(n)">
                <div class="flex-col gap-1" style="flex: 1; padding-right: 16px;">
                  <div class="flex items-center gap-2">
                    <strong class="text-sm" [style.color]="getNotificationColor(n.type)">
                      {{ getNotificationIcon(n.type) }} {{ n.type }}
                    </strong>
                    <span *ngIf="!n.isRead" class="badge badge-danger" style="font-size: 8px; padding: 2px 6px;">New</span>
                  </div>
                  <p class="text-sm text-main m-0 mt-1">{{ n.message }}</p>
                  <span class="text-xs text-muted mt-1">{{ n.sentAt | date:'medium' }}</span>
                </div>
                <button *ngIf="!n.isRead" class="btn btn-outline btn-xs" (click)="$event.stopPropagation(); markAsRead(n)">
                  Mark read
                </button>
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
            </div>
          </div>
        </div>

        <!-- Consultation Workspace View -->
        <div class="dashboard-content" *ngIf="inConsultation && activePatient">
          <app-consultation-workspace 
            [patient]="activePatient"
            [vitals]="activePatientVitals"
            [history]="activePatientHistory"
            [patientVitalsHistory]="activePatientVitalsHistory"
            [patientSubmittedVitals]="activePatientSubmittedVitals"
            (onCancel)="endConsultation()"
            (onComplete)="completeConsultation($event)"
            (onSaveVitals)="saveClinicalVitals($event)"
            (verifyVital)="verifyPatientVital($event)">
          </app-consultation-workspace>
        </div>
      </main>
    </div>

    <!-- Profile Edit Modal -->
    <div *ngIf="showProfileModal" class="modal-overlay" (click)="closeProfileModal()">
      <div class="modal-content" (click)="$event.stopPropagation()" style="max-width: 650px;">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">Edit Doctor Profile</h3>
            <p class="text-sm text-muted mt-1">Update your professional and contact details below.</p>
          </div>
          <button class="modal-close-btn" (click)="closeProfileModal()">&times;</button>
        </div>

        <form (ngSubmit)="saveProfile()" class="flex-col gap-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">First Name</label>
              <input type="text" class="form-control" [(ngModel)]="profileForm.firstName" name="firstName" required>
            </div>
            <div class="form-group">
              <label class="form-label">Last Name</label>
              <input type="text" class="form-control" [(ngModel)]="profileForm.lastName" name="lastName" required>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" class="form-control" [value]="profileForm.email" name="email" disabled style="opacity: 0.6; cursor: not-allowed;">
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input type="text" class="form-control" [(ngModel)]="profileForm.phone" name="phone">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Specialization</label>
              <input type="text" class="form-control" [(ngModel)]="profileForm.specialization" name="specialization" required>
            </div>
            <div class="form-group">
              <label class="form-label">License Number</label>
              <input type="text" class="form-control" [(ngModel)]="profileForm.licenseNumber" name="licenseNumber">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Experience (Years)</label>
              <input type="number" class="form-control" [(ngModel)]="profileForm.experienceYears" name="experienceYears">
            </div>
            <div class="form-group">
              <label class="form-label">Consultation Fee ($)</label>
              <input type="number" class="form-control" [(ngModel)]="profileForm.consultationFee" name="consultationFee">
            </div>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button type="button" (click)="closeProfileModal()" class="btn btn-outline">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .filter-btn {
      padding: 0.4rem 0.9rem;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 20px;
      background: rgba(255,255,255,0.04);
      color: var(--text-muted, #94a3b8);
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .filter-btn.active, .filter-btn:hover {
      background: rgba(99,102,241,0.15);
      color: var(--primary, #6366f1);
      border-color: var(--primary, #6366f1);
    }
    .apt-row {
      border-left: 3px solid transparent;
      transition: all 0.2s;
    }
    .apt-row:hover { background: rgba(255,255,255,0.04); }
    .apt-pending { border-left-color: var(--accent, #f59e0b); }
    .apt-confirmed { border-left-color: var(--primary, #6366f1); }
    .apt-completed { border-left-color: var(--secondary, #22c55e); }
    .apt-cancelled { border-left-color: var(--danger, #ef4444); opacity: 0.7; }
    .patient-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.85rem; color: white;
      flex-shrink: 0;
    }
    .spinner-lg {
      width: 40px; height: 40px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: var(--primary, #6366f1);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
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
  activePatientVitalsHistory: VitalResponseDto[] = [];
  activePatientSubmittedVitals: VitalResponseDto[] = [];
  activeEncounterId: number | null = null;

  // Selected date for viewing schedule
  selectedDate: Date = new Date();

  // Dynamic Data
  appointments: any[] = [];
  todayAppointmentsCount = 0;
  completedTodayCount = 0;
  pendingCount = 0;
  loadingApts = false;

  aptFilterStatus = '';
  aptSearchTerm = '';

  mockSchedule: any[] = [];
  mockQueue: any[] = [];

  // Notifications State
  notifications: any[] = [];
  unreadCount = 0;
  private refreshInterval: any;

  // Profile Modal State
  showProfileModal = false;
  profileForm: any = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialization: '',
    licenseNumber: '',
    experienceYears: null,
    consultationFee: null
  };

  get pendingAppointments(): any[] {
    return this.appointments.filter(a => a.status === 'Pending');
  }

  get filteredDoctorAppointments(): any[] {
    let result = this.appointments;
    if (this.aptFilterStatus) {
      result = result.filter(a => a.status === this.aptFilterStatus);
    }
    if (this.aptSearchTerm) {
      const term = this.aptSearchTerm.toLowerCase();
      result = result.filter(a => 
        (a.patientName?.toLowerCase().includes(term)) ||
        (a.reason?.toLowerCase().includes(term))
      );
    }
    return result;
  }

  constructor(private api: ApiService, private vitalService: VitalService, private router: Router) {}

  ngOnInit() {
    this.doctorName = localStorage.getItem('name') || 'Doctor';
    const names = this.doctorName.replace(/^(Dr\.\s*|Dr\s+)/i, '').split(' ');
    this.doctorInitials = names.map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'CP';
    
    if (!this.doctorName.toLowerCase().startsWith('dr.')) {
      this.doctorName = 'Dr. ' + this.doctorName;
    }

    this.loadAppointments();
    this.loadProfile();
    this.loadNotifications();

    this.timer = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);

    this.refreshInterval = setInterval(() => {
      this.loadNotifications();
    }, 30000);
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  loadAppointments() {
    this.loadingApts = true;
    this.api.getMyAppointments().subscribe({
      next: (data) => {
        this.appointments = data || [];
        this.loadingApts = false;
        
        if (data && data.length > 0) {
          const firstWithSpec = data.find((a: any) => a.specialization);
          if (firstWithSpec) this.doctorSpecialization = firstWithSpec.specialization;
        }
        
        this.processAppointments();
      },
      error: (err) => {
        console.error('Failed to load appointments', err);
        this.loadingApts = false;
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
    
    const todayApts = this.appointments.filter(a => this.isSameDay(new Date(a.appointmentDate), today));
    this.todayAppointmentsCount = todayApts.length;
    this.completedTodayCount = todayApts.filter(a => a.status === 'Completed').length;
    this.pendingCount = this.appointments.filter(a => a.status === 'Pending').length;

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
          type: a.type,
          rawStatus: a.status,
          patientId: a.patientId,
          encounterId: a.encounterId,
          encounterStatus: a.encounterStatus,
          vitals: a.vitals,
          notes: a.notes,
          appointmentDate: a.appointmentDate
        };
      })
      .sort((a, b) => a.time.localeCompare(b.time));

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
          waitMins: 12,
          priority: priority,
          encounterId: a.encounterId,
          appointment: a
        };
      });
  }

  countDoctorByStatus(status: string): number {
    return this.appointments.filter(a => a.status === status).length;
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  confirmAppointment(apt: any) {
    this.api.confirmAppointment(apt.id).subscribe({
      next: () => {
        apt.status = 'Confirmed';
        this.processAppointments();
        alert(`Appointment for ${apt.patientName} confirmed!`);
      },
      error: (err) => alert('Failed to confirm: ' + (err.error?.message || err.message))
    });
  }

  confirmAppointmentBySchedule(apt: any) {
    const fullApt = this.appointments.find(a => a.id === apt.id);
    if (fullApt) this.confirmAppointment(fullApt);
  }

  rejectAppointment(apt: any) {
    if (!confirm(`Reject appointment for ${apt.patientName}?`)) return;
    this.api.rejectAppointment(apt.id).subscribe({
      next: () => {
        apt.status = 'Rejected';
        this.processAppointments();
        alert(`Appointment for ${apt.patientName} rejected.`);
      },
      error: (err) => alert('Failed to reject: ' + (err.error?.message || err.message))
    });
  }

  completeAppointment(apt: any) {
    if (!confirm(`Mark appointment for ${apt.patientName} as completed?`)) return;
    this.api.completeAppointment(apt.id).subscribe({
      next: () => {
        apt.status = 'Completed';
        this.processAppointments();
        alert(`Appointment marked as completed.`);
      },
      error: (err) => alert('Failed to complete: ' + (err.error?.message || err.message))
    });
  }

  markNoShow(apt: any) {
    if (!confirm(`Mark ${apt.patientName} as No Show?`)) return;
    this.api.markNoShow(apt.id).subscribe({
      next: () => {
        apt.status = 'NoShow';
        this.processAppointments();
        alert(`Patient marked as No Show.`);
      },
      error: (err) => alert('Failed: ' + (err.error?.message || err.message))
    });
  }

  cancelAppointmentDoctor(apt: any) {
    if (!confirm(`Cancel appointment for ${apt.patientName}?`)) return;
    this.api.cancelAppointment(apt.id).subscribe({
      next: () => {
        apt.status = 'Cancelled';
        this.processAppointments();
        alert(`Appointment cancelled.`);
      },
      error: (err) => alert('Failed to cancel: ' + (err.error?.message || err.message))
    });
  }

  navigate(nav: string) {
    if (this.inConsultation) {
      if (confirm('You are in an active consultation. Are you sure you want to leave? Notes will be lost.')) {
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
      'dashboard': 'Dashboard', 'appointments': 'Appointments',
      'schedule': 'Schedule', 'queue': 'Patient Queue',
      'records': 'Medical Records', 'telemedicine': 'Telemedicine',
      'settings': 'Settings', 'notifications': 'Notifications', 'messages': 'Messages'
    };
    return titles[this.activeNav] || 'Dashboard';
  }

  getBadgeClass(status: string): string {
    switch (status) {
      case 'Completed': return 'badge-success';
      case 'Waiting': return 'badge-accent';
      case 'Emergency': return 'badge-danger';
      case 'Confirmed': return 'badge-primary';
      case 'Pending': return 'badge-warning';
      default: return 'badge-muted';
    }
  }

  getDoctorBadgeClass(status: string): string {
    switch (status) {
      case 'Completed': return 'badge-success';
      case 'Confirmed': return 'badge-primary';
      case 'Pending': return 'badge-warning';
      case 'Cancelled': return 'badge-danger';
      case 'Rejected': return 'badge-danger';
      case 'NoShow': return 'badge-muted';
      default: return 'badge-muted';
    }
  }

  startConsultationFromApt(apt: any) {
    const scheduleApt = {
      id: apt.id,
      name: apt.patientName,
      reason: apt.reason,
      patientId: apt.patientId,
      encounterId: apt.encounterId,
      encounterStatus: apt.encounterStatus,
      vitals: apt.vitals,
      status: 'Waiting'
    };
    this.startConsultation(scheduleApt);
  }

  startConsultation(apt: any) {
    if (!apt.encounterId) {
      if (apt.type === 'Video Consultation' || confirm('Patient has not checked in at reception yet. Do you want to check them in and start the consultation?')) {
        this.api.checkInEncounter(apt.id).subscribe({
          next: (res: any) => {
            apt.encounterId = res.encounterId;
            this.executeStartConsultation(apt);
          },
          error: (err: any) => alert('Failed to check in: ' + (err.error?.message || err.message))
        });
      }
      return;
    }

    this.executeStartConsultation(apt);
  }

  executeStartConsultation(apt: any) {
    this.api.startConsultation(apt.encounterId).subscribe({
      next: () => {
        this.activePatient = {
          id: 'PT' + apt.patientId + '992',
          patientDbId: apt.patientId,
          name: apt.name,
          age: 45,
          gender: 'Male',
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
        this.loadPatientVitals(this.activePatient.patientDbId);
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
        orders.push({ orderType: 'Pharmacy', description: `${rx.name} ${rx.dosage} - ${rx.frequency} for ${rx.duration}` });
      }
    }
    if (event.orderedLabs && event.orderedLabs.length > 0) {
      for (const lab of event.orderedLabs) {
        orders.push({ orderType: 'Lab', description: lab });
      }
    }

    this.api.completeConsultation(encounterId, { notes: notesSummary, diagnosis, orders }).subscribe({
      next: () => { alert('Consultation completed successfully!'); this.endConsultation(); },
      error: (err) => { alert('Failed to complete consultation: ' + (err.error?.message || err.message)); }
    });
  }

  changeDay(offset: number) {
    const newDate = new Date(this.selectedDate);
    newDate.setDate(newDate.getDate() + offset);
    this.selectedDate = newDate;
    this.processAppointments();
  }

  searchRecords() { alert('Searching records... No matches found.'); }
  joinRoom() { alert('Joining telemedicine room... Waiting for patient.'); }
  saveSettings() { alert('Settings saved successfully!'); }
  changePassword() { alert('Password updated successfully!'); }

  getEmergencyCount(): number {
    return this.mockQueue ? this.mockQueue.filter(q => q.priority === 'Emergency').length : 0;
  }

  getUrgentCount(): number {
    return this.mockQueue ? this.mockQueue.filter(q => q.priority === 'Urgent').length : 0;
  }

  getNormalCount(): number {
    return this.mockQueue ? this.mockQueue.filter(q => q.priority === 'Normal').length : 0;
  }

  loadProfile() {
    this.api.getDoctorProfile().subscribe({
      next: (data) => {
        this.doctorSpecialization = data.specialization || 'General Medicine';
        this.doctorName = `Dr. ${data.firstName || ''} ${data.lastName || ''}`;
        const names = `${data.firstName || ''} ${data.lastName || ''}`.trim().split(' ');
        this.doctorInitials = names.map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'CP';
        localStorage.setItem('name', this.doctorName);
      },
      error: (err) => {
        console.error('Failed to load doctor profile details', err);
      }
    });
  }

  loadNotifications() {
    this.api.getNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
        this.unreadCount = this.notifications.filter(n => !n.isRead).length;
      },
      error: (err) => {
        console.error('Failed to load notifications', err);
      }
    });
  }

  markAsRead(n: any) {
    if (n.isRead) return;
    this.api.markNotificationRead(n.id).subscribe({
      next: () => {
        n.isRead = true;
        this.unreadCount = this.notifications.filter(item => !item.isRead).length;
      },
      error: (err) => {
        console.error('Failed to mark notification as read', err);
      }
    });
  }

  markAllAsRead() {
    const unreadNotifications = this.notifications.filter(n => !n.isRead);
    if (unreadNotifications.length === 0) return;

    this.api.markAllNotificationsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.isRead = true);
        this.unreadCount = 0;
      },
      error: (err) => console.error('Failed to mark all as read', err)
    });
  }

  getNotificationColor(type: string): string {
    switch (type?.toLowerCase()) {
      case 'booking': return 'var(--primary)';
      case 'cancellation': return 'var(--danger)';
      case 'reminder': return 'var(--accent)';
      default: return 'var(--secondary)';
    }
  }

  getNotificationIcon(type: string): string {
    switch (type?.toLowerCase()) {
      case 'booking': return '📅';
      case 'cancellation': return '❌';
      case 'reminder': return '⏰';
      default: return '🔔';
    }
  }

  openProfileModal() {
    this.api.getDoctorProfile().subscribe({
      next: (data) => {
        this.profileForm = {
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          specialization: data.specialization || '',
          licenseNumber: data.licenseNumber || '',
          experienceYears: data.experienceYears,
          consultationFee: data.consultationFee
        };
        this.showProfileModal = true;
      },
      error: (err) => {
        console.error('Failed to load profile details', err);
        alert('Failed to load profile details.');
      }
    });
  }

  closeProfileModal() {
    this.showProfileModal = false;
  }

  saveProfile() {
    this.api.updateDoctorProfile(this.profileForm).subscribe({
      next: () => {
        alert('Profile updated successfully!');
        this.closeProfileModal();
        this.loadProfile(); // reload details in UI
      },
      error: (err) => {
        console.error('Failed to update profile', err);
        alert('Failed to update profile.');
      }
    });
  }

  logout() {
    if (confirm('Are you sure you want to log out?')) {
      localStorage.removeItem('token');
      this.router.navigate(['/login']);
    }
  }

  loadPatientVitals(patientId: number) {
    this.vitalService.getPatientVitals(patientId).subscribe({
      next: (vitals) => {
        this.activePatientVitalsHistory = vitals;
        this.activePatientSubmittedVitals = vitals.filter(v => v.source === 'Patient Submitted' && v.status !== 'Verified');
        // Update the activePatientVitals with latest
        if (vitals.length > 0) {
          const latest = vitals[0];
          this.activePatientVitals = {
            bp: `${latest.bloodPressureSystolic || '--'}/${latest.bloodPressureDiastolic || '--'}`,
            pulse: latest.heartRate ? `${latest.heartRate} bpm` : '--',
            temp: latest.temperature ? `${latest.temperature} °C` : '--',
            weight: latest.weightKg ? `${latest.weightKg} kg` : '--'
          };
        }
      },
      error: (err) => console.error('Failed to load vitals', err)
    });
  }

  saveClinicalVitals(vitalForm: any) {
    if (!this.activeEncounterId) return;
    
    const dto = {
      ...vitalForm,
      encounterId: this.activeEncounterId,
      patientId: this.activePatient.patientDbId,
      isHomeReading: false
    };

    this.vitalService.createVital(dto).subscribe({
      next: (vital) => {
        this.activePatientVitalsHistory.unshift(vital);
        this.activePatientVitalsHistory = [...this.activePatientVitalsHistory]; // Trigger change detection
        
        this.activePatientVitals = {
          bp: `${vital.bloodPressureSystolic || '--'}/${vital.bloodPressureDiastolic || '--'}`,
          pulse: vital.heartRate ? `${vital.heartRate} bpm` : '--',
          temp: vital.temperature ? `${vital.temperature} °C` : '--',
          weight: vital.weightKg ? `${vital.weightKg} kg` : '--'
        };
        alert('Clinical vitals recorded successfully.');
      },
      error: (err) => alert('Failed to record vitals: ' + (err.error?.message || err.message))
    });
  }

  verifyPatientVital(vitalId: number) {
    this.vitalService.verifyVital(vitalId).subscribe({
      next: (vital) => {
        // Remove from unverified list
        this.activePatientSubmittedVitals = this.activePatientSubmittedVitals.filter(v => v.id !== vitalId);
        
        // Update history item
        const index = this.activePatientVitalsHistory.findIndex(v => v.id === vitalId);
        if (index !== -1) {
          this.activePatientVitalsHistory[index] = vital;
          this.activePatientVitalsHistory = [...this.activePatientVitalsHistory];
        }
        
        alert('Patient vital reading verified.');
      },
      error: (err) => alert('Failed to verify vital: ' + (err.error?.message || err.message))
    });
  }
}
