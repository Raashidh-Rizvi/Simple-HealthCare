import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="flex items-center justify-center mt-8">
      <div class="glass-card" style="width: 100%; max-width: 400px;">
        <div class="text-center mb-6">
          <h2 style="font-size: 24px; margin-bottom: 8px;">Welcome Back</h2>
          <p class="form-label">Sign in to your healthcare account</p>
        </div>

        <form (ngSubmit)="onLogin()" ngNativeValidate>
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" class="form-control" placeholder="doctor@example.com" [(ngModel)]="email" name="email" required>
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-control" placeholder="••••••••" [(ngModel)]="password" name="password" required>
          </div>

          <button type="submit" class="btn btn-primary w-full mt-4" style="padding: 12px;">Sign In</button>
          
          <div class="text-center mt-4">
            <a routerLink="/register" style="font-size: 14px; cursor: pointer;">Don't have an account? Register</a>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrl: './login.css'
})
export class LoginComponent {
  email = '';
  password = '';

  constructor(private router: Router, private api: ApiService) {}

  onLogin() {
    if (!this.email || !this.password) {
      alert('Please enter email and password.');
      return;
    }

    this.api.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        if (res.role.toLowerCase() === 'doctor') {
          this.router.navigate(['/doctor']);
        } else {
          this.router.navigate(['/patient']);
        }
      },
      error: (err) => {
        alert('Login failed: ' + (err.error?.message || err.message));
      }
    });
  }
}

