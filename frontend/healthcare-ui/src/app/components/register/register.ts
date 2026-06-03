import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  template: `
    <div class="flex items-center justify-center mt-8">
      <div class="glass-card w-full" style="max-width: 420px;">
        <div class="text-center mb-6">
          <h2 class="mb-2">Create Account</h2>
          <p class="text-muted text-sm">Join our healthcare platform</p>
        </div>

        <form (ngSubmit)="onRegister()" ngNativeValidate>
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" class="form-control" placeholder="John Doe" [(ngModel)]="fullName" name="fullName" required>
          </div>

          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" class="form-control" placeholder="user@example.com" [(ngModel)]="email" name="email" required>
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-control" placeholder="••••••••" [(ngModel)]="password" name="password" required minlength="6">
          </div>
          
          <div class="form-group">
            <label class="form-label">Role</label>
            <select class="form-control" [(ngModel)]="role" name="role" required>
              <option value="patient" style="color: black;">Patient</option>
              <option value="doctor" style="color: black;">Doctor</option>
            </select>
          </div>

          <div class="form-group" *ngIf="role === 'doctor'">
            <label class="form-label">Specialization</label>
            <select class="form-control" [(ngModel)]="specialization" name="specialization" required>
              <option value="" disabled style="color: black;">Select Specialization</option>
              <option value="General Physician" style="color: black;">General Physician</option>
              <option value="Cardiologist" style="color: black;">Cardiologist</option>
              <option value="Dermatologist" style="color: black;">Dermatologist</option>
              <option value="Pediatrician" style="color: black;">Pediatrician</option>
              <option value="Neurologist" style="color: black;">Neurologist</option>
              <option value="Orthopedic" style="color: black;">Orthopedic</option>
              <option value="Psychiatrist" style="color: black;">Psychiatrist</option>
            </select>
          </div>

          <button type="submit" class="btn btn-primary w-full mt-6">Register</button>
          
          <div class="text-center mt-6">
            <a routerLink="/login" class="text-sm">Already have an account? Sign In</a>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrl: './register.css'
})
export class RegisterComponent {
  fullName = '';
  email = '';
  password = '';
  role = 'patient';
  specialization = '';

  constructor(private router: Router, private api: ApiService) {}

  onRegister() {
    if (!this.fullName || !this.email || !this.password || !this.role || (this.role === 'doctor' && !this.specialization)) {
      alert('Please fill out all required fields correctly.');
      return;
    }

    const parts = this.fullName.split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '.';
    
    this.api.register({
      email: this.email,
      password: this.password,
      role: this.role,
      firstName,
      lastName,
      specialization: this.role === 'doctor' ? this.specialization : undefined
    }).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        alert('Registration failed: ' + (err.error?.message || err.message));
      }
    });
  }
}

