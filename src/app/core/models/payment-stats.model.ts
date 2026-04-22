export interface MonthlyPaymentStatsPoint {
  month: string;
  paymentsCount: number;
  revenue: number;
}

export interface PaymentsMonthlyStatsResponse {
  series: MonthlyPaymentStatsPoint[];
  totalRevenue: number;
  currentMonthRevenue: number;
}
