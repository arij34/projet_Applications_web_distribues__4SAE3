import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AnalysisResult {
  skills: any[];
  complexity: { level: string; score: number; multiplier: number };
  duration: { min_weeks: number; max_weeks: number; estimated_weeks: number; warning: string | null };
  budget: { min: number; max: number; recommended: number; currency: string; hourly_rate_avg: number };
  profit: { platform_fee_percent: number; platform_revenue: number; freelancer_profit: number; net_project_cost: number; freelancer_margin_percent: number };
  risk: { level: string; score: number; max_score: number; color: string; factors: string[]; advice: string };
  freelancers: { estimated_count: number; range: string; required_categories: string[]; availability: string };
}

@Injectable({ providedIn: 'root' })
export class AnalysisService {

  private apiUrl     = 'http://localhost:8085/analysis/analyze';
  private projectUrl = 'http://localhost:8085/projects';

  constructor(private http: HttpClient) {}

  analyzeProject(title: string, description: string, deadline: string): Observable<AnalysisResult> {
    return this.http.post<AnalysisResult>(this.apiUrl, { title, description, deadline });
  }

  saveProjectSkills(projectId: number, skills: any[]): Observable<any> {
    return this.http.post(`${this.projectUrl}/${projectId}/skills`, skills);
  }

  saveProjectAnalysis(projectId: number, analysis: AnalysisResult, feasibilityScore: number): Observable<any> {
    return this.http.post(`${this.projectUrl}/${projectId}/analysis`, {
      ...analysis,
      feasibilityScore
    });
  }

  // ← NOUVEAU : récupérer l'analyse sauvegardée d'un projet
  getProjectAnalysis(projectId: number): Observable<any> {
    return this.http.get(`${this.projectUrl}/${projectId}/analysis`);
  }
}