import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InvitationService {

  private baseUrl = 'http://localhost:8087/invitations';

  constructor(private http: HttpClient) {}

  // Utiliser /freelancer/me + envoyer le token
  getMyInvitations(freelancerId: number): Observable<any[]> {
    const token = localStorage.getItem('token'); // même clé partout

    const headers: HttpHeaders = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();

    return this.http.get<any[]>(
      `${this.baseUrl}/freelancer/me`,
      {
        params: { freelancerId: freelancerId.toString() },
        headers
      }
    );
  }

  // Envoyer une invitation
  sendInvitation(body: {
    projectId: number | null,
    freelancerId: number,
    clientId: number,
    matchScore: number
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/send`, body);
  }

  // Accept
  acceptInvitation(id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/accept`, {});
  }

  // Decline
  declineInvitation(id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/decline`, {});
  }

  // (optionnel) pending-count si tu ajoutes l'endpoint côté backend
  getPendingCount(): Observable<number> {
    return this.http.get<{ count: number }>(
      `${this.baseUrl}/pending-count`
    ).pipe(map(res => res.count));
  }

  // Mettre en corbeille
  trashInvitation(id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/trash`, {});
  }

  // Restaurer depuis corbeille
  restoreInvitation(id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/restore`, {});
  }

  // Suppression définitive
  deleteInvitation(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  // Récupérer la corbeille
  getTrash(freelancerId: number): Observable<any[]> {
    const token = localStorage.getItem('token');

    const headers: HttpHeaders = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();

    return this.http.get<any[]>(
      `${this.baseUrl}/freelancer/${freelancerId}/trash`,
      { headers }
    );
  }
}