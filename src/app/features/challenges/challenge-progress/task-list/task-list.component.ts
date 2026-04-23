import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type TaskStatus = 'completed' | 'in-progress' | 'incomplete';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  estimatedTime: string;
}

type FilterType = 'all' | 'completed' | 'in-progress' | 'incomplete';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css']
})
export class TaskListComponent {
  @Input() tasks: Task[] = [];
  @Output() taskToggle = new EventEmitter<string>();
  @Output() addTask = new EventEmitter<void>();

  activeFilter: FilterType = 'all';

  filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'completed', label: 'Completed' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'incomplete', label: 'Incomplete' },
  ];

  get filteredTasks(): Task[] {
    if (this.activeFilter === 'all') {
      return this.tasks;
    }
    return this.tasks.filter(task => task.status === this.activeFilter);
  }

  setActiveFilter(filter: FilterType): void {
    this.activeFilter = filter;
  }

  onTaskToggle(taskId: string): void {
    this.taskToggle.emit(taskId);
  }

  onAddTask(): void {
    this.addTask.emit();
  }

  getStatusIconPath(status: TaskStatus): string {
    switch (status) {
      case 'completed':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'in-progress':
        return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'incomplete':
        return 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z';
    }
  }

  getStatusIconColor(status: TaskStatus): string {
    switch (status) {
      case 'completed':
        return 'text-[#16A34A]';
      case 'in-progress':
        return 'text-[#1E3A8A]';
      case 'incomplete':
        return 'text-[#6B7280]';
    }
  }

  getTaskBgClass(status: TaskStatus): string {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'in-progress':
        return 'bg-blue-50 border-blue-200';
      case 'incomplete':
        return 'bg-white border-gray-200';
    }
  }

  getTaskTitleClass(status: TaskStatus): string {
    return status === 'completed' ? 'line-through text-[#9CA3AF]' : 'text-[#1F2937]';
  }
}
