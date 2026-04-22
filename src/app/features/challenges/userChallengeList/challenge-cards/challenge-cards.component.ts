import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export type DifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

@Component({
  selector: 'app-challenge-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './challenge-cards.component.html',
  styleUrls: ['./challenge-cards.component.css']
})
export class ChallengeCardsComponent {
  @Input() challengeId: string = '';
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() difficulty: DifficultyLevel = 'BEGINNER';
  @Input() tags: string[] = [];
  @Input() participants: number = 0;
  @Input() startDate: string = '';
  @Input() endDate: string = '';
  @Input() duration: string = '';
  @Input() points: number = 0;
  @Input() imageUrl: string = '';
  @Input() status: string = '';
  @Input() trending: boolean = false;
  @Input() buttonLabel: string = 'Join Now';
  @Input() navigateTo: string = '';
  @Output() joinChallenge = new EventEmitter<void>();

  constructor(private router: Router) {}

  isHovered: boolean = false;
  showComingSoonModal: boolean = false;

  getDifficultyClass(): string {
    const styles: Record<DifficultyLevel, string> = {
      'BEGINNER': 'difficulty-beginner',
      'INTERMEDIATE': 'difficulty-intermediate',
      'ADVANCED': 'difficulty-advanced',
      'EXPERT': 'difficulty-expert'
    };
    return styles[this.difficulty];
  }

  getStatusLabel(): string {
    switch ((this.status ?? '').toUpperCase()) {
      case 'ACTIVE': return 'Active';
      case 'COMINGSOON': return 'Coming Soon';
      case 'COMPLETED': return 'Completed';
      case 'CLOSED': return 'Closed';
      case 'DRAFT': return 'Draft';
      default: return this.status || 'Unknown';
    }
  }

  getStatusClass(): string {
    switch ((this.status ?? '').toUpperCase()) {
      case 'ACTIVE': return 'status-active';
      case 'COMINGSOON': return 'status-coming-soon';
      case 'COMPLETED': return 'status-completed';
      case 'CLOSED': return 'status-closed';
      default: return 'status-draft';
    }
  }

  formatDate(date?: string): string {
    if (!date) return '—';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  onMouseEnter(): void {
    this.isHovered = true;
  }

  onMouseLeave(): void {
    this.isHovered = false;
  }

  get isComingSoon(): boolean {
    return (this.status ?? '').toUpperCase() === 'COMINGSOON';
  }

  get isViewResults(): boolean {
    return this.buttonLabel === 'View Results';
  }

  onJoinClick(): void {
    if (this.isComingSoon) {
      this.showComingSoonModal = true;
      return;
    }
    if (this.navigateTo && this.challengeId) {
      this.router.navigate([this.navigateTo, this.challengeId]);
    } else if (this.challengeId) {
      this.router.navigate(['/challenges/join', this.challengeId]);
    }
    this.joinChallenge.emit();
  }

  closeComingSoonModal(): void {
    this.showComingSoonModal = false;
  }

  onModalOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeComingSoonModal();
    }
  }
}
