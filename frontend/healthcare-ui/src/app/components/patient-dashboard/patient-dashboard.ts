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
            <div *ngFor="let apt of appointments" class="inner-card flex-col gap-2">
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
                  <li *ngIf="apt.vitals[0].heartRate">Heart Rate: {{ apt.vitals[0].heartRate }}</li>
                  <li *ngIf="apt.vitals[0].bloodPressure">BP: {{ apt.vitals[0].bloodPressure }}</li>
                  <li *ngIf="apt.vitals[0].temperature">Temp: {{ apt.vitals[0].temperature }}</li>
                  <li *ngIf="apt.vitals[0].weight">Weight: {{ apt.vitals[0].weight }}</li>
                </ul>
              </div>

              <div class="mt-4" *ngIf="activeVitalForm !== apt.id">
                <button (click)="openVitalForm(apt.id)" class="btn btn-secondary w-full text-sm">Add Vitals</button>
              </div>

              <div class="mt-4 p-4" style="background: rgba(0,0,0,0.2); border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.05);" *ngIf="activeVitalForm === apt.id">
                <h4 class="mb-3 text-sm font-bold text-secondary">Enter Vitals</h4>
                <div class="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label class="form-label text-xs">Heart Rate</label>
                    <input type="text" [(ngModel)]="vitalForm.heartRate" placeholder="e.g. 72" class="form-control" />
                  </div>
                  <div>
                    <label class="form-label text-xs">Blood Pressure</label>
                    <input type="text" [(ngModel)]="vitalForm.bloodPressure" placeholder="e.g. 120/80" class="form-control" />
                  </div>
                  <div>
                    <label class="form-label text-xs">Temperature</label>
                    <input type="text" [(ngModel)]="vitalForm.temperature" placeholder="e.g. 98.6" class="form-control" />
                  </div>
                  <div>
                    <label class="form-label text-xs">Weight</label>
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
}

