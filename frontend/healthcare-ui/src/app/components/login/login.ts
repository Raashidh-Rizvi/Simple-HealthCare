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
      <div class="glass-card w-full" style="max-width: 420px;">
        <div class="text-center mb-6">
          <h2 class="mb-2">Welcome Back</h2>
          <p class="text-muted text-sm">Sign in to your healthcare account</p>
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

          <button type="submit" class="btn btn-primary w-full mt-6">Sign In</button>
          
          <div class="text-center mt-6">
            <a routerLink="/register" class="text-sm">Don't have an account? Register</a>
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
        localStorage.setItem('role', res.role);
        localStorage.setItem('name', res.firstName + ' ' + res.lastName);
        const role = res.role.toLowerCase();
        if (role === 'doctor') {
          this.router.navigate(['/doctor']);
        } else if (role === 'admin') {
          this.router.navigate(['/admin']);
        } else if (role === 'receptionist') {
          this.router.navigate(['/reception']);
        } else if (role === 'nurse') {
          this.router.navigate(['/nurse']);
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

