import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { KcRole } from './roles';
import { KC_ROLES } from './roles';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
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

  async isLoggedIn(): Promise<boolean> {
    return this.keycloak.isLoggedIn();
  }

  getUsername(): string | undefined {
    return this.keycloak.getUsername();
  }

  /**
   * A friendly display name for the UI.
   * Tries OIDC "name" first, then preferred_username/username.
   */
  getDisplayName(): string | undefined {
    const parsed: any = this.keycloak.getKeycloakInstance().tokenParsed;
    return parsed?.name || parsed?.preferred_username || this.getUsername();
  }

  /**
   * Keycloak token parsed content (standard OIDC claims).
   */
  getUserInfo(): unknown {
    return this.keycloak.getKeycloakInstance().tokenParsed;
  }

  getAccessToken(): Promise<string> {
    return this.keycloak.getToken();
  }

  /**
   * Refreshes the access token (useful after changing realm roles in Keycloak).
   */
  async refreshToken(minValiditySeconds: number = 9999): Promise<void> {
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
    const roles = this.keycloak.getUserRoles(true); // true => realm roles
    return roles as KcRole[];
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
    // Use a route that exists in the Angular app.
    // Keycloak validates post_logout_redirect_uri; we keep it under /front.
    const kc = this.keycloak.getKeycloakInstance();
    // Keycloak (newer versions) may require id_token_hint on the OIDC logout endpoint.
    // keycloak-angular's wrapper does not always send it, so we pass it explicitly.
    return kc.logout({ redirectUri, idTokenHint: kc.idToken } as any);
  }

  login(redirectUri: string = window.location.href): Promise<void> {
    return this.keycloak.login({ redirectUri });
  }

  /**
   * Login with a specific Identity Provider configured in Keycloak.
   * Example idpHint: 'google'
   */
  loginWithIdp(idpHint: string, redirectUri: string = window.location.href): Promise<void> {
    return this.keycloak.login({ redirectUri, idpHint } as any);
  }

  /**
   * Redirect to Keycloak reset credentials screen (Forgot password).
   * This uses Keycloak's standard login-actions endpoint.
   */
  resetPassword(redirectUri: string = window.location.origin + '/front'): void {
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
    // Prefer using the standard authorization endpoint with action=register.
    // This is more robust across Keycloak versions than hitting /registrations directly.
    const kc = this.keycloak.getKeycloakInstance();
    return kc.login({ redirectUri, action: 'register' } as any);
  }
  getKeycloakSub(): string {
  const kc = this.keycloak.getKeycloakInstance();
  return kc?.tokenParsed?.['sub'] || '';
}
getUserId(): number | null {
  // ✅ Récupérer depuis localStorage (stocké après /api/me/sync)
  const id = localStorage.getItem('userId');
  return id ? parseInt(id) : null;
}
}
