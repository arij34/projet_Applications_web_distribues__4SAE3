import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Exam } from '../../models/exam.model';
import { ExamService } from '../../services/exam.service';
import { ExamDashboardCardComponent } from '../exam-dashboard-card/exam-dashboard-card.component';
import { ExamDashboardParticipantsModalComponent } from '../exam-dashboard-participants-modal/exam-dashboard-participants-modal.component';

@Component({
  selector: 'app-exams',
  standalone: true,
  imports: [CommonModule, FormsModule, ExamDashboardCardComponent, ExamDashboardParticipantsModalComponent],
  templateUrl: './exams.component.html',
  styleUrls: ['./exams.component.css']
})
export class ExamsComponent implements OnInit {
  exams: Exam[] = [];
  filteredExams: Exam[] = [];
  searchTerm: string = '';
  activeFilter: string = 'all';
  isLoading = false;
  errorMessage = '';
  selectedExam: Exam | null = null;
  viewMode: 'grid' | 'list' = 'grid';
  showQuickPanel = false;
  stats = {
    totalExams: 0,
    totalParticipants: 0,
    avgPassRate: 0,
    publishedExams: 0
  };

  constructor(
    private examService: ExamService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadExams();
  }

  loadExams(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.examService.getExams().subscribe({
      next: (exams) => {
        this.exams = exams;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err: Error) => {
        this.errorMessage = err.message || 'Failed to load exams';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredExams = this.exams.filter(exam => {
      const term = this.searchTerm.toLowerCase().trim();
      const inSearch = !term
        || exam.title.toLowerCase().includes(term)
        || (exam.description || '').toLowerCase().includes(term);

      const filter = this.activeFilter.toLowerCase();
      const statusKey = exam.status.toLowerCase();
      const typeKey = exam.type.toLowerCase();
      const inFilter = filter === 'all' || statusKey === filter || typeKey === filter;
      return inSearch && inFilter;
    });
    this.computeStats();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  setFilter(filter: string): void {
    this.activeFilter = filter;
    this.applyFilters();
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  viewExam(examId: string): void {
    if (!examId) return;
    this.router.navigate(['/admin/exam-quiz/exams', examId]);
  }

  onViewExam(exam: Exam): void {
    this.viewExam(exam.id);
  }

  goToCreateExam(): void {
    this.router.navigate(['/admin/exam-quiz/exams/create']);
    this.showQuickPanel = false;
  }

  toggleQuickPanel(): void {
    this.showQuickPanel = !this.showQuickPanel;
  }

  exportExams(): void {
    const header = ['Title', 'Type', 'Status', 'Duration', 'TotalMarks', 'CreatedBy', 'CreatedAt', 'Attempts'];
    const rows = this.exams.map(e => [
      e.title,
      e.type,
      e.status,
      String(e.duration),
      String(e.totalMarks),
      e.createdBy,
      e.createdAt,
      String(e.attempts)
    ]);
    const csv = [header, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'exams-export.csv';
    link.click();
    URL.revokeObjectURL(url);
    this.showQuickPanel = false;
  }

  openParticipants(exam: Exam): void {
    this.selectedExam = exam;
  }

  closeModal(): void {
    this.selectedExam = null;
  }

  getPassRate(exam: Exam): number | null {
    if (exam.status === 'Draft') return null;
    const seed = exam.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return 60 + (seed % 31);
  }

  private computeStats(): void {
    const totalExams = this.exams.length;
    const totalParticipants = this.exams.reduce((sum, e) => sum + (e.attempts || 0), 0);
    const publishedExams = this.exams.filter(e => e.status === 'Active').length;
    const rates = this.exams
      .map(e => this.getPassRate(e))
      .filter((r): r is number => r !== null);
    const avgPassRate = rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0;
    this.stats = { totalExams, totalParticipants, avgPassRate, publishedExams };
  }
}
