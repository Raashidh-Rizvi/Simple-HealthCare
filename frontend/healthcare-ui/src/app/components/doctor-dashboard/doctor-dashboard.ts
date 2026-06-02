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
    <div *ngIf="!inConsultation" class="glass-card mt-4">
      <div class="flex justify-between items-center mb-6">
        <h2>Doctor Dashboard</h2>
      </div>

      <div class="flex-col gap-4">
        <div class="glass-card" style="background: rgba(16, 185, 129, 0.1);">
          <h3 style="color: var(--secondary)">Scheduled Appointments</h3>
          
          <div *ngIf="appointments.length === 0" class="mt-4 text-muted">
            You have 0 scheduled appointments.
          </div>

          <div *ngIf="appointments.length > 0" class="mt-4">
            <div *ngFor="let apt of appointments" class="glass-card mt-2" style="padding: 12px;">
              <strong>Patient:</strong> {{ apt.patientName }} <br/>
              <strong>Date:</strong> {{ apt.appointmentDate | date:'medium' }} <br/>
              <strong>Status:</strong> {{ apt.status }} <br/>
              <strong>Notes:</strong> {{ apt.notes || 'None' }} <br/>

              <div *ngIf="apt.vitals && apt.vitals.length > 0" class="mt-2 p-2" style="background: rgba(255,255,255,0.05); border-radius: 6px;">
                <strong>Patient Vitals:</strong>
                <ul class="list-none pl-0 m-0 text-sm mt-1">
                  <li *ngIf="apt.vitals[0].heartRate">Heart Rate: {{ apt.vitals[0].heartRate }}</li>
                  <li *ngIf="apt.vitals[0].bloodPressure">BP: {{ apt.vitals[0].bloodPressure }}</li>
                  <li *ngIf="apt.vitals[0].temperature">Temp: {{ apt.vitals[0].temperature }}</li>
                  <li *ngIf="apt.vitals[0].weight">Weight: {{ apt.vitals[0].weight }}</li>
                </ul>
              </div>

              <button *ngIf="apt.status === 'Scheduled'" (click)="startConsultation(apt)" class="btn btn-primary mt-4" style="padding: 8px 16px; border-radius: 6px; border: none; background: #3b82f6; color: white; cursor: pointer;">Start Consultation</button>
            </div>
          </div>
        </div>

        <div class="glass-card mt-4" style="background: rgba(59, 130, 246, 0.1);">
          <h3 style="color: var(--primary)">Care Providers</h3>
          <div class="flex gap-2 mt-4 flex-wrap">
            <input type="text" [(ngModel)]="newProvider.name" placeholder="Name" class="form-control" style="width: 200px; padding: 8px; border-radius: 4px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white;">
            <input type="text" [(ngModel)]="newProvider.role" placeholder="Role (e.g., Nurse)" class="form-control" style="width: 200px; padding: 8px; border-radius: 4px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white;">
            <input type="text" [(ngModel)]="newProvider.phoneNumber" placeholder="Phone (optional)" class="form-control" style="width: 200px; padding: 8px; border-radius: 4px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white;">
            <button (click)="addCareProvider()" class="btn btn-primary" style="padding: 8px 16px; border-radius: 6px; border: none; background: #3b82f6; color: white; cursor: pointer;">Add Provider</button>
          </div>
          <div *ngIf="careProviders.length === 0" class="mt-4 text-muted">No care providers added yet.</div>
          <div *ngIf="careProviders.length > 0" class="mt-4">
            <div *ngFor="let provider of careProviders" class="glass-card mt-2 flex justify-between items-center" style="padding: 12px;">
              <div>
                <strong>{{ provider.name }}</strong> ({{ provider.role }}) <br/>
                <small *ngIf="provider.phoneNumber">{{ provider.phoneNumber }}</small>
              </div>
              <button (click)="deleteCareProvider(provider.id)" class="btn" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Remove</button>
            </div>
          </div>
        </div>

        <div class="glass-card mt-4" style="background: rgba(245, 158, 11, 0.1);">
          <h3 style="color: #f59e0b">My Schedule Slots</h3>
          <div class="flex gap-2 mt-4 items-center flex-wrap">
            <select [(ngModel)]="newSlot.dayOfWeek" class="form-control" style="width: 150px; padding: 8px; border-radius: 4px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white;">
              <option [ngValue]="1" style="color: black;">Monday</option>
              <option [ngValue]="2" style="color: black;">Tuesday</option>
              <option [ngValue]="3" style="color: black;">Wednesday</option>
              <option [ngValue]="4" style="color: black;">Thursday</option>
              <option [ngValue]="5" style="color: black;">Friday</option>
              <option [ngValue]="6" style="color: black;">Saturday</option>
              <option [ngValue]="0" style="color: black;">Sunday</option>
            </select>
            <input type="time" [(ngModel)]="newSlot.startTime" class="form-control" style="width: 150px; padding: 8px; border-radius: 4px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white;">
            <span style="color: white;">to</span>
            <input type="time" [(ngModel)]="newSlot.endTime" class="form-control" style="width: 150px; padding: 8px; border-radius: 4px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white;">
            <button (click)="addScheduleSlot()" class="btn" style="padding: 8px 16px; border-radius: 6px; border: none; background: #f59e0b; color: white; cursor: pointer;">Add Slot</button>
          </div>
          <div *ngIf="scheduleSlots.length === 0" class="mt-4 text-muted">No schedule slots added yet.</div>
          <div *ngIf="scheduleSlots.length > 0" class="mt-4">
            <div *ngFor="let slot of scheduleSlots" class="glass-card mt-2 flex justify-between items-center" style="padding: 12px;">
              <div>
                <strong>{{ getDayName(slot.dayOfWeek) }}</strong>: {{ slot.startTime }} - {{ slot.endTime }}
              </div>
              <button (click)="deleteScheduleSlot(slot.id)" class="btn" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Remove</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Consultation View -->
    <div *ngIf="inConsultation && currentConsultation" class="glass-card mt-4" style="background: rgba(59, 130, 246, 0.15);">
      <div class="flex justify-between items-center mb-6">
        <h2>Consultation with {{ currentConsultation.patientName }}</h2>
        <button (click)="cancelConsultationView()" class="btn btn-secondary" style="padding: 8px 16px; border-radius: 6px; border: none; background: #6b7280; color: white; cursor: pointer;">Back to Dashboard</button>
      </div>

      <div class="mt-4">
        <h4>Status</h4>
        <select [(ngModel)]="consultationData.status" class="form-control" style="width: 200px; padding: 8px; border-radius: 4px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white;">
          <option value="Scheduled" style="color: black;">Scheduled</option>
          <option value="Completed" style="color: black;">Completed</option>
          <option value="Cancelled" style="color: black;">Cancelled</option>
        </select>
      </div>

      <div class="mt-4">
        <h4>Notes (Speech to Text Available)</h4>
        <div class="flex items-center gap-2 mb-2">
          <button (click)="toggleSpeech()" class="btn" [ngStyle]="{'background': speechService.isListening ? '#ef4444' : '#10b981', 'color': 'white', 'border': 'none', 'padding': '8px 16px', 'border-radius': '6px', 'cursor': 'pointer'}">
            {{ speechService.isListening ? '🛑 Stop Listening' : '🎤 Start Speech to Text' }}
          </button>
        </div>
        <textarea [(ngModel)]="consultationData.notes" rows="4" class="form-control w-full" style="width: 100%; padding: 8px; border-radius: 4px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; font-family: inherit;"></textarea>
      </div>

      <div class="mt-4">
        <h4>Vitals</h4>
        <div class="flex gap-2 flex-wrap">
          <input type="text" [(ngModel)]="newVital.heartRate" placeholder="Heart Rate" class="form-control" style="width: 150px; padding: 8px; border-radius: 4px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white;">
          <input type="text" [(ngModel)]="newVital.bloodPressure" placeholder="BP" class="form-control" style="width: 150px; padding: 8px; border-radius: 4px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white;">
          <input type="text" [(ngModel)]="newVital.temperature" placeholder="Temp" class="form-control" style="width: 150px; padding: 8px; border-radius: 4px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white;">
          <input type="text" [(ngModel)]="newVital.weight" placeholder="Weight" class="form-control" style="width: 150px; padding: 8px; border-radius: 4px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white;">
          <button (click)="addVitalToConsultation()" class="btn" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Add Vital</button>
        </div>
        <ul *ngIf="consultationData.vitals.length > 0" class="mt-2 text-sm pl-4" style="color: white;">
           <li *ngFor="let v of consultationData.vitals; let i = index">
              HR: {{ v.heartRate }}, BP: {{ v.bloodPressure }}, Temp: {{ v.temperature }}, Weight: {{ v.weight }}
              <button (click)="consultationData.vitals.splice(i, 1)" style="background: transparent; color: #ef4444; border: none; cursor: pointer; font-weight: bold;">[x]</button>
           </li>
        </ul>
      </div>

      <div class="mt-4">
        <h4>Orders</h4>
        <div class="flex gap-2 flex-wrap">
          <select [(ngModel)]="newOrder.orderType" class="form-control" style="width: 150px; padding: 8px; border-radius: 4px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white;">
            <option value="Lab" style="color: black;">Lab Test</option>
            <option value="Pharmacy" style="color: black;">Pharmacy</option>
          </select>
          <input type="text" [(ngModel)]="newOrder.description" placeholder="Description (e.g. Blood Test)" class="form-control" style="width: 250px; padding: 8px; border-radius: 4px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white;">
          <button (click)="addOrderToConsultation()" class="btn" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Add Order</button>
        </div>
        <ul *ngIf="consultationData.orders.length > 0" class="mt-2 text-sm pl-4" style="color: white;">
           <li *ngFor="let o of consultationData.orders; let j = index">
              <strong>{{ o.orderType }}:</strong> {{ o.description }}
              <button (click)="consultationData.orders.splice(j, 1)" style="background: transparent; color: #ef4444; border: none; cursor: pointer; font-weight: bold;">[x]</button>
           </li>
        </ul>
      </div>

      <div class="mt-6 flex justify-end">
        <button (click)="saveConsultation()" class="btn" style="background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: bold;">Save Consultation</button>
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
    status: 'Scheduled',
    notes: '',
    vitals: [],
    orders: []
  };

  newVital = { heartRate: '', bloodPressure: '', temperature: '', weight: '' };
  newOrder = { orderType: 'Lab', description: '' };

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
    this.api.createCareProvider(this.newProvider).subscribe({
      next: (data) => {
        this.careProviders.push(data);
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
      next: (data) => this.scheduleSlots.push(data),
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
      status: apt.status || 'Scheduled',
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
}
