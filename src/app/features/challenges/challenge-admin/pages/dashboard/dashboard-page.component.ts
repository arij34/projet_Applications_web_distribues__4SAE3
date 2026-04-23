import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ChallengeAdminService } from '@core/services/challenge-admin.service';
import { Challenge } from '@core/models/challenge.model';

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.css']
})
export class DashboardPageComponent implements OnInit {
  challenges: Challenge[] = [];
  isSidebarOpen = false;
  isMobile = false;

  constructor(
    private challengeAdminService: ChallengeAdminService,
    private router: Router
  ) {
    this.checkMobile();
    window.addEventListener('resize', () => this.checkMobile());
  }

  private checkMobile(): void {
    this.isMobile = window.innerWidth < 1024;
    if (!this.isMobile) this.isSidebarOpen = false;
  }

  onToggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  onTabChange(tab: string): void {
    if (tab === 'Challenge') {
      this.router.navigate(['/admin/challenges']);
    } else {
      this.router.navigate(['/admin'], { queryParams: { tab } });
    }
    if (this.isMobile) this.isSidebarOpen = false;
  }

  ngOnInit(): void {
    this.challengeAdminService.getChallenges().subscribe(challenges => {
      this.challenges = challenges;
    });
  }

  onCreateChallenge(): void {
    this.router.navigate(['/challenges/wizard']);
  }

  onAIGenerate(): void {
    // Scroll to AI panel or open modal
    console.log('AI Generate clicked');
  }

  onViewAllChallenges(): void {
    this.router.navigate(['/admin/challenges/all']);
  }
}
