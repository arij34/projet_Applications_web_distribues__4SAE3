import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Skill } from '../../models/skill/skill.model';
import { environment } from '../../../../environments/environment';
export interface SkillMatchResult {
  skill: any;
  confidence: number;
  exactMatch: boolean;
  suggestion: boolean;
}
@Injectable({ providedIn: 'root' })
export class SkillService {
  private url = `${environment.apiUrl}/skills`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<Skill[]>                    { return this.http.get<Skill[]>(this.url); }
  getById(id: number): Observable<Skill>           { return this.http.get<Skill>(`${this.url}/${id}`); }
  create(s: Skill): Observable<Skill>              { return this.http.post<Skill>(this.url, s); }
  update(id: number, s: Skill): Observable<Skill>  { return this.http.put<Skill>(`${this.url}/${id}`, s); }
  delete(id: number): Observable<void>             { return this.http.delete<void>(`${this.url}/${id}`); }
  matchSkill(input: string): Observable<SkillMatchResult> {
    return this.http.get<SkillMatchResult>(
      `${this.url}/match?input=${encodeURIComponent(input)}`
    );
  }
}