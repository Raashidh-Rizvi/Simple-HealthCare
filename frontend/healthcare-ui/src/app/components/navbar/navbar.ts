import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule],
  template: `
    <nav class="glass-card" style="border-radius: 0; padding: 16px 24px; position: sticky; top: 0; z-index: 50;">
      <div class="container flex justify-between items-center">
        <div class="flex items-center gap-4">
          <h3 style="color: var(--text-main); font-weight: 700;">🏥 QuicHealth</h3>
        </div>
        <div class="flex gap-4 items-center">
          <a routerLink="/login" class="btn btn-outline" style="padding: 8px 16px; font-size: 13px;">Sign Out</a>
        </div>
      </div>
    </nav>
  `,
  styleUrl: './navbar.css',
})
export class NavbarComponent {

}
