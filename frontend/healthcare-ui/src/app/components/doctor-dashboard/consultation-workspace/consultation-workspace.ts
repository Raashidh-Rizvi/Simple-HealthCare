import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpeechRecognitionService } from '../../../services/speech-recognition.service';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { Subscription } from 'rxjs';
import { VideoCallComponent } from '../../video-call/video-call.component';

Chart.register(...registerables);

@Component({
  selector: 'app-consultation-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, VideoCallComponent],
  template: `
    <div class="consultation-workspace">
      <!-- Video Call Overlay -->
      <app-video-call *ngIf="isVideoCallActive" 
                      [callId]="'appointment-' + patient.appointmentId" 
                      (callEnded)="isVideoCallActive = false">
      </app-video-call>
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
            <h4 class="text-sm font-semibold mb-3 text-muted flex justify-between items-center">
              Vitals (Last Recorded)
              <button class="btn btn-outline btn-xs" (click)="isVitalsModalOpen = true">+ Add</button>
            </h4>
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
            <h4 class="text-sm font-semibold mb-2 text-muted flex justify-between items-center">
              Allergies
              <button class="btn btn-outline btn-xs" (click)="addAllergy()" *ngIf="!isAddingAllergy">+ Add</button>
            </h4>
            <div *ngIf="isAddingAllergy" class="flex gap-2 mb-2">
              <input type="text" class="form-control form-control-sm" [(ngModel)]="newAllergy" placeholder="Add allergy...">
              <button class="btn btn-primary btn-xs" (click)="saveAllergy()">Save</button>
              <button class="btn btn-outline btn-xs" (click)="isAddingAllergy = false">Cancel</button>
            </div>
            <div class="flex flex-wrap gap-2">
              <span *ngFor="let allergy of patient.allergies" class="badge badge-danger">{{ allergy }}</span>
              <span *ngIf="!patient.allergies?.length" class="text-sm text-muted">No known allergies</span>
            </div>
          </div>
          
          <div>
            <h4 class="text-sm font-semibold mb-2 text-muted flex justify-between items-center">
              Chronic Conditions
              <button class="btn btn-outline btn-xs" (click)="addCondition()" *ngIf="!isAddingCondition">+ Add</button>
            </h4>
            <div *ngIf="isAddingCondition" class="flex gap-2 mb-2">
              <input type="text" class="form-control form-control-sm" [(ngModel)]="newCondition" placeholder="Add condition...">
              <button class="btn btn-primary btn-xs" (click)="saveCondition()">Save</button>
              <button class="btn btn-outline btn-xs" (click)="isAddingCondition = false">Cancel</button>
            </div>
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
          <div class="flex gap-2">
            <button (click)="startVideoCall()" class="btn btn-xs btn-primary">
              📹 Start Video Call
            </button>
            <button (click)="toggleSpeech()" class="btn btn-xs" [ngClass]="speechService.isListening ? 'btn-danger' : 'btn-outline'">
              <span *ngIf="speechService.isListening">🛑 Stop</span>
              <span *ngIf="!speechService.isListening">🎤 Dictate</span>
            </button>
          </div>
        </div>
        <div class="panel-content flex-col gap-4">
          <div *ngIf="speechService.isListening" class="text-xs text-warning mb-2 animate-pulse">
            🎤 Listening... dictating into {{ getActiveFieldLabel() }}
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Chief Complaint</label>
            <input type="text" [(ngModel)]="notes.chiefComplaint" (focus)="activeField = 'chiefComplaint'" class="form-control" placeholder="Primary reason for visit...">
          </div>
          <div class="form-group mb-0">
            <label class="form-label">History of Present Illness (HPI)</label>
            <textarea [(ngModel)]="notes.hpi" (focus)="activeField = 'hpi'" rows="3" class="form-control" placeholder="Patient reports..."></textarea>
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Assessment / Diagnosis</label>
            <textarea [(ngModel)]="notes.assessment" (focus)="activeField = 'assessment'" rows="2" class="form-control" placeholder="Enter diagnosis..."></textarea>
          </div>
          <div class="form-group mb-0 flex-1 flex flex-col">
            <label class="form-label">Plan</label>
            <textarea [(ngModel)]="notes.plan" (focus)="activeField = 'plan'" class="form-control flex-1" style="min-height: 100px;" placeholder="Treatment plan..."></textarea>
          </div>
          <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-700">
            <button class="btn btn-outline" (click)="onCancel.emit()">Cancel</button>
            <button class="btn btn-primary" (click)="onSave.emit({ notes: notes, prescriptions: currentPrescriptions, orderedLabs: orderedLabs, allergies: patient.allergies, conditions: patient.conditions })">Save Draft</button>
            <button class="btn btn-secondary" (click)="onComplete.emit({ notes: notes, prescriptions: currentPrescriptions, orderedLabs: orderedLabs, allergies: patient.allergies, conditions: patient.conditions })">Complete Consultation</button>
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
          <div class="tab" [class.active]="activeTab === 'imaging'" (click)="activeTab = 'imaging'">Imaging</div>
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
                   <div>BP: {{ v.bloodPressureSystolic ? v.bloodPressureSystolic + '/' + v.bloodPressureDiastolic : 'Not added' }}</div>
                   <div>HR: {{ v.heartRate ? v.heartRate + ' bpm' : 'Not added' }}</div>
                   <div>Temp: {{ v.temperature ? v.temperature + ' °C' : 'Not added' }}</div>
                   <div>Weight: {{ v.weightKg ? v.weightKg + ' kg' : 'Not added' }}</div>
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
          
          <!-- Imaging Tab -->
          <div *ngIf="activeTab === 'imaging'" class="flex-col gap-4">
             <h4 class="text-sm font-semibold mt-2 mb-2 text-muted">Imaging Reports</h4>
             <div class="grid grid-cols-2 gap-4">
               <div class="inner-card p-3">
                 <div class="flex justify-between items-start mb-2">
                   <div>
                     <h5 class="m-0 font-bold text-main">Chest X-Ray</h5>
                     <span class="text-xs text-muted">2026-01-05</span>
                   </div>
                 </div>
                 <p class="text-xs m-0 mt-1 mb-3 text-main">Clear, no abnormalities detected.</p>
                 <div class="bg-gray-800 rounded p-2 text-center cursor-pointer hover:bg-gray-700 transition" style="height: 100px; display: flex; align-items: center; justify-content: center; border: 1px dashed rgba(255,255,255,0.2);">
                   <span class="text-2xl">🖼️</span>
                   <span class="ml-2 text-xs text-muted">View Image</span>
                 </div>
               </div>
               <div class="inner-card p-3">
                 <div class="flex justify-between items-start mb-2">
                   <div>
                     <h5 class="m-0 font-bold text-main">MRI - Brain</h5>
                     <span class="text-xs text-muted">2025-08-12</span>
                   </div>
                 </div>
                 <p class="text-xs m-0 mt-1 mb-3 text-main">No acute intracranial pathology.</p>
                 <div class="bg-gray-800 rounded p-2 text-center cursor-pointer hover:bg-gray-700 transition" style="height: 100px; display: flex; align-items: center; justify-content: center; border: 1px dashed rgba(255,255,255,0.2);">
                   <span class="text-2xl">🖼️</span>
                   <span class="ml-2 text-xs text-muted">View Image</span>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>

      <!-- History Details Modal Overlay -->
      <div *ngIf="isHistoryModalOpen && selectedHistoryVisit" class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000;" (click)="isHistoryModalOpen = false">
        <div class="inner-card p-4" style="background: #1e293b; width: 600px; max-width: 90%; max-height: 90vh; overflow-y: auto; border: 1px solid #334155; border-radius: 8px;" (click)="$event.stopPropagation()">
          <div class="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
            <div>
              <h3 class="m-0 text-main">Visit Details - {{ selectedHistoryVisit.date }}</h3>
              <p class="text-xs text-muted m-0 mt-1">Type: {{ selectedHistoryVisit.type }}</p>
            </div>
            <button class="btn btn-sm" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer;" (click)="isHistoryModalOpen = false">&times;</button>
          </div>
          
          <div class="mb-4">
            <h4 class="text-sm font-semibold mb-2 text-primary">Reason for Visit</h4>
            <div class="inner-card p-3 text-sm">
              {{ selectedHistoryVisit.reason || 'No reason provided' }}
            </div>
          </div>

          <div class="mb-4">
            <h4 class="text-sm font-semibold mb-2 text-primary">Consultation Notes</h4>
            <div class="inner-card p-3 text-sm" style="white-space: pre-wrap;">{{ selectedHistoryVisit.notes || 'No notes available' }}</div>
          </div>

          <div class="mb-4">
            <h4 class="text-sm font-semibold mb-2 text-primary">Diagnosis</h4>
            <div class="inner-card p-3 text-sm">
              {{ selectedHistoryVisit.diagnosis || 'No diagnosis recorded' }}
            </div>
          </div>

          <div class="mb-4">
            <h4 class="text-sm font-semibold mb-2 text-primary">Past Vital History</h4>
            <div *ngIf="!selectedHistoryVisit.vitals || selectedHistoryVisit.vitals.length === 0" class="text-xs text-muted">No vitals recorded for this visit.</div>
            <div *ngIf="selectedHistoryVisit.vitals && selectedHistoryVisit.vitals.length > 0" class="flex-col gap-2">
              <div *ngFor="let vital of selectedHistoryVisit.vitals" class="inner-card p-3 text-sm">
                 <div class="grid grid-cols-2 gap-2 text-muted">
                    <div>BP: {{ vital.bloodPressureSystolic ? vital.bloodPressureSystolic + '/' + vital.bloodPressureDiastolic : 'Not added' }}</div>
                    <div>HR: {{ vital.heartRate ? vital.heartRate + ' bpm' : 'Not added' }}</div>
                    <div>Temp: {{ vital.temperature ? vital.temperature + ' °C' : 'Not added' }}</div>
                    <div>Weight: {{ vital.weightKg ? vital.weightKg + ' kg' : 'Not added' }}</div>
                 </div>
                 <div class="text-xs mt-2 text-primary">Recorded at: {{ vital.recordedAt | date:'short' }}</div>
              </div>
            </div>
          </div>

          <div class="flex justify-end mt-4 pt-4 border-t border-gray-700">
            <button class="btn btn-outline btn-sm" (click)="isHistoryModalOpen = false">Close</button>
          </div>
        </div>
      </div>

      <!-- Vitals Modal Overlay -->
      <div *ngIf="isVitalsModalOpen" class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000;" (click)="isVitalsModalOpen = false">
        <div class="inner-card p-4" style="background: #1e293b; width: 400px; max-width: 90%; border: 1px solid #334155; border-radius: 8px;" (click)="$event.stopPropagation()">
          <div class="flex justify-between items-center mb-4">
            <h3 class="m-0 text-main">Record Clinical Vitals</h3>
            <button class="btn btn-sm" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer;" (click)="isVitalsModalOpen = false">&times;</button>
          </div>
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
          <div class="flex gap-2 mt-4">
            <button class="btn btn-outline btn-sm w-full" (click)="isVitalsModalOpen = false">Cancel</button>
            <button class="btn btn-primary btn-sm w-full" (click)="submitClinicalVitalsFromModal()">Save</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './consultation-workspace.css'
})
export class ConsultationWorkspaceComponent implements OnInit, OnDestroy {
  @Input() patient: any;
  @Input() vitals: any = {};
  @Input() history: any[] = [];
  
  @Output() onComplete = new EventEmitter<any>();
  @Output() onSave = new EventEmitter<any>();
  @Output() onCancel = new EventEmitter<void>();
  @Output() onSaveVitals = new EventEmitter<any>();
  @Output() verifyVital = new EventEmitter<number>();

  @Input() patientSubmittedVitals: any[] = [];
  
  newVitalForm: any = {};
  isVitalsModalOpen = false;
  isHistoryModalOpen = false;
  selectedHistoryVisit: any = null;

  isAddingAllergy = false;
  newAllergy = '';
  isAddingCondition = false;
  newCondition = '';

  activeTab = 'vitals';
  activeField: 'chiefComplaint' | 'hpi' | 'assessment' | 'plan' = 'hpi';
  isVideoCallActive: boolean = false;
  private speechSub: Subscription | null = null;
  
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

  @Input() set initialNotes(val: any) {
    if (val) {
      if (val.notesString) {
        const ccMatch = val.notesString.match(/Chief Complaint:\s*(.*?)(?=\nHPI:|$)/s);
        const hpiMatch = val.notesString.match(/HPI:\s*(.*?)(?=\nPlan:|$)/s);
        const planMatch = val.notesString.match(/Plan:\s*(.*)/s);
        
        this.notes.chiefComplaint = ccMatch ? ccMatch[1].trim() : '';
        this.notes.hpi = hpiMatch ? hpiMatch[1].trim() : '';
        this.notes.plan = planMatch ? planMatch[1].trim() : '';
      }
      if (val.diagnosis) {
        this.notes.assessment = val.diagnosis;
      }
    }
  }

  currentPrescriptions: any[] = [];
  orderedLabs: string[] = [];

  constructor(public speechService: SpeechRecognitionService) {}

  ngOnInit() {
    this.speechSub = this.speechService.transcript$.subscribe(text => {
      if (text) {
        if (!this.notes[this.activeField]) {
          this.notes[this.activeField] = '';
        }
        this.notes[this.activeField] += (this.notes[this.activeField] ? ' ' : '') + text;
      }
    });
  }

  ngOnDestroy() {
    if (this.speechSub) {
      this.speechSub.unsubscribe();
    }
    this.speechService.stop();
  }

  getActiveFieldLabel(): string {
    switch(this.activeField) {
      case 'chiefComplaint': return 'Chief Complaint';
      case 'hpi': return 'History of Present Illness';
      case 'assessment': return 'Assessment / Diagnosis';
      case 'plan': return 'Plan';
      default: return 'Notes';
    }
  }

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

  startVideoCall() {
    this.isVideoCallActive = true;
  }

  viewHistoryDetails(visit: any) {
    this.selectedHistoryVisit = visit;
    this.isHistoryModalOpen = true;
  }

  addAllergy() {
    this.isAddingAllergy = true;
  }

  saveAllergy() {
    if (this.newAllergy.trim()) {
      if (!this.patient.allergies) {
        this.patient.allergies = [];
      }
      this.patient.allergies.push(this.newAllergy.trim());
      this.newAllergy = '';
      this.isAddingAllergy = false;
    }
  }

  addCondition() {
    this.isAddingCondition = true;
  }

  saveCondition() {
    if (this.newCondition.trim()) {
      if (!this.patient.conditions) {
        this.patient.conditions = [];
      }
      this.patient.conditions.push(this.newCondition.trim());
      this.newCondition = '';
      this.isAddingCondition = false;
    }
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

  submitClinicalVitalsFromModal() {
    this.submitClinicalVitals();
    this.isVitalsModalOpen = false;
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
