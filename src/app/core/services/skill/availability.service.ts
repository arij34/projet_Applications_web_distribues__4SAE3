import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Availability } from '../../models/skill/availability.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AvailabilityService {

  private url = `${environment.apiUrl}/availability`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Availability[]> {
    return this.http.get<Availability[]>(this.url);
  }

  getById(id: number): Observable<Availability> {
    return this.http.get<Availability>(`${this.url}/${id}`);
  }

  // ✅ /user/me — token Keycloak injecté automatiquement (enableBearerInterceptor: true)
  getForCurrentUser(): Observable<Availability> {
    return this.http.get<Availability>(`${this.url}/user/me`);
  }

  create(availability: Availability): Observable<Availability> {
    return this.http.post<Availability>(`${this.url}/user/me`, availability);
  }

  update(id: number, availability: Availability): Observable<Availability> {
    return this.http.put<Availability>(`${this.url}/${id}`, availability);
  }

  preview(availability: Availability): Observable<Availability> {
    return this.http.post<Availability>(`${this.url}/preview`, availability);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
