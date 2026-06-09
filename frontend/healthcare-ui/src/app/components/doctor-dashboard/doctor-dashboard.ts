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
      <aside class="sidebar" [class.collapsed]="isSidebarCollapsed">
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
          <!-- <div class="nav-item" [class.active]="activeNav === 'queue'" (click)="navigate('queue')">
            <span class="nav-icon">👥</span> Patient Queue
          </div>
          <div class="nav-item" [class.active]="activeNav === 'records'" (click)="navigate('records')">
            <span class="nav-icon">📁</span> Medical Records
          </div> -->
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
          <div class="top-bar-left flex items-center gap-3">
            <button class="btn-icon" (click)="toggleSidebar()" style="background:none; border:none; color:var(--text-main); font-size:1.5rem; cursor:pointer; padding:0; margin-right:10px;">☰</button>
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
              <!-- Today's Schedule -->
              <div class="glass-card">
                <div class="flex justify-between items-center mb-4">
                  <h3 class="m-0">Today's Schedule</h3>
                  <button class="btn btn-outline btn-xs" (click)="changeDayAndNavigate(0)">View All</button>
                </div>
                
                <div *ngIf="dashboardTodaySchedule.length === 0" class="text-muted text-sm py-4 text-center">
                  No appointments scheduled for today.
                </div>
                <div class="flex-col gap-3">
                  <div *ngFor="let apt of dashboardTodaySchedule.slice(0,5)" class="inner-card flex justify-between items-center p-3">
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

              <!-- Tomorrow's Schedule -->
              <div class="glass-card">
                <div class="flex justify-between items-center mb-4">
                  <h3 class="m-0">Tomorrow's Appointments</h3>
                  <button class="btn btn-outline btn-xs" (click)="changeDayAndNavigate(1)">View</button>
                </div>
                
                <div *ngIf="tomorrowSchedule.length === 0" class="text-muted text-sm py-4 text-center">
                  No appointments scheduled for tomorrow.
                </div>
                <div class="flex-col gap-3">
                  <div *ngFor="let apt of tomorrowSchedule.slice(0,5)" class="inner-card flex justify-between items-center p-3">
                    <div class="flex gap-4 items-center">
                      <div class="text-main font-bold" style="width: 60px;">{{ apt.time }}</div>
                      <div>
                        <div class="font-semibold">{{ apt.name }}</div>
                        <div class="text-xs text-muted">{{ apt.reason }}</div>
                      </div>
                    </div>
                    <div class="flex items-center gap-4">
                      <span class="badge" [ngClass]="getBadgeClass(apt.status)">{{ apt.status }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column: Queue & Pending -->
            <div class="flex-col gap-6">
              <!-- Waiting Patients -->
              <div class="glass-card">
                <div class="flex justify-between items-center mb-4">
                  <h3 class="m-0 text-accent">👥 Waiting Patients</h3>
                  <button class="btn btn-outline btn-xs" (click)="navigate('queue')">View Queue</button>
                </div>
                <div *ngIf="mockQueue.length === 0" class="text-muted text-sm py-2 text-center">
                  No patients waiting.
                </div>
                <div class="flex-col gap-2">
                  <div *ngFor="let q of mockQueue.slice(0, 3)" class="inner-card p-3">
                    <div class="flex justify-between items-start mb-2">
                      <div>
                        <strong class="text-sm text-main">{{ q.name }}</strong>
                        <div class="text-xs text-muted">Waiting {{ q.waitMins }} min • {{ q.priority }}</div>
                      </div>
                      <span class="badge" [ngClass]="{'badge-danger': q.priority === 'Emergency', 'badge-warning': q.priority === 'Urgent', 'badge-primary': q.priority === 'Normal'}">{{ q.token }}</span>
                    </div>
                    <div class="flex gap-2">
                      <button class="btn btn-primary btn-xs w-full" (click)="startConsultation(q.appointment)">Start Consult</button>
                    </div>
                  </div>
                </div>
              </div>

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
                  <div *ngIf="clinicalAlerts.length === 0" class="text-muted text-sm py-2 text-center">
                    No clinical alerts.
                  </div>
                  <div *ngFor="let alert of clinicalAlerts.slice(0, 3)" class="inner-card p-3"
                       [ngClass]="alert.type === 'danger' ? 'bg-red-900 bg-opacity-20 border-red-800' : 'bg-yellow-900 bg-opacity-20 border-yellow-800'">
                    <strong class="text-sm block mb-1" [ngClass]="alert.type === 'danger' ? 'text-danger' : 'text-accent'">{{ alert.title }}</strong>
                    <span class="text-xs text-muted">{{ alert.message }}</span>
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

          <div *ngIf="topAppointments.length > 0" class="glass-card mb-6" style="border: 1px solid var(--primary);">
            <h4 class="m-0 mb-4 text-primary flex items-center gap-2">
              <span class="text-xl">📅</span> Upcoming Appointments
            </h4>
            <div class="flex-col gap-3">
              <div *ngFor="let apt of topAppointments" class="apt-row inner-card flex justify-between items-center p-4 cursor-pointer hover-lift" [class.apt-pending]="apt.status === 'Pending'" [class.apt-confirmed]="apt.status === 'Confirmed'" [class.apt-completed]="apt.status === 'Completed'" [class.apt-cancelled]="apt.status === 'Cancelled' || apt.status === 'Rejected'" (click)="viewAppointmentDetails(apt)">
                <!-- Left: Patient Info -->
                <div class="flex gap-4 items-center" style="flex: 1;">
                  <div class="patient-avatar">{{ getInitials(apt.patientName) }}</div>
                  <div>
                    <div class="font-semibold text-main">{{ apt.patientName }}</div>
                    <div class="text-xs text-muted mt-1">📅 {{ apt.appointmentDate | date:'mediumDate' }} &nbsp; ⏰ {{ apt.startTime }} – {{ apt.endTime }} &nbsp; • {{ apt.type }}</div>
                  </div>
                </div>
                <!-- Middle: Status -->
                <div class="flex-shrink-0 px-4">
                  <span class="badge" [ngClass]="getDoctorBadgeClass(apt.status)">{{ apt.status }}</span>
                </div>
                <!-- Right: Actions -->
                <div class="flex gap-2 flex-shrink-0" style="flex-wrap: wrap;">
                  <button *ngIf="apt.status === 'Pending'" class="btn btn-xs" style="background: rgba(34,197,94,0.15); color: var(--secondary); border: 1px solid rgba(34,197,94,0.3);" (click)="$event.stopPropagation(); confirmAppointment(apt)">✓ Confirm</button>
                  <button *ngIf="apt.status === 'Confirmed'" class="btn btn-primary btn-xs" (click)="$event.stopPropagation(); startConsultationFromApt(apt)">Start Consult</button>
                </div>
              </div>
            </div>
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
              <div *ngFor="let apt of filteredDoctorAppointments" class="apt-row inner-card flex justify-between items-center p-4 cursor-pointer hover-lift" [class.apt-pending]="apt.status === 'Pending'" [class.apt-confirmed]="apt.status === 'Confirmed'" [class.apt-completed]="apt.status === 'Completed'" [class.apt-cancelled]="apt.status === 'Cancelled' || apt.status === 'Rejected'" (click)="viewAppointmentDetails(apt)">
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
                    (click)="$event.stopPropagation(); confirmAppointment(apt)">✓ Confirm</button>
                  <button *ngIf="apt.status === 'Pending'"
                    class="btn btn-xs" style="background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3);"
                    (click)="$event.stopPropagation(); rejectAppointment(apt)">✕ Reject</button>

                  <!-- Confirmed actions -->
                  <button *ngIf="apt.status === 'Confirmed'"
                    class="btn btn-primary btn-xs"
                    (click)="$event.stopPropagation(); startConsultationFromApt(apt)">Start Consult</button>
                  <button *ngIf="apt.status === 'Confirmed'"
                    class="btn btn-xs" style="background: rgba(34,197,94,0.15); color: var(--secondary); border: 1px solid rgba(34,197,94,0.3);"
                    (click)="$event.stopPropagation(); completeAppointment(apt)">✅ Complete</button>
                  <button *ngIf="apt.status === 'Confirmed'"
                    class="btn btn-xs" style="background: rgba(156,163,175,0.15); color: var(--text-muted); border: 1px solid rgba(156,163,175,0.3);"
                    (click)="$event.stopPropagation(); markNoShow(apt)">No Show</button>

                  <!-- Cancel for Pending/Confirmed -->
                  <button *ngIf="apt.status === 'Pending' || apt.status === 'Confirmed'"
                    class="btn btn-xs" style="background: rgba(239,68,68,0.08); color: #ef4444; border: 1px solid rgba(239,68,68,0.2);"
                    (click)="$event.stopPropagation(); cancelAppointmentDoctor(apt)">Cancel</button>
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
              <input type="text" class="form-control" placeholder="Search patient by name, ID, or phone..." [(ngModel)]="recordSearchTerm" (keyup.enter)="searchRecords()">
              <button class="btn btn-primary" (click)="searchRecords()">
                <span *ngIf="!isSearching">Search</span>
                <span *ngIf="isSearching">Searching...</span>
              </button>
            </div>
            
            <div *ngIf="!searchedPatient && searchResults.length === 0" class="inner-card p-8 text-center text-muted">
              <span class="text-4xl mb-4 block">🗂️</span>
              Enter a patient's details to view their complete medical history, lab reports, and imaging.
            </div>

            <!-- Search Results List -->
            <div *ngIf="searchResults.length > 0 && !searchedPatient" class="flex-col gap-3">
               <h4 class="m-0 mb-2">Search Results ({{ searchResults.length }})</h4>
               <div *ngFor="let p of searchResults" class="inner-card p-4 flex justify-between items-center cursor-pointer hover-lift" (click)="selectPatient(p)">
                 <div>
                   <strong class="text-main">{{ p.name }}</strong>
                   <span class="text-xs text-muted block">ID: #{{ p.id }} • {{ p.age }} yrs • {{ p.gender }}</span>
                 </div>
                 <button class="btn btn-outline btn-xs">View Records</button>
               </div>
            </div>

            <div *ngIf="searchedPatient">
              <div class="mb-4">
                <button class="btn btn-outline btn-xs" (click)="searchedPatient = null">← Back to Search Results</button>
              </div>
              <div class="flex justify-between items-center mb-4 p-4 inner-card">
                <div>
                  <h4 class="m-0 font-bold text-main">{{ searchedPatient.name }}</h4>
                  <span class="text-xs text-muted">ID: #{{ searchedPatient.id }} • {{ searchedPatient.age }} yrs • {{ searchedPatient.gender }}</span>
                </div>
              </div>
              
              <!-- Tabs -->
              <div class="flex gap-4 border-b border-gray-700 mb-6">
                <button class="pb-2 px-1 text-sm font-medium border-b-2" [class.border-primary]="activeRecordTab === 'history'" [class.text-primary]="activeRecordTab === 'history'" [class.border-transparent]="activeRecordTab !== 'history'" [class.text-muted]="activeRecordTab !== 'history'" style="background:none; color:inherit; cursor:pointer" (click)="activeRecordTab = 'history'">Medical History</button>
                <button class="pb-2 px-1 text-sm font-medium border-b-2" [class.border-primary]="activeRecordTab === 'labs'" [class.text-primary]="activeRecordTab === 'labs'" [class.border-transparent]="activeRecordTab !== 'labs'" [class.text-muted]="activeRecordTab !== 'labs'" style="background:none; color:inherit; cursor:pointer" (click)="activeRecordTab = 'labs'">Lab Reports</button>
                <button class="pb-2 px-1 text-sm font-medium border-b-2" [class.border-primary]="activeRecordTab === 'imaging'" [class.text-primary]="activeRecordTab === 'imaging'" [class.border-transparent]="activeRecordTab !== 'imaging'" [class.text-muted]="activeRecordTab !== 'imaging'" style="background:none; color:inherit; cursor:pointer" (click)="activeRecordTab = 'imaging'">Imaging</button>
              </div>

              <!-- Medical History Tab -->
              <div *ngIf="activeRecordTab === 'history'" class="flex-col gap-4">
                <div class="glass-card">
                  <h4 class="text-sm font-semibold mb-4 text-primary">Complete Medical History</h4>
                  <div *ngIf="searchedPatient.medicalHistory.length === 0" class="text-center py-4 text-muted text-sm">No medical history available.</div>
                  <div *ngFor="let item of searchedPatient.medicalHistory" class="inner-card p-4 mb-4">
                    <div class="flex justify-between items-start mb-2">
                      <div>
                        <h5 class="m-0 font-bold text-main">{{ item.condition }}</h5>
                        <span class="text-xs text-muted">{{ item.date | date:'mediumDate' }} • Diagnosed by {{ item.doctor }}</span>
                      </div>
                    </div>
                    <p class="text-sm m-0 mt-2 text-main">{{ item.notes }}</p>
                  </div>
                </div>
              </div>

              <!-- Lab Reports Tab -->
              <div *ngIf="activeRecordTab === 'labs'" class="flex-col gap-4">
                <div class="glass-card">
                  <h4 class="text-sm font-semibold mb-4 text-primary">Lab Reports</h4>
                  <div *ngIf="searchedPatient.labReports.length === 0" class="text-center py-4 text-muted text-sm">No lab reports available.</div>
                  <div *ngFor="let report of searchedPatient.labReports" class="inner-card p-4 mb-4 flex justify-between items-center">
                    <div>
                      <h5 class="m-0 font-bold text-main">{{ report.test }}</h5>
                      <span class="text-xs text-muted">{{ report.date | date:'mediumDate' }} • Status: {{ report.status }}</span>
                      <p class="text-sm m-0 mt-1" [ngClass]="{'text-warning': report.result !== 'Normal', 'text-success': report.result === 'Normal'}">Result: {{ report.result }}</p>
                    </div>
                    <button class="btn btn-outline btn-sm">📄 View PDF</button>
                  </div>
                </div>
              </div>

              <!-- Imaging Tab -->
              <div *ngIf="activeRecordTab === 'imaging'" class="flex-col gap-4">
                <div class="glass-card">
                  <h4 class="text-sm font-semibold mb-4 text-primary">Imaging</h4>
                  <div *ngIf="searchedPatient.imagingRecords.length === 0" class="text-center py-4 text-muted text-sm">No imaging records available.</div>
                  <div class="grid grid-cols-2 gap-4">
                    <div *ngFor="let image of searchedPatient.imagingRecords" class="inner-card p-4">
                      <div class="flex justify-between items-start mb-2">
                        <div>
                          <h5 class="m-0 font-bold text-main">{{ image.type }} - {{ image.region }}</h5>
                          <span class="text-xs text-muted">{{ image.date | date:'mediumDate' }}</span>
                        </div>
                      </div>
                      <p class="text-sm m-0 mt-2 mb-4 text-main">{{ image.result }}</p>
                      <div class="bg-gray-800 rounded p-4 text-center cursor-pointer hover:bg-gray-700 transition" style="height: 150px; display: flex; align-items: center; justify-content: center; border: 1px dashed rgba(255,255,255,0.2);">
                        <span class="text-4xl">🖼️</span>
                        <span class="ml-2 text-sm text-muted">View Image</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TELEMEDICINE VIEW -->
        <div class="dashboard-content" *ngIf="!inConsultation && activeNav === 'telemedicine'">
          <div class="glass-card">
            <div class="flex justify-between items-center mb-6">
              <h3 class="m-0">Telemedicine Sessions</h3>
            </div>
            <div class="grid grid-cols-2 gap-6">
               <div class="inner-card">
                 <div class="text-center p-6">
                    <div class="text-4xl mb-4">🎥</div>
                    <h4 class="mb-2">Virtual Waiting Room</h4>
                    <p class="text-sm text-muted mb-4">{{ waitingVideoPatients.length }} patients currently waiting online.</p>
                 </div>
                 <div *ngIf="waitingVideoPatients.length > 0" class="flex-col gap-2 mt-4">
                   <div *ngFor="let apt of waitingVideoPatients" class="flex justify-between items-center p-2 border-b border-gray-700">
                     <div>
                       <strong class="text-main">{{ apt.patientName }}</strong>
                       <span class="text-xs text-muted block">{{ apt.startTime }}</span>
                     </div>
                     <button class="btn btn-secondary btn-xs" (click)="startConsultationFromApt(apt)">Start Video Consultation</button>
                   </div>
                 </div>
               </div>
               <div class="inner-card">
                 <h4 class="mb-4">Upcoming Video Calls</h4>
                 <div *ngIf="videoAppointments.length === 0" class="text-sm text-muted p-4 text-center">No video consultations scheduled for today.</div>
                 <div *ngIf="videoAppointments.length > 0" class="flex-col gap-2">
                   <div *ngFor="let apt of videoAppointments" class="flex justify-between items-center p-2 border-b border-gray-700">
                     <div>
                       <strong class="text-main">{{ apt.patientName }}</strong>
                       <span class="badge" [ngClass]="getDoctorBadgeClass(apt.status)">{{ apt.status }}</span>
                       <span class="text-xs text-muted block">{{ apt.startTime }}</span>
                     </div>
                     <button *ngIf="apt.status === 'Pending' || apt.status === 'Confirmed'" class="btn btn-outline btn-xs" (click)="startConsultationFromApt(apt)">Start</button>
                   </div>
                 </div>
               </div>
            </div>
            
            <div class="mt-8">
              <h4 class="mb-4">Past Video Consultation Logs</h4>
              <div *ngIf="pastVideoAppointments.length === 0" class="text-sm text-muted p-4 text-center inner-card">
                No past video consultations found.
              </div>
              <div *ngIf="pastVideoAppointments.length > 0" class="flex-col gap-3">
                <div *ngFor="let apt of pastVideoAppointments" class="inner-card flex justify-between items-center p-4 cursor-pointer hover-lift" style="border-left: 4px solid var(--success);" (click)="viewAppointmentDetails(apt)">
                  <div class="flex gap-4 items-center">
                    <div class="patient-avatar">{{ getInitials(apt.patientName) }}</div>
                    <div>
                      <strong class="text-main text-lg">{{ apt.patientName }}</strong>
                      <span class="text-xs text-muted block mb-1">📅 {{ apt.appointmentDate | date:'mediumDate' }} at {{ apt.startTime }}</span>
                      <p class="text-sm text-muted m-0 mt-2">
                        <strong class="text-primary">Diagnosis/Notes:</strong> 
                        {{ apt.diagnosis || apt.notes || 'No clinical notes recorded.' }}
                      </p>
                    </div>
                  </div>
                  <span class="badge badge-success">Completed</span>
                </div>
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

              <!-- Schedule Settings -->
              <div class="flex-col gap-4" style="grid-column: span 2;">
                <h4 class="m-0 text-primary mb-2">Working Hours Schedule</h4>
                
                <div class="inner-card p-4 mb-4">
                  <h5 class="m-0 mb-3">Add Availability</h5>
                  <div class="grid grid-cols-4 gap-4 items-end">
                    <div class="form-group mb-0">
                      <label class="form-label">Day of Week</label>
                      <select class="form-control" [(ngModel)]="scheduleForm.dayOfWeek">
                        <option *ngFor="let day of daysOfWeek" [value]="day.value">{{ day.label }}</option>
                      </select>
                    </div>
                    <div class="form-group mb-0">
                      <label class="form-label">Start Time</label>
                      <input type="time" class="form-control" [(ngModel)]="scheduleForm.startTime">
                    </div>
                    <div class="form-group mb-0">
                      <label class="form-label">End Time</label>
                      <input type="time" class="form-control" [(ngModel)]="scheduleForm.endTime">
                    </div>
                    <div class="form-group mb-0">
                      <button class="btn btn-primary w-full" (click)="addAvailability()">Add Slot</button>
                    </div>
                  </div>
                </div>

                <div *ngIf="loadingSchedule" class="text-muted text-sm py-2">Loading schedule...</div>
                <div *ngIf="!loadingSchedule && availabilities.length === 0" class="text-muted text-sm py-2">No working hours configured.</div>
                
                <div *ngIf="!loadingSchedule && availabilities.length > 0" class="grid grid-cols-3 gap-4">
                  <div *ngFor="let avail of availabilities" class="inner-card p-3 flex justify-between items-center" style="border-left: 3px solid var(--primary)">
                    <div>
                      <strong class="text-main block">{{ getDayName(avail.dayOfWeek) }}</strong>
                      <span class="text-xs text-muted">{{ avail.startTime }} - {{ avail.endTime }}</span>
                    </div>
                    <button class="btn btn-xs" style="background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3);" (click)="deleteAvailability(avail.id)">✕</button>
                  </div>
                </div>

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
            [initialNotes]="activePatientNotes"
            (onCancel)="endConsultation()"
            (onSave)="saveConsultationDraft($event)"
            (onComplete)="completeConsultation($event)"
            (onSaveVitals)="saveClinicalVitals($event)"
            (verifyVital)="verifyPatientVital($event)">
          </app-consultation-workspace>
        </div>
      </main>
    <!-- Appointment Details Modal -->
    <div *ngIf="showDetailsModal && selectedAppointment" class="modal-overlay" (click)="closeDetailsModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">Appointment Details</h3>
            <p class="text-sm text-muted mt-1">ID: #{{ selectedAppointment.id }}</p>
          </div>
          <button class="modal-close-btn" (click)="closeDetailsModal()">&times;</button>
        </div>

        <div class="modal-section">
          <h4 class="modal-section-title">Patient Info</h4>
          <div class="modal-grid">
            <div class="modal-detail-item">
              <span class="modal-detail-label">Patient</span>
              <span class="modal-detail-value">{{ selectedAppointment.patientName }}</span>
            </div>
            <div class="modal-detail-item">
              <span class="modal-detail-label">Type</span>
              <span class="modal-detail-value">{{ selectedAppointment.type }}</span>
            </div>
            <div class="modal-detail-item">
              <span class="modal-detail-label">Date</span>
              <span class="modal-detail-value">{{ selectedAppointment.appointmentDate | date:'fullDate' }}</span>
            </div>
            <div class="modal-detail-item">
              <span class="modal-detail-label">Time</span>
              <span class="modal-detail-value">{{ selectedAppointment.startTime }} – {{ selectedAppointment.endTime }}</span>
            </div>
            <div class="modal-detail-item">
              <span class="modal-detail-label">Status</span>
              <span class="modal-detail-value">
                <span class="badge" [ngClass]="getDoctorBadgeClass(selectedAppointment.status)">{{ selectedAppointment.status }}</span>
              </span>
            </div>
          </div>
        </div>

        <div class="modal-section" *ngIf="selectedAppointment.reason">
          <h4 class="modal-section-title">Reason for Visit</h4>
          <div class="inner-card">
            <p class="text-sm">{{ selectedAppointment.reason }}</p>
          </div>
        </div>

        <div class="modal-section">
          <h4 class="modal-section-title secondary-title">Consultation Notes & Diagnosis</h4>
          <div class="inner-card">
            <p class="text-sm font-semibold mb-1 text-primary" *ngIf="selectedAppointment.diagnosis">Diagnosis: {{ selectedAppointment.diagnosis }}</p>
            <p class="text-sm" style="white-space: pre-wrap;">{{ selectedAppointment.notes || 'No notes available.' }}</p>
          </div>
        </div>

        <div class="modal-section">
          <h4 class="modal-section-title accent-title">Recorded Vitals</h4>
          <div *ngIf="!selectedAppointment.vitals || selectedAppointment.vitals.length === 0" class="text-muted text-sm">
            No vitals entered for this appointment.
          </div>
          <div *ngIf="selectedAppointment.vitals && selectedAppointment.vitals.length > 0" class="flex-col gap-2">
            <div *ngFor="let vital of selectedAppointment.vitals" class="inner-card p-3 text-sm">
              <div class="flex justify-between mb-2">
                <strong class="text-main">Recorded At:</strong>
                <span class="text-muted">{{ vital.recordedAt | date:'medium' }}</span>
              </div>
              <ul class="list-none pl-0 m-0 grid grid-cols-2 gap-2 text-muted">
                <li>Heart Rate: {{ vital.heartRate ? vital.heartRate + ' bpm' : 'Not added' }}</li>
                <li>Blood Pressure: {{ vital.bloodPressureSystolic ? vital.bloodPressureSystolic + '/' + vital.bloodPressureDiastolic + ' mmHg' : 'Not added' }}</li>
                <li>Temperature: {{ vital.temperature ? vital.temperature + ' °C' : 'Not added' }}</li>
                <li>Weight: {{ vital.weightKg ? vital.weightKg + ' kg' : 'Not added' }}</li>
                <li>SpO2: {{ vital.oxygenSaturation ? vital.oxygenSaturation + '%' : 'Not added' }}</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="flex justify-end mt-6">
          <button (click)="closeDetailsModal()" class="btn btn-outline">Close</button>
        </div>
      </div>
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
              <label class="form-label">Consultation Type</label>
              <select class="form-control" [(ngModel)]="profileForm.consultationType" name="consultationType">
                <option value="Both">Both (Video & Hospital)</option>
                <option value="Video">Video Consulting Only</option>
                <option value="Hospital">Hospital Visit Only</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
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
  isSidebarCollapsed = false;

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

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
  activePatientNotes: any = null;
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

  selectedAppointment: any = null;
  showDetailsModal = false;

  dashboardTodaySchedule: any[] = [];
  tomorrowSchedule: any[] = [];
  mockSchedule: any[] = [];
  mockQueue: any[] = [];
  clinicalAlerts: any[] = [];

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
    consultationType: 'Both',
    licenseNumber: '',
    experienceYears: null,
    consultationFee: null
  };

  availabilities: any[] = [];
  scheduleForm = {
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00',
    slotDurationMinutes: 30
  };
  loadingSchedule = false;
  daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  get pendingAppointments(): any[] {
    return this.appointments.filter(a => a.status === 'Pending');
  }

  get filteredDoctorAppointments(): any[] {
    const now = new Date();
    // Filter to only include future appointments
    let result = this.appointments.filter(a => new Date(a.appointmentDate).getTime() > now.getTime());
    
    // Sort ascending by date and time
    result.sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());

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

  get topAppointments(): any[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = this.appointments.filter(a => {
      const aptDate = new Date(a.appointmentDate);
      return aptDate.getTime() >= today.getTime() && aptDate.getTime() < tomorrow.getTime();
    }).sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());

    if (todayAppointments.length > 0) {
      return todayAppointments;
    }

    return this.appointments.filter(a => {
      const aptDate = new Date(a.appointmentDate);
      return aptDate.getTime() >= tomorrow.getTime();
    }).sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()).slice(0, 2);
  }

  get videoAppointments(): any[] {
    return this.appointments.filter(a => 
      a.type === 'Video Consultation' && 
      a.status !== 'Completed' && 
      a.status !== 'Cancelled' && 
      a.status !== 'Rejected'
    ).sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
  }

  get waitingVideoPatients(): any[] {
    return this.appointments.filter(a => 
      a.type === 'Video Consultation' && 
      (a.encounterStatus === 'CheckedIn' || a.encounterStatus === 'VitalsRecorded' || a.status === 'Waiting')
    ).sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
  }

  get pastVideoAppointments(): any[] {
    return this.appointments
      .filter(a => a.type === 'Video Consultation' && a.status === 'Completed')
      .sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
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
    this.loadAvailability();

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

    const mapAppointment = (a: any) => {
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
        diagnosis: a.diagnosis,
        appointmentDate: a.appointmentDate
      };
    };

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    this.dashboardTodaySchedule = this.appointments
      .filter(a => this.isSameDay(new Date(a.appointmentDate), today))
      .map(mapAppointment)
      .sort((a, b) => a.time.localeCompare(b.time));

    this.tomorrowSchedule = this.appointments
      .filter(a => this.isSameDay(new Date(a.appointmentDate), tomorrow))
      .map(mapAppointment)
      .sort((a, b) => a.time.localeCompare(b.time));

    this.mockSchedule = this.appointments
      .filter(a => this.isSameDay(new Date(a.appointmentDate), this.selectedDate))
      .map(mapAppointment)
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

    this.clinicalAlerts = [];
    todayApts.forEach(a => {
      if (a.vitals && a.vitals.length > 0) {
        const v = a.vitals[a.vitals.length - 1];
        if (v.bloodPressureSystolic >= 140 || v.bloodPressureDiastolic >= 90) {
          this.clinicalAlerts.push({
            type: 'danger',
            title: `Critical BP - ${a.patientName}`,
            message: `BP measured ${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}.`
          });
        }
        if (v.heartRate > 100) {
           this.clinicalAlerts.push({
            type: 'warning',
            title: `High Heart Rate - ${a.patientName}`,
            message: `Pulse measured ${v.heartRate} bpm.`
          });
        }
        if (v.temperature >= 100.4) {
           this.clinicalAlerts.push({
            type: 'warning',
            title: `High Temp - ${a.patientName}`,
            message: `Temperature measured ${v.temperature} °F.`
          });
        }
      }
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
          appointmentId: apt.id,
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
            type: a.type || 'General',
            diagnosis: a.diagnosis || a.notes || 'Routine checkup. Consultation completed.',
            vitals: a.vitals,
            notes: a.notes,
            reason: a.reason,
            appointmentId: a.id
          }));

        this.activePatientNotes = {
          notesString: apt.notes,
          diagnosis: apt.diagnosis
        };

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
    this.activePatientNotes = null;
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

    this.api.completeConsultation(encounterId, { notes: notesSummary, diagnosis, orders, allergies: event.allergies, conditions: event.conditions }).subscribe({
      next: () => { alert('Consultation completed successfully!'); this.endConsultation(); },
      error: (err) => { alert('Failed to complete consultation: ' + (err.error?.message || err.message)); }
    });
  }

  saveConsultationDraft(event: any) {
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

    this.api.saveConsultation(encounterId, { notes: notesSummary, diagnosis, orders, allergies: event.allergies, conditions: event.conditions }).subscribe({
      next: () => { alert('Consultation details saved successfully!'); },
      error: (err) => { alert('Failed to save consultation details: ' + (err.error?.message || err.message)); }
    });
  }

  changeDay(offset: number) {
    const newDate = new Date(this.selectedDate);
    newDate.setDate(newDate.getDate() + offset);
    this.selectedDate = newDate;
    this.processAppointments();
  }

  changeDayAndNavigate(offset: number) {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + offset);
    this.selectedDate = newDate;
    this.processAppointments();
    this.navigate('schedule');
  }

  viewAppointmentDetails(apt: any) {
    this.selectedAppointment = apt;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedAppointment = null;
  }

  recordSearchTerm = '';
  searchedPatient: any = null;
  activeRecordTab = 'history';
  searchResults: any[] = [];
  isSearching = false;

  searchRecords() {
    if (!this.recordSearchTerm) {
      alert('Please enter a patient name or ID to search.');
      return;
    }
    
    this.isSearching = true;
    this.searchedPatient = null;
    this.api.searchPatients(this.recordSearchTerm).subscribe({
      next: (results: any[]) => {
        this.isSearching = false;
        this.searchResults = results;
        if (results.length === 0) {
          alert('No records found for that search.');
        } else if (results.length === 1) {
          this.selectPatient(results[0]);
        }
      },
      error: (err: any) => {
        this.isSearching = false;
        alert('Failed to search patients.');
      }
    });
  }

  selectPatient(patient: any) {
    const matchingApts = this.appointments.filter(a => a.patientId === patient.id && a.status === 'Completed');
    
    const history = matchingApts.map(a => ({
      date: new Date(a.appointmentDate).toLocaleDateString(),
      condition: a.diagnosis || a.reason || 'General Consultation',
      doctor: 'Dr. ' + (a.doctorName || this.doctorName),
      notes: a.notes || 'Consultation completed.'
    }));

    this.searchedPatient = {
      id: patient.id,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      medicalHistory: history,
      labReports: [],
      imagingRecords: []
    };
  }
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
          consultationFee: data.consultationFee,
          consultationType: data.consultationType || 'Both'
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

  loadAvailability() {
    this.loadingSchedule = true;
    this.api.getAvailability().subscribe({
      next: (data) => {
        this.availabilities = data || [];
        this.loadingSchedule = false;
      },
      error: (err) => {
        console.error('Failed to load availability', err);
        this.loadingSchedule = false;
      }
    });
  }

  addAvailability() {
    if (!this.scheduleForm.startTime || !this.scheduleForm.endTime) {
      alert('Please select both start and end times');
      return;
    }
    
    // API expects TimeSpan (HH:mm:ss). Input type time returns HH:mm
    const payload = {
      dayOfWeek: parseInt(this.scheduleForm.dayOfWeek.toString()),
      startTime: this.scheduleForm.startTime.length === 5 ? this.scheduleForm.startTime + ':00' : this.scheduleForm.startTime,
      endTime: this.scheduleForm.endTime.length === 5 ? this.scheduleForm.endTime + ':00' : this.scheduleForm.endTime,
      slotDurationMinutes: this.scheduleForm.slotDurationMinutes
    };

    this.api.createAvailability(payload).subscribe({
      next: (data) => {
        this.loadAvailability();
        // Reset form times
        this.scheduleForm.startTime = '';
        this.scheduleForm.endTime = '';
      },
      error: (err) => {
        console.error('Failed to create availability', err);
        alert('Could not update schedule. Check the times and try again.');
      }
    });
  }

  deleteAvailability(id: number) {
    if(confirm('Are you sure you want to remove this availability slot?')) {
      this.api.deleteAvailability(id).subscribe({
        next: () => {
          this.loadAvailability();
        },
        error: (err) => {
          console.error('Failed to delete availability', err);
          alert('Failed to remove slot');
        }
      });
    }
  }
  
  getDayName(dayValue: number): string {
    const day = this.daysOfWeek.find(d => d.value === dayValue);
    return day ? day.label : 'Unknown';
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
