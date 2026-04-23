import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';

export interface ParticipationResponse {
  id: string;
  usernameGithub: string;
  repoUrl: string;
  repoName: string;
  forkCreatedAt: string;
  status: string;
  challenge: any;
}

export interface InvitationStatusResponse {
  participationId: string;
  accepted: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ParticipationService {
  private baseUrl = `${environment.apiUrl}/participations`;

  constructor(private http: HttpClient) {}

  checkGitHubUserExists(usernameGithub: string): Observable<{ usernameGithub: string; exists: boolean }> {
    return this.http.get<{ usernameGithub: string; exists: boolean }>(
      `${this.baseUrl}/github/user-exists/${usernameGithub}`
    );
  }

  joinChallenge(challengeId: string, usernameGithub: string): Observable<ParticipationResponse> {
    const params = new HttpParams().set('usernameGithub', usernameGithub);
    return this.http.post<ParticipationResponse>(`${this.baseUrl}/${challengeId}/join`, null, { params });
  }

  checkInvitationStatus(participationId: string): Observable<InvitationStatusResponse> {
    return this.http.get<InvitationStatusResponse>(`${this.baseUrl}/${participationId}/invitation-status`);
  }

  getParticipation(id: string): Observable<ParticipationResponse> {
    return this.http.get<ParticipationResponse>(`${this.baseUrl}/${id}`);
  }

  getParticipationsByChallenge(challengeId: string): Observable<ParticipationResponse[]> {
    return this.http.get<ParticipationResponse[]>(`${this.baseUrl}/challenge/${challengeId}`);
  }

  deleteParticipation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getSonarResults(participationId: string): Observable<SonarResultResponse> {
    return this.http.get<SonarResultResponse>(`${this.baseUrl}/${participationId}/sonar-results`);
  }

  refreshSonarResults(participationId: string): Observable<SonarResultResponse> {
    return this.http.post<SonarResultResponse>(`${this.baseUrl}/${participationId}/sonar-results/refresh`, null);
  }

  getSonarResultsStatus(participationId: string): Observable<SonarResultsStatusResponse> {
    return this.http.get<SonarResultsStatusResponse>(
      `${this.baseUrl}/${participationId}/sonar-results/status`
    );
  }

  getMyChallenges(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/my/challenges`);
  }

  getMyParticipationForChallenge(challengeId: string): Observable<ParticipationResponse> {
    return this.http.get<ParticipationResponse>(`${this.baseUrl}/my/challenge/${challengeId}`);
  }

  getTotalParticipantsCount(): Observable<number> {
    return this.http.get<{ count: number }>(`${this.baseUrl}/count`).pipe(
      map(res => res.count ?? 0)
    );
  }

  submitChallenge(participationId: string, branchName: string): Observable<SubmitChallengeResponse> {
    const params = new HttpParams().set('branchName', branchName);
    return this.http.post<SubmitChallengeResponse>(`${this.baseUrl}/${participationId}/submit`, null, { params });
  }

  checkBranchExists(repoUrl: string, branchName: string): Observable<{ exists: boolean }> {
    const params = new HttpParams().set('repoUrl', repoUrl).set('branchName', branchName);
    return this.http.get<{ repoUrl: string; branchName: string; exists: boolean }>(`${this.baseUrl}/github/branch-exists`, { params });
  }
}

export interface SubmitChallengeResponse {
  participationId: string;
  pullRequestUrl: string;
  message: string;
}

export interface SonarResultResponse {
  id: string;
  qualityGateStatus: string;
  bugs: number;
  codeSmells: number;
  vulnerabilities: number;
  securityHotspots: number;
  coverage: number;
  duplication: number;
  linesOfCode: number;
  pullRequestKey: string;
  analyzedAt: string;
}

export interface SonarResultsStatusResponse {
  status: string;
  result: SonarResultResponse | null;
}

