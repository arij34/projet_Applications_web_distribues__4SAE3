import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ChallengeTask } from '@core/models/challenge.model';

@Component({
  selector: 'app-view-challenge-tasks-modal',
  templateUrl: './view-challenge-tasks-modal.component.html',
  styleUrls: ['./view-challenge-tasks-modal.component.css']
})
export class ViewChallengeTasksModalComponent {
  @Input() isOpen = false;
  @Input() challenge: any = null;
  @Input() tasks: ChallengeTask[] = [];
  @Input() isLoading = false;
  @Output() close = new EventEmitter<void>();
  @Output() editChallenge = new EventEmitter<any>();
  @Output() taskUpdated = new EventEmitter<ChallengeTask>();
  @Output() taskDeleted = new EventEmitter<ChallengeTask>();

  editingTaskId: string | null = null;
  editBuffer: { title: string; description: string; status: string } = { title: '', description: '', status: 'INCOMPLETE' };

  taskToDelete: ChallengeTask | null = null;
  showDeleteConfirm = false;
  showDeleteSuccess = false;

  taskToSave: ChallengeTask | null = null;
  showSaveConfirm = false;
  showSaveSuccess = false;

  taskStatusOptions = [
    { value: 'INCOMPLETE', label: 'Incomplete' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'COMPLETE', label: 'Complete' },
    { value: 'CLOSED', label: 'Closed' }
  ];

  onClose(): void {
    this.close.emit();
  }

  onEdit(): void {
    this.editChallenge.emit(this.challenge);
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.onClose();
    }
  }

  getDifficultyColor(difficulty?: string): string {
    const d = (difficulty || '').toLowerCase();
    switch (d) {
      case 'beginner':
      case 'easy': return 'bg-emerald-100 text-emerald-700';
      case 'intermediate':
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'advanced': return 'bg-orange-100 text-orange-700';
      case 'expert':
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  getStatusColor(status?: string): string {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'COMPLETE': return 'bg-green-100 text-green-700 border-green-200';
      case 'INCOMPLETE': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'ACTIVE': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'CLOSED': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }

  formatStatus(status?: string): string {
    return (status || 'INCOMPLETE').replace(/_/g, ' ');
  }

  formatDeadline(deadline?: string | Date): string {
    return this.formatDate(deadline);
  }

  formatDate(val?: string | Date): string {
    if (!val) return '—';
    const d = val instanceof Date ? val : new Date(val);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getChallengeStatusColor(status?: string): string {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'ACTIVE': return 'bg-green-100 text-green-700 border-green-200';
      case 'DRAFT': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'COMPLETED':
      case 'CLOSED': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }

  formatChallengeStatus(status?: string): string {
    return (status || '—').replace(/_/g, ' ');
  }

  trackByTask(index: number, task: ChallengeTask): string {
    return task.id ?? task.idTask ?? String(index);
  }

  getTaskId(task: ChallengeTask): string {
    return task.id ?? task.idTask ?? '';
  }

  isEditing(task: ChallengeTask): boolean {
    return this.editingTaskId === this.getTaskId(task);
  }

  onEditTask(task: ChallengeTask): void {
    this.editingTaskId = this.getTaskId(task);
    this.editBuffer = {
      title: task.title || '',
      description: task.description || '',
      status: (task.status || 'INCOMPLETE').toUpperCase()
    };
  }

  onSaveTask(task: ChallengeTask): void {
    this.taskToSave = {
      ...task,
      title: this.editBuffer.title,
      description: this.editBuffer.description,
      status: this.editBuffer.status
    };
    this.showSaveConfirm = true;
  }

  onConfirmSave(): void {
    if (this.taskToSave) {
      this.taskUpdated.emit(this.taskToSave);
      this.editingTaskId = null;
      this.showSaveConfirm = false;
      this.taskToSave = null;
      this.showSaveSuccess = true;
      setTimeout(() => this.showSaveSuccess = false, 2500);
    }
  }

  onCancelSave(): void {
    this.showSaveConfirm = false;
    this.taskToSave = null;
  }

  onCancelEdit(): void {
    this.editingTaskId = null;
  }

  onDeleteTask(task: ChallengeTask): void {
    this.taskToDelete = task;
    this.showDeleteConfirm = true;
  }

  onConfirmDelete(): void {
    if (this.taskToDelete) {
      this.taskDeleted.emit(this.taskToDelete);
      this.showDeleteConfirm = false;
      this.taskToDelete = null;
      this.showDeleteSuccess = true;
      setTimeout(() => this.showDeleteSuccess = false, 2500);
    }
  }

  onCancelDelete(): void {
    this.showDeleteConfirm = false;
    this.taskToDelete = null;
  }
}
