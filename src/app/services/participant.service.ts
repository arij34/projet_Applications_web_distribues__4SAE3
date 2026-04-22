import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Event } from './event.service'; // importer Event si tu as une interface Event

// ✅ Interface corrigée sans champ 'nom'
export interface Participant {
  id?: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  event?: Event; // référence vers Event
}

@Injectable({
  providedIn: 'root'
})
export class ParticipantService {
  private apiUrl = 'http://localhost:8084/evenment/api/participants';

  constructor(private http: HttpClient) {}

  // ➕ Add Participant
  addParticipant(participant: Participant): Observable<Participant> {
    return this.http.post<Participant>(this.apiUrl, participant);
  }

  // 📥 Get All
  getAllParticipants(): Observable<Participant[]> {
    return this.http.get<Participant[]>(this.apiUrl);
  }

  // 📥 Get By Id
  getParticipant(id: number): Observable<Participant> {
    return this.http.get<Participant>(`${this.apiUrl}/${id}`);
  }

  // ✏ Update
  updateParticipant(id: number, participant: Participant): Observable<Participant> {
    return this.http.put<Participant>(`${this.apiUrl}/${id}`, participant);
  }

  // ❌ Delete
  deleteParticipant(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // 📥 Get Participants by Event
  getParticipantsByEvent(eventId: number): Observable<Participant[]> {
    return this.http.get<Participant[]>(`${this.apiUrl}/event/${eventId}`);
  }
 getParticipantsOfClosedEvents(): Observable<Participant[]> {
  return this.http.get<Participant[]>(`${this.apiUrl}/closed-events`);
}
}