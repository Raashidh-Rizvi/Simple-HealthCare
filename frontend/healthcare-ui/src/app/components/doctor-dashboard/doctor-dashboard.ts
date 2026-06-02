import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-card mt-4">
      <div class="flex justify-between items-center mb-6">
        <h2>Doctor Dashboard</h2>
        <button (click)="startConsultation()" class="btn btn-primary" style="padding: 8px 16px; border-radius: 6px; border: none; background: #3b82f6; color: white; cursor: pointer;">Start Consultation</button>
      </div>

      <div class="flex-col gap-4">
        <div class="glass-card" style="background: rgba(16, 185, 129, 0.1);">
          <h3 style="color: var(--secondary)">Scheduled Appointments</h3>
          
          <div *ngIf="appointments.length === 0" class="mt-4 text-muted">
            You have 0 scheduled appointments.
          </div>

          <div *ngIf="appointments.length > 0" class="mt-4">
            <div *ngFor="let apt of appointments" class="glass-card mt-2" style="padding: 12px; background: white;">
              <strong>Patient:</strong> {{ apt.patientName }} <br/>
              <strong>Date:</strong> {{ apt.appointmentDate | date:'medium' }} <br/>
              <strong>Status:</strong> {{ apt.status }} <br/>
              <strong>Notes:</strong> {{ apt.notes || 'None' }}
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styleUrl: './doctor-dashboard.css'
})
export class DoctorDashboardComponent implements OnInit {
  appointments: any[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getMyAppointments().subscribe({
      next: (data) => {
        this.appointments = data;
      },
      error: (err) => {
        console.error('Failed to load appointments', err);
      }
    });
  }

  startConsultation() {
    alert('Consultation started successfully!');
  }
}

