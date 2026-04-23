import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface Task {
  id: string;
  title: string;
  deadline: string;
  completed: boolean;
}

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css']
})
export class TaskListComponent {
  @Input() tasks: Task[] = [];
  @Output() taskToggle = new EventEmitter<string>();

  onToggleTask(taskId: string): void {
    this.taskToggle.emit(taskId);
  }
}
