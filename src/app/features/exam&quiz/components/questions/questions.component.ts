import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Question } from '../../models/question.model';
import { QuestionService } from '../../services/question.service';

@Component({
  selector: 'app-questions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './questions.component.html',
  styleUrls: ['./questions.component.css']
})
export class QuestionsComponent implements OnInit {
  questions: Question[] = [];
  filteredQuestions: Question[] = [];
  searchTerm: string = '';
  selectedType: string = 'all';
  isLoading = false;
  errorMessage = '';

  constructor(private questionService: QuestionService) {}

  ngOnInit(): void {
    this.loadQuestions();
  }

  loadQuestions(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.questionService.getQuestions().subscribe({
      next: (questions) => {
        this.questions = questions;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err: Error) => {
        this.errorMessage = err.message || 'Failed to load questions';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredQuestions = this.questions.filter(question => {
      const matchesSearch = 
        question.questionText.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        question.examTitle.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesType = this.selectedType === 'all' || question.type === this.selectedType;
      return matchesSearch && matchesType;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onTypeChange(): void {
    this.applyFilters();
  }

  getTypeClass(type: string): string {
    const typeMap: { [key: string]: string } = {
      'MCQ': 'type-mcq',
      'True/False': 'type-truefalse',
      'Short': 'type-short'
    };
    return typeMap[type] || '';
  }

  deleteQuestion(id: string): void {
    if (confirm('Are you sure you want to delete this question?')) {
      this.questionService.deleteQuestion(id).subscribe({
        next: () => this.loadQuestions(),
        error: (err: Error) => {
          this.errorMessage = err.message || 'Failed to delete question';
        }
      });
    }
  }
}
