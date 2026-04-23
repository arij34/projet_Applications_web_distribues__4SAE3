import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-motivation-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './motivation-banner.component.html',
  styleUrls: ['./motivation-banner.component.css']
})
export class MotivationBannerComponent {
  @Input() progressPercentage: number = 0;

  get message(): string {
    if (this.progressPercentage >= 90) {
      return "Almost there! You're doing amazing!";
    } else if (this.progressPercentage >= 75) {
      return "Great progress! Keep up the excellent work!";
    } else if (this.progressPercentage >= 50) {
      return `Keep going! You're ${this.progressPercentage}% done.`;
    } else if (this.progressPercentage >= 25) {
      return "You're making progress! Stay focused!";
    } else {
      return "Let's get started! You've got this!";
    }
  }
}
