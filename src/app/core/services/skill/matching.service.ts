import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MatchingResult {
  id: number;
  freelancerId: number;
  projectId: number;
  scoreFinal: number;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class MatchingService {

  private apiUrl = 'http://localhost:8087/matching';

  constructor(private http: HttpClient) {}

  // ✅ Fonction pour récupérer le token
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); // même clé que dans InvitationService

    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  // ✅ Matching pour un projet
  getMatching(projectId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${projectId}`, {
      headers: this.getHeaders()
    });
  }

  // ✅ Matching pour un freelancer
  getProjectsForFreelancer(freelancerId: number): Observable<MatchingResult[]> {
    return this.http.get<MatchingResult[]>(
      `${this.apiUrl}/freelancer/${freelancerId}`,
      { headers: this.getHeaders() }
    );
  }

  // ✅ Accept
  acceptByFreelancer(matchingId: number): Observable<MatchingResult> {
    return this.http.put<MatchingResult>(
      `${this.apiUrl}/accept/${matchingId}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // ✅ Reject
  rejectByFreelancer(matchingId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/reject/${matchingId}`,
      { headers: this.getHeaders() }
    );
  }
  getMatchedProjectScoresForFreelancer(freelancerId: number) {
  return this.http.get<{ projectId: number; matchScore: number }[]>(
    `http://localhost:8087/matching/freelancer/${freelancerId}/project-scores`
  );
}
}