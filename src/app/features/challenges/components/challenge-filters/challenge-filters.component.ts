import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { ChallengesDataService } from '../../services/challenges-data.service';

export interface ChallengeFilters {
  category: string;
  difficulty: string;
  pointRange: { min: number; max: number };
  sortBy: string;
}

@Component({
  selector: 'app-challenge-filters',
  templateUrl: './challenge-filters.component.html',
  styleUrls: ['./challenge-filters.component.css','./../../challenges.styles.css']
})
export class ChallengeFiltersComponent implements OnInit {
  @Output() filtersChanged = new EventEmitter<ChallengeFilters>();

  categories: string[] = [];
  difficulties: string[] = [];
  pointRanges: { label: string; min: number; max: number }[] = [];
  sortOptions: { label: string; value: string }[] = [];

  selectedCategory = 'All Categories';
  selectedDifficulty = 'All Levels';
  selectedPointRange = { label: 'All Points', min: 0, max: Infinity };
  selectedSort = 'popular';

  Infinity = Infinity;
  showFilters = false;
  activeFiltersCount = 0;

  constructor(private challengesDataService: ChallengesDataService) {}

  ngOnInit(): void {
    this.categories = this.challengesDataService.getCategories();
    this.difficulties = this.challengesDataService.getDifficulties();
    this.pointRanges = this.challengesDataService.getPointRanges();
    this.sortOptions = this.challengesDataService.getSortOptions();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  onCategoryChange(category: string): void {
    this.selectedCategory = category;
    this.updateActiveFiltersCount();
    this.emitFilters();
  }

  onDifficultyChange(difficulty: string): void {
    this.selectedDifficulty = difficulty;
    this.updateActiveFiltersCount();
    this.emitFilters();
  }

  onPointRangeChange(range: { label: string; min: number; max: number }): void {
    this.selectedPointRange = range;
    this.updateActiveFiltersCount();
    this.emitFilters();
  }

  onSortChange(sortValue: string): void {
    this.selectedSort = sortValue;
    this.emitFilters();
  }

  clearAllFilters(): void {
    this.selectedCategory = 'All Categories';
    this.selectedDifficulty = 'All Levels';
    this.selectedPointRange = { label: 'All Points', min: 0, max: Infinity };
    this.selectedSort = 'popular';
    this.activeFiltersCount = 0;
    this.emitFilters();
  }

  private updateActiveFiltersCount(): void {
    let count = 0;
    if (this.selectedCategory !== 'All Categories') count++;
    if (this.selectedDifficulty !== 'All Levels') count++;
    if (this.selectedPointRange.label !== 'All Points') count++;
    this.activeFiltersCount = count;
  }

  private emitFilters(): void {
    this.filtersChanged.emit({
      category: this.selectedCategory,
      difficulty: this.selectedDifficulty,
      pointRange: this.selectedPointRange,
      sortBy: this.selectedSort
    });
  }
}
