export type PaymentStatus = 'SUCCESS' | 'FAILED';

export interface PaymentHistory {
  id: number;
  userId: number;
  plan: string;
  status: PaymentStatus;
  amount: number;
  createdAt: string;
  cardLast4?: string | null;
}
