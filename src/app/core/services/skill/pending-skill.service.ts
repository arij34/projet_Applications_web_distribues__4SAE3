import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PendingSkill } from '../../models/skill/pending-skill.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PendingSkillService {

  private url = `${environment.apiUrl}/pending-skills`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<PendingSkill[]> {
    return this.http.get<PendingSkill[]>(this.url);
  }

  approve(id: number): Observable<void> {
    return this.http.post<void>(`${this.url}/${id}/approve`, {});
  }

  reject(id: number): Observable<void> {
    return this.http.post<void>(`${this.url}/${id}/reject`, {});
  }
}