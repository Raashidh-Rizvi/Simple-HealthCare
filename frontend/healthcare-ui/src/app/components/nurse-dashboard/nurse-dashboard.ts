import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nurse-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nurse-dashboard.html',
  styleUrls: ['./nurse-dashboard.css']
})
export class NurseDashboardComponent implements OnInit {
  encounters: any[] = [];
  loading = true;
  error = '';
  success = '';

  selectedEncounter: any = null;
  vitalsData = {
    heartRate: null,
    bloodPressureSystolic: null,
    bloodPressureDiastolic: null,
    respiratoryRate: '',
    temperature: null,
    weight: null,
    height: '',
    bmi: '',
    bloodSugar: '',
    oxygenSaturation: '',
    isHomeReading: false
  };

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadEncounters();
  }

  loadEncounters() {
    this.loading = true;
    this.api.getTodayEncounters().subscribe({
      next: (data) => {
        // Only show encounters that need vitals or are currently in progress
        this.encounters = data.filter((e: any) => e.status !== 'Completed');
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load today\'s encounters';
        this.loading = false;
      }
    });
  }

  openVitalsModal(encounter: any) {
    this.selectedEncounter = encounter;
    this.vitalsData = {
      heartRate: null,
      bloodPressureSystolic: null,
      bloodPressureDiastolic: null,
      respiratoryRate: '',
      temperature: null,
      weight: null,
      height: '',
      bmi: '',
      bloodSugar: '',
      oxygenSaturation: '',
      isHomeReading: false
    };
    this.error = '';
    this.success = '';
  }

  closeVitalsModal() {
    this.selectedEncounter = null;
  }

  submitVitals() {
    if (!this.selectedEncounter) return;

    this.api.addVitals(this.selectedEncounter.id, this.vitalsData).subscribe({
      next: (res) => {
        this.success = 'Vitals recorded successfully!';
        this.closeVitalsModal();
        this.loadEncounters();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to record vitals';
      }
    });
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
