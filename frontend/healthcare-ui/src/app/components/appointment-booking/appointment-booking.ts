import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface Slot {
  startTime: string;
  endTime: string;
  startTimeSpan: string;
  endTimeSpan: string;
}

@Component({
  selector: 'app-appointment-booking',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  template: `
    <div class="booking-wrapper">
      <div class="glass-card booking-card">
        <div class="booking-header">
          <div>
            <h2 class="booking-title">Book Appointment</h2>
            <p class="booking-subtitle">Select a doctor, date, and available time slot</p>
          </div>
          <a routerLink="/patient" class="btn btn-outline btn-sm" id="back-to-dashboard-btn">
            ← Dashboard
          </a>
        </div>

        <!-- Step Indicator -->
        <div class="steps-bar">
          <div class="step" [class.active]="currentStep >= 1" [class.done]="currentStep > 1">
            <span class="step-num">1</span>
            <span class="step-label">Doctor</span>
          </div>
          <div class="step-line" [class.done]="currentStep > 1"></div>
          <div class="step" [class.active]="currentStep >= 2" [class.done]="currentStep > 2">
            <span class="step-num">2</span>
            <span class="step-label">Date</span>
          </div>
          <div class="step-line" [class.done]="currentStep > 2"></div>
          <div class="step" [class.active]="currentStep >= 3" [class.done]="currentStep > 3">
            <span class="step-num">3</span>
            <span class="step-label">Slot</span>
          </div>
          <div class="step-line" [class.done]="currentStep > 3"></div>
          <div class="step" [class.active]="currentStep >= 4">
            <span class="step-num">4</span>
            <span class="step-label">Confirm</span>
          </div>
        </div>

        <!-- Step 1: Doctor Selection -->
        <div *ngIf="currentStep === 1" class="step-content" id="step-doctor">
          <h3 class="step-heading">Select a Doctor</h3>
          <div *ngIf="loadingDoctors" class="loading-msg">Loading doctors...</div>
          <div class="doctor-grid" *ngIf="!loadingDoctors">
            <div
              *ngFor="let doc of doctors"
              class="doctor-card"
              [class.selected]="selectedDoctor?.id === doc.id"
              (click)="selectDoctor(doc)"
              [id]="'doctor-card-' + doc.id"
            >
              <div class="doctor-avatar">{{ doc.firstName[0] }}{{ doc.lastName[0] }}</div>
              <div class="doctor-info">
                <div class="doctor-name">Dr. {{ doc.firstName }} {{ doc.lastName }}</div>
                <div class="doctor-spec">{{ doc.specialization }}</div>
                <div class="doctor-meta">
                  <span *ngIf="doc.experienceYears">{{ doc.experienceYears }} yrs exp</span>
                  <span *ngIf="doc.consultationFee" class="fee-badge">₹{{ doc.consultationFee }}</span>
                </div>
              </div>
              <div class="doctor-check" *ngIf="selectedDoctor?.id === doc.id">✓</div>
            </div>
          </div>
          <button class="btn btn-primary mt-6" (click)="nextStep()" [disabled]="!selectedDoctor" id="step1-next-btn">
            Next →
          </button>
        </div>

        <!-- Step 2: Date Selection -->
        <div *ngIf="currentStep === 2" class="step-content" id="step-date">
          <h3 class="step-heading">Select Appointment Date</h3>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input
              type="date"
              class="form-control date-input"
              [(ngModel)]="selectedDate"
              [min]="minDate"
              (change)="onDateSelected()"
              id="appointment-date-input"
            >
          </div>
          <div class="step-actions">
            <button class="btn btn-outline" (click)="prevStep()" id="step2-back-btn">← Back</button>
            <button class="btn btn-primary" (click)="nextStep()" [disabled]="!selectedDate" id="step2-next-btn">
              Next →
            </button>
          </div>
        </div>

        <!-- Step 3: Slot Selection -->
        <div *ngIf="currentStep === 3" class="step-content" id="step-slots">
          <h3 class="step-heading">Select a Time Slot</h3>
          <p class="step-sub">{{ selectedDate | date:'EEEE, dd MMMM yyyy' }} — Dr. {{ selectedDoctor?.firstName }} {{ selectedDoctor?.lastName }}</p>

          <div *ngIf="loadingSlots" class="loading-msg">
            <div class="spinner"></div> Fetching available slots...
          </div>

          <div *ngIf="!loadingSlots && availableSlots.length === 0" class="no-slots">
            <div class="no-slots-icon">📅</div>
            <p>No slots available for this date.</p>
            <p class="text-sm">The doctor may be off or all slots are booked. Try another date.</p>
          </div>

          <div *ngIf="!loadingSlots && availableSlots.length > 0" class="slots-grid">
            <button
              *ngFor="let slot of availableSlots"
              class="slot-btn"
              [class.selected]="selectedSlot?.startTime === slot.startTime"
              (click)="selectSlot(slot)"
              [id]="'slot-' + slot.startTime"
            >
              {{ slot.startTime }} – {{ slot.endTime }}
            </button>
          </div>

          <div class="step-actions">
            <button class="btn btn-outline" (click)="prevStep()" id="step3-back-btn">← Back</button>
            <button class="btn btn-primary" (click)="nextStep()" [disabled]="!selectedSlot" id="step3-next-btn">
              Next →
            </button>
          </div>
        </div>

        <!-- Step 4: Confirm & Notes -->
        <div *ngIf="currentStep === 4" class="step-content" id="step-confirm">
          <h3 class="step-heading">Confirm Appointment</h3>

          <div class="confirm-summary">
            <div class="summary-row">
              <span class="summary-label">Doctor</span>
              <span class="summary-val">Dr. {{ selectedDoctor?.firstName }} {{ selectedDoctor?.lastName }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Specialization</span>
              <span class="summary-val">{{ selectedDoctor?.specialization }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Date</span>
              <span class="summary-val">{{ selectedDate | date:'dd MMM yyyy' }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Time</span>
              <span class="summary-val slot-highlight">{{ selectedSlot?.startTime }} – {{ selectedSlot?.endTime }}</span>
            </div>
            <div class="summary-row" *ngIf="selectedDoctor?.consultationFee">
              <span class="summary-label">Fee</span>
              <span class="summary-val">₹{{ selectedDoctor?.consultationFee }}</span>
            </div>
          </div>

          <div class="form-group mt-4">
            <label class="form-label">Reason / Chief Complaint</label>
            <input type="text" class="form-control" [(ngModel)]="reason" id="reason-input"
              placeholder="e.g. Chest pain, Skin rash...">
          </div>

          <div class="form-group">
            <label class="form-label">Additional Notes</label>
            <textarea class="form-control" [(ngModel)]="notes" id="notes-input" rows="3"
              placeholder="Any other information for the doctor..."></textarea>
          </div>

          <div *ngIf="bookingError" class="alert alert-error" id="booking-error-msg">
            ⚠️ {{ bookingError }}
          </div>

          <div class="step-actions">
            <button class="btn btn-outline" (click)="prevStep()" [disabled]="booking" id="step4-back-btn">← Back</button>
            <button class="btn btn-primary" (click)="onBook()" [disabled]="booking" id="book-submit-btn">
              <span *ngIf="!booking">✓ Confirm Booking</span>
              <span *ngIf="booking">Booking...</span>
            </button>
          </div>
        </div>

        <!-- Success -->
        <div *ngIf="currentStep === 5" class="step-content success-screen" id="booking-success">
          <div class="success-icon">🎉</div>
          <h3 class="success-title">Appointment Booked!</h3>
          <p>Your appointment is <strong>Pending</strong> confirmation from the doctor.</p>
          <p>You'll be notified once it's confirmed.</p>
          <a routerLink="/patient" class="btn btn-primary mt-6" id="go-to-dashboard-btn">Go to Dashboard</a>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .booking-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 2rem 1rem;
      background: var(--bg-gradient, #0f172a);
    }
    .booking-card {
      width: 100%;
      max-width: 700px;
      border-top: 4px solid var(--primary, #6366f1);
    }
    .booking-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }
    .booking-title { font-size: 1.5rem; font-weight: 700; margin: 0 0 0.25rem; }
    .booking-subtitle { color: var(--text-muted, #94a3b8); font-size: 0.875rem; margin: 0; }
    .btn-sm { font-size: 0.8rem; padding: 0.4rem 0.9rem; }

    /* Steps bar */
    .steps-bar {
      display: flex;
      align-items: center;
      margin-bottom: 2rem;
      padding: 1rem 0;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.3rem;
      flex-shrink: 0;
    }
    .step-num {
      width: 32px; height: 32px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.85rem;
      color: var(--text-muted, #94a3b8);
      transition: all 0.3s;
    }
    .step.active .step-num {
      border-color: var(--primary, #6366f1);
      color: var(--primary, #6366f1);
      background: rgba(99,102,241,0.15);
    }
    .step.done .step-num {
      border-color: var(--secondary);
      color: var(--secondary);
      background: rgba(34,197,94,0.15);
    }
    .step-label { font-size: 0.7rem; color: var(--text-muted, #94a3b8); }
    .step.active .step-label { color: var(--primary, #6366f1); }
    .step-line {
      flex: 1;
      height: 2px;
      background: rgba(255,255,255,0.1);
      margin: 0 0.5rem;
      margin-bottom: 1rem;
      transition: background 0.3s;
    }
    .step-line.done { background: var(--secondary); }

    /* Step content */
    .step-content { padding: 0.5rem 0; }
    .step-heading { font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; }
    .step-sub { color: var(--text-muted, #94a3b8); font-size: 0.875rem; margin-bottom: 1rem; }
    .step-actions { display: flex; gap: 1rem; margin-top: 1.5rem; }

    /* Doctor grid */
    .doctor-grid { display: flex; flex-direction: column; gap: 0.75rem; }
    .doctor-card {
      display: flex; align-items: center; gap: 1rem;
      padding: 1rem 1.25rem;
      border: 2px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      background: rgba(255,255,255,0.03);
    }
    .doctor-card:hover { border-color: var(--primary, #6366f1); background: rgba(99,102,241,0.08); }
    .doctor-card.selected { border-color: var(--primary, #6366f1); background: rgba(99,102,241,0.12); }
    .doctor-avatar {
      width: 48px; height: 48px; border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 1rem; color: var(--text-inverse);
      flex-shrink: 0;
    }
    .doctor-info { flex: 1; }
    .doctor-name { font-weight: 600; margin-bottom: 0.15rem; }
    .doctor-spec { color: var(--primary, #6366f1); font-size: 0.85rem; margin-bottom: 0.25rem; }
    .doctor-meta { display: flex; gap: 0.75rem; font-size: 0.8rem; color: var(--text-muted, #94a3b8); }
    .fee-badge { background: rgba(34,197,94,0.15); color: var(--secondary); padding: 0.1rem 0.5rem; border-radius: 4px; }
    .doctor-check { color: var(--primary, #6366f1); font-size: 1.2rem; font-weight: 700; }

    /* Date input */
    .date-input { max-width: 280px; }

    /* Slots */
    .slots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 0.75rem;
      margin: 1rem 0;
    }
    .slot-btn {
      padding: 0.7rem 0.5rem;
      border: 2px solid rgba(255,255,255,0.12);
      border-radius: 10px;
      background: rgba(255,255,255,0.04);
      color: inherit;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
    }
    .slot-btn:hover { border-color: var(--primary, #6366f1); background: rgba(99,102,241,0.1); }
    .slot-btn.selected {
      border-color: var(--primary, #6366f1);
      background: var(--primary, #6366f1);
      color: var(--text-inverse);
    }
    .no-slots { text-align: center; padding: 2rem; color: var(--text-muted, #94a3b8); }
    .no-slots-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .text-sm { font-size: 0.8rem; }

    /* Confirm summary */
    .confirm-summary {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 1rem;
    }
    .summary-row {
      display: flex; justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .summary-row:last-child { border-bottom: none; }
    .summary-label { color: var(--text-muted, #94a3b8); font-size: 0.875rem; }
    .summary-val { font-weight: 500; }
    .slot-highlight {
      background: rgba(99,102,241,0.15);
      color: var(--primary, #6366f1);
      padding: 0.15rem 0.6rem;
      border-radius: 6px;
      font-weight: 700;
    }

    /* Alerts */
    .alert-error {
      background: rgba(239,68,68,0.15);
      border: 1px solid rgba(239,68,68,0.3);
      color: var(--danger);
      padding: 0.75rem 1rem;
      border-radius: 8px;
      margin: 1rem 0;
    }

    /* Spinner */
    .loading-msg { display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted, #94a3b8); padding: 1rem 0; }
    .spinner {
      width: 20px; height: 20px;
      border: 2px solid rgba(255,255,255,0.1);
      border-top-color: var(--primary, #6366f1);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Success */
    .success-screen { text-align: center; padding: 2rem 0; }
    .success-icon { font-size: 3.5rem; margin-bottom: 1rem; }
    .success-title { font-size: 1.5rem; font-weight: 700; color: var(--secondary); margin-bottom: 0.5rem; }

    .mt-4 { margin-top: 1rem; }
    .mt-6 { margin-top: 1.5rem; }
  `]
})
export class AppointmentBookingComponent implements OnInit {
  currentStep = 1;
  doctors: any[] = [];
  selectedDoctor: any = null;
  selectedDate: string = '';
  minDate: string = '';
  availableSlots: Slot[] = [];
  selectedSlot: Slot | null = null;
  reason: string = '';
  notes: string = '';
  loadingDoctors = false;
  loadingSlots = false;
  booking = false;
  bookingError: string | null = null;

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    // Set min date to today
    this.minDate = new Date().toISOString().split('T')[0];
    this.loadDoctors();
  }

  loadDoctors() {
    this.loadingDoctors = true;
    this.api.getDoctors().subscribe({
      next: (data) => { this.doctors = data; this.loadingDoctors = false; },
      error: () => { this.loadingDoctors = false; }
    });
  }

  selectDoctor(doc: any) {
    this.selectedDoctor = doc;
  }

  onDateSelected() {
    this.selectedSlot = null;
    this.availableSlots = [];
  }

  loadSlots() {
    if (!this.selectedDoctor || !this.selectedDate) return;
    this.loadingSlots = true;
    this.availableSlots = [];
    this.selectedSlot = null;

    this.api.getAvailableSlots(this.selectedDoctor.id, this.selectedDate).subscribe({
      next: (res) => { this.availableSlots = res.slots || []; this.loadingSlots = false; },
      error: () => { this.availableSlots = []; this.loadingSlots = false; }
    });
  }

  selectSlot(slot: Slot) {
    this.selectedSlot = slot;
  }

  nextStep() {
    if (this.currentStep === 1 && !this.selectedDoctor) return;
    if (this.currentStep === 2 && !this.selectedDate) return;
    if (this.currentStep === 3 && !this.selectedSlot) return;

    if (this.currentStep === 2) {
      this.loadSlots();
    }
    this.currentStep++;
  }

  prevStep() {
    if (this.currentStep > 1) this.currentStep--;
  }

  onBook() {
    if (!this.selectedDoctor || !this.selectedDate || !this.selectedSlot) return;
    this.booking = true;
    this.bookingError = null;

    const payload = {
      doctorId: this.selectedDoctor.id,
      appointmentDate: this.selectedDate,
      startTime: this.selectedSlot.startTimeSpan,
      endTime: this.selectedSlot.endTimeSpan,
      reason: this.reason,
      notes: this.notes
    };

    this.api.bookAppointment(payload).subscribe({
      next: () => {
        this.booking = false;
        this.currentStep = 5;
      },
      error: (err) => {
        this.booking = false;
        if (err.status === 409) {
          this.bookingError = err.error?.message || 'This slot was just booked. Please select another slot.';
          // Go back to slot selection
          setTimeout(() => { this.currentStep = 3; this.loadSlots(); }, 2500);
        } else {
          this.bookingError = err.error?.message || 'Booking failed. Please try again.';
        }
      }
    });
  }
}
