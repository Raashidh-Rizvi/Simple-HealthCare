import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule],
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
              <strong>Notes:</strong> {{ apt.notes || 'None' }}
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
}

