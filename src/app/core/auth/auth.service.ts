import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { environment } from '../../../environments/environment';
import { KcRole } from './roles';
import { KC_ROLES } from './roles';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly localUserRoleKey = 'userRole';
  private readonly localUserNameKey = 'userName';
  private readonly localUserIdKey = 'userId';

  /**
   * Default route after login depending on the user's realm role.
   */
  getDefaultRouteByRole(): string {
    const roles = this.getUserRoles();
    if (roles.includes(KC_ROLES.ADMIN)) return '/admin';
    if (roles.includes(KC_ROLES.CLIENT)) return '/front';
    if (roles.includes(KC_ROLES.FREELANCER)) return '/front';
    return '/front';
  }
  constructor(private readonly keycloak: KeycloakService) {}

  isKeycloakEnabled(): boolean {
    return environment.useKeycloak !== false;
  }

  setLocalSession(role: KcRole, displayName?: string): void {
    localStorage.setItem(this.localUserRoleKey, role);
    localStorage.setItem(this.localUserNameKey, displayName || this.getLocalDisplayName(role));
    if (!localStorage.getItem(this.localUserIdKey)) {
      localStorage.setItem(this.localUserIdKey, '0');
    }
  }

  private getLocalRole(): KcRole | undefined {
    const storedRole = (localStorage.getItem(this.localUserRoleKey) || '').toUpperCase();
    if (storedRole === KC_ROLES.ADMIN || storedRole === KC_ROLES.CLIENT || storedRole === KC_ROLES.FREELANCER) {
      return storedRole;
    }

    return undefined;
  }

  private getLocalDisplayName(role: KcRole): string {
    switch (role) {
      case KC_ROLES.ADMIN:
        return 'Admin';
      case KC_ROLES.CLIENT:
        return 'Client';
      case KC_ROLES.FREELANCER:
        return 'Freelancer';
      default:
        return 'User';
    }
  }

  private navigateTo(url: string): Promise<void> {
    window.location.href = url;
    return Promise.resolve();
  }

  async isLoggedIn(): Promise<boolean> {
    if (this.isKeycloakEnabled()) {
      try {
        return await this.keycloak.isLoggedIn();
      } catch {
        return !!this.getLocalRole();
      }
    }

    return !!this.getLocalRole();
  }

  getUsername(): string | undefined {
    if (!this.isKeycloakEnabled()) {
      return localStorage.getItem(this.localUserNameKey) || this.getLocalRole();
    }

    return this.keycloak.getUsername();
  }

  /**
   * A friendly display name for the UI.
   * Tries OIDC "name" first, then preferred_username/username.
   */
  getDisplayName(): string | undefined {
    if (!this.isKeycloakEnabled()) {
      return localStorage.getItem(this.localUserNameKey) || this.getUsername();
    }

    const parsed: any = this.keycloak.getKeycloakInstance().tokenParsed;
    return parsed?.name || parsed?.preferred_username || this.getUsername();
  }

  /**
   * Keycloak token parsed content (standard OIDC claims).
   */
  getUserInfo(): unknown {
    if (!this.isKeycloakEnabled()) {
      return {
        sub: localStorage.getItem(this.localUserIdKey) || 'local-user',
        name: this.getDisplayName(),
        preferred_username: this.getUsername(),
        realm_access: { roles: this.getUserRoles() }
      };
    }

    return this.keycloak.getKeycloakInstance().tokenParsed;
  }

  getAccessToken(): Promise<string> {
    if (!this.isKeycloakEnabled()) {
      return Promise.resolve('');
    }

    return this.keycloak.getToken().catch(() => '');
  }

  /**
   * Refreshes the access token (useful after changing realm roles in Keycloak).
   */
  async refreshToken(minValiditySeconds: number = 9999): Promise<void> {
    if (!this.isKeycloakEnabled()) {
      return;
    }

    try {
      // NOTE: We often need to FORCE refresh after role assignment.
      // Keycloak only refreshes when the token is close to expiring.
      // Using a large minValidity ensures a refresh happens immediately.
      await this.keycloak.updateToken(minValiditySeconds);
    } catch {
      // If refresh fails, user may need to re-login.
    }
  }

  /**
   * Returns the realm roles (e.g. ADMIN, CLIENT, FREELANCER).
   */
  getUserRoles(): KcRole[] {
    if (!this.isKeycloakEnabled()) {
      const role = this.getLocalRole();
      return role ? [role] : [];
    }

    try {
      const roles = this.keycloak.getUserRoles(true); // true => realm roles
      return roles as KcRole[];
    } catch {
      return [];
    }
  }

  hasRole(role: KcRole): boolean {
    return this.getUserRoles().includes(role);
  }

  hasAnyRole(roles: KcRole[]): boolean {
    return roles.some((r) => this.hasRole(r));
  }

  logout(redirectUri: string = window.location.origin + '/front'): Promise<void> {
    localStorage.removeItem('userId');
    localStorage.removeItem('freelancerId');
    localStorage.removeItem('clientId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('pendingGoogleRole');

    if (!this.isKeycloakEnabled()) {
      window.location.href = redirectUri;
      return Promise.resolve();
    }

    // Use a route that exists in the Angular app.
    // Keycloak validates post_logout_redirect_uri; we keep it under /front.
    const kc = this.keycloak.getKeycloakInstance();
    // Keycloak (newer versions) may require id_token_hint on the OIDC logout endpoint.
    // keycloak-angular's wrapper does not always send it, so we pass it explicitly.
    return kc.logout({ redirectUri, idTokenHint: kc.idToken } as any);
  }

  login(redirectUri: string = window.location.href): Promise<void> {
    if (!this.isKeycloakEnabled()) {
      const fallbackTarget = redirectUri.includes('/signin')
        ? redirectUri
        : `${window.location.origin}/signin?returnUrl=${encodeURIComponent(redirectUri)}`;
      return this.navigateTo(fallbackTarget);
    }

    return this.keycloak.login({ redirectUri });
  }

  /**
   * Login with a specific Identity Provider configured in Keycloak.
   * Example idpHint: 'google'
   */
  loginWithIdp(idpHint: string, redirectUri: string = window.location.href): Promise<void> {
    if (!this.isKeycloakEnabled()) {
      const fallbackTarget = `${window.location.origin}/signin?chooseRole=1${redirectUri ? `&returnUrl=${encodeURIComponent(redirectUri)}` : ''}`;
      return this.navigateTo(fallbackTarget);
    }

    return this.keycloak.login({ redirectUri, idpHint } as any);
  }

  /**
   * Redirect to Keycloak reset credentials screen (Forgot password).
   * This uses Keycloak's standard login-actions endpoint.
   */
  resetPassword(redirectUri: string = window.location.origin + '/front'): void {
    if (!this.isKeycloakEnabled()) {
      window.location.href = `${window.location.origin}/signup`;
      return;
    }

    const kc: any = this.keycloak.getKeycloakInstance();
    const authServerUrl: string = kc.authServerUrl || 'http://localhost:8081';
    const realm: string = kc.realm || 'smart-platform';
    const clientId: string = kc.clientId || 'angular-app';

    const url =
      `${authServerUrl}/realms/${encodeURIComponent(realm)}` +
      `/login-actions/reset-credentials?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`;

    window.location.href = url;
  }

  register(redirectUri: string = window.location.href): Promise<void> {
    if (!this.isKeycloakEnabled()) {
      return this.navigateTo(`${window.location.origin}/signup`);
    }

    // Prefer using the standard authorization endpoint with action=register.
    // This is more robust across Keycloak versions than hitting /registrations directly.
    const kc = this.keycloak.getKeycloakInstance();
    return kc.login({ redirectUri, action: 'register' } as any);
  }
  getKeycloakSub(): string {
    if (!this.isKeycloakEnabled()) {
      return localStorage.getItem(this.localUserIdKey) || '';
    }

    const kc = this.keycloak.getKeycloakInstance();
    return kc?.tokenParsed?.['sub'] || '';
  }
}
