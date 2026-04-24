import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { KC_ROLES } from '../auth/roles';

export interface MeDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  enabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MeService {
  private readonly baseUrl = 'http://localhost:8090/api/me';
  private readonly localUserIdKey = 'userId';
  private readonly localUserNameKey = 'userName';
  private readonly localUserRoleKey = 'userRole';
  private readonly localFirstNameKey = 'userFirstName';
  private readonly localLastNameKey = 'userLastName';
  private readonly localEmailKey = 'userEmail';

  constructor(private readonly http: HttpClient) {}

  private getLocalMe(): MeDto {
    const role = (localStorage.getItem(this.localUserRoleKey) || 'CLIENT').toUpperCase();
    const firstName = localStorage.getItem(this.localFirstNameKey) || 'User';
    const lastName = localStorage.getItem(this.localLastNameKey) || '';
    const email = localStorage.getItem(this.localEmailKey) || '';

    return {
      id: Number(localStorage.getItem(this.localUserIdKey) || '0'),
      firstName,
      lastName,
      email,
      role: role === KC_ROLES.ADMIN || role === KC_ROLES.CLIENT || role === KC_ROLES.FREELANCER ? role : 'CLIENT',
      enabled: true
    };
  }

  private setLocalMe(me: Partial<MeDto>): MeDto {
    const current = this.getLocalMe();
    const next: MeDto = {
      ...current,
      ...me,
      role: me.role || current.role,
      enabled: me.enabled ?? current.enabled
    };

    if (typeof next.id === 'number') {
      localStorage.setItem(this.localUserIdKey, String(next.id || 0));
    }
    localStorage.setItem(this.localFirstNameKey, next.firstName || '');
    localStorage.setItem(this.localLastNameKey, next.lastName || '');
    localStorage.setItem(this.localEmailKey, next.email || '');
    localStorage.setItem(this.localUserRoleKey, (next.role || 'CLIENT').toUpperCase());
    localStorage.setItem(this.localUserNameKey, [next.firstName, next.lastName].filter(Boolean).join(' ').trim() || next.email || 'User');

    return next;
  }

  /**
   * Creates/updates the local DB user profile based on the logged-in Keycloak user.
   * Requires Authorization: Bearer <token> (KeycloakBearerInterceptor will attach it).
   */
  sync(): Promise<MeDto> {
    if (!environment.useKeycloak) {
      return Promise.resolve(this.getLocalMe());
    }

    return firstValueFrom(this.http.post<MeDto>(`${this.baseUrl}/sync`, {}));
  }

  me(): Promise<MeDto> {
    if (!environment.useKeycloak) {
      return Promise.resolve(this.getLocalMe());
    }

    return firstValueFrom(this.http.get<MeDto>(this.baseUrl));
  }

  /**
   * Assigns a realm role in Keycloak for the currently authenticated user.
   * Used after first Google login when realm role is missing.
   */
  setRole(role: 'CLIENT' | 'FREELANCER' | 'ADMIN'): Promise<void> {
    if (!environment.useKeycloak) {
      this.setLocalMe({ role });
      return Promise.resolve();
    }

    return firstValueFrom(this.http.post<void>(`${this.baseUrl}/role`, { role }));
  }

  saveLocalProfile(profile: Partial<MeDto>): MeDto {
    return this.setLocalMe(profile);
  }
}
