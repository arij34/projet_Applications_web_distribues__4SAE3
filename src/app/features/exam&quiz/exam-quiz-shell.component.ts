import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from '../back-office/back-office/components/header/header.component';
import { SidebarComponent } from '../back-office/back-office/components/sidebar/sidebar.component';

@Component({
  selector: 'app-exam-quiz-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex h-screen w-full bg-[#f5f5f9] overflow-hidden">
      <app-backoffice-sidebar
        [activeTab]="activeTab"
        [isOpen]="sidebarOpen"
        [isMobile]="isMobile"
        (tabChange)="onTabChange($event)"
        (toggleSidebar)="onToggleSidebar()">
      </app-backoffice-sidebar>

      <div class="flex-1 flex flex-col h-full overflow-hidden">
        <app-backoffice-header (menuClick)="onMenuClick()"></app-backoffice-header>

        <main class="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-6 lg:p-8">
          <div class="max-w-7xl mx-auto">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    .no-scrollbar::-webkit-scrollbar {
      display: none;
      width: 0;
      height: 0;
    }
  `]
})
export class ExamQuizShellComponent implements OnInit {
  activeTab = 'dashboard';
  sidebarOpen = false;
  isMobile = false;

  constructor(private readonly router: Router, private readonly route: ActivatedRoute) {}

  ngOnInit(): void {
    this.checkMobile();
    window.addEventListener('resize', () => this.checkMobile());
    this.syncSidebarTab(this.router.url);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.syncSidebarTab(event.urlAfterRedirects));

    this.route.queryParams.subscribe((params) => {
      if (params['tab']) {
        this.activeTab = params['tab'];
      }
    });
  }

  private syncSidebarTab(url: string): void {
    if (url.includes('/admin/exam-quiz')) {
      this.activeTab = 'examQuiz';
    }
  }

  checkMobile(): void {
    this.isMobile = window.innerWidth < 1024;
  }

  onTabChange(tab: string): void {
    if (tab === 'Challenge') {
      this.router.navigate(['/admin/challenges']);
      return;
    }
    if (tab === 'examQuiz') {
      this.router.navigate(['/admin/exam-quiz']);
      return;
    }
    this.activeTab = tab;
    if (this.isMobile) {
      this.sidebarOpen = false;
    }
    this.router.navigate(['/admin'], { queryParams: { tab } });
  }

  onMenuClick(): void {
    this.sidebarOpen = true;
  }

  onToggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
