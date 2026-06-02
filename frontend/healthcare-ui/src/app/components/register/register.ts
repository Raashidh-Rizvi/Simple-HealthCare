import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="flex items-center justify-center mt-8">
      <div class="glass-card" style="width: 100%; max-width: 400px;">
        <div class="text-center mb-6">
          <h2 style="font-size: 24px; margin-bottom: 8px;">Create Account</h2>
          <p class="form-label">Join our healthcare platform</p>
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
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>
          </div>

          <button type="submit" class="btn btn-primary w-full mt-4" style="padding: 12px;">Register</button>
          
          <div class="text-center mt-4">
            <a routerLink="/login" style="font-size: 14px; cursor: pointer;">Already have an account? Sign In</a>
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

  constructor(private router: Router, private api: ApiService) {}

  onRegister() {
    if (!this.fullName || !this.email || !this.password || !this.role) {
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
      lastName
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

