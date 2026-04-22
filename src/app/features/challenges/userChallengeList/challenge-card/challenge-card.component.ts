import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  estimatedTime: string;
  tags: string[];
  participants: number;
  imageUrl: string;
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  points?: number;
}

@Component({
  selector: 'app-challenge-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './challenge-card.component.html',
  styleUrls: ['./challenge-card.component.css']
})
export class ChallengeCardComponent {
  @Input() challenge!: Challenge;

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'BEGINNER':
        return 'bg-emerald-500 text-white';
      case 'INTERMEDIATE':
        return 'bg-amber-500 text-white';
      case 'ADVANCED':
        return 'bg-orange-500 text-white';
      case 'EXPERT':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  }

  getStatusColor(status?: string): string {
    switch ((status || '').toUpperCase()) {
      case 'ACTIVE':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'DRAFT':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'COMPLETED':
      case 'CLOSED':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  }

  formatParticipants(count: number): string {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  }

  formatDate(date?: string): string {
    if (!date) return '—';
    const d = new Date(date);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
