import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-bar.component.html',
  styleUrls: ['./filter-bar.component.css']
})
export class FilterBarComponent {
  @Output() searchChange = new EventEmitter<string>();
  @Output() difficultyChange = new EventEmitter<string | null>();
  @Output() technologyChange = new EventEmitter<string>();
  @Output() durationChange = new EventEmitter<string>();
  @Output() statusChange = new EventEmitter<string>();

  searchTerm = '';
  selectedDifficulty: string | null = null;
  selectedTechnology = '';
  selectedDuration = '';
  selectedStatus = '';

  difficulties = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
  technologies = ['React', 'Node.js', 'Python', 'Docker', 'TypeScript', 'GraphQL'];
  durations = ['A week', 'Two weeks', '3 weeks', '4+ weeks'];
  statuses = ['Not Started', 'In Progress', 'Completed'];

  onSearchChange(): void {
    this.searchChange.emit(this.searchTerm);
  }

  onDifficultyChange(difficulty: string): void {
    if (this.selectedDifficulty === difficulty) {
      this.selectedDifficulty = null;
      this.difficultyChange.emit(null);
    } else {
      this.selectedDifficulty = difficulty;
      this.difficultyChange.emit(difficulty);
    }
  }

  onTechnologyChange(): void {
    this.technologyChange.emit(this.selectedTechnology);
  }

  onDurationChange(): void {
    this.durationChange.emit(this.selectedDuration);
  }

  onStatusChange(): void {
    this.statusChange.emit(this.selectedStatus);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedDifficulty = null;
    this.selectedTechnology = '';
    this.selectedDuration = '';
    this.selectedStatus = '';
    
    this.searchChange.emit('');
    this.difficultyChange.emit(null);
    this.technologyChange.emit('');
    this.durationChange.emit('');
    this.statusChange.emit('');
  }

  getDifficultyClasses(difficulty: string): string {
    const base = 'px-4 py-2 rounded-full text-xs font-medium border transition-colors';
    const isSelected = this.selectedDifficulty === difficulty;

    const colorMap: Record<string, { active: string; inactive: string }> = {
      BEGINNER: {
        active: 'bg-green-600 text-white border-green-600',
        inactive: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
      },
      INTERMEDIATE: {
        active: 'bg-blue-600 text-white border-blue-600',
        inactive: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'
      },
      ADVANCED: {
        active: 'bg-orange-600 text-white border-orange-600',
        inactive: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200'
      },
      EXPERT: {
        active: 'bg-[#1E3A8A] text-white border-[#1E3A8A]',
        inactive: 'bg-blue-50 text-[#1E3A8A] border-blue-200 hover:bg-blue-100'
      }
    };

    const colors = colorMap[difficulty] || colorMap['EXPERT'];
    return `${base} ${isSelected ? colors.active : colors.inactive}`;
  }
}
