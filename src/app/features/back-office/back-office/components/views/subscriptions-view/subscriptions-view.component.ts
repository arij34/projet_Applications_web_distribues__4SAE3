import { Component, OnInit } from '@angular/core';
import { AdminSubscriptionsApiService } from 'src/app/core/services/admin-subscriptions-api.service';
import { AdminSubscription, SubscriptionStatus, SubscriptionType } from 'src/app/core/models/admin-subscription.model';
import { PaymentHistory } from 'src/app/core/models/payment-history.model';
import { PaymentHistoryApiService } from 'src/app/core/services/payment-history-api.service';

@Component({
  selector: 'app-subscriptions-view',
  templateUrl: './subscriptions-view.component.html',
  styleUrls: ['./subscriptions-view.component.css']
})
export class SubscriptionsViewComponent implements OnInit {
  loading = false;
  error?: string;
  subs: AdminSubscription[] = [];

  q = '';
  sortKey: 'id' | 'userId' | 'type' | 'status' | 'startDate' | 'endDate' = 'id';
  sortDir: 'asc' | 'desc' = 'desc';

  editOpen = false;
  editSub?: AdminSubscription;
  editType: SubscriptionType = 'FREE';
  editStatus: SubscriptionStatus = 'ACTIVE';
  editEndDate: string | null = null;
  editError?: string;

  paymentsOpen = false;
  paymentsUserId?: number;
  payments: PaymentHistory[] = [];
  paymentsError?: string;

  constructor(
    private readonly api: AdminSubscriptionsApiService,
    private readonly paymentApi: PaymentHistoryApiService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = undefined;
    try {
      this.subs = await this.api.listAll();
    } catch (e: any) {
      this.error = e?.error?.error || e?.message || 'Erreur chargement subscriptions';
    } finally {
      this.loading = false;
    }
  }

  get filteredSubs(): AdminSubscription[] {
    const q = (this.q || '').trim().toLowerCase();
    const rows = !q
      ? [...this.subs]
      : this.subs.filter((s) => {
          const hay = `${s.id} ${s.userId} ${s.type} ${s.status} ${s.startDate ?? ''} ${s.endDate ?? ''}`.toLowerCase();
          return hay.includes(q);
        });

    const factor = this.sortDir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      const va: any = (a as any)[this.sortKey] ?? '';
      const vb: any = (b as any)[this.sortKey] ?? '';
      if (va < vb) return -1 * factor;
      if (va > vb) return 1 * factor;
      return 0;
    });
    return rows;
  }

  setSort(key: typeof this.sortKey): void {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = 'asc';
    }
  }

  formatDate(d?: string | null): string {
    if (!d) return '-';
    try {
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return d;
      return dt.toLocaleDateString();
    } catch {
      return d;
    }
  }

  typeBadgeClass(type: SubscriptionType): string {
    return type === 'VIP'
      ? 'badge badge-vip'
      : 'badge badge-free';
  }

  statusBadgeClass(status: SubscriptionStatus): string {
    return status === 'ACTIVE'
      ? 'badge badge-active'
      : 'badge badge-expired';
  }

  async onDelete(id: number): Promise<void> {
    if (!confirm('Supprimer cet abonnement ?')) return;
    this.loading = true;
    this.error = undefined;
    try {
      await this.api.delete(id);
      this.subs = this.subs.filter((s) => s.id !== id);
    } catch (e: any) {
      this.error = e?.error?.error || e?.message || 'Erreur suppression';
    } finally {
      this.loading = false;
    }
  }

  openEdit(sub: AdminSubscription): void {
    this.editSub = sub;
    this.editType = sub.type;
    this.editStatus = sub.status;
    this.editEndDate = (sub.endDate ?? null) as any;
    this.editError = undefined;
    this.editOpen = true;
  }

  closeEdit(): void {
    this.editOpen = false;
    this.editSub = undefined;
    this.editError = undefined;
  }

  async saveEdit(): Promise<void> {
    if (!this.editSub) return;
    this.loading = true;
    this.error = undefined;
    try {
      const updated = await this.api.update(this.editSub.id, {
        type: this.editType,
        status: this.editStatus,
        endDate: this.editEndDate
      });
      this.subs = this.subs.map((s) => (s.id === updated.id ? updated : s));
      this.closeEdit();
    } catch (e: any) {
      this.editError = e?.error?.error || e?.message || 'Erreur modification';
    } finally {
      this.loading = false;
    }
  }

  async openPayments(userId: number): Promise<void> {
    this.paymentsUserId = userId;
    this.paymentsOpen = true;
    this.loading = true;
    this.error = undefined;
    this.paymentsError = undefined;
    try {
      this.payments = await this.paymentApi.listForUserAsAdmin(userId);
    } catch (e: any) {
      this.paymentsError = e?.error?.error || e?.message || 'Erreur chargement paiements';
      this.payments = [];
    } finally {
      this.loading = false;
    }
  }

  closePayments(): void {
    this.paymentsOpen = false;
    this.paymentsUserId = undefined;
    this.payments = [];
    this.paymentsError = undefined;
  }
}
