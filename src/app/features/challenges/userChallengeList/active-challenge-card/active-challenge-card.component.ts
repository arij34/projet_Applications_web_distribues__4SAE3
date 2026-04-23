import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ActiveChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  progress: number;
  startedAt: string;
  estimatedTime: string;
  tags: string[];
  imageUrl: string;
  lastActivity: string;
}

@Component({
  selector: 'app-active-challenge-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './active-challenge-card.component.html',
  styleUrls: ['./active-challenge-card.component.css']
})
export class ActiveChallengeCardComponent {
  @Input() challenge!: ActiveChallenge;

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'BEGINNER':
        return 'bg-[#10B981] text-white';
      case 'INTERMEDIATE':
        return 'bg-[#F59E0B] text-white';
      case 'ADVANCED':
        return 'bg-[#EF4444] text-white';
      case 'EXPERT':
        return 'bg-[#8B5CF6] text-white';
      default:
        return 'bg-[#6B7280] text-white';
    }
  }

  getProgressColor(progress: number): string {
    if (progress >= 75) return 'bg-[#10B981]';
    if (progress >= 50) return 'bg-[#F59E0B]';
    if (progress >= 25) return 'bg-[#3B82F6]';
    return 'bg-[#6B7280]';
  }
}
