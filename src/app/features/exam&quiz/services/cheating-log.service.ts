import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable, catchError, map, throwError } from 'rxjs';
import { ApiCheatingLog } from '../models/api.models';
import { mapApiCheatingLogToUi, mapUiCheatingLogToApi } from '../models/mappers';
import { CheatingLog, CheatingStats } from '../models/cheating-log.model';

@Injectable({
  providedIn: 'root'
})
export class CheatingLogService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/cheating-logs`;

  constructor(private readonly http: HttpClient) {}

  getLogs(): Observable<CheatingLog[]> {
    return this.http.get<ApiCheatingLog[]>(this.baseUrl).pipe(
      map((items) => items.map(mapApiCheatingLogToUi)),
      catchError(this.handleError('Failed to load cheating logs'))
    );
  }

  getLogById(id: string): Observable<CheatingLog> {
    return this.http.get<ApiCheatingLog>(`${this.baseUrl}/${id}`).pipe(
      map(mapApiCheatingLogToUi),
      catchError(this.handleError(`Failed to load cheating log ${id}`))
    );
  }

  createLog(log: Partial<CheatingLog>): Observable<CheatingLog> {
    const payload = mapUiCheatingLogToApi(log);
    return this.http.post<ApiCheatingLog>(this.baseUrl, payload).pipe(
      map(mapApiCheatingLogToUi),
      catchError(this.handleError('Failed to create cheating log'))
    );
  }

  updateLog(id: string, log: Partial<CheatingLog>): Observable<CheatingLog> {
    const payload = mapUiCheatingLogToApi(log);
    return this.http.put<ApiCheatingLog>(`${this.baseUrl}/${id}`, payload).pipe(
      map(mapApiCheatingLogToUi),
      catchError(this.handleError(`Failed to update cheating log ${id}`))
    );
  }

  deleteLog(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError(`Failed to delete cheating log ${id}`))
    );
  }

  getStats(): Observable<CheatingStats> {
    return this.getLogs().pipe(
      map((logs) => ({
        total: logs.length,
        critical: logs.filter((l) => l.severity === 'Critical').length,
        high: logs.filter((l) => l.severity === 'High').length,
        medium: logs.filter((l) => l.severity === 'Medium').length,
        low: logs.filter((l) => l.severity === 'Low').length
      }))
    );
  }

  private handleError(message: string) {
    return (error: unknown) => {
      console.error(message, error);
      return throwError(() => new Error(message));
    };
  }
}
