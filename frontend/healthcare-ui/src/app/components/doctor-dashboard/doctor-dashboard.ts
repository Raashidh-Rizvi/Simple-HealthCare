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
                <span class="badge" [ngClass]="(apt.status === 'start' || apt.status === 'SCHEDULED' || apt.status === 'Scheduled') ? 'badge-primary' : 'badge-warning'">{{ apt.status }}</span>
              </div>
              <p class="text-sm text-muted mb-1"><strong class="text-main">Date:</strong> {{ apt.appointmentDate | date:'medium' }}</p>
              <p class="text-sm text-muted mb-3"><strong class="text-main">Notes:</strong> {{ apt.notes || 'None' }}</p>

              <div *ngIf="apt.vitals && apt.vitals.length > 0" class="mt-3 p-3" style="background: rgba(0,0,0,0.2); border-radius: var(--radius-sm);">
                <strong class="text-sm">Patient Vitals:</strong>
                <ul class="list-none pl-0 m-0 text-sm mt-1 text-muted">
                  <li *ngIf="apt.vitals[0].heartRate">Heart Rate: {{ apt.vitals[0].heartRate }} bpm</li>
                  <li *ngIf="apt.vitals[0].bloodPressure">BP: {{ apt.vitals[0].bloodPressure }} mmHg</li>
                  <li *ngIf="apt.vitals[0].temperature">Temp: {{ apt.vitals[0].temperature }} °F</li>
                  <li *ngIf="apt.vitals[0].weight">Weight: {{ apt.vitals[0].weight }} lbs</li>
                </ul>
              </div>

              <button *ngIf="apt.status === 'start' || apt.status === 'SCHEDULED' || apt.status === 'Scheduled'" (click)="startConsultation(apt); $event.stopPropagation()" class="btn btn-primary mt-4 w-full">Start Consultation</button>
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
            <h4 class="mb-2">Status</h4>
            <select [(ngModel)]="consultationData.status" class="form-control" style="width: 200px;">
              <option value="start" style="color: black;">Start</option>
              <option value="complete" style="color: black;">Complete</option>
              <option value="cancel" style="color: black;">Cancel</option>
            </select>
          </div>

          <div>
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
            <h4 class="mb-4">Vitals</h4>
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label class="form-label text-xs">Heart Rate (bpm)</label>
                <input type="text" [(ngModel)]="newVital.heartRate" placeholder="e.g. 72" class="form-control">
              </div>
              <div>
                <label class="form-label text-xs">Blood Pressure (mmHg)</label>
                <input type="text" [(ngModel)]="newVital.bloodPressure" placeholder="e.g. 120/80" class="form-control">
              </div>
              <div>
                <label class="form-label text-xs">Temperature (°F)</label>
                <input type="text" [(ngModel)]="newVital.temperature" placeholder="e.g. 98.6" class="form-control">
              </div>
              <div>
                <label class="form-label text-xs">Weight (lbs)</label>
                <input type="text" [(ngModel)]="newVital.weight" placeholder="e.g. 150" class="form-control">
              </div>
            </div>
            <button (click)="addVitalToConsultation()" class="btn btn-primary w-full text-sm mb-3">Add Vital</button>
            
            <ul *ngIf="consultationData.vitals.length > 0" class="list-none pl-0 m-0 space-y-2">
               <li *ngFor="let v of consultationData.vitals; let i = index" class="inner-card flex justify-between items-center p-2 text-sm">
                  <span>HR: {{ v.heartRate }} bpm, BP: {{ v.bloodPressure }} mmHg, Temp: {{ v.temperature }} °F, Weight: {{ v.weight }} lbs</span>
                  <button (click)="consultationData.vitals.splice(i, 1)" class="btn btn-danger text-xs p-1" style="min-width: 30px;">X</button>
               </li>
            </ul>
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

  newProvider = { name: '', role: '', phoneNumber: '' };
  newSlot = { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isAvailable: true };

  // Consultation View State
  inConsultation = false;
  currentConsultation: any = null;
  consultationData: any = {
    status: 'start',
    notes: '',
    vitals: [],
    orders: []
  };

  newVital = { heartRate: '', bloodPressure: '', temperature: '', weight: '' };
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

  // --- Consultation Flow ---

  startConsultation(apt: any) {
    this.currentConsultation = apt;
    this.consultationData = {
      status: apt.status || 'start',
      notes: apt.notes || '',
      vitals: [],
      orders: []
    };
    this.inConsultation = true;
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

  addVitalToConsultation() {
    if (this.newVital.heartRate && !new RegExp('^\\d{2,3}$').test(this.newVital.heartRate)) return alert('Invalid Heart Rate (e.g. 72)');
    if (this.newVital.bloodPressure && !new RegExp('^\\d{2,3}/\\d{2,3}$').test(this.newVital.bloodPressure)) return alert('Invalid BP (e.g. 120/80)');
    if (this.newVital.temperature && !new RegExp('^\\d{2,3}(\\.\\d{1,2})?$').test(this.newVital.temperature)) return alert('Invalid Temp (e.g. 98.6)');
    if (this.newVital.weight && !new RegExp('^\\d{2,3}(\\.\\d{1,2})?$').test(this.newVital.weight)) return alert('Invalid Weight (e.g. 150)');

    if (this.newVital.heartRate || this.newVital.bloodPressure || this.newVital.temperature || this.newVital.weight) {
      this.consultationData.vitals.push({ ...this.newVital });
      this.newVital = { heartRate: '', bloodPressure: '', temperature: '', weight: '' };
    }
  }

  addOrderToConsultation() {
    if (this.newOrder.description) {
      this.consultationData.orders.push({ ...this.newOrder });
      this.newOrder = { orderType: 'Lab', description: '' };
    }
  }

  saveConsultation() {
    this.api.saveConsultation(this.currentConsultation.id, this.consultationData).subscribe({
      next: () => {
        alert('Consultation saved successfully!');
        if (this.speechService.isListening) {
          this.speechService.stop();
        }
        this.inConsultation = false;
        this.currentConsultation = null;
        this.loadAppointments(); // Refresh list
      },
      error: (err) => console.error('Failed to save consultation', err)
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
