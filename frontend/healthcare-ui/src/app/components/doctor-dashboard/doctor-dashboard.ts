import { Component } from '@angular/core';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [],
  template: `
    <div class="glass-card mt-4">
      <div class="flex justify-between items-center mb-6">
        <h2>Doctor Dashboard</h2>
        <button class="btn btn-primary">Start Consultation</button>
      </div>

      <div class="flex-col gap-4">
        <div class="glass-card" style="background: rgba(16, 185, 129, 0.1);">
          <h3 style="color: var(--secondary)">Today's Appointments</h3>
          <p class="mt-4 text-muted">You have 0 scheduled appointments today.</p>
        </div>
      </div>
    </div>
  `,
  styleUrl: './doctor-dashboard.css'
})
export class DoctorDashboardComponent {

}
