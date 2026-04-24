import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private readonly router: Router,
    private readonly auth: AuthService
  ) {}

  /**
   * Expects route data:
   * data: { roles: ['ADMIN'] }
   */
  public async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean | UrlTree> {
    const loggedIn = await this.auth.isLoggedIn();
    if (!loggedIn) {
      return this.router.parseUrl(`/signin?returnUrl=${encodeURIComponent(state.url)}`);
    }

    const requiredRoles: string[] = route.data['roles'] || [];
    if (requiredRoles.length === 0) {
      return true;
    }

    const localRoles = this.auth.getUserRoles();
    const hasRole = requiredRoles.some((role) => localRoles.includes(role as any));
    if (!hasRole) {
      return this.router.parseUrl('/not-authorized');
    }

    return true;
  }
}
