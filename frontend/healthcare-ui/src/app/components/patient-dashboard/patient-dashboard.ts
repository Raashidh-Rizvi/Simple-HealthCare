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
    <div class="glass-card mt-4">
      <div class="flex justify-between items-center mb-6">
        <h2>Patient Dashboard</h2>
        <a routerLink="/patient/book" class="btn btn-primary">Book New Appointment</a>
      </div>

      <div class="flex-col gap-4">
        <div class="glass-card" style="background: rgba(79, 70, 229, 0.1);">
          <h3 style="color: var(--primary)">Upcoming Appointments</h3>
          
          <div *ngIf="appointments.length === 0" class="mt-4 text-muted">
            You have no upcoming appointments.
          </div>
          
          <div *ngIf="appointments.length > 0" class="mt-4">
            <div *ngFor="let apt of appointments" class="glass-card mt-2" style="padding: 12px;">
              <strong>Doctor:</strong> {{ apt.doctorName }} ({{ apt.specialization }}) <br/>
              <strong>Date:</strong> {{ apt.appointmentDate | date:'medium' }} <br/>
              <strong>Status:</strong> {{ apt.status }} <br/>
              <strong>Notes:</strong> {{ apt.notes || 'None' }} <br/>
              
              <div *ngIf="apt.vitals && apt.vitals.length > 0" class="mt-2">
                <strong>Latest Vitals:</strong>
                <ul class="list-none pl-0 m-0 text-sm">
                  <li *ngIf="apt.vitals[0].heartRate">Heart Rate: {{ apt.vitals[0].heartRate }}</li>
                  <li *ngIf="apt.vitals[0].bloodPressure">BP: {{ apt.vitals[0].bloodPressure }}</li>
                  <li *ngIf="apt.vitals[0].temperature">Temp: {{ apt.vitals[0].temperature }}</li>
                  <li *ngIf="apt.vitals[0].weight">Weight: {{ apt.vitals[0].weight }}</li>
                </ul>
              </div>

              <div class="mt-2" *ngIf="activeVitalForm !== apt.id">
                <button (click)="openVitalForm(apt.id)" class="btn btn-secondary" style="padding: 4px 12px; font-size: 0.9em; cursor:pointer;">Add Vitals</button>
              </div>

              <div class="mt-3 p-3" style="background: rgba(255,255,255,0.05); border-radius: 8px;" *ngIf="activeVitalForm === apt.id">
                <h4>Enter Vitals</h4>
                <div class="grid grid-cols-2 gap-2 mt-2">
                  <input type="text" [(ngModel)]="vitalForm.heartRate" placeholder="Heart Rate" class="form-control" style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 4px 8px;" />
                  <input type="text" [(ngModel)]="vitalForm.bloodPressure" placeholder="Blood Pressure (e.g. 120/80)" class="form-control" style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 4px 8px;" />
                  <input type="text" [(ngModel)]="vitalForm.temperature" placeholder="Temperature (e.g. 98.6 F)" class="form-control" style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 4px 8px;" />
                  <input type="text" [(ngModel)]="vitalForm.weight" placeholder="Weight (e.g. 150 lbs)" class="form-control" style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 4px 8px;" />
                </div>
                <div class="mt-2 flex gap-2">
                  <button (click)="submitVitals(apt.id)" class="btn btn-primary" style="padding: 4px 12px; font-size: 0.9em; cursor:pointer;">Save</button>
                  <button (click)="closeVitalForm()" class="btn" style="padding: 4px 12px; font-size: 0.9em; cursor:pointer; background: transparent; border: 1px solid #ccc; color: #ccc;">Cancel</button>
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

