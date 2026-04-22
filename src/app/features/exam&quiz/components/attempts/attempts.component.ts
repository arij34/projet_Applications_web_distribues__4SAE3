import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Attempt } from '../../models/attempt.model';
import { AttemptService } from '../../services/attempt.service';

@Component({
  selector: 'app-attempts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attempts.component.html',
  styleUrls: ['./attempts.component.css']
})
export class AttemptsComponent implements OnInit {
  attempts: Attempt[] = [];
  filteredAttempts: Attempt[] = [];
  searchTerm: string = '';
  filterStatus: string = 'all';
  isLoading = false;
  errorMessage = '';

  constructor(private attemptService: AttemptService) {}

  ngOnInit(): void {
    this.loadAttempts();
  }

  loadAttempts(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.attemptService.getAttempts().subscribe({
      next: (attempts) => {
        this.attempts = attempts;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err: Error) => {
        this.errorMessage = err.message || 'Failed to load attempts';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredAttempts = this.attempts.filter(attempt => {
      const matchesSearch = 
        attempt.userName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        attempt.examTitle.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        attempt.userEmail.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = this.filterStatus === 'all' || attempt.status === this.filterStatus;
      return matchesSearch && matchesStatus;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Completed': 'badge-success',
      'In Progress': 'badge-info',
      'Submitted': 'badge-info',
      'Flagged': 'badge-danger'
    };
    return statusMap[status] || 'badge-default';
  }

  getScorePercentage(score: number | null, totalMarks: number): number {
    if (score === null) return 0;
    return (score / totalMarks) * 100;
  }
}
