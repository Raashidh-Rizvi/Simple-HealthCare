import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reception-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reception-dashboard.html',
  styleUrls: ['./reception-dashboard.css']
})
export class ReceptionDashboardComponent implements OnInit {
  appointments: any[] = [];
  loading = true;
  error = '';
  success = '';
  searchTerm: string = '';

  get filteredAppointments(): any[] {
    if (!this.searchTerm) return this.appointments;
    const term = this.searchTerm.toLowerCase();
    return this.appointments.filter(apt => 
      (apt.patientName?.toLowerCase().includes(term)) ||
      (apt.doctorName?.toLowerCase().includes(term)) ||
      (apt.specialization?.toLowerCase().includes(term)) ||
      (apt.status?.toLowerCase().includes(term)) ||
      (apt.encounterStatus?.toLowerCase().includes(term))
    );
  }
  
  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments() {
    this.loading = true;
    this.api.getTodayAppointments().subscribe({
      next: (data) => {
        this.appointments = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load today\'s appointments';
        this.loading = false;
      }
    });
  }

  checkIn(appointment: any) {
    if (!confirm(`Are you sure you want to check in ${appointment.patientName}?`)) return;
    
    this.error = '';
    this.success = '';
    
    this.api.checkInEncounter(appointment.id).subscribe({
      next: (res) => {
        this.success = 'Patient checked in successfully!';
        this.loadAppointments();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to check in patient';
      }
    });
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
