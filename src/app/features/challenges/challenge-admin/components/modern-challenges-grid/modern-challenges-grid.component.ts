import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';

@Component({
  selector: 'app-modern-challenges-grid',
  templateUrl: './modern-challenges-grid.component.html',
  styleUrls: ['./modern-challenges-grid.component.css']
})
export class ModernChallengesGridComponent implements OnChanges {
  @Input() challenges: any[] = [];
  @Output() edit = new EventEmitter<any>();
  @Output() duplicate = new EventEmitter<any>();
  @Output() view = new EventEmitter<any>();
  @Output() viewParticipants = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() goBack = new EventEmitter<void>();

  filterCategory: string = 'all';
  filterStatus: string = 'all';
  filterDifficulty: string = 'all';
  viewMode: 'grid' | 'list' = 'grid';

  categories = ['Web Development', 'Mobile Development', 'Machine Learning', 'DevOps', 'Data Science', 'Blockchain'];
  statuses = ['Active', 'Draft', 'Completed', 'Coming Soon'];
  difficulties = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  filteredChallenges: any[] = [];

  ngOnChanges(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    if (!this.challenges) {
      this.filteredChallenges = [];
      return;
    }
    this.filteredChallenges = this.challenges.filter(challenge => {
      const matchesCategory = this.filterCategory === 'all' || this.normalizeForCompare(challenge.category) === this.normalizeForCompare(this.filterCategory);
      const matchesStatus = this.filterStatus === 'all' || this.statusMatches(challenge.status, this.filterStatus);
      const matchesDifficulty = this.filterDifficulty === 'all' || this.difficultyMatches(challenge.difficulty, this.filterDifficulty);
      return matchesCategory && matchesStatus && matchesDifficulty;
    });
  }

  private normalizeForCompare(val: string | undefined): string {
    return (val || '').toLowerCase().trim();
  }

  private statusMatches(challengeStatus: string | undefined, filterStatus: string): boolean {
    const c = this.normalizeForCompare(challengeStatus);
    const f = this.normalizeForCompare(filterStatus);
    if (c === f) return true;
    if (f === 'coming soon' && c === 'comingsoon') return true;
    if (f === 'comingsoon' && c === 'coming soon') return true;
    return false;
  }

  private difficultyMatches(challengeDifficulty: string | undefined, filterDifficulty: string): boolean {
    const c = this.normalizeForCompare(challengeDifficulty);
    const f = this.normalizeForCompare(filterDifficulty);
    if (c === f) return true;
    const aliasMap: Record<string, string[]> = {
      'beginner': ['easy'],
      'intermediate': ['medium'],
      'advanced': [],
      'expert': ['hard']
    };
    const aliases = aliasMap[f] || [];
    return aliases.includes(c) || (aliasMap[c] && aliasMap[c].includes(f));
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onEdit(challenge: any): void {
    this.edit.emit(challenge);
  }

  onDuplicate(challenge: any): void {
    this.duplicate.emit(challenge);
  }

  onView(challenge: any): void {
    this.view.emit(challenge);
  }

  onViewParticipants(challenge: any): void {
    this.viewParticipants.emit(challenge);
  }

  onDelete(challenge: any): void {
    this.delete.emit(challenge);
  }

  onGoBack(): void {
    this.goBack.emit();
  }

  getTechnologyArray(challenge: any): string[] {
    const tech = challenge.technology;
    if (Array.isArray(tech)) return tech;
    if (typeof tech === 'string') return tech ? [tech] : [];
    return [];
  }

  getCompletionRate(challenge: any): number {
    return challenge.progress ?? challenge.completionRate ?? 0;
  }

  getStatusColor(status?: string): string {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'active': return 'bg-green-500 text-white shadow-lg backdrop-blur-sm';
      case 'draft': return 'bg-gray-400 text-white shadow-lg backdrop-blur-sm';
      case 'completed': return 'bg-blue-500 text-white shadow-lg backdrop-blur-sm';
      case 'comingsoon':
      case 'coming soon': return 'bg-yellow-500 text-white shadow-lg backdrop-blur-sm';
      default: return 'bg-gray-400 text-white shadow-lg backdrop-blur-sm';
    }
  }

  getDifficultyColor(difficulty?: string): string {
    const d = (difficulty || '').toLowerCase();
    switch (d) {
      case 'beginner':
      case 'easy': return 'bg-emerald-100 text-emerald-700 border-emerald-200 border backdrop-blur-sm';
      case 'intermediate':
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200 border backdrop-blur-sm';
      case 'advanced': return 'bg-orange-100 text-orange-700 border-orange-200 border backdrop-blur-sm';
      case 'expert':
      case 'hard': return 'bg-red-100 text-red-700 border-red-200 border backdrop-blur-sm';
      default: return 'bg-gray-100 text-gray-700 border-gray-200 border backdrop-blur-sm';
    }
  }

  trackByChallenge(index: number, challenge: any): string {
    return challenge.id;
  }
}
