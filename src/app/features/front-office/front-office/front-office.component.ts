import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-front-office',
  templateUrl: './front-office.component.html',
  styleUrl: './front-office.component.css'
})
export class FrontOfficeComponent implements OnInit {

  isChildRoute = false;

  constructor(private readonly router: Router) {}

  ngOnInit(): void {
    // Vérifie à chaque changement de route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects;
      this.isChildRoute = url !== '/front' && url !== '/front/';
    });

    // Vérifie aussi au chargement initial
    const url = this.router.url;
    this.isChildRoute = url !== '/front' && url !== '/front/';
  }

  private rolePrefixFromUrl(): 'client' | 'freelancer' {
    const firstSegment = this.router.url.split('/').filter(Boolean)[0];
    return firstSegment === 'freelancer' ? 'freelancer' : 'client';
  }

  goToSubscription(): void {
    const role = this.rolePrefixFromUrl();
    this.router.navigate(['/', role, 'subscription']);
  }

  goToSubscriptionPayment(): void {
    const role = this.rolePrefixFromUrl();
    this.router.navigate(['/', role, 'subscription', 'pay']);
  }
}