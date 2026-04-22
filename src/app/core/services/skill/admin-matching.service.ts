import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminMatchingRow } from '../../models/skill/admin-matching.model';
import { AdminInvitation } from '../../models/skill/admin-invitation.model';
import { AdminMatchingStats } from '../../models/skill/admin-matching-stats.model';


@Injectable({ providedIn: 'root' })
export class AdminMatchingService {

  // 🔹 adapte l’URL au gateway / port du backend matching
  private baseUrl = 'http://localhost:8087/admin';

  constructor(private http: HttpClient) {}

  // Matching table
  getAllMatchings(): Observable<AdminMatchingRow[]> {
    return this.http.get<AdminMatchingRow[]>(`${this.baseUrl}/matching`);
  }

  // Invitations table
  getAllInvitations(): Observable<AdminInvitation[]> {
    return this.http.get<AdminInvitation[]>(`${this.baseUrl}/invitations`);
  }
   // 🔹 nouvelle méthode: stats globales
  getGlobalStats(): Observable<AdminMatchingStats> {
    return this.http.get<AdminMatchingStats>(`${this.baseUrl}/matching/stats`);
  }
}