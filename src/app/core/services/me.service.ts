import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

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

  constructor(private readonly http: HttpClient) {}

  /**
   * Creates/updates the local DB user profile based on the logged-in Keycloak user.
   * Requires Authorization: Bearer <token> (KeycloakBearerInterceptor will attach it).
   */
  sync(): Promise<MeDto> {
    return firstValueFrom(this.http.post<MeDto>(`${this.baseUrl}/sync`, {}));
  }

  me(): Promise<MeDto> {
    return firstValueFrom(this.http.get<MeDto>(this.baseUrl));
  }

  /**
   * Assigns a realm role in Keycloak for the currently authenticated user.
   * Used after first Google login when realm role is missing.
   */
  setRole(role: 'CLIENT' | 'FREELANCER'): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${this.baseUrl}/role`, { role }));
  }
}
