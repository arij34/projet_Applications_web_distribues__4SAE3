import { Component, OnInit, OnDestroy } from '@angular/core';

export interface Task {
  id: string;
  title: string;
  deadline: string;
  completed: boolean;
}

export type FilterType = 'all' | 'remaining' | 'completed';

@Component({
  selector: 'app-challenge-participate',
  templateUrl: './challenge-participate.component.html',
  styleUrls: ['./challenge-participate.component.css']
})
export class ChallengeParticipateComponent implements OnInit, OnDestroy {
  challengeTitle = 'Full-Stack Web Application Challenge';
  challengeDescription = 'Build a complete full-stack web application with user authentication, RESTful API, and responsive frontend. This challenge will test your ability to design scalable architecture, implement secure authentication, and create an intuitive user experience.';
  challengeDeadline = new Date('2026-02-20T23:59:59');

  timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
  private countdownInterval: any;

  tasks: Task[] = [
    {
      id: '1',
      title: 'Set up project repository and initialize Git',
      deadline: 'Feb 14, 2026',
      completed: true
    },
    {
      id: '2',
      title: 'Design and implement database schema',
      deadline: 'Feb 15, 2026',
      completed: true
    },
    {
      id: '3',
      title: 'Create user authentication system',
      deadline: 'Feb 16, 2026',
      completed: false
    },
    {
      id: '4',
      title: 'Build RESTful API endpoints',
      deadline: 'Feb 17, 2026',
      completed: false
    },
    {
      id: '5',
      title: 'Implement frontend components',
      deadline: 'Feb 18, 2026',
      completed: false
    },
    {
      id: '6',
      title: 'Write unit and integration tests',
      deadline: 'Feb 19, 2026',
      completed: false
    },
    {
      id: '7',
      title: 'Deploy application to production',
      deadline: 'Feb 20, 2026',
      completed: false
    },
    {
      id: '8',
      title: 'Complete documentation and README',
      deadline: 'Feb 20, 2026',
      completed: false
    }
  ];

  activeFilter: FilterType = 'all';
  filteredTasks: Task[] = [];

  ngOnInit(): void {
    this.updateFilteredTasks();
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  startCountdown(): void {
    this.updateTimeLeft();
    this.countdownInterval = setInterval(() => {
      this.updateTimeLeft();
    }, 1000);
  }

  updateTimeLeft(): void {
    const now = new Date().getTime();
    const deadline = this.challengeDeadline.getTime();
    const distance = deadline - now;

    if (distance > 0) {
      this.timeLeft = {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      };
    } else {
      this.timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
    }
  }

  get completedCount(): number {
    return this.tasks.filter(t => t.completed).length;
  }

  get remainingCount(): number {
    return this.tasks.filter(t => !t.completed).length;
  }

  get allTasksCompleted(): boolean {
    return this.tasks.every(task => task.completed);
  }

  onFilterChange(filter: FilterType): void {
    this.activeFilter = filter;
    this.updateFilteredTasks();
  }

  updateFilteredTasks(): void {
    this.filteredTasks = this.tasks.filter(task => {
      if (this.activeFilter === 'completed') return task.completed;
      if (this.activeFilter === 'remaining') return !task.completed;
      return true;
    });
  }

  onToggleTask(taskId: string): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      this.updateFilteredTasks();
    }
  }

  onSubmit(githubUrl: string): void {
    alert(`Solution submitted successfully!\nGitHub URL: ${githubUrl}`);
    // Add your submission logic here
  }
}