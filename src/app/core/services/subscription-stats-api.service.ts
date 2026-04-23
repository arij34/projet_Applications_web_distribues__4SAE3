import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SubscriptionsMonthlyStatsResponse } from '../models/subscription-stats.model';

@Injectable({ providedIn: 'root' })
export class SubscriptionStatsApiService {
  private readonly baseUrl = 'http://localhost:8091/api';

  constructor(private readonly http: HttpClient) {}

  vipMonthlyAsAdmin(months: number = 12): Promise<SubscriptionsMonthlyStatsResponse> {
    return firstValueFrom(
      this.http.get<SubscriptionsMonthlyStatsResponse>(`${this.baseUrl}/admin/subscriptions/stats/monthly`, {
        params: { months }
      })
    );
  }
}
