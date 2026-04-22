import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, forkJoin } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import {
  Challenge,
  ChallengeFormData,
  ChallengeInfo,
  GitHubData,
  Task,
  SettingsData
} from '@core/models/challenge.model';
import { ChallengeService } from '@core/services/challenge.service';

const DEFAULT_FORM_DATA: ChallengeFormData = {
  challengeInfo: {
    title: '',
    description: '',
    category: '',
    technologies: [],
    difficulty: '',
    image: null
  },
  githubData: {
    repositoryUrl: '',
    checklist: {
      orgCreated: false,
      repoCreated: false,
      readmeAdded: false,
      forkEnabled: false
    }
  },
  tasks: [],
  settings: {
    startDate: '',
    endDate: '',
    maxParticipants: '',
    points: '',
    status: ''
  }
};

@Injectable({
  providedIn: 'root'
})
export class ChallengeStateService {
  private formDataSubject = new BehaviorSubject<ChallengeFormData>({ ...this.deepClone(DEFAULT_FORM_DATA) });
  formData$ = this.formDataSubject.asObservable();

  constructor(private challengeService: ChallengeService) {}

  getFormData(): ChallengeFormData {
    return this.deepClone(this.formDataSubject.value);
  }

  updateChallengeInfo(data: Partial<ChallengeInfo>): void {
    this.updateFormData({
      challengeInfo: { ...this.formDataSubject.value.challengeInfo, ...data }
    });
  }

  updateGitHubData(data: Partial<GitHubData>): void {
    const current = this.formDataSubject.value.githubData;
    this.updateFormData({
      githubData: {
        ...current,
        ...data,
        checklist: { ...current.checklist, ...(data.checklist ?? {}) }
      }
    });
  }

  updateTasks(tasks: Task[]): void {
    this.updateFormData({ tasks });
  }

  updateSettings(settings: Partial<SettingsData>): void {
    this.updateFormData({
      settings: { ...this.formDataSubject.value.settings, ...settings }
    });
  }

  saveDraft(): Observable<{ message: string }> {
    const payload = this.buildApiPayload('DRAFT');
    const tasks = this.formDataSubject.value.tasks;
    return this.challengeService.addChallenge(payload).pipe(
      switchMap(challenge => this.addTasksToChallenge(String(challenge.id), tasks)),
      map(() => ({ message: 'Draft saved successfully' }))
    );
  }

  publishChallenge(): Observable<Challenge> {
    const status = this.mapStatus(this.formDataSubject.value.settings.status);
    const payload = this.buildApiPayload(status);
    const tasks = this.formDataSubject.value.tasks;
    return this.challengeService.addChallenge(payload).pipe(
      switchMap(challenge =>
        this.addTasksToChallenge(String(challenge.id), tasks).pipe(
          map(() => challenge)
        )
      )
    );
  }

  private addTasksToChallenge(challengeId: string, tasks: Task[]): Observable<any> {
    if (!tasks || tasks.length === 0) {
      return of(null);
    }
    const taskRequests = tasks
      .filter(t => t.title && t.title.trim())
      .map(t =>
        this.challengeService.addTaskToChallenge(challengeId, {
          title: t.title,
          description: t.description || '',
          deadline: t.deadline || undefined
        })
      );
    if (taskRequests.length === 0) {
      return of(null);
    }
    return forkJoin(taskRequests);
  }

  private mapStatus(formStatus: string): string {
    switch (formStatus) {
      case 'published': return 'ACTIVE';
      case 'closed': return 'COMPLETED';
      case 'draft':
      default: return 'DRAFT';
    }
  }

  private mapDifficulty(difficulty: string): string {
    if (!difficulty) return 'BEGINNER';
    const d = difficulty.toLowerCase();
    if (d === 'easy' || d === 'beginner') return 'BEGINNER';
    if (d === 'medium' || d === 'intermediate') return 'INTERMEDIATE';
    if (d === 'hard' || d === 'advanced') return 'ADVANCED';
    if (d === 'expert') return 'EXPERT';
    return 'BEGINNER';
  }

  private buildApiPayload(status: string): Record<string, any> {
    const data = this.formDataSubject.value;
    const info = data.challengeInfo;
    const settings = data.settings;
    const technology = info.technologies?.length ? info.technologies[0] : info.category || '';

    const now = new Date();
    const defaultEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    return {
      title: info.title || 'Untitled Challenge',
      description: info.description || '',
      category: info.category || 'General',
      technology: technology || 'General',
      difficulty: this.mapDifficulty(info.difficulty),
      status,
      maxParticipants: Math.max(1, parseInt(settings.maxParticipants || '100', 10) || 100),
      startDate: settings.startDate ? new Date(settings.startDate).toISOString() : now.toISOString(),
      endDate: settings.endDate ? new Date(settings.endDate).toISOString() : defaultEnd.toISOString(),
      points: Math.max(0, parseInt(settings.points || '100', 10) || 100),
      githubUrl: data.githubData?.repositoryUrl || null,
      image: info.image || null
    };
  }

  resetForm(): void {
    this.formDataSubject.next(this.deepClone(DEFAULT_FORM_DATA));
  }

  private updateFormData(partial: Partial<ChallengeFormData>): void {
    this.formDataSubject.next({
      ...this.formDataSubject.value,
      ...partial
    });
  }

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}
