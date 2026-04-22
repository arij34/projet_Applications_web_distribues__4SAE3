import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ✅ Interface pour typer les événements
export interface Event {
  id?: number;
  titre: string;
  description: string;
  dateDebut: string; // format ISO string
  dateFin: string;   // format ISO string
  lieu: string;
  status: string;    // OPEN / CLOSED
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  // ✅ URL corrigée avec context-path /evenment
  private apiUrl = 'http://localhost:8084/evenment/api/events';

  constructor(private http: HttpClient) {}

  // ➕ Create
  addEvent(event: Event): Observable<Event> {
    return this.http.post<Event>(this.apiUrl, event);
  }

  // 📥 Read All
  getAllEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(this.apiUrl);
  }

  // 📥 Read By Id
  getEventById(id: number): Observable<Event> {
    return this.http.get<Event>(`${this.apiUrl}/${id}`);
  }

  // ✏ Update
  updateEvent(id: number, event: Event): Observable<Event> {
    return this.http.put<Event>(`${this.apiUrl}/${id}`, event);
  }

  // ❌ Delete
  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // 📊 Analyse IA (nouveau endpoint backend)
  analyse(eventId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${eventId}/analyse`);
  }
  
}