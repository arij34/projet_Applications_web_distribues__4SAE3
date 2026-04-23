import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ActiveChallengeCardComponent, ActiveChallenge } from '../active-challenge-card/active-challenge-card.component';

@Component({
  selector: 'app-my-active-challenges',
  standalone: true,
  imports: [CommonModule, RouterLink, ActiveChallengeCardComponent],
  templateUrl: './my-active-challenges.component.html',
  styleUrls: ['./my-active-challenges.component.css']
})
export class MyActiveChallengesComponent implements OnInit {
  activeChallenges: ActiveChallenge[] = [];
  averageProgress = 0;

  private mockActiveChallenges: ActiveChallenge[] = [
    {
      id: '1',
      title: 'Build a REST API with Authentication',
      description:
        'Create a secure REST API with JWT authentication and role-based authorization. Implement user registration, login, and protected routes.',
      difficulty: 'INTERMEDIATE',
      progress: 65,
      startedAt: '2026-02-20',
      estimatedTime: '4–6 hours',
      tags: ['Node.js', 'Express', 'JWT', 'API'],
      imageUrl: 'https://images.unsplash.com/photo-1598978028953-799807c097b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXZlbG9wZXIlMjBjb2RpbmclMjB3b3Jrc3BhY2UlMjBwcm9ncmVzc3xlbnwxfHx8fDE3NzIyMDM5OTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      lastActivity: '2 hours ago',
    },
    {
      id: '2',
      title: 'React Dashboard with Real-time Data',
      description:
        'Build a responsive dashboard with real-time data visualization using React and WebSockets. Include charts, tables, and live updates.',
      difficulty: 'ADVANCED',
      progress: 35,
      startedAt: '2026-02-18',
      estimatedTime: '8–10 hours',
      tags: ['React', 'TypeScript', 'WebSocket', 'Charts'],
      imageUrl: 'https://images.unsplash.com/photo-1770368787779-8472da646193?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2Z0d2FyZSUyMHByb2plY3QlMjBkYXNoYm9hcmQlMjBzY3JlZW58ZW58MXx8fHwxNzcyMjAzOTk4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      lastActivity: '1 day ago',
    },
    {
      id: '3',
      title: 'Dockerize a Full-Stack Application',
      description:
        'Learn to containerize a full-stack application using Docker. Create multi-stage builds and docker-compose configurations.',
      difficulty: 'INTERMEDIATE',
      progress: 90,
      startedAt: '2026-02-15',
      estimatedTime: '3–5 hours',
      tags: ['Docker', 'DevOps', 'Containers'],
      imageUrl: 'https://images.unsplash.com/photo-1630442923896-244dd3717b35?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2RpbmclMjBjaGFsbGVuZ2UlMjBsYXB0b3AlMjBwcm9ncmFtbWluZ3xlbnwxfHx8fDE3NzIyMDM5OTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      lastActivity: '4 hours ago',
    },
  ];

  ngOnInit(): void {
    this.activeChallenges = this.mockActiveChallenges;
    this.calculateAverageProgress();
  }

  calculateAverageProgress(): void {
    if (this.activeChallenges.length === 0) {
      this.averageProgress = 0;
      return;
    }
    const total = this.activeChallenges.reduce((acc, c) => acc + c.progress, 0);
    this.averageProgress = Math.round(total / this.activeChallenges.length);
  }
}
