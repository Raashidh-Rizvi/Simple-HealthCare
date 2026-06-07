import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  template: `
    <div class="dashboard-shell">
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
              <div class="avatar">PT</div>
              <div class="flex-col">
                <span class="text-sm font-bold">Patient</span>
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
              <span class="kpi-trend">Next: Tomorrow at 10 AM</span>
            </div>
            <div class="glass-card kpi-card border-t-4 border-accent cursor-pointer" (click)="activeNav = 'records'">
              <span class="kpi-title">Recent Lab Results</span>
              <span class="kpi-value">2</span>
              <span class="kpi-trend text-accent">Ready for review</span>
            </div>
            <div class="glass-card kpi-card border-t-4 border-secondary">
              <span class="kpi-title">Active Prescriptions</span>
              <span class="kpi-value">3</span>
              <span class="kpi-trend">All refills up to date</span>
            </div>
          </div>

          <!-- Recent Activity & Quick Actions -->
          <div class="content-grid">
            <div class="glass-card">
              <h3 class="m-0 mb-4 text-primary">Your Next Appointment</h3>
              <div *ngIf="appointments.length === 0" class="text-muted text-sm p-4">
                You have no upcoming appointments.
              </div>
              <div *ngIf="appointments.length > 0" class="inner-card cursor-pointer hover-lift" (click)="viewAppointmentDetails(appointments[0])">
                <div class="flex justify-between items-start mb-2">
                  <strong class="text-main" style="font-size: 1.1rem;">Dr. {{ appointments[0].doctorName }}</strong>
                  <span class="badge badge-primary">{{ appointments[0].status }}</span>
                </div>
                <p class="text-sm text-primary mb-3">{{ appointments[0].specialization }}</p>
                <div class="flex justify-between text-sm text-muted">
                  <span>📅 {{ appointments[0].appointmentDate | date:'fullDate' }}</span>
                  <span>⏰ {{ appointments[0].appointmentDate | date:'shortTime' }}</span>
                </div>
              </div>
              <button class="btn btn-outline btn-sm mt-4 w-full" (click)="activeNav = 'appointments'">View All Appointments</button>
            </div>

            <div class="glass-card">
              <h3 class="m-0 mb-4 text-accent">Health Summary</h3>
              <div class="flex-col gap-3">
                <div class="inner-card flex justify-between items-center p-3">
                  <div class="flex items-center gap-3">
                    <span class="text-2xl">🩸</span>
                    <div>
                      <strong class="block text-main">Blood Pressure</strong>
                      <span class="text-xs text-muted">Last reading: 2 days ago</span>
                    </div>
                  </div>
                  <strong class="text-lg">118/75</strong>
                </div>
                <div class="inner-card flex justify-between items-center p-3">
                  <div class="flex items-center gap-3">
                    <span class="text-2xl">⚖️</span>
                    <div>
                      <strong class="block text-main">Weight</strong>
                      <span class="text-xs text-muted">Last reading: 1 week ago</span>
                    </div>
                  </div>
                  <strong class="text-lg">165 lbs</strong>
                </div>
              </div>
              <button class="btn btn-outline btn-sm mt-4 w-full" (click)="activeNav = 'records'">View Health Records</button>
            </div>
          </div>
        </div>

        <!-- APPOINTMENTS LIST VIEW -->
        <div class="dashboard-content" *ngIf="activeNav === 'appointments'">
          <div class="flex justify-between items-center mb-6">
            <h3 class="font-bold m-0 text-main">My Appointments</h3>
            <a routerLink="/patient/book" class="btn btn-primary" style="text-decoration: none;">Book Appointment</a>
          </div>
          <div class="glass-card">
            <div *ngIf="appointments.length === 0" class="text-muted py-8 text-center">
              You have no appointments booked.
            </div>
            
            <div *ngIf="appointments.length > 0" class="grid grid-cols-2 gap-4">
              <div *ngFor="let apt of appointments" class="inner-card flex-col gap-2 cursor-pointer hover-lift" (click)="viewAppointmentDetails(apt)">
                <div class="flex justify-between items-start">
                  <strong class="text-main" style="font-size: 16px;">Dr. {{ apt.doctorName }}</strong>
                  <span class="badge" [ngClass]="apt.status === 'Pending' || apt.status === 'Confirmed' ? 'badge-primary' : 'badge-warning'">{{ apt.status }}</span>
                </div>
                <p class="text-sm text-muted mb-0">{{ apt.specialization }}</p>
                
                <div class="mt-2 text-sm text-muted">
                  <p class="mb-1"><strong class="text-main">Date:</strong> {{ apt.appointmentDate | date:'medium' }}</p>
                  <p class="mb-1"><strong class="text-main">Notes:</strong> {{ apt.notes || 'None' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RECORDS VIEW -->
        <div class="dashboard-content" *ngIf="activeNav === 'records'">
          <div class="glass-card text-center py-12 text-muted">
            <span style="font-size: 3rem;">📁</span>
            <h3 class="mt-4 mb-2 text-main">Your Records are Secure</h3>
            <p class="max-w-md mx-auto">Access your past visit summaries, lab results, and prescriptions here. Select a specific past appointment to view its details.</p>
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
              <span class="modal-detail-label">Date & Time</span>
              <span class="modal-detail-value">{{ selectedAppointment.appointmentDate | date:'medium' }}</span>
            </div>
            <div class="modal-detail-item">
              <span class="modal-detail-label">Status</span>
              <span class="modal-detail-value">
                <span class="badge badge-primary">{{ selectedAppointment.status }}</span>
              </span>
            </div>
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

        <div class="flex justify-end mt-6">
          <button (click)="closeDetailsModal()" class="btn btn-outline">Close</button>
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
              <label class="form-label">Phone (Primary)</label>
              <input type="text" class="form-control" [(ngModel)]="profileForm.phone" name="phone">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Date of Birth</label>
              <input type="date" class="form-control" [(ngModel)]="profileForm.dateOfBirth" name="dateOfBirth">
            </div>
            <div class="form-group">
              <label class="form-label">Phone (Secondary/Mobile)</label>
              <input type="text" class="form-control" [(ngModel)]="profileForm.phoneNumber" name="phoneNumber">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Gender</label>
              <select class="form-control" [(ngModel)]="profileForm.gender" name="gender">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
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
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button type="button" (click)="closeProfileModal()" class="btn btn-outline">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrl: './patient-dashboard.css'
})
export class PatientDashboardComponent implements OnInit, OnDestroy {
  appointments: any[] = [];
  upcomingCount = 0;
  activeNav: string = 'dashboard';
  currentTime = new Date();
  private timer: any;

  // Details Modal State
  selectedAppointment: any = null;
  showDetailsModal = false;

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
    dateOfBirth: '',
    phoneNumber: '',
    gender: '',
    bloodGroup: ''
  };

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.loadAppointments();
    this.loadNotifications();
    this.timer = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
    this.refreshInterval = setInterval(() => {
      this.loadNotifications();
    }, 30000);
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  getNavTitle(): string {
    const titles: any = {
      'dashboard': 'Dashboard',
      'appointments': 'Appointments',
      'records': 'Health Records',
      'settings': 'Settings',
      'notifications': 'Notifications'
    };
    return titles[this.activeNav] || 'Dashboard';
  }

  loadAppointments() {
    this.api.getMyAppointments().subscribe({
      next: (data) => {
        this.appointments = data;
        this.upcomingCount = this.appointments.filter(a => a.status === 'Pending' || a.status === 'Confirmed').length;
      },
      error: (err) => {
        console.error('Failed to load appointments', err);
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

    let completed = 0;
    unreadNotifications.forEach(n => {
      this.api.markNotificationRead(n.id).subscribe({
        next: () => {
          n.isRead = true;
          completed++;
          if (completed === unreadNotifications.length) {
            this.unreadCount = 0;
          }
        },
        error: (err) => {
          console.error(err);
          completed++;
          if (completed === unreadNotifications.length) {
            this.loadNotifications();
          }
        }
      });
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
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          dateOfBirth: data.dateOfBirth || '',
          phoneNumber: data.phoneNumber || '',
          gender: data.gender || '',
          bloodGroup: data.bloodGroup || ''
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
    this.api.updatePatientProfile(this.profileForm).subscribe({
      next: () => {
        alert('Profile updated successfully!');
        this.closeProfileModal();
      },
      error: (err) => {
        console.error('Failed to update profile', err);
        alert('Failed to update profile.');
      }
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
