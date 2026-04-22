import { Component, OnInit } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { PaymentStatsApiService } from 'src/app/core/services/payment-stats-api.service';
import { SubscriptionStatsApiService } from 'src/app/core/services/subscription-stats-api.service';
import { PaymentsMonthlyStatsResponse } from 'src/app/core/models/payment-stats.model';
import { SubscriptionsMonthlyStatsResponse } from 'src/app/core/models/subscription-stats.model';

@Component({
  selector: 'app-subscription-stats-view',
  template: `
    <div class="space-y-6">
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Statistique abonnement/payement</h2>
          <p class="text-gray-500">12 derniers mois : paiements, abonnements VIP et revenus.</p>
        </div>
        <button (click)="load()" [disabled]="loading" class="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60">
          {{ loading ? 'Chargement…' : 'Refresh' }}
        </button>
      </div>

      <div *ngIf="error" class="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600">
        {{ error }}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div class="text-xs uppercase tracking-wide text-gray-400 font-semibold">Revenu total</div>
          <div class="text-2xl font-extrabold text-gray-800 mt-1">{{ totalRevenue | number:'1.2-2' }}</div>
        </div>
        <div class="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div class="text-xs uppercase tracking-wide text-gray-400 font-semibold">Revenu mois courant</div>
          <div class="text-2xl font-extrabold text-gray-800 mt-1">{{ currentMonthRevenue | number:'1.2-2' }}</div>
        </div>
        <div class="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div class="text-xs uppercase tracking-wide text-gray-400 font-semibold">Paiements (12 mois)</div>
          <div class="text-2xl font-extrabold text-gray-800 mt-1">{{ totalPaymentsCount }}</div>
        </div>
        <div class="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div class="text-xs uppercase tracking-wide text-gray-400 font-semibold">VIP activations (12 mois)</div>
          <div class="text-2xl font-extrabold text-gray-800 mt-1">{{ totalVipActivations }}</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div class="font-bold text-gray-800 mb-2">Paiements SUCCESS / mois</div>
          <canvas baseChart [type]="'line'" [data]="paymentsCountChartData" [options]="lineOptions"></canvas>
        </div>
        <div class="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div class="font-bold text-gray-800 mb-2">Abonnements VIP / mois</div>
          <canvas baseChart [type]="'line'" [data]="vipChartData" [options]="lineOptions"></canvas>
        </div>
      </div>

      <div class="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
        <div class="font-bold text-gray-800 mb-2">Revenu / mois</div>
        <canvas baseChart [type]="'bar'" [data]="revenueChartData" [options]="barOptions"></canvas>
      </div>
    </div>
  `
})
export class SubscriptionStatsViewComponent implements OnInit {
  loading = false;
  error?: string;
  totalRevenue = 0;
  currentMonthRevenue = 0;
  totalPaymentsCount = 0;
  totalVipActivations = 0;
  paymentsCountChartData: ChartData<'line'> = { labels: [], datasets: [] };
  vipChartData: ChartData<'line'> = { labels: [], datasets: [] };
  revenueChartData: ChartData<'bar'> = { labels: [], datasets: [] };

  lineOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: { legend: { display: true } },
    elements: { line: { tension: 0.25 } }
  };

  barOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: { legend: { display: true } }
  };

  constructor(
    private readonly paymentStatsApi: PaymentStatsApiService,
    private readonly subscriptionStatsApi: SubscriptionStatsApiService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = undefined;
    try {
      const months = 12;
      const [paymentsStats, subsStats] = await Promise.all([
        this.paymentStatsApi.monthlyAsAdmin(months),
        this.subscriptionStatsApi.vipMonthlyAsAdmin(months)
      ]);
      this.applyStats(paymentsStats, subsStats);
    } catch (e: any) {
      this.error = e?.error?.error || e?.message || 'Erreur chargement statistiques';
    } finally {
      this.loading = false;
    }
  }

  private applyStats(payments: PaymentsMonthlyStatsResponse, subs: SubscriptionsMonthlyStatsResponse): void {
    const labels = payments.series.map((p) => p.month);
    const paymentsCount = payments.series.map((p) => p.paymentsCount);
    const revenue = payments.series.map((p) => p.revenue);
    const subsMap = new Map(subs.series.map((s) => [s.month, s.count] as const));
    const vip = labels.map((m) => subsMap.get(m) ?? 0);

    this.totalRevenue = payments.totalRevenue ?? 0;
    this.currentMonthRevenue = payments.currentMonthRevenue ?? 0;
    this.totalPaymentsCount = paymentsCount.reduce((a, b) => a + b, 0);
    this.totalVipActivations = vip.reduce((a, b) => a + b, 0);

    this.paymentsCountChartData = {
      labels,
      datasets: [{ label: 'Payments SUCCESS', data: paymentsCount, borderColor: '#4f46e5', backgroundColor: 'rgba(79,70,229,0.12)', fill: true, pointRadius: 3 }]
    };

    this.vipChartData = {
      labels,
      datasets: [{ label: 'VIP activations', data: vip, borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.12)', fill: true, pointRadius: 3 }]
    };

    this.revenueChartData = {
      labels,
      datasets: [{ label: 'Revenue', data: revenue, backgroundColor: 'rgba(34,197,94,0.35)', borderColor: '#22c55e' }]
    };
  }
}
