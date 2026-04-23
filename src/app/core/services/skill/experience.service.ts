import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Experience } from '../../models/skill/experience.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ExperienceService {

  private baseUrl = `${environment.apiUrl}/experience`;

  constructor(private http: HttpClient) {}

  // 🔒 Récupérer uniquement les expériences de l'utilisateur connecté
  getMyExperiences(): Observable<Experience[]> {
    return this.http.get<Experience[]>(`${this.baseUrl}/user/me`);
  }

  // 🔍 Récupérer une expérience par ID (optionnel)
  getById(id: number): Observable<Experience> {
  return this.http.get<Experience>(`${this.baseUrl}/user/me/${id}`);
}

  // ✅ Création sécurisée (user récupéré via token backend)
  create(experience: Experience): Observable<Experience> {
    return this.http.post<Experience>(`${this.baseUrl}/user/me`, experience);
  }

  // 🔄 Mise à jour sécurisée
  update(experience: Experience): Observable<Experience> {
    return this.http.put<Experience>(`${this.baseUrl}/user/me`, experience);
  }

  // ❌ Suppression (tu peux aussi sécuriser côté backend)
  delete(id: number): Observable<void> {
  return this.http.delete<void>(`${this.baseUrl}/user/me/${id}`);
}

  // 📊 Calcul total années d'expérience pour user connecté
  getTotalYearsForCurrentUser(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/user/me/total-years`);
  }
}
