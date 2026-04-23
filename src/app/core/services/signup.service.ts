import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type AccountType = 'CLIENT' | 'FREELANCER';

export interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  accountType: AccountType;
}

@Injectable({
  providedIn: 'root'
})
export class SignupService {
  private readonly baseUrl = 'http://localhost:8090/api/public/signup';

  constructor(private readonly http: HttpClient) {}

  signup(payload: SignupPayload): Promise<{ message: string }> {
    return firstValueFrom(this.http.post<{ message: string }>(this.baseUrl, payload));
  }
}
