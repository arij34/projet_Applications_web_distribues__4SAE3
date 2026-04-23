import { Component, Input, Output, EventEmitter, OnChanges, OnInit } from '@angular/core';
import { ParticipationService } from '@core/services/participation.service';

@Component({
  selector: 'app-challenges-preview',
  templateUrl: './challenges-preview.component.html',
  styleUrls: ['./challenges-preview.component.css']
})
export class ChallengesPreviewComponent implements OnChanges, OnInit {
  @Input() challenges: any[] = [];
  @Output() viewAll = new EventEmitter<void>();

  recentChallenges: any[] = [];
  stats = {
    total: 0,
    active: 0,
    totalParticipants: 0,
    avgCompletion: 0
  };

  constructor(private participationService: ParticipationService) {}

  ngOnInit(): void {
    this.loadTotalParticipants();
  }

  ngOnChanges(): void {
    this.calculateStats();
    this.filterRecentChallenges();
  }

  private loadTotalParticipants(): void {
    this.participationService.getTotalParticipantsCount().subscribe({
      next: (count) => {
        this.stats.totalParticipants = count;
      },
      error: () => {
        this.stats.totalParticipants = 0;
      }
    });
  }

  private isActiveStatus(status: string | undefined): boolean {
    const s = (status || '').toLowerCase();
    return s === 'active';
  }

  private filterRecentChallenges(): void {
    this.recentChallenges = this.challenges
      .filter(c => this.isActiveStatus(c.status))
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 6);
  }

  private calculateStats(): void {
    const total = this.challenges.length;
    const active = this.challenges.filter(c => this.isActiveStatus(c.status)).length;
    const avgCompletion = total > 0 
      ? Math.round(this.challenges.reduce((sum, c) => sum + (c.progress ?? c.completionRate ?? 0), 0) / total)
      : 0;

    this.stats = { ...this.stats, total, active, avgCompletion };
  }

  onViewAll(): void {
    this.viewAll.emit();
  }

  onChallengeClick(challenge: any): void {
    this.viewAll.emit();
  }

  getStatusColor(status?: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'active') return 'bg-green-500';
    if (s === 'draft') return 'bg-gray-400';
    if (s === 'closed' || s === 'completed') return 'bg-blue-500';
    return 'bg-gray-400';
  }

  getDifficultyColor(difficulty?: string): string {
    const d = (difficulty || '').toLowerCase();
    if (d === 'beginner' || d === 'easy') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (d === 'intermediate' || d === 'medium') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (d === 'advanced') return 'bg-orange-100 text-orange-700 border-orange-200';
    if (d === 'expert' || d === 'hard') return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  }

  trackByChallenge(index: number, challenge: any): string {
    return challenge.id;
  }
}
