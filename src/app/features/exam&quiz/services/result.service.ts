import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface ResultAnswerDto {
  questionId?: number;
  questionText?: string;
  yourAnswer?: string;
  correctAnswer?: string;
  earnedPoints?: number;
  totalPoints?: number;
  status?: 'correct' | 'wrong' | 'partial' | 'skipped' | string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | string;
}

export interface ResultDto {
  id?: number;
  attemptId?: number;
  examId: number;
  userId: number;
  earnedPoints: number;
  totalPoints: number;
  scorePercent?: number;
  status?: 'PASSED' | 'FAILED' | 'AUTO_SUBMITTED' | string;
  submittedAt?: string;
  timeTakenSeconds?: number;
  answers?: ResultAnswerDto[];
  questionResults?: ResultAnswerDto[];
}

@Injectable({
  providedIn: 'root'
})
export class ResultService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/results`;

  constructor(private readonly http: HttpClient) {}

  getMyResult(userId: number, examId: number): Observable<ResultDto> {
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('examId', examId.toString());
    return this.http.get<ResultDto>(`${this.baseUrl}/me`, { params });
  }

  getMyHistory(userId: number): Observable<ResultDto[]> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<ResultDto[]>(`${this.baseUrl}/history/me`, { params });
  }

  increaseScore(userId: number, examId: number, deltaPoints: number): Observable<unknown> {
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('examId', examId.toString())
      .set('deltaPoints', deltaPoints.toString());

    return this.http.patch(`${this.baseUrl}/increase-score`, null, { params });
  }
}
