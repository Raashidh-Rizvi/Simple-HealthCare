import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

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
          <a routerLink="/login" class="btn btn-outline text-sm">Sign Out</a>
        </div>
      </div>
    </nav>
  `,
  styleUrl: './navbar.css',
})
export class NavbarComponent {

}
