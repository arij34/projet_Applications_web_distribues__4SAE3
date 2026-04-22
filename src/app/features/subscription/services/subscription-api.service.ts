import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import {
  CreateOrUpdateSubscriptionRequest,
  Subscription,
  UpdateSubscriptionStatusRequest,
  UpdateSubscriptionTypeRequest
} from '../models/subscription.model';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionApiService {
  private readonly baseUrl = 'http://localhost:8091/api';

  constructor(private readonly http: HttpClient) {}

  getByUserId(userId: number, role: 'client' | 'freelancer'): Promise<Subscription> {
    return firstValueFrom(
      this.http.get<Subscription>(`${this.baseUrl}/${role}/subscriptions/user/${userId}`)
    );
  }

  createOrUpdate(payload: CreateOrUpdateSubscriptionRequest, role: 'client' | 'freelancer'): Promise<Subscription> {
    return firstValueFrom(
      this.http.post<Subscription>(`${this.baseUrl}/${role}/subscriptions`, payload)
    );
  }

  updateType(id: number, payload: UpdateSubscriptionTypeRequest, role: 'client' | 'freelancer'): Promise<Subscription> {
    return firstValueFrom(
      this.http.put<Subscription>(`${this.baseUrl}/${role}/subscriptions/${id}/type`, payload)
    );
  }

  updateStatus(id: number, payload: UpdateSubscriptionStatusRequest, role: 'client' | 'freelancer'): Promise<Subscription> {
    return firstValueFrom(
      this.http.put<Subscription>(`${this.baseUrl}/${role}/subscriptions/${id}/status`, payload)
    );
  }
}
