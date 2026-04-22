import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Experience } from '../../models/skill/experience.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ExperienceService {

  private url = `${environment.apiUrl}/experience`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Experience[]> {
    return this.http.get<Experience[]>(this.url);
  }

  getById(id: number): Observable<Experience> {
    return this.http.get<Experience>(`${this.url}/${id}`);
  }

  // ✅ Token Keycloak injecté automatiquement
  create(experience: Experience): Observable<Experience> {
    return this.http.post<Experience>(`${this.url}/user/me`, experience);
  }

  update(experience: Experience): Observable<Experience> {
    return this.http.put<Experience>(this.url, experience);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  getTotalYearsForCurrentUser(): Observable<number> {
    return this.http.get<number>(`${this.url}/user/me/total-years`);
  }
}
