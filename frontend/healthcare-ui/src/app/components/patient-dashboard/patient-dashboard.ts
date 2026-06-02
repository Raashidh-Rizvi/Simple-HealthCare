import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="glass-card mt-4">
      <div class="flex justify-between items-center mb-6">
        <h2>Patient Dashboard</h2>
        <a routerLink="/patient/book" class="btn btn-primary">Book New Appointment</a>
      </div>

      <div class="flex-col gap-4">
        <div class="glass-card" style="background: rgba(79, 70, 229, 0.1);">
          <h3 style="color: var(--primary)">Upcoming Appointments</h3>
          <p class="mt-4 text-muted">You have no upcoming appointments.</p>
        </div>
      </div>
    </div>
  `,
  styleUrl: './patient-dashboard.css'
})
export class PatientDashboardComponent {

}
