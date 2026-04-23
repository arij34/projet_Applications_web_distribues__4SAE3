import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { MeService } from '../../services/me.service';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html'
})
export class SigninComponent implements OnInit {
  loading = false;
  error?: string;
  googleRolePickerOpen = false;

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly me: MeService
  ) {}

  async ngOnInit(): Promise<void> {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || undefined;

    // If we just returned from Keycloak, we may already be authenticated.
    try {
      const loggedIn = await this.auth.isLoggedIn();
      if (loggedIn) {
        // If user has no role yet (e.g. first Google login), show role picker and assign role.
        const roles = this.auth.getUserRoles();
        const hasAppRole = roles.includes('ADMIN' as any) || roles.includes('CLIENT' as any) || roles.includes('FREELANCER' as any);

        // Allow forcing role picker from other pages (?chooseRole=1)
        const forced = this.route.snapshot.queryParamMap.get('chooseRole') === '1';

        if (!hasAppRole || forced) {
          // Open role picker automatically.
          this.googleRolePickerOpen = true;

          // If we already have a stored pending role (from earlier click), try to apply it now.
          const pending = localStorage.getItem('pendingGoogleRole') as any;
          if (pending === 'CLIENT' || pending === 'FREELANCER') {
            await this.applyRoleAndRedirect(pending);
          }
          return;
        }

        // If we already have a role, redirect to the requested page (if any), otherwise default.
        await this.router.navigateByUrl(returnUrl || this.auth.getDefaultRouteByRole());
      }
    } catch {
      // ignore
    }

    // If not logged in but user came from "choose role" action, open the picker.
    if (this.route.snapshot.queryParamMap.get('chooseRole') === '1' || !!returnUrl) {
      this.googleRolePickerOpen = true;
    }
  }

  private async applyRoleAndRedirect(role: 'CLIENT' | 'FREELANCER'): Promise<void> {
    this.error = undefined;
    this.loading = true;
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || undefined;
    try {
      await this.me.setRole(role);
      localStorage.removeItem('pendingGoogleRole');
      // After assigning role in Keycloak, refresh token so RoleGuard sees it.
      await this.auth.refreshToken();
      await this.router.navigateByUrl(returnUrl || this.auth.getDefaultRouteByRole());
    } catch (e: any) {
      // Log full error for debugging (network/CORS/401/500...)
      console.error('Role assignment failed', e);
      const status = e?.status ? `HTTP ${e.status}` : '';
      const msg = e?.error?.error || e?.error?.message || e?.message || 'Failed to assign role';
      this.error = [status, msg].filter(Boolean).join(' - ');
      this.googleRolePickerOpen = true;
    } finally {
      this.loading = false;
    }
  }

  async signIn(): Promise<void> {
    this.error = undefined;
    this.loading = true;
    try {
      // redirect back here then route by role
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '';
      await this.auth.login(window.location.origin + '/signin' + (returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''));
    } catch (e: any) {
      this.error = e?.message || 'Sign in failed';
    } finally {
      this.loading = false;
    }
  }

  async signInWithGoogle(role: 'CLIENT' | 'FREELANCER'): Promise<void> {
    this.error = undefined;
    this.loading = true;
    try {
      this.googleRolePickerOpen = false;
      // Single Google IdP (alias='google') is provisioned.
      // Role selection is done in the app and will be assigned after login.
      localStorage.setItem('pendingGoogleRole', role);
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '';
      await this.auth.loginWithIdp('google', window.location.origin + '/signin' + (returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''));
    } catch (e: any) {
      this.error = e?.message || 'Google sign in failed';
    } finally {
      this.loading = false;
    }
  }

  openGoogleRolePicker(): void {
    this.error = undefined;
    this.googleRolePickerOpen = true;
  }

  closeGoogleRolePicker(): void {
    if (this.loading) return;
    this.googleRolePickerOpen = false;
  }

  async chooseRole(role: 'CLIENT' | 'FREELANCER'): Promise<void> {
    // If already authenticated (e.g. user landed in NotAuthorized), just assign role.
    const loggedIn = await this.auth.isLoggedIn();
    if (loggedIn) {
      await this.applyRoleAndRedirect(role);
      return;
    }

    // Otherwise proceed with Google login and store the choice.
    await this.signInWithGoogle(role);
  }

  resetPassword(): void {
    this.error = undefined;
    this.auth.resetPassword(window.location.origin + '/signin');
  }
}
