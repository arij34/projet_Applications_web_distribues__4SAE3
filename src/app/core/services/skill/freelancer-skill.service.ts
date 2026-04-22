import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FreelancerSkill } from '../../models/skill/freelancer-skill.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FreelancerSkillService {

  private url = `${environment.apiUrl}/freelancer-skill`;

  constructor(private http: HttpClient) {}

  // ✅ CORRIGÉ : appelle /user/me (token JWT envoyé automatiquement par AuthTokenInterceptor)
  getAll(): Observable<FreelancerSkill[]> {
    return this.http.get<FreelancerSkill[]>(`${this.url}/user/me`);
  }

  getAllForCurrentUser(): Observable<FreelancerSkill[]> {
    return this.http.get<FreelancerSkill[]>(`${this.url}/user/me`);
  }

  getById(id: number): Observable<FreelancerSkill> {
    return this.http.get<FreelancerSkill>(`${this.url}/${id}`);
  }

  // ✅ Création manuelle — /user/me?skillInput=...
  createWithSkillInput(skillInput: string, payload: Partial<FreelancerSkill>): Observable<any> {
    return this.http.post<any>(
      `${this.url}/user/me?skillInput=${encodeURIComponent(skillInput)}`,
      payload
    );
  }

  // ✅ Création depuis CV — /CV/me?skillInput=...
  createWithSkillInputCV(skillInput: string, payload: Partial<FreelancerSkill>): Observable<any> {
    return this.http.post<any>(
      `${this.url}/CV/me?skillInput=${encodeURIComponent(skillInput)}`,
      payload
    );
  }

  update(freelancerSkill: FreelancerSkill): Observable<any> {
    return this.http.put<any>(this.url, freelancerSkill);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  getLevelByYears(years: number): Observable<{ years: number; level: number; label: string }> {
    return this.http.get<{ years: number; level: number; label: string }>(
      `${this.url}/level/${years}`
    );
  }

  // ✅ CORRIGÉ : /user/me/duplicates — plus de userId dans l'URL
  getDuplicateSkillsForCurrentUser(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/user/me/duplicates`);
  }

  // Pour l'admin uniquement (par userId)
  getDuplicateSkillsByUserId(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/user/${userId}/duplicates`);
  }

  // ✅ CORRIGÉ : /check-skills/me (correspond exactement au backend)
  checkExistingSkillsForCurrentUser(skills: string[]): Observable<{ existing: string[]; newSkills: string[] }> {
    return this.http.post<{ existing: string[]; newSkills: string[] }>(
      `${this.url}/check-skills/me`,
      skills
    );
  }
}