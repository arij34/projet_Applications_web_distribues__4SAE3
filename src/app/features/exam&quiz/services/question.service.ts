import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable, catchError, forkJoin, map, of, switchMap, throwError } from 'rxjs';
import { ApiAnswer, ApiQuestion } from '../models/api.models';
import { mapApiQuestionToUi, mapUiQuestionToApi } from '../models/mappers';
import { Question } from '../models/question.model';

@Injectable({
  providedIn: 'root'
})
export class QuestionService {
  private readonly questionUrl = `${environment.apiBaseUrl}/api/questions`;
  private readonly answerUrl = `${environment.apiBaseUrl}/api/answers`;

  constructor(private readonly http: HttpClient) {}

  getQuestions(): Observable<Question[]> {
    return this.http.get<ApiQuestion[]>(this.questionUrl).pipe(
      switchMap((questions) => {
        if (questions.length === 0) return of([]);
        const withAnswers$ = questions.map((question) =>
          this.getAnswersByQuestionId(String(question.id ?? '')).pipe(
            map((answers) => mapApiQuestionToUi(question, answers))
          )
        );
        return forkJoin(withAnswers$);
      }),
      catchError(this.handleError('Failed to load questions'))
    );
  }

  getQuestionById(id: string): Observable<Question> {
    return this.http.get<ApiQuestion>(`${this.questionUrl}/${id}`).pipe(
      switchMap((question) =>
        this.getAnswersByQuestionId(id).pipe(
          map((answers) => mapApiQuestionToUi(question, answers))
        )
      ),
      catchError(this.handleError(`Failed to load question ${id}`))
    );
  }

  getQuestionsByExamId(examId: string): Observable<ApiQuestion[]> {
    return this.http.get<ApiQuestion[]>(`${this.questionUrl}/by-exam/${examId}`).pipe(
      catchError(() =>
        this.http.get<ApiQuestion[]>(this.questionUrl).pipe(
          map((questions) => questions.filter((question) => {
            const qExamId = String(question.examId ?? question.exam?.id ?? '');
            return qExamId === examId;
          })),
          catchError(this.handleError(`Failed to load questions for exam ${examId}`))
        )
      )
    );
  }

  createQuestion(question: Partial<Question> | Partial<ApiQuestion>): Observable<ApiQuestion> {
    const payload = this.normalizeQuestionPayload(question);
    return this.http.post<ApiQuestion>(this.questionUrl, payload).pipe(
      catchError(this.handleError('Failed to create question'))
    );
  }

  updateQuestion(id: string, question: Partial<Question> | Partial<ApiQuestion>): Observable<Question> {
    const payload = this.normalizeQuestionPayload(question);
    return this.http.put<ApiQuestion>(`${this.questionUrl}/${id}`, payload).pipe(
      map((item) => mapApiQuestionToUi(item, [])),
      catchError(this.handleError(`Failed to update question ${id}`))
    );
  }

  deleteQuestion(id: string): Observable<void> {
    return this.http.delete<void>(`${this.questionUrl}/${id}`).pipe(
      catchError(this.handleError(`Failed to delete question ${id}`))
    );
  }

  getAnswersByQuestionId(questionId: string): Observable<ApiAnswer[]> {
    if (!questionId) return of([]);
    return this.http.get<ApiAnswer[]>(`${this.answerUrl}/by-question/${questionId}`).pipe(
      catchError(() =>
        this.http.get<ApiAnswer[]>(this.answerUrl).pipe(
          map((answers) => answers.filter((answer) => String(answer.questionId ?? answer.question?.id ?? '') === questionId)),
          catchError(() => of([]))
        )
      )
    );
  }

  createAnswer(answer: Partial<ApiAnswer>): Observable<ApiAnswer> {
    return this.http.post<ApiAnswer>(this.answerUrl, answer).pipe(
      catchError(this.handleError('Failed to create answer'))
    );
  }

  updateAnswer(id: string, answer: Partial<ApiAnswer>): Observable<ApiAnswer> {
    return this.http.put<ApiAnswer>(`${this.answerUrl}/${id}`, answer).pipe(
      catchError(this.handleError(`Failed to update answer ${id}`))
    );
  }

  deleteAnswer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.answerUrl}/${id}`).pipe(
      catchError(this.handleError(`Failed to delete answer ${id}`))
    );
  }

  private normalizeQuestionPayload(question: Partial<Question> | Partial<ApiQuestion>): Partial<ApiQuestion> {
    const hasApiShape = Object.prototype.hasOwnProperty.call(question, 'questionType')
      || Object.prototype.hasOwnProperty.call(question, 'exam');
    return hasApiShape ? (question as Partial<ApiQuestion>) : mapUiQuestionToApi(question as Partial<Question>);
  }

  private handleError(message: string) {
    return (error: unknown) => {
      console.error(message, error);
      return throwError(() => new Error(message));
    };
  }
}
