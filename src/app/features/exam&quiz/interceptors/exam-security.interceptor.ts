import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AntiCheatingService } from '../services/anti-cheating.service';
import { Router } from '@angular/router';

@Injectable()
export class ExamSecurityInterceptor implements HttpInterceptor {
  constructor(
    private antiCheatingService: AntiCheatingService,
    private router: Router
  ) { }

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Only apply to exam-related endpoints
    if (!request.url.includes('/exam-sessions') && !request.url.includes('/exams') && !request.url.includes('/questions')) {
      return next.handle(request);
    }

    // Add session token to requests
    const sessionToken = this.antiCheatingService.getSessionToken();
    
    if (sessionToken && (request.url.includes('/exam-sessions/submit') || 
        request.url.includes('/exam-sessions/save-answer') ||
        request.url.includes('/exam-sessions/report-event'))) {
      
      // Clone request and add security headers
      request = request.clone({
        setHeaders: {
          'X-Session-Token': sessionToken,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle specific error codes
        if (error.status === 401) {
          // Session token invalid or expired
          console.warn('Session token invalid or expired');
          alert('Your exam session has expired. Please start a new exam.');
          this.antiCheatingService.stopExamMonitoring();
          this.router.navigate(['/exams']);
        } else if (error.status === 403) {
          // Forbidden - likely due to anti-cheating violation
          console.error('Access forbidden - possible cheating detected');
          alert('Your exam session has been terminated due to suspicious activity.');
          this.antiCheatingService.stopExamMonitoring();
          this.router.navigate(['/exams']);
        } else if (error.status === 429) {
          // Too many requests - rate limiting
          console.warn('Rate limit exceeded');
          alert('Too many requests. Please wait before trying again.');
        }

        return throwError(() => error);
      })
    );
  }
}
