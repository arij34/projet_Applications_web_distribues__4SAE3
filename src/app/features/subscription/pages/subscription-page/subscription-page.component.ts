import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { MeDto, MeService } from 'src/app/core/services/me.service';
import { SubscriptionApiService } from '../../services/subscription-api.service';
import { Subscription, SubscriptionStatus, SubscriptionType } from '../../models/subscription.model';
import { PaymentHistoryApiService } from 'src/app/core/services/payment-history-api.service';
import { PaymentHistory } from 'src/app/core/models/payment-history.model';

@Component({
  selector: 'app-subscription-page',
  templateUrl: './subscription-page.component.html',
  styleUrls: ['./subscription-page.component.css']
})
export class SubscriptionPageComponent implements OnInit {
  loading = false;
  error?: string;
  discountLoading = false;
  discountError?: string;
  successPaymentsCount = 0;
  discountProgress = 0;
  discountRemaining = 5;
  discountEligible = false;

  me?: MeDto;
  subscription?: Subscription;

  type: SubscriptionType = 'FREE';
  status: SubscriptionStatus = 'ACTIVE';
  endDate: string | null = null;

  constructor(
    private readonly meService: MeService,
    private readonly subscriptionApi: SubscriptionApiService,
    private readonly paymentHistoryApi: PaymentHistoryApiService,
    private readonly router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  private roleFromUrl(): 'client' | 'freelancer' {
    const firstSegment = this.router.url.split('/').filter(Boolean)[0];
    return firstSegment === 'freelancer' ? 'freelancer' : 'client';
  }

  goToVipPayment(): void {
    const role = this.roleFromUrl();
    this.router.navigate(['/', role, 'subscription', 'pay']);
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = undefined;

    try {
      try {
        this.me = await this.meService.me();
      } catch (e: any) {
        if (e?.status === 404) this.me = await this.meService.sync();
        else if (e?.status === 0) throw new Error('USER_BACKEND_DOWN');
        else throw e;
      }

      const role = this.roleFromUrl();
      try {
        this.subscription = await this.subscriptionApi.getByUserId(this.me!.id, role);
        this.type = this.subscription.type;
        this.status = this.subscription.status;
        this.endDate = (this.subscription.endDate ?? null) as any;
      } catch (e: any) {
        if (e?.status === 404) this.subscription = undefined;
        else if (e?.status === 0) throw new Error('SUBSCRIPTION_BACKEND_DOWN');
        else throw e;
      }

      await this.loadDiscountProgress(role, this.me!.id);
    } catch (e: any) {
      if (e?.message === 'USER_BACKEND_DOWN') {
        this.error = 'Impossible de contacter le backend User (8090).';
      } else if (e?.message === 'SUBSCRIPTION_BACKEND_DOWN') {
        this.error = 'Impossible de contacter le backend Subscription (8091).';
      } else if (e?.status === 401) {
        this.error = 'Non autorisé (401). Vérifie ton token Keycloak.';
      } else {
        this.error = e?.error?.error || e?.message || 'Erreur lors du chargement';
      }
    } finally {
      this.loading = false;
    }
  }

  private async loadDiscountProgress(role: 'client' | 'freelancer', userId: number): Promise<void> {
    this.discountLoading = true;
    this.discountError = undefined;

    try {
      const payments: PaymentHistory[] = await this.paymentHistoryApi.listForUser(role, userId);
      const successCount = (payments || []).filter((p) => p.status === 'SUCCESS').length;
      this.successPaymentsCount = successCount;

      const mod = successCount % 5;
      const progress = (mod === 0 && successCount > 0) ? 5 : mod;
      this.discountProgress = progress;
      this.discountRemaining = 5 - progress;
      this.discountEligible = progress === 5;
    } catch (e: any) {
      if (e?.status === 0) this.discountError = 'Impossible de contacter le service Payment (8092).';
      else if (e?.status === 401) this.discountError = 'Non autorisé (401) pour l’historique paiements.';
      else this.discountError = e?.error?.error || e?.message || 'Erreur chargement paiements';
      this.successPaymentsCount = 0;
      this.discountProgress = 0;
      this.discountRemaining = 5;
      this.discountEligible = false;
    } finally {
      this.discountLoading = false;
    }
  }

  async updateType(): Promise<void> {
    if (!this.subscription) return;
    this.loading = true;
    this.error = undefined;
    try {
      const role = this.roleFromUrl();
      this.subscription = await this.subscriptionApi.updateType(this.subscription.id, { type: this.type }, role);
    } catch (e: any) {
      this.error = e?.error?.error || e?.message || 'Erreur update type';
    } finally {
      this.loading = false;
    }
  }
}
