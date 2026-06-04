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
    <div class="register-wrapper">
      <div class="register-card">

        <!-- Header -->
        <div class="register-header">
          <div class="register-icon">🏥</div>
          <h2>Patient Registration</h2>
          <p class="register-subtitle">Create your patient account to get started</p>
        </div>

        <!-- Info banner -->
        <div class="info-banner">
          <span class="info-icon">ℹ️</span>
          <span>Healthcare professionals are registered by administrators only.</span>
        </div>

        <!-- Form -->
        <form (ngSubmit)="onRegister()" ngNativeValidate class="register-form">

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="reg-firstname">First Name</label>
              <input
                id="reg-firstname"
                type="text"
                class="form-control"
                placeholder="John"
                [(ngModel)]="firstName"
                name="firstName"
                required
              >
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-lastname">Last Name</label>
              <input
                id="reg-lastname"
                type="text"
                class="form-control"
                placeholder="Doe"
                [(ngModel)]="lastName"
                name="lastName"
                required
              >
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-email">Email Address</label>
            <input
              id="reg-email"
              type="email"
              class="form-control"
              placeholder="patient@example.com"
              [(ngModel)]="email"
              name="email"
              required
            >
          </div>

          <div class="form-group">
            <label class="form-label" for="reg-password">Password</label>
            <div class="input-with-toggle">
              <input
                id="reg-password"
                [type]="showPassword ? 'text' : 'password'"
                class="form-control"
                placeholder="••••••••"
                [(ngModel)]="password"
                name="password"
                required
                minlength="6"
              >
              <button type="button" class="toggle-pwd" (click)="showPassword = !showPassword" tabindex="-1">
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
            <span class="hint">Minimum 6 characters</span>
          </div>

          <!-- Error message -->
          <div class="error-msg" *ngIf="errorMessage">
            ⚠️ {{ errorMessage }}
          </div>

          <button id="register-submit-btn" type="submit" class="btn-register" [disabled]="isLoading">
            <span *ngIf="!isLoading">Create Account</span>
            <span *ngIf="isLoading" class="spinner">⏳ Creating...</span>
          </button>

          <div class="register-footer">
            Already have an account?
            <a routerLink="/login">Sign In</a>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrl: './register.css'
})
export class RegisterComponent {
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  showPassword = false;
  isLoading = false;
  errorMessage = '';

  constructor(private router: Router, private api: ApiService) {}

  onRegister() {
    this.errorMessage = '';

    if (!this.firstName.trim() || !this.lastName.trim() || !this.email.trim() || !this.password) {
      this.errorMessage = 'Please fill out all required fields.';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }

    this.isLoading = true;

    this.api.register({
      email: this.email.trim(),
      password: this.password,
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim()
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}
