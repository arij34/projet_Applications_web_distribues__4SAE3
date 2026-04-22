import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ChallengeCardsComponent } from '../challenge-cards/challenge-cards.component';
import { FilterBarComponent } from '../filter-bar/filter-bar.component';
import { SharedModule } from '@shared/shared.module';
import { ChallengeService } from '@core/services/challenge.service';
import { ParticipationService } from '@core/services/participation.service';

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
  selector: 'app-explore-challenges',
  standalone: true,
  imports: [CommonModule, RouterLink, ChallengeCardsComponent, FilterBarComponent, SharedModule],
  templateUrl: './explore-challenges.component.html',
  styleUrls: ['./explore-challenges.component.css']
})
export class ExploreChallengesComponent implements OnInit {
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
    const challenges$ = this.challengeService.getChallenges();
    const joinedIds$ = this.participationService.getMyChallenges().pipe(
      map((participations: any[]) =>
        (participations ?? []).map(p => p.challenge?.idChallenge ?? p.challenge?.id ?? '').filter(Boolean)
      ),
      catchError(() => of([]))
    );

    forkJoin({ challenges: challenges$, joinedIds: joinedIds$ }).subscribe({
      next: ({ challenges: data, joinedIds }) => {
        const joinedSet = new Set(joinedIds);
        this.challenges = data
          .map(c => this.mapToCardChallenge(c))
          .filter(c => {
            const s = (c.status ?? '').toUpperCase();
            if (s !== 'ACTIVE' && s !== 'COMINGSOON') return false;
            return !joinedSet.has(c.id);
          });
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

  private mapToCardChallenge(c: any): Challenge {
    const tech = c.technology;
    const tags: string[] = [];
    if (tech) {
      if (Array.isArray(tech)) {
        tags.push(...tech);
      } else {
        tags.push(...String(tech).split(',').map((t: string) => t.trim()).filter(Boolean));
      }
    }
    if (c.category && !tags.includes(c.category)) {
      tags.push(c.category);
    }

    let estimatedTime = '';
    if (c.startDate && c.endDate) {
      const start = new Date(c.startDate);
      const end = new Date(c.endDate);
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

    const startDate = c.startDate ? (c.startDate instanceof Date ? c.startDate.toISOString() : String(c.startDate)) : undefined;
    const endDate = c.endDate ? (c.endDate instanceof Date ? c.endDate.toISOString() : String(c.endDate)) : undefined;

    return {
      id: c.id ?? '',
      title: c.title ?? 'Untitled',
      description: c.description ?? '',
      difficulty: (c.difficulty || 'BEGINNER').toUpperCase() as Challenge['difficulty'],
      estimatedTime: estimatedTime || 'Flexible',
      tags: tags.length ? tags : ['General'],
      participants: c.participants ?? c.maxParticipants ?? 0,
      imageUrl: c.image || defaultImages[c.difficulty?.toUpperCase()] || defaultImages['BEGINNER'],
      category: c.category ?? '',
      status: c.status ?? 'DRAFT',
      startDate,
      endDate,
      points: c.points ?? 0
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
