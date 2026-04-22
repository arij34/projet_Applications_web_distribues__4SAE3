export type SubscriptionType = 'FREE' | 'VIP';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED';

export interface AdminSubscription {
  id: number;
  userId: number;
  type: SubscriptionType;
  status: SubscriptionStatus;
  startDate: string;
  endDate?: string | null;
}
