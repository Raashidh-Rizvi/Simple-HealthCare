import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpeechRecognitionService } from '../../../services/speech-recognition.service';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-consultation-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  template: `
    <div class="consultation-workspace">
      <!-- Left Panel: Patient Summary -->
      <div class="panel">
        <div class="panel-header">
          <h3>Patient Summary</h3>
        </div>
        <div class="panel-content">
          <div class="patient-profile">
            <div class="patient-avatar">{{ getInitials(patient.name) }}</div>
            <div>
              <h2 class="font-bold text-lg m-0">{{ patient.name }}</h2>
              <p class="text-sm text-muted m-0">{{ patient.age }} yrs • {{ patient.gender }}</p>
              <p class="text-xs text-muted mt-1">ID: #{{ patient.id }}</p>
            </div>
          </div>
          
          <div class="mb-6">
            <h4 class="text-sm font-semibold mb-3 text-muted">Vitals (Last Recorded)</h4>
            <div class="grid grid-cols-2 gap-2">
              <div class="vital-box">
                <div class="vital-label">BP</div>
                <div class="vital-value" [class.critical]="isCriticalBP(vitals.bp)">{{ vitals.bp || '--' }}</div>
              </div>
              <div class="vital-box">
                <div class="vital-label">Pulse</div>
                <div class="vital-value">{{ vitals.pulse || '--' }}</div>
              </div>
              <div class="vital-box">
                <div class="vital-label">Temp</div>
                <div class="vital-value">{{ vitals.temp || '--' }}</div>
              </div>
              <div class="vital-box">
                <div class="vital-label">Weight</div>
                <div class="vital-value">{{ vitals.weight || '--' }}</div>
              </div>
            </div>
          </div>
          
          <div class="mb-4">
            <h4 class="text-sm font-semibold mb-2 text-muted">Allergies</h4>
            <div class="flex flex-wrap gap-2">
              <span *ngFor="let allergy of patient.allergies" class="badge badge-danger">{{ allergy }}</span>
              <span *ngIf="!patient.allergies?.length" class="text-sm text-muted">No known allergies</span>
            </div>
          </div>
          
          <div>
            <h4 class="text-sm font-semibold mb-2 text-muted">Chronic Conditions</h4>
            <div class="flex flex-wrap gap-2">
              <span *ngFor="let condition of patient.conditions" class="badge badge-warning">{{ condition }}</span>
              <span *ngIf="!patient.conditions?.length" class="text-sm text-muted">None recorded</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Center Panel: Clinical Notes -->
      <div class="panel">
        <div class="panel-header flex justify-between items-center">
          <h3>Clinical Notes</h3>
          <button (click)="toggleSpeech()" class="btn btn-xs" [ngClass]="speechService.isListening ? 'btn-danger' : 'btn-outline'">
            <span *ngIf="speechService.isListening">🛑 Stop</span>
            <span *ngIf="!speechService.isListening">🎤 Dictate</span>
          </button>
        </div>
        <div class="panel-content flex-col gap-4">
          <div class="form-group mb-0">
            <label class="form-label">Chief Complaint</label>
            <input type="text" [(ngModel)]="notes.chiefComplaint" class="form-control" placeholder="Primary reason for visit...">
          </div>
          <div class="form-group mb-0">
            <label class="form-label">History of Present Illness (HPI)</label>
            <textarea [(ngModel)]="notes.hpi" rows="3" class="form-control" placeholder="Patient reports..."></textarea>
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Assessment / Diagnosis</label>
            <textarea [(ngModel)]="notes.assessment" rows="2" class="form-control" placeholder="Enter diagnosis..."></textarea>
          </div>
          <div class="form-group mb-0 flex-1 flex flex-col">
            <label class="form-label">Plan</label>
            <textarea [(ngModel)]="notes.plan" class="form-control flex-1" style="min-height: 100px;" placeholder="Treatment plan..."></textarea>
          </div>
          <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-700">
            <button class="btn btn-outline" (click)="onCancel.emit()">Cancel</button>
            <button class="btn btn-secondary" (click)="onComplete.emit({ notes: notes, prescriptions: currentPrescriptions, orderedLabs: orderedLabs })">Complete Consultation</button>
          </div>
        </div>
      </div>

      <!-- Right Panel: Historical & Orders -->
      <div class="panel">
        <div class="tabs">
          <div class="tab" [class.active]="activeTab === 'history'" (click)="activeTab = 'history'">History</div>
          <div class="tab" [class.active]="activeTab === 'vitals'" (click)="activeTab = 'vitals'">Vitals</div>
          <div class="tab" [class.active]="activeTab === 'meds'" (click)="activeTab = 'meds'">Meds</div>
          <div class="tab" [class.active]="activeTab === 'labs'" (click)="activeTab = 'labs'">Labs</div>
        </div>
        <div class="panel-content">
          <!-- History Tab -->
          <div *ngIf="activeTab === 'history'" class="flex-col gap-4">
            <div *ngFor="let visit of history" class="inner-card">
              <div class="flex justify-between items-center mb-1">
                <strong class="text-sm">{{ visit.date }}</strong>
                <span class="badge badge-muted">{{ visit.type }}</span>
              </div>
              <p class="text-xs text-muted mb-2">{{ visit.diagnosis }}</p>
              <button (click)="viewHistoryDetails(visit)" class="text-xs text-primary bg-transparent border-none cursor-pointer hover:underline p-0">View Details</button>
            </div>
          </div>
          
          <!-- Vitals Tab -->
          <div *ngIf="activeTab === 'vitals'" class="flex-col gap-4 overflow-y-auto" style="max-height: 400px; padding-right: 8px;">
             <!-- Unverified Patient Vitals -->
             <div *ngIf="patientSubmittedVitals && patientSubmittedVitals.length > 0" class="mb-4">
               <h4 class="text-sm font-semibold mb-2 text-warning flex items-center gap-2">⚠️ Patient Submitted Vitals (Pending Verification)</h4>
               <div *ngFor="let v of patientSubmittedVitals" class="inner-card border-warning p-3 mb-2">
                 <div class="flex justify-between text-xs text-muted mb-2">
                   <span>Recorded: {{ v.recordedAt | date:'short' }}</span>
                   <span>Source: {{ v.source }}</span>
                 </div>
                 <div class="grid grid-cols-2 gap-2 text-sm">
                   <div *ngIf="v.bloodPressureSystolic">BP: {{ v.bloodPressureSystolic }}/{{ v.bloodPressureDiastolic }}</div>
                   <div *ngIf="v.heartRate">HR: {{ v.heartRate }} bpm</div>
                   <div *ngIf="v.temperature">Temp: {{ v.temperature }} °C</div>
                   <div *ngIf="v.weightKg">Weight: {{ v.weightKg }} kg</div>
                 </div>
                 <button class="btn btn-outline btn-xs w-full mt-3" style="border-color: var(--accent); color: var(--accent);" (click)="verifyVital.emit(v.id)">Verify Readings</button>
               </div>
             </div>

             <!-- Record New Vitals Form -->
             <h4 class="text-sm font-semibold mb-2 text-primary">Record Clinical Vitals</h4>
             <div class="inner-card p-3">
               <div class="grid grid-cols-2 gap-3">
                 <div class="form-group mb-0">
                   <label class="form-label text-xs">Sys BP</label>
                   <input type="number" class="form-control form-control-sm" [(ngModel)]="newVitalForm.bloodPressureSystolic" placeholder="120">
                 </div>
                 <div class="form-group mb-0">
                   <label class="form-label text-xs">Dia BP</label>
                   <input type="number" class="form-control form-control-sm" [(ngModel)]="newVitalForm.bloodPressureDiastolic" placeholder="80">
                 </div>
                 <div class="form-group mb-0">
                   <label class="form-label text-xs">Heart Rate</label>
                   <input type="number" class="form-control form-control-sm" [(ngModel)]="newVitalForm.heartRate" placeholder="72">
                 </div>
                 <div class="form-group mb-0">
                   <label class="form-label text-xs">Resp Rate</label>
                   <input type="number" class="form-control form-control-sm" [(ngModel)]="newVitalForm.respiratoryRate" placeholder="16">
                 </div>
                 <div class="form-group mb-0">
                   <label class="form-label text-xs">Temp (°C)</label>
                   <input type="number" class="form-control form-control-sm" [(ngModel)]="newVitalForm.temperature" placeholder="37.0">
                 </div>
                 <div class="form-group mb-0">
                   <label class="form-label text-xs">Weight (kg)</label>
                   <input type="number" class="form-control form-control-sm" [(ngModel)]="newVitalForm.weightKg" placeholder="70.5">
                 </div>
                 <div class="form-group mb-0">
                   <label class="form-label text-xs">Height (cm)</label>
                   <input type="number" class="form-control form-control-sm" [(ngModel)]="newVitalForm.heightCm" placeholder="175">
                 </div>
                 <div class="form-group mb-0">
                   <label class="form-label text-xs">SpO2 (%)</label>
                   <input type="number" class="form-control form-control-sm" [(ngModel)]="newVitalForm.oxygenSaturation" placeholder="98">
                 </div>
               </div>
               <button class="btn btn-primary btn-sm w-full mt-4" (click)="submitClinicalVitals()">Save Clinical Vitals</button>
             </div>

             <!-- Vitals Trends Graph (Placeholder for Chart.js) -->
             <div class="mt-4" *ngIf="lineChartData.datasets.length > 0">
               <h4 class="text-sm font-semibold mb-2 text-muted">Vitals History & Trends (Sys BP & Temp)</h4>
               <div class="inner-card p-4" style="height: 250px;">
                 <canvas baseChart
                   [data]="lineChartData"
                   [options]="lineChartOptions"
                   [type]="lineChartType">
                 </canvas>
               </div>
             </div>
             <div class="mt-4" *ngIf="lineChartData.datasets.length === 0">
               <h4 class="text-sm font-semibold mb-2 text-muted">Vitals History & Trends</h4>
               <div class="inner-card p-4 text-center text-muted text-sm">
                 Not enough data for trends.
               </div>
             </div>
          </div>
          
          <!-- Meds Tab (Medication Module) -->
          <div *ngIf="activeTab === 'meds'" class="flex-col gap-4">
            <div class="form-group">
              <input type="text" class="form-control" placeholder="Search medications...">
            </div>
            <div class="inner-card bg-opacity-10 border-primary">
              <div class="flex justify-between items-center mb-2">
                <strong class="text-main">Paracetamol</strong>
                <span class="text-xs text-muted">500mg</span>
              </div>
              <div class="flex gap-2 mb-2">
                <select class="form-control form-control-sm text-xs p-1 h-auto"><option>Twice Daily</option></select>
                <select class="form-control form-control-sm text-xs p-1 h-auto"><option>5 Days</option></select>
              </div>
              <button (click)="addPrescription()" class="btn btn-primary w-full btn-xs">Add Prescription</button>
            </div>
            
            <h4 class="text-sm font-semibold mt-4 mb-2 text-muted">Current Prescriptions</h4>
            <div *ngIf="currentPrescriptions.length === 0" class="text-xs text-muted text-center p-4">No prescriptions added yet.</div>
            <div *ngIf="currentPrescriptions.length > 0" class="flex-col gap-2">
               <div *ngFor="let p of currentPrescriptions; let i = index" class="inner-card p-2 flex justify-between items-center text-sm">
                  <div>
                    <strong>{{ p.name }}</strong> {{ p.dosage }}<br>
                    <span class="text-xs text-muted">{{ p.frequency }} for {{ p.duration }}</span>
                  </div>
                  <button (click)="currentPrescriptions.splice(i, 1)" class="btn btn-danger btn-xs p-1">X</button>
               </div>
            </div>
          </div>
          
          <div *ngIf="activeTab === 'labs'" class="flex-col gap-4">
             <div class="grid grid-cols-2 gap-2">
               <button (click)="orderLab('CBC')" class="btn btn-outline btn-xs justify-start">CBC</button>
               <button (click)="orderLab('HbA1c')" class="btn btn-outline btn-xs justify-start">HbA1c</button>
               <button (click)="orderLab('Lipid Profile')" class="btn btn-outline btn-xs justify-start">Lipid Profile</button>
               <button (click)="orderLab('LFT')" class="btn btn-outline btn-xs justify-start">LFT</button>
             </div>
             
             <h4 class="text-sm font-semibold mt-4 mb-2 text-muted">Ordered Labs</h4>
             <div *ngIf="orderedLabs.length === 0" class="text-xs text-muted text-center p-4">No labs ordered yet.</div>
             <div *ngIf="orderedLabs.length > 0" class="flex-col gap-2">
                <div *ngFor="let lab of orderedLabs; let j = index" class="inner-card p-2 flex justify-between items-center text-sm">
                   <span>{{ lab }}</span>
                   <button (click)="orderedLabs.splice(j, 1)" class="btn btn-danger btn-xs p-1">X</button>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './consultation-workspace.css'
})
export class ConsultationWorkspaceComponent {
  @Input() patient: any;
  @Input() vitals: any = {};
  @Input() history: any[] = [];
  
  @Output() onComplete = new EventEmitter<any>();
  @Output() onCancel = new EventEmitter<void>();
  @Output() onSaveVitals = new EventEmitter<any>();
  @Output() verifyVital = new EventEmitter<number>();

  @Input() patientSubmittedVitals: any[] = [];
  
  newVitalForm: any = {};

  activeTab = 'vitals';
  
  // Chart Configuration
  lineChartData: ChartConfiguration['data'] = {
    datasets: [],
    labels: []
  };
  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { position: 'left', beginAtZero: false },
      y1: { position: 'right', beginAtZero: false, grid: { drawOnChartArea: false } }
    }
  };
  lineChartType: ChartType = 'line';

  notes = {
    chiefComplaint: '',
    hpi: '',
    assessment: '',
    plan: ''
  };

  currentPrescriptions: any[] = [];
  orderedLabs: string[] = [];

  constructor(public speechService: SpeechRecognitionService) {}

  getInitials(name: string): string {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  isCriticalBP(bp: string): boolean {
    if (!bp) return false;
    const parts = bp.split('/');
    if (parts.length === 2) {
      const systolic = parseInt(parts[0]);
      const diastolic = parseInt(parts[1]);
      return systolic > 140 || diastolic > 90;
    }
    return false;
  }
  
  toggleSpeech() {
    if (this.speechService.isListening) {
      this.speechService.stop();
    } else {
      this.speechService.start();
    }
  }

  viewHistoryDetails(visit: any) {
    alert('Viewing details for visit on ' + visit.date);
  }

  addPrescription() {
    this.currentPrescriptions.push({ name: 'Paracetamol', dosage: '500mg', frequency: 'Twice Daily', duration: '5 Days' });
  }

  orderLab(lab: string) {
    if (!this.orderedLabs.includes(lab)) {
      this.orderedLabs.push(lab);
    }
  }

  submitClinicalVitals() {
    this.onSaveVitals.emit({
      ...this.newVitalForm,
      isHomeReading: false
    });
    this.newVitalForm = {}; // clear form
  }

  @Input() set patientVitalsHistory(history: any[]) {
    if (!history || history.length === 0) return;
    
    // Reverse so oldest is first for chart
    const data = [...history].reverse();
    
    this.lineChartData = {
      labels: data.map(v => new Date(v.recordedAt).toLocaleDateString()),
      datasets: [
        {
          data: data.map(v => v.bloodPressureSystolic || null),
          label: 'Sys BP',
          borderColor: '#ef4444',
          tension: 0.3,
          yAxisID: 'y'
        },
        {
          data: data.map(v => v.temperature || null),
          label: 'Temp (°C)',
          borderColor: '#f59e0b',
          tension: 0.3,
          yAxisID: 'y1'
        }
      ]
    };
  }
}
