import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Education } from '../../models/skill/education.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EducationService {

  private url = `${environment.apiUrl}/education`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Education[]> {
    return this.http.get<Education[]>(this.url);
  }

  getById(id: number): Observable<Education> {
    return this.http.get<Education>(`${this.url}/${id}`);
  }

  // ✅ Token Keycloak injecté automatiquement
  getAllForCurrentUser(): Observable<Education[]> {
    return this.http.get<Education[]>(`${this.url}/user/me`);
  }

  getLatestForCurrentUser(): Observable<Education> {
    return this.http.get<Education>(`${this.url}/user/me/latest`);
  }

  create(education: Education): Observable<Education> {
    return this.http.post<Education>(`${this.url}/user/me`, education);
  }

  // ✅ PUT avec id dans l'URL (corrigé)
  update(id: number, education: Education): Observable<Education> {
    return this.http.put<Education>(`${this.url}/${id}`, education);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
