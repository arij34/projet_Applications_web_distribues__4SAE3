import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChallengeService } from '@core/services/challenge.service';
import { Challenge } from '@core/models/challenge.model';

@Injectable({
  providedIn: 'root'
})
export class ChallengesDataService {

  constructor(private challengeService: ChallengeService) {}

  /**
   * Get all challenges (from backend)
   * Optional filters: difficulty, category, status
   */
  getChallenges(filters?: {
    difficulty?: string;
    category?: string;
    status?: string;
  }): Observable<Challenge[]> {
    return this.challengeService.getChallenges(filters);
  }

  /**
   * Get categories (hardcoded for now, can also fetch from backend if available)
   */
  getCategories(): string[] {
    return [
      'All Categories',
      'Web Development',
      'Mobile Development',
      'UI/UX Design',
      'Backend Development',
      'Frontend',
      'Full Stack',
      'Data Science',
      'AI/ML',
      'DevOps',
      'Cybersecurity'
    ];
  }

  /**
   * Get difficulties (hardcoded)
   */
  getDifficulties(): string[] {
    return ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];
  }

  /**
   * Point ranges (hardcoded)
   */
  getPointRanges(): { label: string; min: number; max: number }[] {
    return [
      { label: 'All Points', min: 0, max: Infinity },
      { label: '100-200 pts', min: 100, max: 200 },
      { label: '200-300 pts', min: 200, max: 300 },
      { label: '300-400 pts', min: 300, max: 400 },
      { label: '400+ pts', min: 400, max: Infinity }
    ];
  }

  /**
   * Sort options
   */
  getSortOptions(): { label: string; value: string }[] {
    return [
      { label: 'Most Popular', value: 'popular' },
      { label: 'Highest Points', value: 'points-high' },
      { label: 'Lowest Points', value: 'points-low' },
      { label: 'Newest', value: 'newest' },
      { label: 'Oldest', value: 'oldest' }
    ];
  }

  /**
   * Fallback mock data (optional)
   */
  getMockChallenges(): Observable<Challenge[]> {
    const mock: Challenge[] = [
      {
        id: 'mock-1',
        title: 'Build a Responsive Dashboard',
        description: 'Create a fully responsive admin dashboard with charts.',
        difficulty: 'Intermediate',
        points: 250,
        participants: 1247,
        progress: 65,
        category: 'Web Development',
        status: 'Active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'mock-2',
        title: 'Design a Modern Landing Page',
        description: 'Landing page for a SaaS product.',
        difficulty: 'Beginner',
        points: 150,
        participants: 2893,
        category: 'UI/UX Design',
        status: 'Active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    return of(mock);
  }
}
