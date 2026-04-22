import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface StartExamSessionRequest {
  examId: number;
  userId: number;
  ipAddress: string;
  deviceFingerprint: string;
  browserInfo: string;
}

export interface StartExamSessionResponse {
  attemptId: number;
  sessionToken: string;
  status?: string;
  message?: string;
}
export interface ExamAnswerPayload {
  questionId: number;
  answerText: string;
}

export interface SubmitExamSessionRequest {
  attemptId?: number | null;
  userId: number;
  examId: number;
  answers: Record<string, string>;
  sessionToken: string;
  ipAddress: string;
  deviceFingerprint: string;
  timeTakenSeconds: number;
  cheatingEvents: unknown[];
  autoSubmitted: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ExamSessionService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/exam-sessions`;

  constructor(private readonly http: HttpClient) {}

  start(payload: StartExamSessionRequest): Observable<StartExamSessionResponse> {
    return this.http.post<StartExamSessionResponse>(`${this.baseUrl}/start`, payload);
  }

  submit(payload: SubmitExamSessionRequest): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/submit`, payload);
  }

  autoSubmit(attemptId: number): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/auto-submit/${attemptId}`, {});
  }
}
