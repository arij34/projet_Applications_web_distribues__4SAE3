export type SubscriptionType = 'FREE' | 'VIP';

export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED';

export interface Subscription {
  id: number;
  type: SubscriptionType;
  startDate: string;
  endDate?: string | null;
  status: SubscriptionStatus;
  userId: number;
}

export interface CreateOrUpdateSubscriptionRequest {
  userId: number;
  type: SubscriptionType;
  startDate?: string;
  endDate?: string | null;
  status?: SubscriptionStatus;
}

export interface UpdateSubscriptionTypeRequest {
  type: SubscriptionType;
}

export interface UpdateSubscriptionStatusRequest {
  status: SubscriptionStatus;
}
