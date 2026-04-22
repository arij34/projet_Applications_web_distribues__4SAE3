import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PaymentsMonthlyStatsResponse } from '../models/payment-stats.model';

@Injectable({ providedIn: 'root' })
export class PaymentStatsApiService {
  private readonly baseUrl = 'http://localhost:8092/api';

  constructor(private readonly http: HttpClient) {}

  monthlyAsAdmin(months: number = 12): Promise<PaymentsMonthlyStatsResponse> {
    return firstValueFrom(
      this.http.get<PaymentsMonthlyStatsResponse>(`${this.baseUrl}/admin/payments/stats/monthly`, {
        params: { months }
      })
    );
  }
}
