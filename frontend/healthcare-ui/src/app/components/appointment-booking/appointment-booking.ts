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
    <div class="glass-card" style="max-width: 600px; margin: 0 auto; border-top: 4px solid var(--primary);">
      <div class="flex justify-between items-center mb-6">
        <h2 class="font-bold">Book Appointment</h2>
        <a routerLink="/patient" class="btn btn-outline text-sm">Back to Dashboard</a>
      </div>
      
      <form (ngSubmit)="onBook()" class="mt-6">
        <div class="form-group mb-4">
          <label class="form-label">Select Doctor</label>
          <select class="form-control" [(ngModel)]="selectedDoctorId" name="doctorId" required>
            <option *ngFor="let doc of doctors" [value]="doc.id" style="color: black;">
              Dr. {{ doc.firstName }} {{ doc.lastName }} - {{ doc.specialization }}
            </option>
          </select>
        </div>

        <div class="form-group mb-4">
          <label class="form-label">Date & Time</label>
          <input type="datetime-local" class="form-control" [(ngModel)]="appointmentDate" name="appointmentDate" required>
        </div>

        <div class="form-group mb-6">
          <label class="form-label">Notes</label>
          <textarea class="form-control" [(ngModel)]="notes" name="notes" rows="4" placeholder="Any specific symptoms or reasons for visit?"></textarea>
        </div>

        <button type="submit" class="btn btn-primary w-full">Book Appointment</button>
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

