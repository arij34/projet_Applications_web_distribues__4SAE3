import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Project } from '../models/project.model';
import { environment } from '../../../environments/environment';

export interface ProjectParticipant {
  freelancerId: number;
  proposalId: number;
  id: number; // alias for proposalId, for template compatibility
  status: string;
  bidAmount: number;
  deliveryWeeks: number;
  coverLetter?: string;
  createdAt: string;
  availableFrom?: string;
  questionToClient?: string;
  portfolioUrl?: string;
  freelancerEmail?: string;
  freelancerName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  private apiUrl = `${environment.projectApiUrl}/projects`;

  constructor(private http: HttpClient) {}

  addProject(project: Project): Observable<Project> {
    return this.http.post<Project>(this.apiUrl, project);
  }

  getAllProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.apiUrl);
  }

  getProjectsByClient(clientId: number): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/client/${clientId}`);
  }

  updateProject(id: number, project: Project): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/${id}`, project);
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  requestDeleteProject(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/delete-request`, {});
  }

  getDeleteRequests(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/delete-requests`);
  }

  approveDelete(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/delete-request/approve`, {});
  }

  rejectDelete(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/delete-request/reject`, {});
  }

  getProjectById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}`);
  }

  /**
   * Fetches project participants (proposals) from backend GET /projects/{projectId}/participants.
   * Optionally filter by proposal status (PENDING, ACCEPTED, REJECTED, WITHDRAWN).
   */
  getProjectParticipants(projectId: number, status?: string): Observable<ProjectParticipant[]> {
    let params = new HttpParams();
    if (status && status !== 'ALL') params = params.set('status', status);
    return this.http.get<any[]>(`${this.apiUrl}/${projectId}/participants`, { params }).pipe(
      map(list => (list || []).map((p: any) => ({
        ...p,
        id: p.proposalId ?? p.id,
        freelancerId: p.freelancerId,
        proposalId: p.proposalId ?? p.id,
        status: p.status,
        bidAmount: p.bidAmount,
        deliveryWeeks: p.deliveryWeeks,
        coverLetter: p.coverLetter,
        createdAt: p.createdAt,
        availableFrom: p.availableFrom,
        questionToClient: p.questionToClient,
        portfolioUrl: p.portfolioUrl,
        freelancerEmail: p.freelancerEmail ?? '',
        freelancerName: p.freelancerName ?? `Freelancer #${p.freelancerId ?? ''}`
      })))
    );
  }

  getDeleteHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/delete-history`);
  }
  getAcceptedProjects(freelancerId: number): Observable<Project[]> {
    return this.http.get<Project[]>(
      `${environment.projectApiUrl}/proposals/freelancer/${freelancerId}/accepted-projects`
    );
  }

  getAcceptedProjectsByKeycloak(keycloakId: string): Observable<Project[]> {
    return this.http.get<Project[]>(
      `${environment.projectApiUrl}/proposals/freelancer/by-keycloak/${keycloakId}/accepted-projects`
    );
  }
}