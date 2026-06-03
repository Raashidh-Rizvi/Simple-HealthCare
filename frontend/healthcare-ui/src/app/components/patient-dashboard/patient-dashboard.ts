import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  template: `
    <div>
      <div class="flex justify-between items-center mb-6">
        <h2 class="font-bold">Patient Dashboard</h2>
        <a routerLink="/patient/book" class="btn btn-primary">Book New Appointment</a>
      </div>

      <div class="flex-col gap-6">
        <div class="glass-card" style="border-top: 4px solid var(--primary);">
          <h3 style="color: var(--primary);" class="mb-4">Upcoming Appointments</h3>
          
          <div *ngIf="appointments.length === 0" class="text-muted mt-2">
            You have no upcoming appointments.
          </div>
          
          <div *ngIf="appointments.length > 0" class="grid grid-cols-2 gap-4 mt-2">
            <div *ngFor="let apt of appointments" class="inner-card flex-col gap-2 cursor-pointer" (click)="viewAppointmentDetails(apt)">
              <div class="flex justify-between items-start">
                <strong class="text-main" style="font-size: 16px;">Dr. {{ apt.doctorName }}</strong>
                <span class="badge" [ngClass]="apt.status === 'start' ? 'badge-primary' : 'badge-warning'">{{ apt.status }}</span>
              </div>
              <p class="text-sm text-muted mb-0">{{ apt.specialization }}</p>
              
              <div class="mt-2 text-sm text-muted">
                <p class="mb-1"><strong class="text-main">Date:</strong> {{ apt.appointmentDate | date:'medium' }}</p>
                <p class="mb-1"><strong class="text-main">Notes:</strong> {{ apt.notes || 'None' }}</p>
              </div>
              
              <div *ngIf="apt.vitals && apt.vitals.length > 0" class="mt-3 p-3 text-sm" style="background: rgba(0,0,0,0.2); border-radius: var(--radius-sm);">
                <strong class="text-main">Latest Vitals:</strong>
                <ul class="list-none pl-0 m-0 text-muted mt-1">
                  <li *ngIf="apt.vitals[0].heartRate">Heart Rate: {{ apt.vitals[0].heartRate }} bpm</li>
                  <li *ngIf="apt.vitals[0].bloodPressure">BP: {{ apt.vitals[0].bloodPressure }} mmHg</li>
                  <li *ngIf="apt.vitals[0].temperature">Temp: {{ apt.vitals[0].temperature }} °F</li>
                  <li *ngIf="apt.vitals[0].weight">Weight: {{ apt.vitals[0].weight }} lbs</li>
                </ul>
              </div>

              <div class="mt-4" *ngIf="activeVitalForm !== apt.id">
                <button (click)="openVitalForm(apt.id); $event.stopPropagation()" class="btn btn-secondary w-full text-sm">Add Vitals</button>
              </div>

              <div class="mt-4 p-4" style="background: rgba(0,0,0,0.2); border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.05);" *ngIf="activeVitalForm === apt.id" (click)="$event.stopPropagation()">
                <h4 class="mb-3 text-sm font-bold text-secondary">Enter Vitals</h4>
                <div class="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label class="form-label text-xs">Heart Rate (bpm)</label>
                    <input type="text" [(ngModel)]="vitalForm.heartRate" placeholder="e.g. 72" class="form-control" />
                  </div>
                  <div>
                    <label class="form-label text-xs">Blood Pressure (mmHg)</label>
                    <input type="text" [(ngModel)]="vitalForm.bloodPressure" placeholder="e.g. 120/80" class="form-control" />
                  </div>
                  <div>
                    <label class="form-label text-xs">Temperature (°F)</label>
                    <input type="text" [(ngModel)]="vitalForm.temperature" placeholder="e.g. 98.6" class="form-control" />
                  </div>
                  <div>
                    <label class="form-label text-xs">Weight (lbs)</label>
                    <input type="text" [(ngModel)]="vitalForm.weight" placeholder="e.g. 150" class="form-control" />
                  </div>
                </div>
                <div class="flex gap-2">
                  <button (click)="submitVitals(apt.id)" class="btn btn-primary flex-1 text-sm">Save</button>
                  <button (click)="closeVitalForm()" class="btn btn-outline flex-1 text-sm">Cancel</button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
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
                <span class="badge" [ngClass]="(selectedAppointment.status === 'start' || selectedAppointment.status === 'complete') ? 'badge-primary' : 'badge-warning'">
                  {{ selectedAppointment.status }}
                </span>
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
                <li *ngIf="vital.bloodPressure">Blood Pressure: {{ vital.bloodPressure }} mmHg</li>
                <li *ngIf="vital.temperature">Temperature: {{ vital.temperature }} °F</li>
                <li *ngIf="vital.weight">Weight: {{ vital.weight }} lbs</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="modal-section">
          <h4 class="modal-section-title">Prescriptions & Orders</h4>
          <div *ngIf="!selectedAppointment.orders || selectedAppointment.orders.length === 0" class="text-muted text-sm">
            No prescriptions or orders for this appointment.
          </div>
          <div *ngIf="selectedAppointment.orders && selectedAppointment.orders.length > 0" class="flex-col gap-2">
            <div *ngFor="let order of selectedAppointment.orders" class="inner-card p-3 text-sm flex justify-between items-start">
              <div>
                <strong class="text-main">{{ order.orderType }}:</strong> {{ order.description }}
              </div>
              <span class="text-muted text-xs">{{ order.createdAt | date:'shortDate' }}</span>
            </div>
          </div>
        </div>

        <div class="flex justify-end mt-6">
          <button (click)="closeDetailsModal()" class="btn btn-outline">Close</button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './patient-dashboard.css'
})
export class PatientDashboardComponent implements OnInit {
  appointments: any[] = [];
  activeVitalForm: number | null = null;
  vitalForm: any = {
    heartRate: '',
    bloodPressure: '',
    temperature: '',
    weight: ''
  };

  // Details Modal State
  selectedAppointment: any = null;
  showDetailsModal = false;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadAppointments();
  }

  loadAppointments() {
    this.api.getMyAppointments().subscribe({
      next: (data) => {
        this.appointments = data;
      },
      error: (err) => {
        console.error('Failed to load appointments', err);
      }
    });
  }

  openVitalForm(appointmentId: number) {
    this.activeVitalForm = appointmentId;
    this.vitalForm = { heartRate: '', bloodPressure: '', temperature: '', weight: '' };
  }

  closeVitalForm() {
    this.activeVitalForm = null;
  }

  submitVitals(appointmentId: number) {
    if (this.vitalForm.heartRate && !new RegExp('^\\d{2,3}$').test(this.vitalForm.heartRate)) return alert('Invalid Heart Rate (e.g. 72)');
    if (this.vitalForm.bloodPressure && !new RegExp('^\\d{2,3}/\\d{2,3}$').test(this.vitalForm.bloodPressure)) return alert('Invalid BP (e.g. 120/80)');
    if (this.vitalForm.temperature && !new RegExp('^\\d{2,3}(\\.\\d{1,2})?$').test(this.vitalForm.temperature)) return alert('Invalid Temp (e.g. 98.6)');
    if (this.vitalForm.weight && !new RegExp('^\\d{2,3}(\\.\\d{1,2})?$').test(this.vitalForm.weight)) return alert('Invalid Weight (e.g. 150)');

    this.api.addVitals(appointmentId, this.vitalForm).subscribe({
      next: () => {
        alert('Vitals saved successfully!');
        this.closeVitalForm();
        this.loadAppointments();
      },
      error: (err) => {
        console.error('Failed to save vitals', err);
        alert('Failed to save vitals');
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
}

