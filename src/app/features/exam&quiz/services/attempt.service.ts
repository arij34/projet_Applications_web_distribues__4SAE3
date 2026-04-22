import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable, catchError, map, throwError } from 'rxjs';
import { ApiAttempt } from '../models/api.models';
import { mapApiAttemptToUi, mapUiAttemptToApi } from '../models/mappers';
import { Attempt } from '../models/attempt.model';

@Injectable({
  providedIn: 'root'
})
export class AttemptService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/attempts`;

  constructor(private readonly http: HttpClient) {}

  getAttempts(): Observable<Attempt[]> {
    return this.http.get<ApiAttempt[]>(this.baseUrl).pipe(
      map((items) => items.map(mapApiAttemptToUi)),
      catchError(this.handleError('Failed to load attempts'))
    );
  }

  getAttemptById(id: string): Observable<Attempt> {
    return this.http.get<ApiAttempt>(`${this.baseUrl}/${id}`).pipe(
      map(mapApiAttemptToUi),
      catchError(this.handleError(`Failed to load attempt ${id}`))
    );
  }

  createAttempt(attempt: Partial<Attempt> | Partial<ApiAttempt>): Observable<Attempt> {
    const payload = mapUiAttemptToApi(attempt as Partial<Attempt>);
    return this.http.post<ApiAttempt>(this.baseUrl, payload).pipe(
      map(mapApiAttemptToUi),
      catchError(this.handleError('Failed to create attempt'))
    );
  }

  updateAttempt(id: string, attempt: Partial<Attempt> | Partial<ApiAttempt>): Observable<Attempt> {
    const payload = mapUiAttemptToApi(attempt as Partial<Attempt>);
    return this.http.put<ApiAttempt>(`${this.baseUrl}/${id}`, payload).pipe(
      map(mapApiAttemptToUi),
      catchError(this.handleError(`Failed to update attempt ${id}`))
    );
  }

  deleteAttempt(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError(`Failed to delete attempt ${id}`))
    );
  }

  private handleError(message: string) {
    return (error: unknown) => {
      console.error(message, error);
      return throwError(() => new Error(message));
    };
  }
}
