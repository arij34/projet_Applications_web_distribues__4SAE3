import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { KC_ROLES } from './core/auth/roles';
import { MeService } from './core/services/me.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'pidev-freelancy';

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly me: MeService
  ) {}

  async ngOnInit(): Promise<void> {
    const loggedIn = await this.auth.isLoggedIn();
    if (!loggedIn) {
      return;
    }

    // Sync Keycloak user -> local DB profile (hybrid auth)
    try {
      const profile = await this.me.sync();
      localStorage.setItem('userId', profile.id.toString());
      localStorage.setItem('userRole', profile.role || (this.auth.hasRole(KC_ROLES.FREELANCER) ? 'FREELANCER' : 'CLIENT'));
      const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || profile.email || 'User';
      localStorage.setItem('userName', displayName);
    } catch (e) {
      // Non-blocking: app should still work even if DB is down
      console.error('Failed to sync user to DB', e);
    }

    // If user is logged and currently on landing pages, redirect by role.
    const current = this.router.url;
    if (current === '/' || current.startsWith('/front')) {
      const target = this.auth.getDefaultRouteByRole();
      if (target && target !== current) {
        await this.router.navigateByUrl(target);
      }
    }
  }
}