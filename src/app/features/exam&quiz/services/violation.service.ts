import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { ProctoringViolation, RecordViolationResponse, ViolationDTO } from '../models/proctoring.model';

@Injectable({
  providedIn: 'root'
})
export class ViolationService {
  private readonly endpoint = `${environment.apiBaseUrl}/api/proctoring/violations`;

  constructor(private readonly http: HttpClient) {}

  reportViolation(violation: ProctoringViolation): Observable<RecordViolationResponse> {
    return this.http.post<RecordViolationResponse>(this.endpoint, violation);
  }

  getViolations(examId: number, userId: number): Observable<ViolationDTO[]> {
    return this.http.get<ViolationDTO[]>(this.endpoint, {
      params: { examId: examId.toString(), userId: userId.toString() }
    });
  }
}
