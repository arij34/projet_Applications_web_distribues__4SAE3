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

  // 🔹 Tabs qui utilisent une route propre /admin/<tab>
  //    (router-outlet affiche un composant différent)
  private routedTabs = [
    'dashboard',
    'projects',
    'contracts',
    'users',
    'stats',
    'skills',
    'pending-skills',
    'matching-admin'          // <-- important pour afficher la vue Matching
  ];

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.checkMobile();

    // Sync depuis ?tab= (ancien système, conservé pour compatibilité)
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab = params['tab'];
      }
    });

    // Sync activeTab depuis l'URL (pour /admin/skills/form, /admin/matching-admin, etc.)
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      const url = e.urlAfterRedirects as string;
      const match = url.match(/\/admin\/([^/?]+)/);
      const pathTab = match ? match[1] : null;

      // If we are on the default child route (/admin -> /admin/dashboard) and a non-routed
      // tab is provided via query param (?tab=subscriptions, etc.), prefer the query param.
      const queryTab = this.route.snapshot.queryParamMap.get('tab');
      if (queryTab && !this.routedTabs.includes(queryTab) && (!pathTab || pathTab === 'dashboard')) {
        this.activeTab = queryTab;
        return;
      }

      if (pathTab) {
        this.activeTab = pathTab;
        return;
      }

      if (queryTab) {
        this.activeTab = queryTab;
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
    // 🔹 Cas spécial Challenge → route dédiée existante
    if (tab === 'Challenge') {
      this.router.navigate(['/admin/challenges']);
      if (this.isMobile) this.sidebarOpen = false;
      return;
    }
    if (tab === 'examQuiz') {
      this.router.navigate(['/admin/exam-quiz']);
      if (this.isMobile) this.sidebarOpen = false;
      return;
    }

    if (tab === 'subscriptions' || tab === 'subscription-stats') {
      this.router.navigate(['/admin'], { queryParams: { tab } });
      this.activeTab = tab;
      if (this.isMobile) this.sidebarOpen = false;
      return;
    }

    this.activeTab = tab;

    // 🔹 Tabs qui ont une route propre /admin/<tab>
    if (this.routedTabs.includes(tab)) {
      this.router.navigate(['/admin', tab]);
    } else {
      // 🔹 Autres tabs → on reste sur la route courante et on change juste ?tab=
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { tab },
        queryParamsHandling: 'merge'
      });
    }

    if (this.isMobile) {
      this.sidebarOpen = false;
    }
  }

  onMenuClick() {
    this.sidebarOpen = true;
  }

  onToggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
