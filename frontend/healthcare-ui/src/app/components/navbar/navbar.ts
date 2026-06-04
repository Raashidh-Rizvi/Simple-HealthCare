import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule],
  template: `
    <nav class="glass-card" style="border-radius: 0; padding: 16px 24px; position: sticky; top: 0; z-index: 50; border-left: none; border-right: none; border-top: none;">
      <div class="container flex justify-between items-center">
        <div class="flex items-center gap-4">
          <h3 class="font-bold text-main" style="letter-spacing: -0.05em; font-size: 22px;">
            <span style="color: var(--primary);">🏥</span> QuicHealth
          </h3>
        </div>
        <div class="flex gap-4 items-center">
          <button (click)="toggleTheme()" class="btn btn-outline text-sm" style="padding: 8px 12px; border-radius: 50%; border-color: var(--surface-border);" title="Toggle Theme">
            {{ isDarkMode ? '🌙' : '☀️' }}
          </button>
          @if (isLoggedIn) {
            <a (click)="signOut()" class="btn btn-outline text-sm" style="cursor: pointer;">Sign Out</a>
          } @else {
            <a routerLink="/login" class="btn btn-primary text-sm">Log In</a>
          }
        </div>
      </div>
    </nav>
  `,
  styleUrl: './navbar.css',
})
export class NavbarComponent implements OnInit {
  isLoggedIn = false;
  isDarkMode = true;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkLoginStatus();
    });
  }

  ngOnInit() {
    this.checkLoginStatus();
    this.initTheme();
  }

  initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      this.isDarkMode = false;
      document.documentElement.classList.add('light-theme');
    } else {
      this.isDarkMode = true;
      document.documentElement.classList.remove('light-theme');
    }
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.documentElement.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
    }
  }

  checkLoginStatus() {
    this.isLoggedIn = !!localStorage.getItem('token');
  }

  signOut() {
    localStorage.removeItem('token');
    this.checkLoginStatus();
    this.router.navigate(['/login']);
  }
}
