import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { MeDto, MeService } from 'src/app/core/services/me.service';
import { PaymentApiService } from '../../services/payment-api.service';

@Component({
  selector: 'app-subscription-payment-page',
  templateUrl: './subscription-payment-page.component.html',
  styleUrls: ['./subscription-payment-page.component.css']
})
export class SubscriptionPaymentPageComponent implements OnInit {
  loading = false;
  error?: string;
  success?: string;
  me?: MeDto;
  cardHolderName = '';
  cardNumber = '';
  expiry = '';
  cvv = '';

  constructor(
    private readonly meService: MeService,
    private readonly paymentApi: PaymentApiService,
    private readonly router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadMe();
  }

  private roleFromUrl(): 'client' | 'freelancer' {
    const firstSegment = this.router.url.split('/').filter(Boolean)[0];
    return firstSegment === 'freelancer' ? 'freelancer' : 'client';
  }

  private async loadMe(): Promise<void> {
    try {
      this.me = await this.meService.me();
    } catch (e: any) {
      if (e?.status === 404) this.me = await this.meService.sync();
      else this.error = e?.message || 'Impossible de charger l utilisateur';
    }
  }

  validate(): string | null {
    const cn = (this.cardNumber || '').replace(/\s+/g, '');
    if (!/^[0-9]{16}$/.test(cn)) return 'Numero de carte invalide (16 chiffres)';
    if (!/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(this.expiry)) return 'Expiration invalide (MM/YY)';
    if (!/^[0-9]{3}$/.test(this.cvv)) return 'CVV invalide (3 chiffres)';
    if (!this.cardHolderName.trim()) return 'Nom du titulaire requis';
    return null;
  }

  async pay(): Promise<void> {
    if (!this.me) return;
    this.loading = true;
    this.error = undefined;
    this.success = undefined;

    const validation = this.validate();
    if (validation) {
      this.loading = false;
      this.error = validation;
      return;
    }

    try {
      const role = this.roleFromUrl();
      const res = await this.paymentApi.paySubscription(role, {
        userId: this.me.id,
        plan: 'VIP',
        cardNumber: (this.cardNumber || '').replace(/\s+/g, ''),
        expiry: this.expiry,
        cvv: this.cvv,
        cardHolderName: this.cardHolderName
      });

      if (res.status === 'SUCCESS') {
        this.success = res.message;
        setTimeout(() => {
          this.router.navigate(['/', role, 'subscription']);
        }, 700);
      } else {
        this.error = res.message;
      }
    } catch (e: any) {
      this.error = e?.error?.error || e?.message || 'Erreur paiement';
    } finally {
      this.loading = false;
    }
  }
}
