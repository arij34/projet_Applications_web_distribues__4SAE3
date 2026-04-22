import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PaymentHistory } from '../models/payment-history.model';

@Injectable({ providedIn: 'root' })
export class PaymentHistoryApiService {
  private readonly baseUrl = 'http://localhost:8092/api';

  constructor(private readonly http: HttpClient) {}

  listForUser(role: 'client' | 'freelancer', userId: number): Promise<PaymentHistory[]> {
    return firstValueFrom(
      this.http.get<PaymentHistory[]>(`${this.baseUrl}/${role}/payments/user/${userId}`)
    );
  }

  listForUserAsAdmin(userId: number): Promise<PaymentHistory[]> {
    return firstValueFrom(
      this.http.get<PaymentHistory[]>(`${this.baseUrl}/admin/payments/user/${userId}`)
    );
  }
}
