import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Planning {
  id?: number;
  type: string;
  dateCreation: string;
}

export interface PlanningAnalysis {
  planningId: number;
  planningType: string;
  totalTasks: number;
  doneTasks: number;
  overdueTasks: number;
  criticalTasks: number;
  completionRate: number;
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
  recommendedFocus: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlanningService {
  private apiUrl = 'http://localhost:8089/planning/api/plannings';

  constructor(private http: HttpClient) {}

  addPlanning(planning: Planning): Observable<Planning> {
    return this.http.post<Planning>(this.apiUrl, planning);
  }

  getAllPlannings(): Observable<Planning[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map((data: any[]) => (data || []).map(item => this.normalizePlanning(item)))
    );
  }

  getPlanning(id: number): Observable<Planning> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(item => this.normalizePlanning(item))
    );
  }

  getPlanningAnalysis(id: number): Observable<PlanningAnalysis> {
    return this.http.get<PlanningAnalysis>(`${this.apiUrl}/${id}/analysis`);
  }

  updatePlanning(id: number, planning: Planning): Observable<Planning> {
    return this.http.put<Planning>(`${this.apiUrl}/${id}`, planning);
  }

  deletePlanning(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private normalizePlanning(item: any): Planning {
    let source: any = item?.planning ?? item ?? {};

    if (
      source &&
      typeof source === 'object' &&
      !('id' in source) &&
      !('type' in source) &&
      !('dateCreation' in source) &&
      Object.keys(source).length === 1
    ) {
      const onlyVal = Object.values(source)[0];
      if (onlyVal && typeof onlyVal === 'object') {
        source = onlyVal;
      }
    }

    const rawDate: any =
      source.dateCreation ??
      source.date_creation ??
      source.date_created ??
      source.dateCreationStr ??
      source.date_creation_str ??
      '';

    let normalizedDate = '';
    if (typeof rawDate === 'string') {
      normalizedDate = rawDate.replace(' ', 'T').replace(/(\.\d{3})\d+$/, '$1');
    }

    return {
      id: source.id ?? source.planningId ?? source.planning_id ?? undefined,
      type: source.type ?? source.planningType ?? source.planning_type ?? '',
      dateCreation: normalizedDate
    };
  }
}
