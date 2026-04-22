import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type ProductivityStatus = 'ahead' | 'onTrack' | 'behind';

@Component({
  selector: 'app-productivity-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './productivity-indicator.component.html',
  styleUrls: ['./productivity-indicator.component.css']
})
export class ProductivityIndicatorComponent {
  @Input() completedTasks: number = 0;
  @Input() totalTasks: number = 0;
  @Input() daysLeft: number = 0;

  get completionRate(): number {
    return this.totalTasks > 0 ? this.completedTasks / this.totalTasks : 0;
  }

  get dailyCompletionNeeded(): number {
    return (this.totalTasks - this.completedTasks) / (this.daysLeft || 1);
  }

  get status(): ProductivityStatus {
    if (this.completionRate >= 0.8) {
      return 'ahead';
    } else if (this.dailyCompletionNeeded <= 2) {
      return 'onTrack';
    } else {
      return 'behind';
    }
  }

  get label(): string {
    switch (this.status) {
      case 'ahead':
        return 'Ahead of Schedule';
      case 'onTrack':
        return 'On Track';
      case 'behind':
        return 'Behind Schedule';
    }
  }

  get colorClass(): string {
    switch (this.status) {
      case 'ahead':
        return 'text-green-700';
      case 'onTrack':
        return 'text-blue-700';
      case 'behind':
        return 'text-orange-700';
    }
  }

  get bgClass(): string {
    switch (this.status) {
      case 'ahead':
        return 'bg-green-100 border-green-200';
      case 'onTrack':
        return 'bg-blue-100 border-blue-200';
      case 'behind':
        return 'bg-orange-100 border-orange-200';
    }
  }

  get iconPath(): string {
    switch (this.status) {
      case 'ahead':
        return 'M13 10V3L4 14h7v7l9-11h-7z'; // Rocket/Zap icon
      case 'onTrack':
        return 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'; // TrendingUp icon
      case 'behind':
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'; // AlertCircle icon
    }
  }
}
