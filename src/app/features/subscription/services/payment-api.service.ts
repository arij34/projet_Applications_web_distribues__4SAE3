import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type PaymentStatus = 'SUCCESS' | 'FAILED';

export interface PaySubscriptionRequest {
  userId: number;
  plan: 'VIP';
  cardNumber: string;
  expiry: string;
  cvv: string;
  cardHolderName: string;
}

export interface PaySubscriptionResponse {
  paymentId: number;
  status: PaymentStatus;
  message: string;
  subscriptionEndDate?: string | null;
  discountPercent?: number;
  originalAmount?: number;
  paidAmount?: number;
}

@Injectable({ providedIn: 'root' })
export class PaymentApiService {
  private readonly baseUrl = 'http://localhost:8092/api';

  constructor(private readonly http: HttpClient) {}

  paySubscription(role: 'client' | 'freelancer', req: PaySubscriptionRequest): Promise<PaySubscriptionResponse> {
    return firstValueFrom(
      this.http.post<PaySubscriptionResponse>(`${this.baseUrl}/${role}/payments/subscription`, req)
    );
  }
}
