import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { KeycloakAuthGuard, KeycloakService } from 'keycloak-angular';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard extends KeycloakAuthGuard implements CanActivate {
  constructor(
    protected override readonly router: Router,
    protected override readonly keycloakAngular: KeycloakService
  ) {
    super(router, keycloakAngular);
  }

  /**
   * Expects route data:
   * data: { roles: ['ADMIN'] }
   */
  public override async isAccessAllowed(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean | UrlTree> {
    if (!this.authenticated) {
      // IMPORTANT:
      // Do NOT redirect directly to Keycloak here.
      // We want the user to land on our /signin page first so we can:
      // - show "Sign in with Google"
      // - ask the user to choose their role (CLIENT/FREELANCER) BEFORE Google login
      return this.router.parseUrl(`/signin?returnUrl=${encodeURIComponent(state.url)}`);
    }

    const requiredRoles: string[] = route.data['roles'] || [];
    if (requiredRoles.length === 0) {
      return true;
    }

    const hasRole = requiredRoles.some((role) => this.roles.includes(role));
    if (!hasRole) {
      return this.router.parseUrl('/not-authorized');
    }

    return true;
  }
}
