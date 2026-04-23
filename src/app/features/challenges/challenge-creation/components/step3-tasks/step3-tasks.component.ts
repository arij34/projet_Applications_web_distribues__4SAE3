// src/app/modules/challenge-creation/components/step3-tasks/step3-tasks.component.ts

import { Component, Input, OnInit } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChallengeStateService } from '../../services/challenge-state.service';
import { Task } from '../../models/challenge.model';

@Component({
  selector: 'app-step3-tasks',
  templateUrl: './step3-tasks.component.html',
  styleUrls: ['./step3-tasks.component.css']
})
export class Step3TasksComponent implements OnInit {
  @Input() data: Task[] = [];
  
  expandedTasks = new Set<string>();

  constructor(private challengeStateService: ChallengeStateService) {}

  ngOnInit(): void {
    // Expand all tasks initially
    this.data.forEach(task => this.expandedTasks.add(task.id));
  }

  get tasks(): Task[] {
    return this.data || [];
  }

  trackByTaskId(_index: number, task: Task): string {
    return task.id;
  }

  addTask(): void {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: '',
      description: '',
      deadline: '',
      order: this.tasks.length
    };
    
    const updatedTasks = [...this.tasks, newTask];
    this.challengeStateService.updateTasks(updatedTasks);
    this.expandedTasks.add(newTask.id);
  }

  updateTask(id: string, updates: Partial<Task>): void {
    const updatedTasks = this.tasks.map(task =>
      task.id === id ? { ...task, ...updates } : task
    );
    this.challengeStateService.updateTasks(updatedTasks);
  }

  deleteTask(id: string): void {
    const updatedTasks = this.tasks.filter(task => task.id !== id);
    this.challengeStateService.updateTasks(updatedTasks);
    this.expandedTasks.delete(id);
  }

  drop(event: CdkDragDrop<Task[]>): void {
    const tasksCopy = [...this.tasks];
    moveItemInArray(tasksCopy, event.previousIndex, event.currentIndex);
    
    const reorderedTasks = tasksCopy.map((task, index) => ({
      ...task,
      order: index
    }));
    
    this.challengeStateService.updateTasks(reorderedTasks);
  }

  toggleExpand(id: string): void {
    if (this.expandedTasks.has(id)) {
      this.expandedTasks.delete(id);
    } else {
      this.expandedTasks.add(id);
    }
  }

  isExpanded(id: string): boolean {
    return this.expandedTasks.has(id);
  }
}
