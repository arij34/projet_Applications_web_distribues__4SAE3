import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClientInvitation } from '../../models/skill/client-invitation.model';

@Injectable({ providedIn: 'root' })
export class ProjectInvitationService {

  private baseUrl = 'http://localhost:8087/projects';

  constructor(private http: HttpClient) {}

  getInvitationsForProject(projectId: number): Observable<ClientInvitation[]> {
    return this.http.get<ClientInvitation[]>(`${this.baseUrl}/${projectId}/invitations`);
  }
}