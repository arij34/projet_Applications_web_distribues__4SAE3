import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard-header',
  templateUrl: './dashboard-header.component.html',
  styleUrls: ['./dashboard-header.component.css']
})
export class DashboardHeaderComponent {
  searchQuery: string = '';

  onSearch(): void {
    // Implement search functionality
    console.log('Searching for:', this.searchQuery);
  }

  onNotificationClick(): void {
    // Handle notification click
    console.log('Notifications clicked');
  }

  onProfileClick(): void {
    // Handle profile click
    console.log('Profile clicked');
  }
}
