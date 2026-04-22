import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { AdminUserSummary } from '../models/admin-monitoring.model';

@Injectable({
  providedIn: 'root'
})
export class UserDirectoryService {
  // Falls back to the same backend used by MeService if env key is absent.
  private readonly userApiBaseUrl = (environment as { userApiBaseUrl?: string }).userApiBaseUrl ?? 'http://localhost:8090';
  private lookupDisabled = false;

  constructor(private readonly http: HttpClient) {}

  getUserById(userId: number): Observable<AdminUserSummary | null> {
    if (this.lookupDisabled) {
      return of(null);
    }

    return this.tryLookupByCandidateEndpoints(userId).pipe(
      catchError((error: { status?: number }) => {
        // Prevent repeated noisy calls when user-service routes are unavailable.
        if (error?.status === 404 || error?.status === 401 || error?.status === 403) {
          this.lookupDisabled = true;
        }
        return of(null);
      })
    );
  }

  private tryLookupByCandidateEndpoints(userId: number): Observable<AdminUserSummary | null> {
    const endpoints = [
      `${this.userApiBaseUrl}/api/users/${userId}`,
      `${this.userApiBaseUrl}/users/${userId}`,
      `${this.userApiBaseUrl}/api/user/${userId}`,
      `${this.userApiBaseUrl}/api/users?id=${userId}`
    ];

    return this.tryEndpoint(endpoints, 0, userId);
  }

  private tryEndpoint(endpoints: string[], index: number, userId: number): Observable<AdminUserSummary | null> {
    if (index >= endpoints.length) {
      return of(null);
    }

    return this.http.get<unknown>(endpoints[index]).pipe(
      map((payload) => this.mapPayloadToUserSummary(payload, userId)),
      switchMap((user) => {
        if (user) {
          return of(user);
        }
        return this.tryEndpoint(endpoints, index + 1, userId);
      }),
      catchError(() => this.tryEndpoint(endpoints, index + 1, userId))
    );
  }

  private mapPayloadToUserSummary(payload: unknown, fallbackUserId: number): AdminUserSummary | null {
    const dto = this.pickCandidateDto(payload);
    if (!dto) {
      return null;
    }

    const resolvedId = Number((dto as { id?: number }).id ?? fallbackUserId);
    if (!resolvedId) {
      return null;
    }

    return {
      id: resolvedId,
      firstName: this.readString(dto, ['firstName', 'firstname', 'givenName', 'name']),
      lastName: this.readString(dto, ['lastName', 'lastname', 'familyName']),
      email: this.readString(dto, ['email', 'mail', 'username'])
    };
  }

  private pickCandidateDto(payload: unknown): Record<string, unknown> | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    if (Array.isArray(payload)) {
      const first = payload[0];
      return first && typeof first === 'object' ? (first as Record<string, unknown>) : null;
    }

    const record = payload as Record<string, unknown>;

    // Some APIs return wrappers like { content: [...] } or { data: {...} }.
    const content = record['content'];
    if (Array.isArray(content) && content.length > 0 && typeof content[0] === 'object') {
      return content[0] as Record<string, unknown>;
    }

    const data = record['data'];
    if (data && typeof data === 'object') {
      return data as Record<string, unknown>;
    }

    return record;
  }

  private readString(dto: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = dto[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }
    return null;
  }
}
