import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isOverdue: boolean;
}

@Component({
  selector: 'app-countdown-timer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './countdown-timer.component.html',
  styleUrls: ['./countdown-timer.component.css']
})
export class CountdownTimerComponent implements OnInit, OnDestroy {
  @Input() deadline!: Date;
  
  timeLeft: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: false };
  private intervalId: any;

  ngOnInit(): void {
    this.updateTimeLeft();
    this.intervalId = setInterval(() => {
      this.updateTimeLeft();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private updateTimeLeft(): void {
    const difference = this.deadline.getTime() - new Date().getTime();
    
    if (difference <= 0) {
      this.timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: true };
      return;
    }

    this.timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      isOverdue: false,
    };
  }

  get totalHours(): number {
    return this.timeLeft.days * 24 + this.timeLeft.hours;
  }

  get isUrgent(): boolean {
    return this.totalHours < 24 && !this.timeLeft.isOverdue;
  }

  get textColorClass(): string {
    if (this.timeLeft.isOverdue) return 'text-red-500';
    return 'text-[#1E3A8A]';
  }

  padNumber(num: number): string {
    return String(num).padStart(2, '0');
  }
}
