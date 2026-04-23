import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-back-office',
  templateUrl: './back-office.component.html',
  styleUrl: './back-office.component.css'
})
export class BackOfficeComponent implements OnInit {
  activeTab: string = 'dashboard';
  sidebarOpen: boolean = false;
  isMobile: boolean = false;

  // Tabs qui utilisent router-outlet (ont des sous-routes comme /form)
  private routedTabs = ['skills', 'pending-skills'];

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.checkMobile();

    // Sync depuis ?tab=
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab = params['tab'];
      }
    });

    // Sync activeTab depuis l'URL (pour skills/form, pending-skills/form)
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      const url = e.urlAfterRedirects;
      // If URL uses ?tab=, queryParams subscription controls activeTab.
      if (/[?&]tab=/.test(url)) return;
      const match = url.match(/\/admin\/([^/?]+)/);
      if (match) {
        this.activeTab = match[1];
      }
    });
  }

  @HostListener('window:resize')
  checkMobile() {
    this.isMobile = window.innerWidth < 1024;
  }

  isRoutedTab(): boolean {
    return this.routedTabs.includes(this.activeTab);
  }

  onTabChange(tab: string) {
    // Challenge → route dédiée
    if (tab === 'Challenge') {
      this.router.navigate(['/admin/challenges']);
      return;
    }

    this.activeTab = tab;

    // Tabs avec sous-routes → navigation par URL
    if (this.routedTabs.includes(tab)) {
      this.router.navigate(['/admin', tab]);
    } else {
      // Autres tabs → système ?tab=
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { tab },
        queryParamsHandling: 'merge'
      });
    }

    if (this.isMobile) this.sidebarOpen = false;
  }

  onMenuClick() {
    this.sidebarOpen = true;
  }

  onToggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
