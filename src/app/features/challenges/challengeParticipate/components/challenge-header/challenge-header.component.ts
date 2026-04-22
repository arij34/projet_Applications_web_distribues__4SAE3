import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-challenge-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './challenge-header.component.html',
  styleUrls: ['./challenge-header.component.css']
})
export class ChallengeHeaderComponent {
  title = input<string>('');
  description = input<string>('');
  completedCount = input<number>(0);
  totalCount = input<number>(0);
  timeLeft = input<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
}