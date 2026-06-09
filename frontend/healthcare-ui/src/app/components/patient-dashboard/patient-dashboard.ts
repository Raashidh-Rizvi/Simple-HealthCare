import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { VitalService, VitalResponseDto } from '../../services/vital.service';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { VideoCallComponent } from '../video-call/video-call.component';

Chart.register(...registerables);

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, BaseChartDirective, VideoCallComponent],
  template: `
    <div class="dashboard-shell">
      <!-- Video Call Overlay -->
      <app-video-call *ngIf="isVideoCallActive" 
                      [callId]="activeVideoCallId" 
                      [isInitiator]="false" 
                      (callEnded)="isVideoCallActive = false">
      </app-video-call>
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo">
            <span class="text-primary">✚</span> HealthPro
          </div>
        </div>
        <nav class="sidebar-nav">
          <div class="nav-item" [class.active]="activeNav === 'dashboard'" (click)="activeNav = 'dashboard'">
            <span class="nav-icon">📊</span> Dashboard
          </div>
          <div class="nav-item" [class.active]="activeNav === 'appointments'" (click)="activeNav = 'appointments'">
            <span class="nav-icon">📅</span> Appointments
          </div>
          <div class="nav-item" [class.active]="activeNav === 'records'" (click)="activeNav = 'records'">
            <span class="nav-icon">📁</span> Health Records
          </div>
          <div class="nav-item" [class.active]="activeNav === 'settings'" (click)="activeNav = 'settings'">
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
            <h2 class="m-0 font-bold">{{ getNavTitle() }}</h2>
          </div>
          <div class="top-bar-right">
            <span class="current-time">{{ currentTime | date:'shortTime' }}</span>
            <div class="action-icon cursor-pointer" (click)="activeNav = 'notifications'">🔔<span class="icon-badge" *ngIf="unreadCount > 0">{{ unreadCount }}</span></div>
            <div class="user-profile-sm ml-4 pl-4 border-l border-gray-700 cursor-pointer" (click)="openProfileModal()">
              <div class="avatar">{{ patientInitials | uppercase }}</div>
              <div class="flex-col">
                <span class="text-sm font-bold">{{ patientName }}</span>
                <span class="text-xs text-muted">My Profile</span>
              </div>
            </div>
          </div>
        </header>

        <!-- DASHBOARD OVERVIEW -->
        <div class="dashboard-content" *ngIf="activeNav === 'dashboard'">
          <div class="flex justify-between items-center mb-6">
            <h3 class="font-bold m-0 text-main">Patient Overview</h3>
            <a routerLink="/patient/book" class="btn btn-primary" style="text-decoration: none;">Book Appointment</a>
          </div>
          <!-- KPI Row -->
          <div class="kpi-grid">
            <div class="glass-card kpi-card border-t-4 border-primary cursor-pointer" (click)="activeNav = 'appointments'">
              <span class="kpi-title">Upcoming Appointments</span>
              <span class="kpi-value">{{ upcomingCount }}</span>
              <span class="kpi-trend">Pending or Confirmed</span>
            </div>
            <div class="glass-card kpi-card border-t-4 border-secondary cursor-pointer" (click)="activeNav = 'appointments'">
              <span class="kpi-title">Completed Visits</span>
              <span class="kpi-value">{{ completedCount }}</span>
              <span class="kpi-trend">All time</span>
            </div>
            <div class="glass-card kpi-card border-t-4 border-accent">
              <span class="kpi-title">Total Appointments</span>
              <span class="kpi-value">{{ appointments.length }}</span>
              <span class="kpi-trend">All records</span>
            </div>
          </div>

          <!-- Recent Activity & Quick Actions -->
          <div class="content-grid">
            <div class="glass-card">
              <h3 class="m-0 mb-4 text-primary">Your Next Appointment</h3>
              <div *ngIf="upcomingAppointments.length === 0" class="text-muted text-sm p-4">
                You have no upcoming appointments.
              </div>
              <div *ngIf="upcomingAppointments.length > 0" class="inner-card cursor-pointer hover-lift" (click)="viewAppointmentDetails(upcomingAppointments[0])">
                <div class="flex justify-between items-start mb-2">
                  <strong class="text-main" style="font-size: 1.1rem;">Dr. {{ upcomingAppointments[0].doctorName }}</strong>
                  <span class="badge" [ngClass]="getStatusBadgeClass(upcomingAppointments[0].status)">{{ upcomingAppointments[0].status }}</span>
                </div>
                <p class="text-sm text-primary mb-3">{{ upcomingAppointments[0].specialization }} • {{ upcomingAppointments[0].type }}</p>
                <div class="flex justify-between text-sm text-muted">
                  <span>📅 {{ upcomingAppointments[0].appointmentDate | date:'fullDate' }}</span>
                  <span>⏰ {{ upcomingAppointments[0].startTime }} – {{ upcomingAppointments[0].endTime }}</span>
                </div>
              </div>
              <button class="btn btn-outline btn-sm mt-4 w-full" (click)="activeNav = 'appointments'">View All Appointments</button>
            </div>

            <div class="glass-card">
              <h3 class="m-0 mb-4 text-accent">Health Summary</h3>
              <div class="flex-col gap-3" *ngIf="vitalsHistory.length > 0">
                <div class="inner-card flex justify-between items-center p-3" *ngIf="vitalsHistory[0].bloodPressureSystolic">
                  <div class="flex items-center gap-3">
                    <span class="text-2xl">🩸</span>
                    <div>
                      <strong class="block text-main">Blood Pressure</strong>
                      <span class="text-xs text-muted">Last reading: {{ vitalsHistory[0].recordedAt | date:'shortDate' }}</span>
                    </div>
                  </div>
                  <strong class="text-lg">{{ vitalsHistory[0].bloodPressureSystolic }}/{{ vitalsHistory[0].bloodPressureDiastolic }}</strong>
                </div>
                <div class="inner-card flex justify-between items-center p-3" *ngIf="vitalsHistory[0].weightKg">
                  <div class="flex items-center gap-3">
                    <span class="text-2xl">⚖️</span>
                    <div>
                      <strong class="block text-main">Weight</strong>
                      <span class="text-xs text-muted">Last reading: {{ vitalsHistory[0].recordedAt | date:'shortDate' }}</span>
                    </div>
                  </div>
                  <strong class="text-lg">{{ vitalsHistory[0].weightKg }} kg</strong>
                </div>
              </div>
              <div *ngIf="vitalsHistory.length === 0" class="text-muted text-sm py-4">
                No health data available.
              </div>
              <button class="btn btn-outline btn-sm mt-4 w-full" (click)="activeNav = 'records'">View Health Records</button>
            </div>
          </div>
        </div>

        <!-- APPOINTMENTS LIST VIEW -->
        <div class="dashboard-content" *ngIf="activeNav === 'appointments'">
          <div class="flex justify-between items-center mb-6">
            <h3 class="font-bold m-0 text-main">My Appointments</h3>
            <div class="flex gap-3">
              <button class="btn btn-outline btn-sm" (click)="loadAppointments()">🔄 Refresh</button>
              <a routerLink="/patient/book" class="btn btn-primary" style="text-decoration: none;">+ Book New</a>
            </div>
          </div>

          <!-- Status Filter -->
          <div class="flex gap-2 mb-4" style="flex-wrap: wrap; justify-content: space-between; align-items: center;">
            <div class="flex gap-2" style="flex-wrap: wrap;">
              <button class="filter-btn" [class.active]="filterStatus === ''" (click)="filterStatus = ''">All ({{ appointments.length }})</button>
              <button class="filter-btn" [class.active]="filterStatus === 'Pending'" (click)="filterStatus = 'Pending'">Pending ({{ countByStatus('Pending') }})</button>
              <button class="filter-btn" [class.active]="filterStatus === 'Confirmed'" (click)="filterStatus = 'Confirmed'">Confirmed ({{ countByStatus('Confirmed') }})</button>
              <button class="filter-btn" [class.active]="filterStatus === 'Completed'" (click)="filterStatus = 'Completed'">Completed ({{ countByStatus('Completed') }})</button>
              <button class="filter-btn" [class.active]="filterStatus === 'Cancelled'" (click)="filterStatus = 'Cancelled'">Cancelled ({{ countByStatus('Cancelled') }})</button>
            </div>
            <div class="flex gap-2">
              <div class="form-control flex items-center gap-2" style="width: auto; padding: 0 0.5rem;">
                <span class="text-muted text-sm">Sort:</span>
                <select style="border: none; background: transparent; outline: none; cursor: pointer; color: inherit; padding-right: 0.5rem;" [(ngModel)]="sortBy">
                  <option value="dateDesc">Newest First</option>
                  <option value="dateAsc">Oldest First</option>
                  <option value="doctorAsc">Doctor (A-Z)</option>
                  <option value="doctorDesc">Doctor (Z-A)</option>
                </select>
              </div>
              <input type="text" class="form-control" style="max-width: 250px;" placeholder="Search appointments..." [(ngModel)]="searchTerm">
            </div>
          </div>

          <div class="glass-card">
            <div *ngIf="loading" class="text-muted py-8 text-center">
              <div class="spinner-lg mx-auto mb-3"></div>
              Loading appointments...
            </div>
            <div *ngIf="!loading && filteredAppointments.length === 0" class="text-muted py-8 text-center">
              <span style="font-size: 3rem;">📅</span>
              <h4 class="mt-4 mb-2 text-main">No Appointments Found</h4>
              <p class="max-w-sm mx-auto text-sm">{{ filterStatus ? 'No ' + filterStatus + ' appointments.' : 'You have no appointments booked yet.' }}</p>
              <a routerLink="/patient/book" class="btn btn-primary mt-4" style="text-decoration: none;">Book Your First Appointment</a>
            </div>
            
            <div *ngIf="!loading && filteredAppointments.length > 0" class="grid grid-cols-2 gap-4">
              <div *ngFor="let apt of filteredAppointments" class="apt-card inner-card flex-col gap-2" [class.apt-pending]="apt.status === 'Pending'" [class.apt-confirmed]="apt.status === 'Confirmed'" [class.apt-completed]="apt.status === 'Completed'" [class.apt-cancelled]="apt.status === 'Cancelled' || apt.status === 'Rejected'">
                <!-- Header -->
                <div class="flex justify-between items-start">
                  <strong class="text-main" style="font-size: 16px;">Dr. {{ apt.doctorName }}</strong>
                  <span class="badge" [ngClass]="getStatusBadgeClass(apt.status)">{{ apt.status }}</span>
                </div>
                <p class="text-sm text-primary mb-0">{{ apt.specialization }} • {{ apt.type }}</p>
                
                <div class="mt-2 text-sm text-muted">
                  <p class="mb-1"><strong class="text-main">📅 Date:</strong> {{ apt.appointmentDate | date:'mediumDate' }}</p>
                  <p class="mb-1"><strong class="text-main">⏰ Time:</strong> {{ apt.startTime }} – {{ apt.endTime }}</p>
                  <p class="mb-1" *ngIf="apt.reason"><strong class="text-main">Reason:</strong> {{ apt.reason }}</p>
                </div>

                <!-- Action Buttons -->
                <div class="flex gap-2 mt-3 flex-wrap" (click)="$event.stopPropagation()">
                  <button class="btn btn-outline btn-xs" (click)="viewAppointmentDetails(apt)">View Details</button>
                  <button 
                    *ngIf="apt.type === 'Video Consultation' && (apt.status === 'Confirmed' || apt.status === 'Pending') && !apt.encounterId"
                    class="btn btn-xs" style="background: rgba(34,197,94,0.15); color: var(--secondary); border: 1px solid rgba(34,197,94,0.3);"
                    (click)="checkInVideoConsultation(apt)">
                    🎥 Check In (Video)
                  </button>
                  <button 
                    *ngIf="apt.type === 'Video Consultation' && apt.encounterId && apt.status !== 'Completed'"
                    class="btn btn-xs" style="background: rgba(99,102,241,0.15); color: var(--primary); border: 1px solid rgba(99,102,241,0.3);"
                    (click)="joinVideoRoom(apt)">
                    🎥 Join Room
                  </button>
                  <button 
                    *ngIf="apt.status === 'Pending' || apt.status === 'Confirmed'"
                    class="btn btn-xs" style="background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3);"
                    (click)="cancelAppointment(apt)">
                    ✕ Cancel
                  </button>
                  <button 
                    *ngIf="apt.status === 'Pending'"
                    class="btn btn-xs" style="background: rgba(99,102,241,0.15); color: var(--primary); border: 1px solid rgba(99,102,241,0.3);"
                    (click)="openRescheduleModal(apt)">
                    📅 Reschedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RECORDS VIEW -->
        <div class="dashboard-content" *ngIf="activeNav === 'records'">
          <div class="flex justify-between items-center mb-6">
            <h3 class="font-bold m-0 text-main">Health Records & Vitals</h3>
          </div>

          <!-- Vitals Chart Card -->
          <div class="glass-card mb-6">
            <h4 class="text-sm font-semibold mb-4 text-primary">Your Vitals Trends</h4>
            <div *ngIf="vitalsHistory.length === 0" class="text-center py-8 text-muted">
               <span style="font-size: 2rem;">📈</span>
               <p class="mt-2 text-sm">No vitals recorded yet. Submit your first reading below.</p>
            </div>
            <div *ngIf="vitalsHistory.length > 0" style="height: 300px;">
              <canvas baseChart
                [data]="lineChartData"
                [options]="lineChartOptions"
                [type]="lineChartType">
              </canvas>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-6">
            <!-- Submit Vitals Form -->
            <div class="glass-card">
              <h4 class="text-sm font-semibold mb-4 text-accent">Submit Home Reading</h4>
              <form (ngSubmit)="submitHomeVitals()" class="flex-col gap-3">
                <div class="grid grid-cols-2 gap-3">
                  <div class="form-group mb-0">
                    <label class="form-label text-xs">Systolic BP</label>
                    <input type="number" class="form-control" [(ngModel)]="homeVitalForm.bloodPressureSystolic" name="sys" placeholder="120">
                  </div>
                  <div class="form-group mb-0">
                    <label class="form-label text-xs">Diastolic BP</label>
                    <input type="number" class="form-control" [(ngModel)]="homeVitalForm.bloodPressureDiastolic" name="dia" placeholder="80">
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div class="form-group mb-0">
                    <label class="form-label text-xs">Heart Rate (bpm)</label>
                    <input type="number" class="form-control" [(ngModel)]="homeVitalForm.heartRate" name="hr" placeholder="72">
                  </div>
                  <div class="form-group mb-0">
                    <label class="form-label text-xs">Temperature (°C)</label>
                    <input type="number" class="form-control" [(ngModel)]="homeVitalForm.temperature" name="temp" placeholder="37">
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div class="form-group mb-0">
                    <label class="form-label text-xs">Weight (kg)</label>
                    <input type="number" class="form-control" [(ngModel)]="homeVitalForm.weightKg" name="weight" placeholder="70.5">
                  </div>
                  <div class="form-group mb-0">
                    <label class="form-label text-xs">SpO2 (%)</label>
                    <input type="number" class="form-control" [(ngModel)]="homeVitalForm.oxygenSaturation" name="spo2" placeholder="98">
                  </div>
                </div>
                <button type="submit" class="btn btn-primary mt-3" [disabled]="submittingVitals">
                   {{ submittingVitals ? 'Submitting...' : 'Submit Reading' }}
                </button>
              </form>
            </div>

            <!-- Vitals History List -->
            <div class="glass-card flex-col" style="max-height: 400px; overflow-y: auto;">
              <h4 class="text-sm font-semibold mb-4 text-primary">Recent Readings</h4>
              <div *ngIf="vitalsHistory.length === 0" class="text-center text-muted text-xs py-4">
                No history available.
              </div>
              <div *ngFor="let vital of vitalsHistory" class="inner-card mb-3 p-3" [style.border-left]="getRiskBorder(vital)">
                <div class="flex justify-between text-xs text-muted mb-2">
                  <span>{{ vital.recordedAt | date:'medium' }}</span>
                  <div class="flex gap-2 items-center">
                    <span class="badge" [ngClass]="getRiskBadgeClass(vital)" *ngIf="getRiskLevel(vital) !== 'Normal'">
                      {{ getRiskLevel(vital) }}
                    </span>
                    <span class="badge" [ngClass]="vital.source === 'Clinical' ? 'badge-primary' : 'badge-warning'">
                      {{ vital.source }}
                    </span>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                  <div *ngIf="vital.bloodPressureSystolic">BP: {{ vital.bloodPressureSystolic }}/{{ vital.bloodPressureDiastolic }}</div>
                  <div *ngIf="vital.heartRate">HR: {{ vital.heartRate }} bpm</div>
                  <div *ngIf="vital.temperature">Temp: {{ vital.temperature }} °C</div>
                  <div *ngIf="vital.weightKg">Weight: {{ vital.weightKg }} kg</div>
                  <div *ngIf="vital.oxygenSaturation">SpO2: {{ vital.oxygenSaturation }}%</div>
                </div>
                <div *ngIf="vital.status === 'Verified'" class="text-xs text-success mt-2">✓ Verified by Doctor</div>
              </div>
            </div>
          </div>
        </div>

        <!-- SETTINGS VIEW -->
        <div class="dashboard-content" *ngIf="activeNav === 'settings'">
          <div class="glass-card">
            <h3 class="m-0 mb-6">Profile & Settings</h3>
            <div class="grid grid-cols-2 gap-8">
              <div class="flex-col gap-4">
                <h4 class="m-0 text-primary mb-2">Personal Information</h4>
                <div class="form-group">
                  <label class="form-label">Full Name</label>
                  <input type="text" class="form-control" value="Patient User" disabled>
                </div>
                <div class="form-group">
                  <label class="form-label">Email Preferences</label>
                  <select class="form-control">
                    <option>All Notifications</option>
                    <option>Important Only</option>
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
                <button class="btn btn-secondary mt-2" (click)="changePassword()">Update Password</button>
              </div>
            </div>
          </div>
        </div>

        <!-- NOTIFICATIONS VIEW -->
        <div class="dashboard-content" *ngIf="activeNav === 'notifications'">
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

      </main>
    </div>

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
          <h4 class="modal-section-title">Doctor Info</h4>
          <div class="modal-grid">
            <div class="modal-detail-item">
              <span class="modal-detail-label">Doctor</span>
              <span class="modal-detail-value">Dr. {{ selectedAppointment.doctorName }}</span>
            </div>
            <div class="modal-detail-item">
              <span class="modal-detail-label">Specialization</span>
              <span class="modal-detail-value">{{ selectedAppointment.specialization }}</span>
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
                <span class="badge" [ngClass]="getStatusBadgeClass(selectedAppointment.status)">{{ selectedAppointment.status }}</span>
              </span>
            </div>
            <div class="modal-detail-item" *ngIf="selectedAppointment.consultationFee">
              <span class="modal-detail-label">Consultation Fee</span>
              <span class="modal-detail-value">₹{{ selectedAppointment.consultationFee }}</span>
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
          <h4 class="modal-section-title secondary-title">Consultation Notes</h4>
          <div class="inner-card">
            <p class="text-sm" style="white-space: pre-wrap;">{{ selectedAppointment.notes || 'No notes from the doctor yet.' }}</p>
          </div>
        </div>

        <div class="modal-section">
          <h4 class="modal-section-title accent-title">My Vitals History</h4>
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
                <li *ngIf="vital.heartRate">Heart Rate: {{ vital.heartRate }} bpm</li>
                <li *ngIf="vital.bloodPressureSystolic">Blood Pressure: {{ vital.bloodPressureSystolic }}/{{ vital.bloodPressureDiastolic }} mmHg</li>
                <li *ngIf="vital.temperature">Temperature: {{ vital.temperature }} °F</li>
                <li *ngIf="vital.weight">Weight: {{ vital.weight }} lbs</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="flex justify-between mt-6 flex-wrap gap-3">
          <div class="flex gap-2">
            <button 
              *ngIf="selectedAppointment.type === 'Video Consultation' && (selectedAppointment.status === 'Confirmed' || selectedAppointment.status === 'Pending') && !selectedAppointment.encounterId"
              class="btn btn-sm" style="background: rgba(34,197,94,0.15); color: var(--secondary); border: 1px solid rgba(34,197,94,0.3);"
              (click)="checkInVideoConsultation(selectedAppointment); closeDetailsModal()">
              🎥 Check In
            </button>
            <button 
              *ngIf="selectedAppointment.type === 'Video Consultation' && selectedAppointment.encounterId && selectedAppointment.status !== 'Completed'"
              class="btn btn-sm" style="background: rgba(99,102,241,0.15); color: var(--primary); border: 1px solid rgba(99,102,241,0.3);"
              (click)="joinVideoRoom(selectedAppointment); closeDetailsModal()">
              🎥 Join Room
            </button>
            <button 
              *ngIf="selectedAppointment.status === 'Pending' || selectedAppointment.status === 'Confirmed'"
              class="btn btn-sm" style="background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3);"
              (click)="closeDetailsModal(); cancelAppointment(selectedAppointment)">
              ✕ Cancel Appointment
            </button>
            <button 
              *ngIf="selectedAppointment.status === 'Pending'"
              class="btn btn-sm" style="background: rgba(99,102,241,0.15); color: var(--primary); border: 1px solid rgba(99,102,241,0.3);"
              (click)="closeDetailsModal(); openRescheduleModal(selectedAppointment)">
              📅 Reschedule
            </button>
          </div>
          <button (click)="closeDetailsModal()" class="btn btn-outline">Close</button>
        </div>
      </div>
    </div>

    <!-- Reschedule Modal -->
    <div *ngIf="showRescheduleModal" class="modal-overlay" (click)="closeRescheduleModal()">
      <div class="modal-content" (click)="$event.stopPropagation()" style="max-width: 560px;">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">Reschedule Appointment</h3>
            <p class="text-sm text-muted mt-1">ID: #{{ rescheduleAppointment?.id }} — Dr. {{ rescheduleAppointment?.doctorName }}</p>
          </div>
          <button class="modal-close-btn" (click)="closeRescheduleModal()">&times;</button>
        </div>

        <div class="form-group mt-2">
          <label class="form-label">New Date</label>
          <input type="date" class="form-control" [(ngModel)]="rescheduleDate" [min]="minDate" (change)="loadRescheduleSlots()">
        </div>

        <div *ngIf="loadingRescheduleSlots" class="text-muted text-sm py-2">
          <div class="spinner-sm d-inline-block mr-2"></div> Loading slots...
        </div>

        <div *ngIf="!loadingRescheduleSlots && rescheduleSlots.length > 0" class="mt-3">
          <label class="form-label">Select Time Slot</label>
          <div class="slots-grid-sm">
            <button
              *ngFor="let slot of rescheduleSlots"
              class="slot-btn-sm"
              [class.selected]="rescheduleSelectedSlot?.startTime === slot.startTime"
              [class.booked]="slot.isBooked"
              [disabled]="slot.isBooked"
              (click)="!slot.isBooked && selectRescheduleSlot(slot)">
              {{ slot.startTime }}
              <span *ngIf="slot.isBooked" class="booked-label">Booked</span>
            </button>
          </div>
        </div>

        <div *ngIf="!loadingRescheduleSlots && rescheduleDate && rescheduleSlots.length === 0" class="text-muted text-sm py-2">
          No slots available on this date.
        </div>

        <div class="form-group mt-3">
          <label class="form-label">Reason (optional)</label>
          <input type="text" class="form-control" [(ngModel)]="rescheduleReason" placeholder="Reason for rescheduling...">
        </div>

        <div *ngIf="rescheduleError" class="alert-error mt-2">⚠️ {{ rescheduleError }}</div>

        <div class="flex justify-end gap-3 mt-6">
          <button class="btn btn-outline" (click)="closeRescheduleModal()">Cancel</button>
          <button class="btn btn-primary" (click)="confirmReschedule()" [disabled]="!rescheduleSelectedSlot || rescheduling">
            {{ rescheduling ? 'Rescheduling...' : '📅 Confirm Reschedule' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Profile Edit Modal -->
    <div *ngIf="showProfileModal" class="modal-overlay" (click)="closeProfileModal()">
      <div class="modal-content" (click)="$event.stopPropagation()" style="max-width: 600px;">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">Edit Profile</h3>
            <p class="text-sm text-muted mt-1">Update your personal details below.</p>
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
              <label class="form-label">Date of Birth</label>
              <input type="date" class="form-control" [(ngModel)]="profileForm.dateOfBirth" name="dateOfBirth">
            </div>
            <div class="form-group">
              <label class="form-label">Gender</label>
              <select class="form-control" [(ngModel)]="profileForm.gender" name="gender">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Blood Group</label>
            <select class="form-control" [(ngModel)]="profileForm.bloodGroup" name="bloodGroup">
              <option value="">Select Blood Group</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
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
    .apt-card {
      border-left: 3px solid transparent;
      transition: all 0.2s;
    }
    .apt-card:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
    .apt-pending { border-left-color: var(--accent, #f59e0b); }
    .apt-confirmed { border-left-color: var(--primary, #6366f1); }
    .apt-completed { border-left-color: var(--secondary, #22c55e); }
    .apt-cancelled { border-left-color: var(--danger, #ef4444); opacity: 0.7; }
    .spinner-lg {
      width: 40px; height: 40px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: var(--primary, #6366f1);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .spinner-sm {
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.1);
      border-top-color: var(--primary, #6366f1);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .slots-grid-sm {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .slot-btn-sm {
      padding: 0.5rem;
      border: 2px solid rgba(255,255,255,0.12);
      border-radius: 8px;
      background: rgba(255,255,255,0.04);
      color: inherit;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
      position: relative;
    }
    .slot-btn-sm:hover:not(:disabled) { border-color: var(--primary); background: rgba(99,102,241,0.1); }
    .slot-btn-sm.selected { border-color: var(--primary); background: var(--primary); color: white; }
    .slot-btn-sm.booked { opacity: 0.4; cursor: not-allowed; background: rgba(239,68,68,0.05); border-color: rgba(239,68,68,0.2); color: var(--text-muted); }
    .booked-label { display: block; font-size: 0.65rem; color: var(--danger, #ef4444); margin-top: 2px; }
    .alert-error {
      background: rgba(239,68,68,0.15);
      border: 1px solid rgba(239,68,68,0.3);
      color: var(--danger, #ef4444);
      padding: 0.75rem 1rem;
      border-radius: 8px;
    }
  `],
  styleUrl: './patient-dashboard.css'
})
export class PatientDashboardComponent implements OnInit, OnDestroy {
  patientName = 'Patient';
  patientInitials = 'PT';
  appointments: any[] = [];
  upcomingCount = 0;
  completedCount = 0;
  activeNav: string = 'dashboard';
  currentTime = new Date();
  private timer: any;
  loading = false;
  filterStatus = '';
  searchTerm = '';
  sortBy = 'dateDesc';
  minDate = (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();

  isVideoCallActive: boolean = false;
  activeVideoCallId: string = '';

  // Computed
  get upcomingAppointments(): any[] {
    return this.appointments.filter(a => a.status === 'Pending' || a.status === 'Confirmed');
  }
  get filteredAppointments(): any[] {
    let result = this.appointments;
    if (this.filterStatus) {
      result = result.filter(a => a.status === this.filterStatus);
    }
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(a => 
        (a.doctorName?.toLowerCase().includes(term)) ||
        (a.specialization?.toLowerCase().includes(term)) ||
        (a.reason?.toLowerCase().includes(term))
      );
    }
    
    // Sorting
    result = [...result]; // Clone to avoid mutating original
    result.sort((a, b) => {
      if (this.sortBy === 'dateDesc') {
        return new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime();
      } else if (this.sortBy === 'dateAsc') {
        return new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime();
      } else if (this.sortBy === 'doctorAsc') {
        return (a.doctorName || '').localeCompare(b.doctorName || '');
      } else if (this.sortBy === 'doctorDesc') {
        return (b.doctorName || '').localeCompare(a.doctorName || '');
      }
      return 0;
    });

    return result;
  }

  // Details Modal State
  selectedAppointment: any = null;
  showDetailsModal = false;

  // Reschedule Modal State
  showRescheduleModal = false;
  rescheduleAppointment: any = null;
  rescheduleDate = '';
  rescheduleSlots: any[] = [];
  rescheduleSelectedSlot: any = null;
  rescheduleReason = '';
  loadingRescheduleSlots = false;
  rescheduling = false;
  rescheduleError: string | null = null;

  // Notifications State
  notifications: any[] = [];
  unreadCount = 0;
  private refreshInterval: any;

  // Profile Modal State
  showProfileModal = false;
  profileForm: any = {
    firstName: '', lastName: '', email: '', phone: '',
    dateOfBirth: '', phoneNumber: '', gender: '', bloodGroup: ''
  };

  // Vitals State
  vitalsHistory: VitalResponseDto[] = [];
  homeVitalForm: any = {};
  submittingVitals = false;

  // Chart Configuration
  lineChartData: ChartConfiguration['data'] = { datasets: [], labels: [] };
  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    scales: { y: { position: 'left' }, y1: { position: 'right', grid: { drawOnChartArea: false } } }
  };
  lineChartType: ChartType = 'line';

  constructor(private api: ApiService, private vitalService: VitalService, private router: Router) {}

  ngOnInit() {
    this.loadAppointments();
    this.loadNotifications();
    this.loadVitals();
    this.timer = setInterval(() => { this.currentTime = new Date(); }, 1000);
    this.refreshInterval = setInterval(() => { this.loadNotifications(); }, 30000);
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  getNavTitle(): string {
    const titles: any = {
      'dashboard': 'Dashboard', 'appointments': 'Appointments',
      'records': 'Health Records', 'settings': 'Settings', 'notifications': 'Notifications'
    };
    return titles[this.activeNav] || 'Dashboard';
  }

  loadAppointments() {
    this.loading = true;
    this.api.getMyAppointments().subscribe({
      next: (data) => {
        this.appointments = data || [];
        this.upcomingCount = this.appointments.filter(a => a.status === 'Pending' || a.status === 'Confirmed').length;
        this.completedCount = this.appointments.filter(a => a.status === 'Completed').length;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load appointments', err);
        this.loading = false;
      }
    });
  }

  countByStatus(status: string): number {
    return this.appointments.filter(a => a.status === status).length;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Confirmed': return 'badge-primary';
      case 'Pending': return 'badge-warning';
      case 'Completed': return 'badge-success';
      case 'Cancelled': return 'badge-danger';
      case 'Rejected': return 'badge-danger';
      case 'NoShow': return 'badge-muted';
      default: return 'badge-muted';
    }
  }

  cancelAppointment(apt: any) {
    if (!confirm(`Cancel appointment with Dr. ${apt.doctorName} on ${new Date(apt.appointmentDate).toLocaleDateString()}?`)) return;
    this.api.cancelAppointment(apt.id).subscribe({
      next: () => {
        apt.status = 'Cancelled';
        this.upcomingCount = this.appointments.filter(a => a.status === 'Pending' || a.status === 'Confirmed').length;
        alert('Appointment cancelled successfully.');
      },
      error: (err) => {
        alert('Failed to cancel: ' + (err.error?.message || err.message));
      }
    });
  }

  checkInVideoConsultation(apt: any) {
    if (!confirm('Are you ready to check in for your video consultation?')) return;
    this.api.checkInEncounter(apt.id).subscribe({
      next: (res: any) => {
        apt.encounterId = res.encounterId;
        apt.encounterStatus = 'CheckedIn';
        alert('Successfully checked in! You can now join the video room.');
        this.loadAppointments(); // Reload to refresh state
      },
      error: (err: any) => alert('Failed to check in: ' + (err.error?.message || err.message))
    });
  }

  joinVideoRoom(apt: any) {
    this.activeVideoCallId = 'appointment-' + apt.id;
    this.isVideoCallActive = true;
  }

  openRescheduleModal(apt: any) {
    this.rescheduleAppointment = apt;
    this.rescheduleDate = '';
    this.rescheduleSlots = [];
    this.rescheduleSelectedSlot = null;
    this.rescheduleReason = apt.reason || '';
    this.rescheduleError = null;
    this.showRescheduleModal = true;
  }

  closeRescheduleModal() {
    this.showRescheduleModal = false;
    this.rescheduleAppointment = null;
  }

  loadRescheduleSlots() {
    if (!this.rescheduleAppointment || !this.rescheduleDate) return;
    const doctorId = this.rescheduleAppointment.doctorId || this.rescheduleAppointment.doctor?.id;
    // Get doctor id from the appointment — need to look it up
    this.loadingRescheduleSlots = true;
    this.rescheduleSlots = [];
    this.rescheduleSelectedSlot = null;

    // We need doctorId. Let's fetch all appointments to find it or try to get from the appointment data
    // The patient's appointment has doctorName but we need doctorId for the slots API
    // We'll use a workaround - look for doctorId in the raw appointment
    this.api.getAvailableSlots(this.rescheduleAppointment.doctorId || 0, this.rescheduleDate).subscribe({
      next: (res) => {
        this.rescheduleSlots = res.slots || [];
        this.loadingRescheduleSlots = false;
      },
      error: () => {
        this.loadingRescheduleSlots = false;
      }
    });
  }

  selectRescheduleSlot(slot: any) {
    this.rescheduleSelectedSlot = slot;
  }

  confirmReschedule() {
    if (!this.rescheduleSelectedSlot || !this.rescheduleDate) return;
    this.rescheduling = true;
    this.rescheduleError = null;

    const payload = {
      appointmentDate: this.rescheduleDate,
      startTime: this.rescheduleSelectedSlot.startTimeSpan,
      endTime: this.rescheduleSelectedSlot.endTimeSpan,
      reason: this.rescheduleReason
    };

    this.api.rescheduleAppointment(this.rescheduleAppointment.id, payload).subscribe({
      next: () => {
        this.rescheduling = false;
        this.closeRescheduleModal();
        alert('Appointment rescheduled successfully!');
        this.loadAppointments();
      },
      error: (err) => {
        this.rescheduling = false;
        this.rescheduleError = err.error?.message || 'Reschedule failed. Please try again.';
      }
    });
  }

  loadNotifications() {
    this.api.getNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
        this.unreadCount = this.notifications.filter(n => !n.isRead).length;
      },
      error: (err) => console.error('Failed to load notifications', err)
    });
  }

  markAsRead(n: any) {
    if (n.isRead) return;
    this.api.markNotificationRead(n.id).subscribe({
      next: () => {
        n.isRead = true;
        this.unreadCount = this.notifications.filter(item => !item.isRead).length;
      },
      error: (err) => console.error('Failed to mark as read', err)
    });
  }

  markAllAsRead() {
    const unread = this.notifications.filter(n => !n.isRead);
    if (!unread.length) return;
    
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
    this.api.getPatientProfile().subscribe({
      next: (data) => {
        this.profileForm = {
          firstName: data.firstName || '', lastName: data.lastName || '',
          email: data.email || '', phone: data.phone || '',
          dateOfBirth: data.dateOfBirth || '', phoneNumber: data.phoneNumber || '',
          gender: data.gender || '', bloodGroup: data.bloodGroup || ''
        };
        this.showProfileModal = true;
      },
      error: (err) => {
        console.error('Failed to load profile', err);
        alert('Failed to load profile details.');
      }
    });
  }

  closeProfileModal() { this.showProfileModal = false; }

  saveProfile() {
    this.api.updatePatientProfile(this.profileForm).subscribe({
      next: () => { alert('Profile updated successfully!'); this.closeProfileModal(); },
      error: (err) => { console.error(err); alert('Failed to update profile.'); }
    });
  }

  viewAppointmentDetails(apt: any) {
    this.selectedAppointment = apt;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedAppointment = null;
  }

  saveSettings() { alert('Settings saved successfully!'); }
  changePassword() { alert('Password updated successfully!'); }

  logout() {
    if (confirm('Are you sure you want to log out?')) {
      localStorage.removeItem('token');
      this.router.navigate(['/login']);
    }
  }

  // Vitals Methods
  patientId: number | null = null;

  loadVitals() {
    if (!this.patientId) {
      this.api.getPatientProfile().subscribe({
        next: (profile) => {
          this.patientId = profile.id;
          this.patientName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Patient';
          this.patientInitials = ((profile.firstName ? profile.firstName.charAt(0) : '') + (profile.lastName ? profile.lastName.charAt(0) : '')) || 'PT';
          this.fetchVitalsHistory();
        },
        error: (err) => console.error('Failed to load profile for vitals', err)
      });
    } else {
      this.fetchVitalsHistory();
    }
  }

  getRiskLevel(vital: any): string {
    if (!vital) return 'Normal';
    if (vital.bloodPressureSystolic >= 180 || vital.bloodPressureDiastolic >= 120) return 'Critical';
    if (vital.bloodPressureSystolic >= 140 || vital.bloodPressureDiastolic >= 90) return 'High';
    if (vital.bloodPressureSystolic < 90 || vital.bloodPressureDiastolic < 60) return 'Low';
    if (vital.heartRate > 120 || vital.heartRate < 50) return 'Critical';
    if (vital.heartRate > 100 || vital.heartRate < 60) return 'Abnormal';
    if (vital.temperature > 39.5 || vital.temperature < 35) return 'Critical';
    if (vital.temperature > 37.5) return 'High';
    if (vital.oxygenSaturation && vital.oxygenSaturation < 90) return 'Critical';
    if (vital.oxygenSaturation && vital.oxygenSaturation < 95) return 'Low';
    return 'Normal';
  }

  getRiskBadgeClass(vital: any): string {
    const level = this.getRiskLevel(vital);
    if (level === 'Critical') return 'badge-danger';
    if (level === 'High' || level === 'Low' || level === 'Abnormal') return 'badge-warning';
    return 'badge-success';
  }

  getRiskBorder(vital: any): string {
    const level = this.getRiskLevel(vital);
    if (level === 'Critical') return '4px solid var(--danger, #ef4444)';
    if (level === 'High' || level === 'Low' || level === 'Abnormal') return '4px solid var(--accent, #f59e0b)';
    return 'none';
  }

  fetchVitalsHistory() {
    if (!this.patientId) return;
    this.vitalService.getPatientVitals(this.patientId).subscribe({
      next: (data) => {
        this.vitalsHistory = data;
        this.updateChart();
      },
      error: (err) => console.error('Failed to load vitals', err)
    });
  }

  updateChart() {
    if (this.vitalsHistory.length === 0) return;
    
    // Sort oldest to newest for chart
    const data = [...this.vitalsHistory].reverse();
    
    this.lineChartData = {
      labels: data.map(v => new Date(v.recordedAt).toLocaleDateString()),
      datasets: [
        {
          data: data.map(v => v.bloodPressureSystolic || null),
          label: 'Sys BP',
          borderColor: '#ef4444',
          tension: 0.3,
          yAxisID: 'y'
        },
        {
          data: data.map(v => v.temperature || null),
          label: 'Temp (°C)',
          borderColor: '#f59e0b',
          tension: 0.3,
          yAxisID: 'y1'
        }
      ]
    };
  }

  submitHomeVitals() {
    if (!this.patientId) {
      alert('Patient ID not loaded yet. Please try again.');
      return;
    }
    
    this.submittingVitals = true;
    const dto = { 
      ...this.homeVitalForm, 
      patientId: this.patientId,
      encounterId: 0, // Not tied to specific clinical encounter
      isHomeReading: true 
    };

    this.vitalService.createVital(dto).subscribe({
      next: (vital) => {
        this.vitalsHistory.unshift(vital);
        this.updateChart();
        this.homeVitalForm = {}; // reset
        this.submittingVitals = false;
        alert('Home vitals submitted successfully. Pending doctor verification.');
      },
      error: (err) => {
        this.submittingVitals = false;
        alert('Failed to submit vitals: ' + (err.error?.message || err.message));
      }
    });
  }
}
