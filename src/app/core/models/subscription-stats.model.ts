export interface MonthlyCountPoint {
  month: string;
  count: number;
}

export interface SubscriptionsMonthlyStatsResponse {
  series: MonthlyCountPoint[];
}
