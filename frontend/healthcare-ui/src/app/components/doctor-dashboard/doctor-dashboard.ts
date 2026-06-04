import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { SpeechRecognitionService } from '../../services/speech-recognition.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="!inConsultation">
      <div class="flex justify-between items-center mb-6">
        <h2 class="font-bold">Doctor Dashboard</h2>
      </div>

      <div class="flex-col gap-6">
        <!-- Appointments -->
        <div class="glass-card" style="border-top: 4px solid var(--secondary);">
          <h3 style="color: var(--secondary);" class="mb-4">Scheduled Appointments</h3>
          
          <div *ngIf="appointments.length === 0" class="text-muted mt-2">
            You have 0 scheduled appointments.
          </div>

          <div *ngIf="appointments.length > 0" class="grid grid-cols-2 gap-4 mt-2">
            <div *ngFor="let apt of appointments" class="inner-card cursor-pointer" (click)="viewAppointmentDetails(apt)">
              <div class="flex justify-between items-start mb-2">
                <strong class="text-main" style="font-size: 16px;">{{ apt.patientName }}</strong>
                <span class="badge" [ngClass]="getStatusBadgeClass(apt.status)">{{ apt.status }}</span>
              </div>
              <p class="text-sm text-muted mb-1"><strong class="text-main">Date:</strong> {{ apt.appointmentDate | date:'mediumDate' }}</p>
              <p class="text-sm text-muted mb-1"><strong class="text-main">Time:</strong> {{ apt.startTime }} – {{ apt.endTime }}</p>
              <p class="text-sm text-muted mb-1" *ngIf="apt.reason"><strong class="text-main">Reason:</strong> {{ apt.reason }}</p>
              <p class="text-sm text-muted mb-3"><strong class="text-main">Notes:</strong> {{ apt.notes || 'None' }}</p>

              <div *ngIf="apt.encounterId" class="mt-3 p-3" style="background: rgba(0,0,0,0.2); border-radius: var(--radius-sm);">
                <strong class="text-sm">Encounter Status:</strong> {{ apt.encounterStatus }}<br/>
              </div>

              <!-- Appointment Action Buttons -->
              <div class="apt-actions mt-4" (click)="$event.stopPropagation()">
                <button *ngIf="apt.status === 'Pending'" (click)="confirmApt(apt.id)" class="btn btn-success btn-xs" id="confirm-apt-{{apt.id}}">✓ Confirm</button>
                <button *ngIf="apt.status === 'Pending'" (click)="rejectApt(apt.id)" class="btn btn-danger btn-xs" id="reject-apt-{{apt.id}}">✗ Reject</button>
                <button *ngIf="apt.encounterStatus === 'VitalsRecorded' || apt.encounterStatus === 'CheckedIn' || apt.encounterStatus === 'InConsultation'" (click)="startConsultationView(apt)" class="btn btn-primary btn-xs" id="start-consult-{{apt.id}}">▶ Consult</button>
                <button *ngIf="apt.status === 'Confirmed' && !apt.encounterStatus" (click)="noShowApt(apt.id)" class="btn btn-warning btn-xs" id="noshow-apt-{{apt.id}}">⚠ No-Show</button>
                <button *ngIf="apt.status === 'Pending' || apt.status === 'Confirmed'" (click)="cancelApt(apt.id)" class="btn btn-outline btn-xs" id="cancel-apt-{{apt.id}}">Cancel</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Care Providers -->
        <div class="glass-card" style="border-top: 4px solid var(--primary);">
          <h3 style="color: var(--primary);" class="mb-4">Care Providers</h3>
          <div class="flex gap-3 mb-4 flex-wrap">
            <input type="text" name="providerName" [(ngModel)]="newProvider.name" placeholder="Name" class="form-control" style="width: 200px;">
            <input type="text" name="providerRole" [(ngModel)]="newProvider.role" placeholder="Role (e.g., Nurse)" class="form-control" style="width: 200px;">
            <input type="text" name="providerPhone" [(ngModel)]="newProvider.phoneNumber" placeholder="Phone (optional)" class="form-control" style="width: 200px;">
            <button (click)="addCareProvider()" class="btn btn-primary">Add Provider</button>
          </div>
          <div *ngIf="careProviders.length === 0" class="text-muted text-sm">No care providers added yet.</div>
          <div *ngIf="careProviders.length > 0" class="grid grid-cols-2 gap-4 mt-4">
            <div *ngFor="let provider of careProviders" class="inner-card flex justify-between items-center">
              <div>
                <strong class="text-main">{{ provider.name }}</strong> <span class="text-muted text-sm">({{ provider.role }})</span> <br/>
                <small class="text-muted" *ngIf="provider.phoneNumber">{{ provider.phoneNumber }}</small>
              </div>
              <button (click)="deleteCareProvider(provider.id)" class="btn btn-danger text-xs p-2">Remove</button>
            </div>
          </div>
        </div>

        <!-- Schedule Slots -->
        <div class="glass-card" style="border-top: 4px solid var(--accent);">
          <h3 style="color: var(--accent);" class="mb-4">My Schedule Slots</h3>
          <div class="flex gap-3 mb-4 items-center flex-wrap">
            <select name="slotDay" [(ngModel)]="newSlot.dayOfWeek" class="form-control" style="width: 150px;">
              <option [ngValue]="1" style="color: black;">Monday</option>
              <option [ngValue]="2" style="color: black;">Tuesday</option>
              <option [ngValue]="3" style="color: black;">Wednesday</option>
              <option [ngValue]="4" style="color: black;">Thursday</option>
              <option [ngValue]="5" style="color: black;">Friday</option>
              <option [ngValue]="6" style="color: black;">Saturday</option>
              <option [ngValue]="0" style="color: black;">Sunday</option>
            </select>
            <input type="time" name="slotStart" [(ngModel)]="newSlot.startTime" class="form-control" style="width: 150px;">
            <span class="text-muted">to</span>
            <input type="time" name="slotEnd" [(ngModel)]="newSlot.endTime" class="form-control" style="width: 150px;">
            <button (click)="addScheduleSlot()" class="btn btn-accent">Add Slot</button>
          </div>
          <div *ngIf="scheduleSlots.length === 0" class="text-muted text-sm">No schedule slots added yet.</div>
          <div *ngIf="scheduleSlots.length > 0" class="grid grid-cols-3 gap-4 mt-4">
            <div *ngFor="let slot of scheduleSlots" class="inner-card flex justify-between items-center">
              <div class="text-sm">
                <strong class="text-main">{{ getDayName(slot.dayOfWeek) }}</strong><br>
                <span class="text-muted">{{ slot.startTime }} - {{ slot.endTime }}</span>
              </div>
              <button (click)="deleteScheduleSlot(slot.id)" class="btn btn-danger text-xs p-2">Remove</button>
            </div>
          </div>
        </div>

        <!-- Availability Management -->
        <div class="glass-card" style="border-top: 4px solid #06b6d4;">
          <h3 style="color: #06b6d4;" class="mb-4">Working Hours & Availability</h3>
          <div class="flex gap-3 mb-4 items-center flex-wrap">
            <select name="availDay" [(ngModel)]="newAvail.dayOfWeek" class="form-control" style="width: 140px;">
              <option [ngValue]="1" style="color:black">Monday</option>
              <option [ngValue]="2" style="color:black">Tuesday</option>
              <option [ngValue]="3" style="color:black">Wednesday</option>
              <option [ngValue]="4" style="color:black">Thursday</option>
              <option [ngValue]="5" style="color:black">Friday</option>
              <option [ngValue]="6" style="color:black">Saturday</option>
              <option [ngValue]="0" style="color:black">Sunday</option>
            </select>
            <input type="time" name="availStart" [(ngModel)]="newAvail.startTime" class="form-control" style="width:130px;">
            <span class="text-muted">to</span>
            <input type="time" name="availEnd" [(ngModel)]="newAvail.endTime" class="form-control" style="width:130px;">
            <select name="availSlot" [(ngModel)]="newAvail.slotDurationMinutes" class="form-control" style="width:130px;">
              <option [ngValue]="15" style="color:black">15 min slots</option>
              <option [ngValue]="20" style="color:black">20 min slots</option>
              <option [ngValue]="30" style="color:black">30 min slots</option>
              <option [ngValue]="45" style="color:black">45 min slots</option>
              <option [ngValue]="60" style="color:black">60 min slots</option>
            </select>
            <button (click)="addAvailability()" class="btn btn-primary" id="add-availability-btn">Save</button>
          </div>
          <div *ngIf="availabilities.length === 0" class="text-muted text-sm">No availability set. Add working hours above.</div>
          <div *ngIf="availabilities.length > 0" class="grid grid-cols-3 gap-4 mt-4">
            <div *ngFor="let av of availabilities" class="inner-card flex justify-between items-center">
              <div class="text-sm">
                <strong class="text-main">{{ getDayName(av.dayOfWeek) }}</strong><br>
                <span class="text-muted">{{ av.startTime }} – {{ av.endTime }}</span><br>
                <span style="color:#06b6d4;font-size:0.75rem;">{{ av.slotDurationMinutes }} min slots</span>
              </div>
              <button (click)="deleteAvailability(av.id)" class="btn btn-danger text-xs p-2">Remove</button>
            </div>
          </div>
        </div>

        <!-- Blocked Dates -->
        <div class="glass-card" style="border-top: 4px solid #f59e0b;">
          <h3 style="color: #f59e0b;" class="mb-4">Blocked Dates / Vacation</h3>
          <div class="flex gap-3 mb-4 items-center flex-wrap">
            <input type="date" name="blockedDate" [(ngModel)]="newBlockedDate.blockedDate" class="form-control" style="width:200px;" id="blocked-date-input">
            <input type="text" name="blockedReason" [(ngModel)]="newBlockedDate.reason" placeholder="Reason (e.g. Annual Leave)" class="form-control" style="width:220px;">
            <button (click)="addBlockedDate()" class="btn btn-warning" id="add-blocked-date-btn">Block Date</button>
          </div>
          <div *ngIf="blockedDates.length === 0" class="text-muted text-sm">No blocked dates. Add vacation or off days above.</div>
          <div *ngIf="blockedDates.length > 0" class="flex gap-3 flex-wrap mt-4">
            <div *ngFor="let bd of blockedDates" class="inner-card" style="min-width:180px;">
              <div class="flex justify-between items-start">
                <div>
                  <strong class="text-main text-sm">{{ bd.blockedDate | date:'dd MMM yyyy' }}</strong><br>
                  <span class="text-muted text-xs">{{ bd.reason || 'No reason specified' }}</span>
                </div>
                <button (click)="removeBlockedDate(bd.id)" class="btn btn-danger text-xs p-1">×</button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Consultation View -->
    <div *ngIf="inConsultation && currentConsultation" class="glass-card mt-4" style="border-top: 4px solid var(--primary);">
      <div class="flex justify-between items-center mb-6">
        <h2>Consultation with {{ currentConsultation.patientName }}</h2>
        <button (click)="cancelConsultationView()" class="btn btn-outline text-sm">Back to Dashboard</button>
      </div>

      <div class="grid grid-cols-2 gap-8">
        <div class="flex-col gap-6">
          <div>
            <h4 class="mb-2">Diagnosis</h4>
            <input type="text" [(ngModel)]="consultationData.diagnosis" placeholder="Primary Diagnosis" class="form-control w-full mb-4">
            
            <h4 class="mb-2">Notes (Speech to Text Available)</h4>
            <div class="mb-3">
              <button (click)="toggleSpeech()" class="btn w-full" [ngClass]="speechService.isListening ? 'btn-danger' : 'btn-secondary'">
                <span *ngIf="speechService.isListening">🛑 Stop Listening</span>
                <span *ngIf="!speechService.isListening">🎤 Start Speech to Text</span>
              </button>
            </div>
            <textarea [(ngModel)]="consultationData.notes" rows="6" class="form-control w-full"></textarea>
          </div>
        </div>

        <div class="flex-col gap-6">
          <div>
            <h4 class="mb-4">Vitals (Read Only)</h4>
            <p class="text-sm text-muted mb-4">Vitals are recorded by the Nurse during check-in.</p>
            
            <!-- Vitals would be passed down via currentConsultation if fetched -->
            <div class="inner-card p-3 text-sm" *ngIf="currentConsultation.vitals && currentConsultation.vitals.length > 0">
               <span>Vitals recorded.</span>
            </div>
          </div>

          <div>
            <h4 class="mb-2">Orders</h4>
            <div class="flex gap-2 mb-3">
              <select [(ngModel)]="newOrder.orderType" class="form-control" style="width: 120px;">
                <option value="Lab" style="color: black;">Lab Test</option>
                <option value="Pharmacy" style="color: black;">Pharmacy</option>
              </select>
              <input type="text" [(ngModel)]="newOrder.description" placeholder="Description" class="form-control">
            </div>
            <button (click)="addOrderToConsultation()" class="btn btn-primary w-full text-sm mb-3">Add Order</button>
            
            <ul *ngIf="consultationData.orders.length > 0" class="list-none pl-0 m-0 space-y-2">
               <li *ngFor="let o of consultationData.orders; let j = index" class="inner-card flex justify-between items-center p-2 text-sm">
                  <span><strong>{{ o.orderType }}:</strong> {{ o.description }}</span>
                  <button (click)="consultationData.orders.splice(j, 1)" class="btn btn-danger text-xs p-1" style="min-width: 30px;">X</button>
               </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="mt-8 flex justify-end">
        <button (click)="saveConsultation()" class="btn btn-secondary" style="padding: 12px 32px;">Save Consultation</button>
      </div>
    </div>

    <!-- Appointment Details Modal -->
    <div *ngIf="showDetailsModal && selectedAppointment" class="modal-overlay" (click)="closeDetailsModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">Appointment Details</h3>
            <p class="text-sm text-muted mt-1">ID: #{{ selectedAppointment.id }}</p>
          </div>
          <button class="modal-close-btn" (click)="closeDetailsModal()">&times;</button>
        </div>

        <div class="modal-section">
          <h4 class="modal-section-title">Patient Info</h4>
          <div class="modal-grid">
            <div class="modal-detail-item">
              <span class="modal-detail-label">Name</span>
              <span class="modal-detail-value">{{ selectedAppointment.patientName }}</span>
            </div>
            <div class="modal-detail-item">
              <span class="modal-detail-label">Date & Time</span>
              <span class="modal-detail-value">{{ selectedAppointment.appointmentDate | date:'medium' }}</span>
            </div>
            <div class="modal-detail-item">
              <span class="modal-detail-label">Status</span>
              <span class="modal-detail-value">
                <span class="badge" [ngClass]="(selectedAppointment.status === 'start' || selectedAppointment.status === 'SCHEDULED' || selectedAppointment.status === 'Scheduled') ? 'badge-primary' : 'badge-warning'">
                  {{ selectedAppointment.status }}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div class="modal-section">
          <h4 class="modal-section-title secondary-title">Consultation Notes</h4>
          <div class="inner-card">
            <p class="text-sm" style="white-space: pre-wrap;">{{ selectedAppointment.notes || 'No consultation notes recorded yet.' }}</p>
          </div>
        </div>

        <div class="modal-section">
          <h4 class="modal-section-title accent-title">Vitals History</h4>
          <div *ngIf="!selectedAppointment.vitals || selectedAppointment.vitals.length === 0" class="text-muted text-sm">
            No vitals recorded for this appointment.
          </div>
          <div *ngIf="selectedAppointment.vitals && selectedAppointment.vitals.length > 0" class="flex-col gap-2">
            <div *ngFor="let vital of selectedAppointment.vitals" class="inner-card p-3 text-sm">
              <div class="flex justify-between mb-2">
                <strong class="text-main">Recorded At:</strong>
                <span class="text-muted">{{ vital.recordedAt | date:'medium' }}</span>
              </div>
              <ul class="list-none pl-0 m-0 grid grid-cols-2 gap-2 text-muted">
                <li *ngIf="vital.heartRate">Heart Rate: {{ vital.heartRate }} bpm</li>
                <li *ngIf="vital.bloodPressure">Blood Pressure: {{ vital.bloodPressure }} mmHg</li>
                <li *ngIf="vital.temperature">Temperature: {{ vital.temperature }} °F</li>
                <li *ngIf="vital.weight">Weight: {{ vital.weight }} lbs</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="modal-section">
          <h4 class="modal-section-title">Prescriptions & Orders</h4>
          <div *ngIf="!selectedAppointment.orders || selectedAppointment.orders.length === 0" class="text-muted text-sm">
            No orders or prescriptions recorded for this appointment.
          </div>
          <div *ngIf="selectedAppointment.orders && selectedAppointment.orders.length > 0" class="flex-col gap-2">
            <div *ngFor="let order of selectedAppointment.orders" class="inner-card p-3 text-sm flex justify-between items-start">
              <div>
                <strong class="text-main">{{ order.orderType }}:</strong> {{ order.description }}
              </div>
              <span class="text-muted text-xs">{{ order.createdAt | date:'shortDate' }}</span>
            </div>
          </div>
        </div>

        <div class="flex justify-end mt-6">
          <button (click)="closeDetailsModal()" class="btn btn-outline">Close</button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './doctor-dashboard.css'
})
export class DoctorDashboardComponent implements OnInit, OnDestroy {
  appointments: any[] = [];
  careProviders: any[] = [];
  scheduleSlots: any[] = [];
  availabilities: any[] = [];
  blockedDates: any[] = [];

  newProvider = { name: '', role: '', phoneNumber: '' };
  newSlot = { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isAvailable: true };
  newAvail = { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 };
  newBlockedDate = { blockedDate: '', reason: '' };

  // Consultation View State
  inConsultation = false;
  currentConsultation: any = null;
  consultationData: any = {
    notes: '',
    diagnosis: '',
    orders: []
  };

  newOrder = { orderType: 'Lab', description: '' };

  // Details Modal State
  selectedAppointment: any = null;
  showDetailsModal = false;

  private speechSub!: Subscription;

  constructor(private api: ApiService, public speechService: SpeechRecognitionService) {}

  ngOnInit() {
    this.loadAppointments();
    this.loadCareProviders();
    this.loadScheduleSlots();
    this.loadAvailability();
    this.loadBlockedDates();

    this.speechSub = this.speechService.transcript$.subscribe(text => {
      if (this.consultationData.notes) {
         this.consultationData.notes += ' ' + text;
      } else {
         this.consultationData.notes = text;
      }
    });
  }

  ngOnDestroy() {
    if (this.speechSub) this.speechSub.unsubscribe();
    if (this.speechService.isListening) {
      this.speechService.stop();
    }
  }

  loadAppointments() {
    this.api.getMyAppointments().subscribe({
      next: (data) => this.appointments = data,
      error: (err) => console.error('Failed to load appointments', err)
    });
  }

  // --- Care Providers & Schedule Slots ---
  loadCareProviders() {
    this.api.getCareProviders().subscribe({
      next: (data) => this.careProviders = data,
      error: (err) => console.error('Failed to load care providers', err)
    });
  }

  addCareProvider() {
    if (!this.newProvider.name || !this.newProvider.role) return;
    if (this.newProvider.phoneNumber && !new RegExp('^\\+?[1-9]\\d{1,14}$').test(this.newProvider.phoneNumber)) {
      return alert('Invalid Phone Number');
    }
    this.api.createCareProvider(this.newProvider).subscribe({
      next: (data) => {
        this.careProviders = [...this.careProviders, data];
        this.newProvider = { name: '', role: '', phoneNumber: '' };
      },
      error: (err) => console.error('Failed to add care provider', err)
    });
  }

  deleteCareProvider(id: number) {
    this.api.deleteCareProvider(id).subscribe({
      next: () => this.careProviders = this.careProviders.filter(p => p.id !== id),
      error: (err) => console.error('Failed to delete care provider', err)
    });
  }

  loadScheduleSlots() {
    this.api.getScheduleSlots().subscribe({
      next: (data) => this.scheduleSlots = data,
      error: (err) => console.error('Failed to load schedule slots', err)
    });
  }

  addScheduleSlot() {
    if (!this.newSlot.startTime || !this.newSlot.endTime) return;
    const slotPayload = {
      ...this.newSlot,
      startTime: this.newSlot.startTime.length === 5 ? this.newSlot.startTime + ':00' : this.newSlot.startTime,
      endTime: this.newSlot.endTime.length === 5 ? this.newSlot.endTime + ':00' : this.newSlot.endTime
    };
    this.api.createScheduleSlot(slotPayload).subscribe({
      next: (data) => {
        this.scheduleSlots = [...this.scheduleSlots, data];
        this.newSlot = { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isAvailable: true };
      },
      error: (err) => console.error('Failed to add schedule slot', err)
    });
  }

  deleteScheduleSlot(id: number) {
    this.api.deleteScheduleSlot(id).subscribe({
      next: () => this.scheduleSlots = this.scheduleSlots.filter(s => s.id !== id),
      error: (err) => console.error('Failed to delete schedule slot', err)
    });
  }

  getDayName(dayIndex: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex] || 'Unknown';
  }

  getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      'Pending': 'badge-warning',
      'Confirmed': 'badge-primary',
      'Completed': 'badge-success',
      'Cancelled': 'badge-muted',
      'Rejected': 'badge-danger',
      'NoShow': 'badge-danger',
      'start': 'badge-primary',
      'SCHEDULED': 'badge-primary',
      'Scheduled': 'badge-primary'
    };
    return map[status] || 'badge-muted';
  }

  // ─── Availability ───────────────────────────────────────────────────────────

  loadAvailability() {
    this.api.getAvailability().subscribe({
      next: (data) => this.availabilities = data,
      error: (err) => console.error('Failed to load availability', err)
    });
  }

  addAvailability() {
    if (!this.newAvail.startTime || !this.newAvail.endTime) return;
    const payload = {
      ...this.newAvail,
      startTime: this.newAvail.startTime.length === 5 ? this.newAvail.startTime + ':00' : this.newAvail.startTime,
      endTime: this.newAvail.endTime.length === 5 ? this.newAvail.endTime + ':00' : this.newAvail.endTime
    };
    this.api.createAvailability(payload).subscribe({
      next: () => this.loadAvailability(),
      error: (err) => console.error('Failed to add availability', err)
    });
  }

  deleteAvailability(id: number) {
    this.api.deleteAvailability(id).subscribe({
      next: () => this.availabilities = this.availabilities.filter(a => a.id !== id),
      error: (err) => console.error('Failed to delete availability', err)
    });
  }

  // ─── Blocked Dates ───────────────────────────────────────────────────────────

  loadBlockedDates() {
    this.api.getBlockedDates().subscribe({
      next: (data) => this.blockedDates = data,
      error: (err) => console.error('Failed to load blocked dates', err)
    });
  }

  addBlockedDate() {
    if (!this.newBlockedDate.blockedDate) return;
    this.api.addBlockedDate(this.newBlockedDate).subscribe({
      next: () => { this.loadBlockedDates(); this.newBlockedDate = { blockedDate: '', reason: '' }; },
      error: (err) => console.error('Failed to add blocked date', err)
    });
  }

  removeBlockedDate(id: number) {
    this.api.removeBlockedDate(id).subscribe({
      next: () => this.blockedDates = this.blockedDates.filter(b => b.id !== id),
      error: (err) => console.error('Failed to remove blocked date', err)
    });
  }

  // ─── Appointment Lifecycle Actions ────────────────────────────────────────────

  confirmApt(id: number) {
    this.api.confirmAppointment(id).subscribe({
      next: () => this.loadAppointments(),
      error: (err) => alert(err.error?.message || 'Failed to confirm')
    });
  }

  rejectApt(id: number) {
    this.api.rejectAppointment(id).subscribe({
      next: () => this.loadAppointments(),
      error: (err) => alert(err.error?.message || 'Failed to reject')
    });
  }

  noShowApt(id: number) {
    this.api.markNoShow(id).subscribe({
      next: () => this.loadAppointments(),
      error: (err) => alert(err.error?.message || 'Failed to mark no-show')
    });
  }

  cancelApt(id: number) {
    if (!confirm('Cancel this appointment?')) return;
    this.api.cancelAppointment(id).subscribe({
      next: () => this.loadAppointments(),
      error: (err) => alert(err.error?.message || 'Failed to cancel')
    });
  }

  // --- Consultation Flow ---

  startConsultationView(apt: any) {
    if (!apt.encounterId) {
      alert("No encounter found. Patient must check in first.");
      return;
    }
    this.currentConsultation = apt;
    this.consultationData = {
      notes: apt.notes || '',
      diagnosis: '',
      orders: []
    };
    this.inConsultation = true;
    
    if (apt.encounterStatus !== 'InConsultation') {
      this.api.startConsultation(apt.encounterId).subscribe({
        next: () => console.log('Consultation started in backend'),
        error: (err) => console.error('Failed to start consultation', err)
      });
    }
  }

  cancelConsultationView() {
    if (this.speechService.isListening) {
      this.speechService.stop();
    }
    this.inConsultation = false;
    this.currentConsultation = null;
  }

  toggleSpeech() {
    if (this.speechService.isListening) {
      this.speechService.stop();
    } else {
      this.speechService.start();
    }
  }

  addOrderToConsultation() {
    if (this.newOrder.description) {
      this.consultationData.orders.push({ ...this.newOrder });
      this.newOrder = { orderType: 'Lab', description: '' };
    }
  }

  saveConsultation() {
    this.api.completeConsultation(this.currentConsultation.encounterId, this.consultationData).subscribe({
      next: () => {
        alert('Consultation completed and saved successfully!');
        if (this.speechService.isListening) {
          this.speechService.stop();
        }
        this.inConsultation = false;
        this.currentConsultation = null;
        this.loadAppointments(); // Refresh list
      },
      error: (err) => alert('Failed to complete consultation: ' + (err.error?.message || err.message))
    });
  }

  viewAppointmentDetails(apt: any) {
    this.selectedAppointment = apt;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedAppointment = null;
  }
}
