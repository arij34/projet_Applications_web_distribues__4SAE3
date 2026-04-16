import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-back-office',
  templateUrl: './back-office.component.html',
  styleUrl: './back-office.component.css'
})
export class BackOfficeComponent implements OnInit {
  activeTab: string = 'dashboard';
  sidebarOpen: boolean = false;
  isMobile: boolean = false;

  ngOnInit() {
    this.checkMobile();
    window.addEventListener('resize', () => this.checkMobile());
  }

  checkMobile() {
    this.isMobile = window.innerWidth < 1024;
  }

  onTabChange(tab: string) {
    this.activeTab = tab;
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