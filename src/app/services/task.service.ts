import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type TaskStatut = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriorite = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Task {
  id?: number;
  titre: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  statut: TaskStatut;
  priorite?: TaskPriorite;
  isOverdue?: boolean;
  /** Formulaire uniquement : id du planning lié */
  planningId?: number | null;
  /** Pour création / mise à jour : envoyer le planning lié */
  planning?: { id: number };
}

export interface AiTaskSuggestionRequest {
  planningId: number;
  targetCount?: number;
}

export interface AiTaskSuggestionResponse {
  model?: string;
  suggestions: Task[];
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = 'http://localhost:8089/planning/api/tasks';

  constructor(private http: HttpClient) {}

  addTask(task: Task): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task);
  }

  getAllTasks(): Observable<Task[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map((data: any[]) => (data || []).map(item => this.normalizeTask(item)))
    );
  }

  getTask(id: number): Observable<Task> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(item => this.normalizeTask(item))
    );
  }

  getOverdueTasks(): Observable<Task[]> {
    return this.http.get<any[]>(`${this.apiUrl}/overdue`).pipe(
      map((data: any[]) => (data || []).map(item => this.normalizeTask(item)))
    );
  }

  generateTodoSuggestions(request: AiTaskSuggestionRequest): Observable<AiTaskSuggestionResponse> {
    return this.http.post<any>(`${this.apiUrl}/ai-suggestions`, request).pipe(
      map((res: any) => ({
        model: res?.model,
        suggestions: (res?.suggestions || []).map((item: any) => this.normalizeTask(item))
      }))
    );
  }

  updateTask(id: number, task: Task): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/${id}`, task);
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private normalizeTask(item: any): Task {
    let source: any = item?.task ?? item ?? {};

    if (
      source &&
      typeof source === 'object' &&
      !('id' in source) &&
      !('titre' in source) &&
      Object.keys(source).length === 1
    ) {
      const onlyVal = Object.values(source)[0];
      if (onlyVal && typeof onlyVal === 'object') {
        source = onlyVal;
      }
    }

    const d1 = source.dateDebut ?? source.date_debut ?? '';
    const d2 = source.dateFin ?? source.date_fin ?? '';
    const statut = (source.statut ?? source.status ?? 'TODO') as TaskStatut;
    const priorite = (source.priorite ?? source.priority ?? 'LOW') as TaskPriorite;

    const planningId = source.planning?.id ?? source.planningId ?? source.planning_id;

    return {
      id: source.id,
      titre: source.titre ?? source.title ?? '',
      description: source.description ?? '',
      dateDebut: this.normalizeDateString(d1),
      dateFin: this.normalizeDateString(d2),
      statut: ['TODO', 'IN_PROGRESS', 'DONE'].includes(statut) ? statut : 'TODO',
      priorite: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(priorite) ? priorite : 'LOW',
      isOverdue: Boolean(source.isOverdue ?? source.overdue ?? false),
      planningId: planningId != null ? Number(planningId) : undefined,
      planning: source.planning?.id ? { id: source.planning.id } : undefined
    };
  }

  private normalizeDateString(v: any): string {
    if (!v) return '';
    if (typeof v === 'string') {
      return v.replace(' ', 'T').replace(/(\.\d{3})\d+$/, '$1');
    }
    return String(v);
  }
}
