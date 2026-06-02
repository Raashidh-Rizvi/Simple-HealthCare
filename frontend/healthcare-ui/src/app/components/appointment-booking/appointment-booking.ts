import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-appointment-booking',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  template: `
    <div class="glass-card mt-4">
      <div class="flex justify-between items-center mb-6">
        <h2>Book Appointment</h2>
        <a routerLink="/patient" class="btn btn-outline" style="border: 1px solid #ccc; padding: 8px 16px; border-radius: 6px; text-decoration: none; color: inherit;">Back to Dashboard</a>
      </div>
      
      <form (ngSubmit)="onBook()" class="mt-4">
        <div class="form-group" style="margin-bottom: 16px;">
          <label class="form-label" style="display: block; margin-bottom: 8px;">Select Doctor</label>
          <select class="form-control" [(ngModel)]="selectedDoctorId" name="doctorId" required style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #ccc;">
            <option *ngFor="let doc of doctors" [value]="doc.id">
              Dr. {{ doc.firstName }} {{ doc.lastName }} - {{ doc.specialization }}
            </option>
          </select>
        </div>

        <div class="form-group" style="margin-bottom: 16px;">
          <label class="form-label" style="display: block; margin-bottom: 8px;">Date & Time</label>
          <input type="datetime-local" class="form-control" [(ngModel)]="appointmentDate" name="appointmentDate" required style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #ccc;">
        </div>

        <div class="form-group" style="margin-bottom: 16px;">
          <label class="form-label" style="display: block; margin-bottom: 8px;">Notes</label>
          <textarea class="form-control" [(ngModel)]="notes" name="notes" rows="3" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #ccc;"></textarea>
        </div>

        <button type="submit" class="btn btn-primary" style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">Book Now</button>
      </form>
    </div>
  `,
  styleUrl: './appointment-booking.css'
})
export class AppointmentBookingComponent implements OnInit {
  doctors: any[] = [];
  selectedDoctorId: number | null = null;
  appointmentDate: string = '';
  notes: string = '';

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.api.getDoctors().subscribe({
      next: (data) => {
        this.doctors = data;
      },
      error: (err) => {
        console.error('Failed to fetch doctors', err);
      }
    });
  }

  onBook() {
    if (!this.selectedDoctorId || !this.appointmentDate) return;

    this.api.bookAppointment({
      doctorId: Number(this.selectedDoctorId),
      appointmentDate: this.appointmentDate,
      notes: this.notes
    }).subscribe({
      next: () => {
        alert('Appointment booked successfully!');
        this.router.navigate(['/patient']);
      },
      error: (err) => {
        alert('Failed to book appointment: ' + (err.error?.message || err.message));
      }
    });
  }
}

