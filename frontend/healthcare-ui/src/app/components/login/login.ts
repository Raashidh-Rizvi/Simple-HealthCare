import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  email = '';
  password = '';

  constructor(private router: Router) {}

  onLogin() {
    // Basic mock logic for now, later connect to backend API
    if (this.email.includes('doctor')) {
      this.router.navigate(['/doctor']);
    } else {
      this.router.navigate(['/patient']);
    }
  }
}
