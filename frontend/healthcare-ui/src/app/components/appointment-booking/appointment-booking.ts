import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-appointment-booking',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="glass-card mt-4">
      <div class="flex justify-between items-center mb-6">
        <h2>Book Appointment</h2>
        <a routerLink="/patient" class="btn btn-outline">Back to Dashboard</a>
      </div>
      <p class="text-muted">Appointment booking form will go here.</p>
    </div>
  `,
  styleUrl: './appointment-booking.css'
})
export class AppointmentBookingComponent {

}
