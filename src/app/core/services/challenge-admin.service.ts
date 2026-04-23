import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Challenge } from '@core/models/challenge.model';
import { Participant } from '@core/models/participant.model';
import { ChallengeService } from './challenge.service';
import { ParticipationService, ParticipationResponse } from './participation.service';

@Injectable({
  providedIn: 'root'
})
export class ChallengeAdminService {
  constructor(
    private challengeService: ChallengeService,
    private participationService: ParticipationService
  ) {}

  getChallenges(): Observable<Challenge[]> {
    return this.challengeService.getChallenges();
  }

  getChallengeById(id: string): Observable<Challenge> {
    return this.challengeService.getChallengeById(id);
  }

  getTasksByChallengeId(challengeId: string): Observable<any[]> {
    return this.challengeService.getTasksByChallengeId(challengeId);
  }

  updateChallenge(challenge: Challenge): Observable<Challenge> {
    const payload = this.toApiPayload(challenge);
    payload['idChallenge'] = challenge.id;
    return this.challengeService.updateChallenge(challenge.id, payload);
  }

  deleteChallenge(challengeId: string): Observable<void> {
    return this.challengeService.deleteChallenge(challengeId);
  }

  updateTask(taskId: string, task: { title?: string; description?: string; status?: string; deadline?: string | null }): Observable<any> {
    return this.challengeService.updateTask(taskId, task);
  }

  deleteTask(taskId: string): Observable<void> {
    return this.challengeService.deleteTask(taskId);
  }

  duplicateChallenge(challenge: Challenge): Observable<Challenge> {
    const payload = this.toApiPayload({
      ...challenge,
      id: '',
      title: `${challenge.title} (Copy)`,
      status: 'Draft',
      participants: 0,
      progress: 0
    });
    return this.challengeService.addChallenge(payload);
  }

  getParticipants(challengeId: string): Observable<Participant[]> {
    return this.participationService.getParticipationsByChallenge(challengeId).pipe(
      map((participations: ParticipationResponse[]) =>
        participations.map((p, i) => this.mapParticipationToParticipant(p, i))
      )
    );
  }

  private mapParticipationToParticipant(p: ParticipationResponse, index: number): Participant {
    const status = this.mapParticipationStatus(p.status);
    return {
      id: p.id,
      name: p.usernameGithub || `Participant ${index + 1}`,
      email: p.usernameGithub ? `${p.usernameGithub}@github` : '',
      enrolledDate: p.forkCreatedAt ? new Date(p.forkCreatedAt).toLocaleDateString() : 'N/A',
      progress: status === 'Completed' ? 100 : 0,
      tasksCompleted: 0,
      totalTasks: 0,
      status,
      lastActivity: p.forkCreatedAt ? new Date(p.forkCreatedAt).toLocaleDateString() : 'N/A'
    };
  }

  private mapParticipationStatus(status: string): 'Active' | 'Completed' | 'Dropped' {
    const s = (status || '').toUpperCase();
    if (s === 'COMPLETED' || s === 'DONE') return 'Completed';
    if (s === 'DROPPED' || s === 'CANCELLED') return 'Dropped';
    return 'Active';
  }

  private toApiPayload(c: Challenge): Record<string, any> {
    const tech = c.technology;
    const techValue = Array.isArray(tech) ? (tech[0] ?? tech.join(',')) : (tech ?? '');
    const startDate = this.toIsoDate(c.startDate);
    const endDate = this.toIsoDate(c.endDate);

    return {
      title: c.title ?? '',
      description: c.description ?? '',
      category: c.category ?? '',
      technology: techValue,
      difficulty: this.mapDifficultyToApi(c.difficulty),
      status: this.mapStatusToApi(c.status),
      maxParticipants: Math.max(1, Number(c.maxParticipants) || 100),
      startDate: startDate ?? null,
      endDate: endDate ?? null,
      points: Math.max(0, Number(c.points) || 100),
      githubUrl: c.githubUrl ?? null,
      image: c.image && String(c.image).trim() ? c.image : null
    };
  }

  private mapDifficultyToApi(difficulty?: string): string {
    if (!difficulty) return 'BEGINNER';
    const d = String(difficulty).toUpperCase();
    if (['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'].includes(d)) return d;
    const map: Record<string, string> = {
      'EASY': 'BEGINNER',
      'MEDIUM': 'INTERMEDIATE',
      'HARD': 'ADVANCED'
    };
    return map[d] ?? 'BEGINNER';
  }

  private toIsoDate(val: Date | string | undefined): string | undefined {
    if (!val) return undefined;
    const d = val instanceof Date ? val : new Date(val);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  }

  private mapStatusToApi(status?: string): string {
    if (!status) return 'DRAFT';
    const s = status.toLowerCase();
    if (s === 'active') return 'ACTIVE';
    if (s === 'completed') return 'COMPLETED';
    if (s === 'comingsoon' || s === 'coming soon') return 'COMINGSOON';
    return 'DRAFT';
  }

}
