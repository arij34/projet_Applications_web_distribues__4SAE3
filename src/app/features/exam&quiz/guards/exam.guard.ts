import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ExamService } from '../services/exam.service';
import { AntiCheatingService } from '../services/anti-cheating.service';

@Injectable({
  providedIn: 'root'
})
export class ExamGuard implements CanActivate {
  constructor(
    private examService: ExamService,
    private antiCheatingService: AntiCheatingService,
    private router: Router
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const examId = route.paramMap.get('id');
    
    if (!examId) {
      console.error('No exam ID provided');
      this.router.navigate(['/exams']);
      return of(false);
    }

    // Verify exam exists and user can access it
    return this.examService.getExamById(examId).pipe(
      map(exam => {
        if (exam) {
          // Check exam status
          if (exam.status !== 'Active') {
            console.warn('Exam is not open for attempt');
            alert('This exam is no longer available for attempts');
            this.router.navigate(['/exams']);
            return false;
          }

          return true;
        } else {
          console.error('Exam not found');
          this.router.navigate(['/exams']);
          return false;
        }
      }),
      catchError(error => {
        console.error('Error accessing exam:', error);
        alert('Error accessing exam. Please try again.');
        this.router.navigate(['/exams']);
        return of(false);
      })
    );
  }
}
