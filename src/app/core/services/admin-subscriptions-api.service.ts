import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AdminSubscription, SubscriptionStatus, SubscriptionType } from '../models/admin-subscription.model';

@Injectable({ providedIn: 'root' })
export class AdminSubscriptionsApiService {
  private readonly baseUrl = 'http://localhost:8091/api/admin/subscriptions';

  constructor(private readonly http: HttpClient) {}

  listAll(): Promise<AdminSubscription[]> {
    return firstValueFrom(this.http.get<AdminSubscription[]>(this.baseUrl));
  }

  updateStatus(id: number, status: SubscriptionStatus): Promise<AdminSubscription> {
    return firstValueFrom(
      this.http.put<AdminSubscription>(`http://localhost:8091/api/admin/subscriptions/${id}/status`, { status })
    );
  }

  update(id: number, payload: { type: SubscriptionType; status: SubscriptionStatus; endDate?: string | null }): Promise<AdminSubscription> {
    return firstValueFrom(
      this.http.put<AdminSubscription>(`http://localhost:8091/api/admin/subscriptions/${id}`, payload)
    );
  }

  delete(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${id}`));
  }
}
