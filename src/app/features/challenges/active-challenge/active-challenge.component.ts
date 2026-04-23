import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChallengeCardsComponent } from '../userChallengeList/challenge-cards/challenge-cards.component';
import { FilterBarComponent } from '../userChallengeList/filter-bar/filter-bar.component';
import { SharedModule } from '@shared/shared.module';
import { ChallengeService } from '@core/services/challenge.service';
import { ParticipationService } from '@core/services/participation.service';

export interface Challenge {
  id: string;
  participationId: string;
  title: string;
  description: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  estimatedTime: string;
  tags: string[];
  participants: number;
  imageUrl: string;
  category?: string;
  status?: string;
  participationStatus?: string;
  startDate?: string;
  endDate?: string;
  points?: number;
  repoUrl?: string;
  repoName?: string;
}

@Component({
  selector: 'app-active-challenge',
  standalone: true,
  imports: [CommonModule, ChallengeCardsComponent, FilterBarComponent, SharedModule],
  templateUrl: './active-challenge.component.html',
  styleUrls: ['./active-challenge.component.css']
})
export class ActiveChallengeComponent implements OnInit {
  challenges: Challenge[] = [];
  filteredChallenges: Challenge[] = [];
  isLoading = true;

  private activeFilters = {
    search: '',
    difficulty: '' as string | null,
    technology: '',
    status: ''
  };

  constructor(
    private challengeService: ChallengeService,
    private participationService: ParticipationService
  ) {}

  ngOnInit(): void {
    this.loadChallenges();
  }

  private loadChallenges(): void {
    this.isLoading = true;
    this.participationService.getMyChallenges().subscribe({
      next: (data) => {
        this.challenges = data.map(c => this.mapToCardChallenge(c));
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.challenges = [];
        this.filteredChallenges = [];
        this.isLoading = false;
      }
    });
  }

  private mapToCardChallenge(participation: any): Challenge {
    const ch = participation.challenge || {};

    const tech = ch.technology;
    const tags: string[] = [];
    if (tech) {
      if (Array.isArray(tech)) {
        tags.push(...tech);
      } else {
        tags.push(...String(tech).split(',').map((t: string) => t.trim()).filter(Boolean));
      }
    }
    if (ch.category && !tags.includes(ch.category)) {
      tags.push(ch.category);
    }

    let estimatedTime = '';
    if (ch.startDate && ch.endDate) {
      const start = new Date(ch.startDate);
      const end = new Date(ch.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (days <= 7) estimatedTime = 'A week';
      else if (days <= 14) estimatedTime = 'Two weeks';
      else if (days <= 21) estimatedTime = '3 weeks';
      else estimatedTime = '4+ weeks';
    }

    const defaultImages: Record<string, string> = {
      'BEGINNER': 'https://images.unsplash.com/photo-1651684195895-38708dc94cfa?w=600',
      'INTERMEDIATE': 'https://images.unsplash.com/photo-1760952851538-17a59f691efe?w=600',
      'ADVANCED': 'https://images.unsplash.com/photo-1759752394755-1241472b589d?w=600',
      'EXPERT': 'https://images.unsplash.com/photo-1744868562210-fffb7fa882d9?w=600'
    };

    const startDate = ch.startDate ? (ch.startDate instanceof Date ? ch.startDate.toISOString() : String(ch.startDate)) : undefined;
    const endDate = ch.endDate ? (ch.endDate instanceof Date ? ch.endDate.toISOString() : String(ch.endDate)) : undefined;

    return {
      id: ch.idChallenge ?? ch.id ?? '',
      participationId: participation.id ?? '',
      title: ch.title ?? 'Untitled',
      description: ch.description ?? '',
      difficulty: (ch.difficulty || 'BEGINNER').toUpperCase() as Challenge['difficulty'],
      estimatedTime: estimatedTime || 'Flexible',
      tags: tags.length ? tags : ['General'],
      participants: ch.participants ?? ch.maxParticipants ?? 0,
      imageUrl: ch.image || defaultImages[ch.difficulty?.toUpperCase()] || defaultImages['BEGINNER'],
      category: ch.category ?? '',
      status: ch.status ?? 'DRAFT',
      startDate,
      endDate,
      points: ch.points ?? 0,
      repoUrl: participation.repoUrl,
      repoName: participation.repoName,
      participationStatus: participation.status ?? ''
    };
  }

  private applyFilters(): void {
    let result = [...this.challenges];

    if (this.activeFilters.search) {
      const term = this.activeFilters.search.toLowerCase();
      result = result.filter(c =>
        c.title.toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term) ||
        c.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    if (this.activeFilters.difficulty) {
      result = result.filter(c => c.difficulty === this.activeFilters.difficulty);
    }

    if (this.activeFilters.technology) {
      const tech = this.activeFilters.technology.toLowerCase();
      result = result.filter(c =>
        c.tags.some(tag => tag.toLowerCase().includes(tech))
      );
    }

    this.filteredChallenges = result;
  }

  onSearchChange(searchTerm: string): void {
    this.activeFilters.search = searchTerm;
    this.applyFilters();
  }

  onDifficultyChange(difficulty: string | null): void {
    this.activeFilters.difficulty = difficulty;
    this.applyFilters();
  }

  onTechnologyChange(technology: string): void {
    this.activeFilters.technology = technology;
    this.applyFilters();
  }

  onDurationChange(duration: string): void {
    console.log('Duration changed:', duration);
  }

  onStatusChange(status: string): void {
    console.log('Status changed:', status);
  }
}
