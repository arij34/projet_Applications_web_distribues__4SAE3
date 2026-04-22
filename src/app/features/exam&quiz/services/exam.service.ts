import { HttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable, catchError, map, throwError } from 'rxjs';
import { ApiExam, ApiExamSetting } from '../models/api.models';
import { mapApiExamToUi, mapUiExamToApi } from '../models/mappers';
import { Exam } from '../models/exam.model';

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/exams`;
  private readonly settingsUrl = `${environment.apiBaseUrl}/api/exam-settings`;

  constructor(private readonly http: HttpClient) {}

  getExams(): Observable<Exam[]> {
    return this.http.get<ApiExam[]>(this.baseUrl).pipe(
      map((items) => items.map(mapApiExamToUi)),
      catchError(this.handleError('Failed to load exams'))
    );
  }

  getExamById(id: string): Observable<Exam> {
    return this.http.get<ApiExam>(`${this.baseUrl}/${id}`).pipe(
      map(mapApiExamToUi),
      catchError(this.handleError(`Failed to load exam ${id}`))
    );
  }

  createExam(exam: Partial<Exam> | Partial<ApiExam>): Observable<ApiExam> {
    const payload = this.normalizeExamPayload(exam);
    return this.http.post<ApiExam>(this.baseUrl, this.withIsoDates(payload)).pipe(
      catchError(this.handleError('Failed to create exam'))
    );
  }

  updateExam(id: string, exam: Partial<Exam> | Partial<ApiExam>): Observable<Exam> {
    const payload = this.normalizeExamPayload(exam);
    return this.http.put<ApiExam>(`${this.baseUrl}/${id}`, this.withIsoDates(payload)).pipe(
      map(mapApiExamToUi),
      catchError(this.handleError(`Failed to update exam ${id}`))
    );
  }

  deleteExam(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError(`Failed to delete exam ${id}`))
    );
  }

  createExamSetting(payload: ApiExamSetting): Observable<ApiExamSetting> {
    return this.http.post<ApiExamSetting>(this.settingsUrl, this.withIsoDates(payload)).pipe(
      catchError(this.handleError('Failed to create exam settings'))
    );
  }

  updateExamSetting(settingId: string, payload: ApiExamSetting): Observable<ApiExamSetting> {
    return this.http.put<ApiExamSetting>(`${this.settingsUrl}/${settingId}`, this.withIsoDates(payload)).pipe(
      catchError(this.handleError(`Failed to update exam settings ${settingId}`))
    );
  }

  getExamSettingByExamId(examId: string): Observable<ApiExamSetting | null> {
    return this.http.get<ApiExamSetting | null>(`${this.settingsUrl}/by-exam/${examId}`).pipe(
      catchError(this.handleError(`Failed to load exam settings for exam ${examId}`))
    );
  }

  private withIsoDates<T>(payload: T): T {
    if (payload === null || typeof payload !== 'object') return payload;
    const out = { ...(payload as object) } as Record<string, unknown>;
    for (const key of Object.keys(out)) {
      const value = out[key];
      if (value instanceof Date) out[key] = value.toISOString();
    }
    return out as T;
  }

  private normalizeExamPayload(exam: Partial<Exam> | Partial<ApiExam>): Partial<ApiExam> {
    const hasApiShape = Object.prototype.hasOwnProperty.call(exam, 'examType')
      || (typeof (exam as ApiExam).status === 'string' && (exam as ApiExam).status!.toUpperCase() === (exam as ApiExam).status);
    return hasApiShape ? (exam as Partial<ApiExam>) : mapUiExamToApi(exam as Partial<Exam>);
  }

  private handleError(message: string) {
    return (error: unknown) => {
      console.error(message, error);
      if (error instanceof HttpErrorResponse) {
        const backendMessage =
          (typeof error.error === 'string' && error.error) ||
          error.error?.message ||
          error.error?.error ||
          error.message;
        return throwError(() => new Error(`${message}: ${backendMessage}`));
      }
      return throwError(() => new Error(message));
    };
  }
}
