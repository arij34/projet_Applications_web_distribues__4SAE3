import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-not-authorized',
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div class="max-w-md w-full bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h1 class="text-xl font-bold text-gray-900 mb-2">Not authorized</h1>
        <p class="text-sm text-gray-600 mb-6">
          You are logged in, but you don't have the required role to access this page.
        </p>

        <div class="flex flex-col gap-2">
          <button
            class="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm"
            (click)="chooseRole()">
            Choose role (Client / Freelancer)
          </button>

          <button
            class="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm"
            (click)="logoutAndGoHome()">
            Logout
          </button>

          <a routerLink="/front" class="w-full text-center text-sm text-gray-600 hover:underline">
            Go home
          </a>
        </div>
      </div>
    </div>
  `
})
export class NotAuthorizedComponent {
  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  async chooseRole(): Promise<void> {
    // Send the user to the same role picker used by Google sign-in.
    // We keep the session; the app will assign the selected role.
    await this.router.navigateByUrl('/signin?chooseRole=1');
  }

  async logoutAndGoHome(): Promise<void> {
    await this.auth.logout(window.location.origin + '/front');
    await this.router.navigateByUrl('/front');
  }
}
