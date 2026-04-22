import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { ExamMonitoringSnapshot, MonitoringCandidateSnapshot, MonitoringEvent } from '../models/admin-monitoring.model';

@Injectable({
  providedIn: 'root'
})
export class AdminMonitoringService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/admin/monitoring/exams`;

  constructor(private readonly http: HttpClient) {}

  getSnapshot(examId: number): Observable<ExamMonitoringSnapshot> {
    return this.http.get<ExamMonitoringSnapshot>(`${this.baseUrl}/${examId}/snapshot`);
  }

  getActiveCandidates(examId: number): Observable<MonitoringCandidateSnapshot[]> {
    return this.http.get<MonitoringCandidateSnapshot[]>(`${this.baseUrl}/${examId}/active-candidates`);
  }

  getRecentEvents(examId: number, sinceMinutes = 30, limit = 25): Observable<MonitoringEvent[]> {
    const params = new HttpParams()
      .set('sinceMinutes', String(sinceMinutes))
      .set('limit', String(limit));

    return this.http.get<MonitoringEvent[]>(`${this.baseUrl}/${examId}/events`, { params });
  }

  getStreamUrl(examId: number): string {
    return `${this.baseUrl}/${examId}/stream`;
  }
}
