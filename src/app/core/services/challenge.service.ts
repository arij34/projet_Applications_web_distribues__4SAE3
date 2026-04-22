import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@environments/environment';
import { Challenge, ChallengeDetail, ChallengeTask } from '../models/challenge.model';

@Injectable({
  providedIn: 'root'
})
export class ChallengeService {
  private apiUrl = `${environment.apiUrl}/challenges`;
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get tasks for a challenge. URL from environment.challengeTasksPath (e.g. '/tasks/challenge/{id}')
   */
  getTasksByChallengeId(challengeId: string): Observable<ChallengeTask[]> {
    const path = (environment.challengeTasksPath || '/tasks/challenge/{id}').replace('{id}', challengeId);
    return this.http.get<any[]>(`${this.baseUrl}${path}`).pipe(
      map(tasks => this.mapTasks(tasks))
    );
  }

  /**
   * Add a task to a challenge. POST to /tasks/challenge/{challengeId}
   */
  addTaskToChallenge(challengeId: string, task: { title: string; description?: string; status?: string; deadline?: string }): Observable<ChallengeTask> {
    const path = ((environment as any).addTaskPath || '/tasks/{id}').replace('{id}', challengeId);
    const id = this.generateUUID();
    const payload = {
      id,
      idTask: id,
      id_task: id,
      title: task.title,
      description: task.description || '',
      status: task.status || 'INCOMPLETE',
      deadline: task.deadline || null
    };
    return this.http.post<any>(`${this.baseUrl}${path}`, payload).pipe(
      map(t => this.mapTasks([t])[0])
    );
  }

  /**
   * Get all challenges with optional filters
   */
  getChallenges(filters?: {
    difficulty?: string;
    category?: string;
    status?: string;
  }): Observable<Challenge[]> {
    let params = new HttpParams();
    
    if (filters?.difficulty) params = params.set('difficulty', filters.difficulty);
    if (filters?.category) params = params.set('category', filters.category);
    if (filters?.status) params = params.set('status', filters.status);

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(response => {
        const challenges = Array.isArray(response) ? response : (response?.content ?? []);
        return challenges.map((c: any) => this.mapChallengeResponse(c));
      })
    );
  }

  /**
   * Get challenge by ID (includes tasks)
   */
  getChallengeById(id: string): Observable<ChallengeDetail> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(c => ({
        ...this.mapChallengeResponse(c),
        requirements: c.requirements ?? [],
        resources: c.resources ?? [],
        submissions: c.submissions ?? 0,
        tasks: this.extractAndMapTasks(c)
      }))
    );
  }

  private mapChallengeResponse(c: any) {
    return {
      id: String(c.id ?? c.idChallenge ?? ''),
      title: c.title,
      description: c.description,
      category: c.category,
      technology: c.technology,
      startDate: c.startDate ? new Date(c.startDate) : undefined,
      endDate: c.endDate ? new Date(c.endDate) : undefined,
      difficulty: c.difficulty,
      status: c.status,
      maxParticipants: c.maxParticipants,
      points: c.points ?? 0,
      participants: c.participants ?? 0,
      progress: c.progress ?? 0,
      githubUrl: c.githubUrl,
      image: c.image ?? c.imageUrl ?? c.img,
      tasks: this.extractAndMapTasks(c),
      createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
      updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date()
    };
  }

  private extractAndMapTasks(c: any): ChallengeTask[] {
    const tasks = c.tasks ?? c.taskList ?? c.challengeTasks ?? c.taskSet;
    return this.mapTasks(tasks);
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private mapTasks(tasks: any[]): ChallengeTask[] {
    if (!Array.isArray(tasks)) return [];
    return tasks.map((t: any) => ({
      id: t.idTask ?? t.id ?? '',
      idTask: t.idTask ?? t.id,
      title: t.title ?? '',
      description: t.description ?? '',
      status: t.status ?? 'INCOMPLETE',
      deadline: t.deadline ? new Date(t.deadline) : undefined,
      submittedAt: t.submittedAt ? new Date(t.submittedAt) : undefined
    }));
  }

  /**
   * Add a new challenge
   */
  addChallenge(challenge: Record<string, any>): Observable<Challenge> {
    // MySQL TEXT ~64KB. Send URL or compressed base64 under limit.
    const img = challenge['image'] || null;
    const trimmed = img && typeof img === 'string' ? img.trim() : '';
    const imageForDb = trimmed.length > 0 && trimmed.length <= 60000 ? trimmed : null;

    const raw: Record<string, any> = {
      title: challenge['title'],
      description: challenge['description'],
      category: challenge['category'] ?? challenge['technology'],
      technology: challenge['technology'],
      difficulty: challenge['difficulty'],
      status: challenge['status'],
      maxParticipants: Math.max(1, challenge['maxParticipants'] ?? 1),
      startDate: challenge['startDate'] ? (challenge['startDate'] instanceof Date ? challenge['startDate'].toISOString() : challenge['startDate']) : null,
      endDate: challenge['endDate'] ? (challenge['endDate'] instanceof Date ? challenge['endDate'].toISOString() : challenge['endDate']) : null,
      points: challenge['points'] ?? 0,
      githubUrl: challenge['githubUrl'] || null,
      image: imageForDb
    };
    const payload: Record<string, any> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (v === undefined) continue;
      payload[k] = v;
    }
    return this.http.post<any>(this.apiUrl, payload).pipe(
      map(c => ({
        id: c.idChallenge ?? c.id,
        title: c.title,
        description: c.description,
        category: c.category,
        technology: c.technology,
        startDate: c.startDate ? new Date(c.startDate) : undefined,
        endDate: c.endDate ? new Date(c.endDate) : undefined,
        difficulty: c.difficulty,
        status: c.status,
        maxParticipants: c.maxParticipants,
        points: c.points ?? 0,
        participants: c.participants ?? 0,
        progress: c.progress ?? 0,
        githubUrl: c.githubUrl,
        image: c.image ?? c.imageUrl ?? c.img,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt)
      }))
    );
  }

  /**
   * Update an existing challenge
   */
  updateChallenge(id: string, challenge: Record<string, any>): Observable<Challenge> {
    const img = challenge['image'] || null;
    const trimmed = img && typeof img === 'string' ? img.trim() : '';
    const imageForDb = trimmed.length > 0 && trimmed.length <= 60000 ? trimmed : null;

    const startDate = challenge['startDate'];
    const endDate = challenge['endDate'];
    const toIso = (v: any) => !v ? null : (v instanceof Date ? v.toISOString() : v);

    const payload: Record<string, any> = {
      idChallenge: challenge['idChallenge'] ?? id,
      title: challenge['title'] ?? '',
      description: challenge['description'] ?? '',
      category: challenge['category'] ?? '',
      technology: challenge['technology'] ?? '',
      difficulty: challenge['difficulty'] ?? 'BEGINNER',
      status: challenge['status'] ?? 'DRAFT',
      maxParticipants: Math.max(1, Number(challenge['maxParticipants']) || 100),
      points: Math.max(0, Number(challenge['points']) || 100),
      githubUrl: challenge['githubUrl'] ?? null,
      startDate: toIso(startDate),
      endDate: toIso(endDate),
      image: imageForDb
    };

    return this.http.put<any>(`${this.apiUrl}/${id}`, payload).pipe(
      map(c => ({
        id: String(c.idChallenge ?? c.id ?? id),
        title: c.title,
        description: c.description,
        category: c.category,
        technology: c.technology,
        startDate: c.startDate ? new Date(c.startDate) : undefined,
        endDate: c.endDate ? new Date(c.endDate) : undefined,
        difficulty: c.difficulty,
        status: c.status,
        maxParticipants: c.maxParticipants,
        points: c.points ?? 0,
        participants: c.participants ?? 0,
        progress: c.progress ?? 0,
        githubUrl: c.githubUrl,
        image: c.image ?? c.imageUrl ?? c.img,
        createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
        updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date()
      }))
    );
  }

  /**
   * Delete a challenge
   */
  deleteChallenge(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateTask(taskId: string, task: { title?: string; description?: string; status?: string; deadline?: string | null }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/tasks/${taskId}`, task);
  }

  updateTaskStatus(taskId: string, status: string): Observable<any> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<any>(`${this.baseUrl}/tasks/${taskId}/status`, null, { params });
  }

  deleteTask(taskId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/tasks/${taskId}`);
  }

  /**
   * Join a challenge
   */
  joinChallenge(challengeId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${challengeId}/join`, {});
  }

  /**
   * Submit challenge solution
   */
  submitSolution(challengeId: string, data: any): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${challengeId}/submit`, data);
  }

  /**
   * Get user's enrolled challenges
   */
  getEnrolledChallenges(): Observable<Challenge[]> {
    return this.http.get<any[]>(`${this.apiUrl}/enrolled`).pipe(
      map(challenges =>
        challenges.map(c => ({
          id: c.idChallenge,
          title: c.title,
          description: c.description,
          category: c.category,
          technology: c.technology,
          startDate: c.startDate ? new Date(c.startDate) : undefined,
          endDate: c.endDate ? new Date(c.endDate) : undefined,
          difficulty: c.difficulty,
          status: c.status,
          maxParticipants: c.maxParticipants,
          points: c.points ?? 0,
          participants: c.participants ?? 0,
          progress: c.progress ?? 0,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt)
        }))
      )
    );
  }

  getActiveChallengesCount(): Observable<number> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/count/active`).pipe(
      map(res => res.count ?? 0)
    );
  }

  getCompletedChallengesCount(): Observable<number> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/count/completed`).pipe(
      map(res => res.count ?? 0)
    );
  }

  getTechnologyCounts(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${this.apiUrl}/stats/technology-counts`);
  }

  getCategoryCounts(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${this.apiUrl}/stats/category-counts`);
  }
}