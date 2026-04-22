import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SavedProjectService {

  private api = 'http://localhost:8085/saved-projects';

  constructor(private http: HttpClient) {}

  // ← garde l'ancienne méthode pour compatibilité
  saveProject(freelancerId: number, projectId: number): Observable<any> {
    return this.http.post(this.api, { freelancerId, projectId });
  }

  saveProjectByKeycloak(keycloakId: string, projectId: number): Observable<any> {
    return this.http.post(this.api, {
      freelancerKeycloakId: keycloakId,
      projectId
    });
  }

  unsaveProject(freelancerId: number, projectId: number): Observable<any> {
    const params = new HttpParams()
      .set('freelancerId', freelancerId.toString())
      .set('projectId', projectId.toString());
    return this.http.delete(this.api, { params });
  }

  unsaveProjectByKeycloak(keycloakId: string, projectId: number): Observable<any> {
    const params = new HttpParams()
      .set('freelancerKeycloakId', keycloakId)
      .set('projectId', projectId.toString());
    return this.http.delete(this.api, { params });
  }

  checkSaved(freelancerId: number, projectId: number): Observable<{ saved: boolean }> {
    const params = new HttpParams()
      .set('freelancerId', freelancerId.toString())
      .set('projectId', projectId.toString());
    return this.http.get<{ saved: boolean }>(`${this.api}/check`, { params });
  }

  checkSavedByKeycloak(keycloakId: string, projectId: number): Observable<{ saved: boolean }> {
    const params = new HttpParams()
      .set('freelancerKeycloakId', keycloakId)
      .set('projectId', projectId.toString());
    return this.http.get<{ saved: boolean }>(`${this.api}/check-keycloak`, { params });
  }

  getSavedProjects(freelancerId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/freelancer/${freelancerId}`);
  }

  getSavedProjectsByKeycloak(keycloakId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/freelancer/by-keycloak/${keycloakId}`);
  }
}