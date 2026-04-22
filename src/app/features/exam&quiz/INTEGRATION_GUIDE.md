# Angular 18 Admin Dashboard - Integration Guide

## Overview

This folder contains fully modular Angular 18 components converted from your React admin dashboard. Each component is self-contained with its own TypeScript, HTML, and CSS files.

## Quick Start

### 1. Copy Files to Your Project

Copy the entire `angular-admin` folder into your existing Angular project:

```
your-angular-project/
├── src/
│   └── app/
│       └── angular-admin/  ← Copy here
```

### 2. Import Components in Your Routing Module

In your `app.routes.ts` or routing configuration:

```typescript
import { Routes } from '@angular/router';
import { DashboardComponent } from './angular-admin/components/dashboard/dashboard.component';
import { ExamsComponent } from './angular-admin/components/exams/exams.component';
import { QuestionsComponent } from './angular-admin/components/questions/questions.component';
import { AttemptsComponent } from './angular-admin/components/attempts/attempts.component';
import { CheatingLogsComponent } from './angular-admin/components/cheating-logs/cheating-logs.component';
import { CreateExamComponent } from './angular-admin/components/create-exam/create-exam.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'exams', component: ExamsComponent },
  { path: 'exams/create', component: CreateExamComponent },
  { path: 'questions', component: QuestionsComponent },
  { path: 'attempts', component: AttemptsComponent },
  { path: 'cheating-logs', component: CheatingLogsComponent }
];
```

### 3. Use Standalone Components (Recommended)

All components are already configured as standalone components with the necessary imports. No need to add them to an NgModule!

### 4. Add to Your Main Layout

In your main layout component (e.g., `app.component.html`):

```html
<div class="main-layout">
  <!-- Your sidebar/navigation here -->
  <nav>
    <a routerLink="/dashboard">Dashboard</a>
    <a routerLink="/exams">Exams</a>
    <a routerLink="/questions">Questions</a>
    <a routerLink="/attempts">Attempts</a>
    <a routerLink="/cheating-logs">Cheating Logs</a>
  </nav>

  <!-- Router Outlet -->
  <main>
    <router-outlet></router-outlet>
  </main>
</div>
```

## Component Structure

### Dashboard Component
**Path:** `components/dashboard/dashboard.component.ts`

**Features:**
- Statistics cards
- Mock chart visualizations
- Recent activities feed

**Usage:**
```typescript
import { DashboardComponent } from './angular-admin/components/dashboard/dashboard.component';
```

### Exams Component
**Path:** `components/exams/exams.component.ts`

**Features:**
- Exam list with filtering
- Search functionality
- Type and status filters
- CRUD operations

**Usage:**
```typescript
import { ExamsComponent } from './angular-admin/components/exams/exams.component';
```

### Questions Component
**Path:** `components/questions/questions.component.ts`

**Features:**
- Question bank management
- Type-based filtering
- Search across questions and exams

**Usage:**
```typescript
import { QuestionsComponent } from './angular-admin/components/questions/questions.component';
```

### Attempts Component
**Path:** `components/attempts/attempts.component.ts`

**Features:**
- Attempt monitoring
- Score visualization
- Status filtering
- Suspicious event tracking

**Usage:**
```typescript
import { AttemptsComponent } from './angular-admin/components/attempts/attempts.component';
```

### Cheating Logs Component
**Path:** `components/cheating-logs/cheating-logs.component.ts`

**Features:**
- Security event monitoring
- Severity-based statistics
- Event type filtering
- Detailed activity logs

**Usage:**
```typescript
import { CheatingLogsComponent } from './angular-admin/components/cheating-logs/cheating-logs.component';
```

### Create Exam Component
**Path:** `components/create-exam/create-exam.component.ts`

**Features:**
- Multi-step wizard (5 steps)
- Question builder
- Anti-cheating settings
- Quiz flow configuration
- Review before submission

**Usage:**
```typescript
import { CreateExamComponent } from './angular-admin/components/create-exam/create-exam.component';
```

## Services

All components use dedicated services for data management:

### ExamService
```typescript
import { ExamService } from './angular-admin/services/exam.service';

// In your component
constructor(private examService: ExamService) {}

// Get all exams
this.examService.getExams().subscribe(exams => {
  console.log(exams);
});
```

### QuestionService
```typescript
import { QuestionService } from './angular-admin/services/question.service';
```

### AttemptService
```typescript
import { AttemptService } from './angular-admin/services/attempt.service';
```

### CheatingLogService
```typescript
import { CheatingLogService } from './angular-admin/services/cheating-log.service';
```

## Models

All TypeScript interfaces are defined in the `models` folder:

```typescript
import { Exam, ExamFormData } from './angular-admin/models/exam.model';
import { Question, QuestionDetail, Answer } from './angular-admin/models/question.model';
import { Attempt } from './angular-admin/models/attempt.model';
import { CheatingLog, EventType, CheatingStats } from './angular-admin/models/cheating-log.model';
```

## Replacing Mock Data with Real API

To connect to your backend API, modify the services:

### Example: ExamService with HTTP

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Exam } from '../models/exam.model';

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  private apiUrl = 'https://your-api.com/api';

  constructor(private http: HttpClient) {}

  getExams(): Observable<Exam[]> {
    return this.http.get<Exam[]>(`${this.apiUrl}/exams`);
  }

  getExamById(id: string): Observable<Exam> {
    return this.http.get<Exam>(`${this.apiUrl}/exams/${id}`);
  }

  createExam(exam: Partial<Exam>): Observable<Exam> {
    return this.http.post<Exam>(`${this.apiUrl}/exams`, exam);
  }

  updateExam(id: string, exam: Partial<Exam>): Observable<Exam> {
    return this.http.put<Exam>(`${this.apiUrl}/exams/${id}`, exam);
  }

  deleteExam(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/exams/${id}`);
  }
}
```

Don't forget to add `HttpClient` to your providers in `app.config.ts`:

```typescript
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient()
  ]
};
```

## Styling

All components use scoped CSS. The color scheme is:

- **Primary:** `#4483f3`
- **Background:** `#faf8f5` (beige/nude)
- **Success:** `#10b981`
- **Warning:** `#f59e0b`
- **Danger:** `#dc3545`
- **Text:** Neutral grays

### Global Styles (Optional)

If you want to add global styles, add this to your `styles.css`:

```css
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  background: #faf8f5;
  margin: 0;
  padding: 0;
}
```

## Navigation Integration

To integrate with your existing navigation:

### Option 1: Use RouterLink

```html
<nav class="sidebar">
  <a routerLink="/dashboard" routerLinkActive="active">
    Dashboard
  </a>
  <a routerLink="/exams" routerLinkActive="active">
    Exams
  </a>
  <a routerLink="/questions" routerLinkActive="active">
    Questions
  </a>
  <a routerLink="/attempts" routerLinkActive="active">
    Attempts
  </a>
  <a routerLink="/cheating-logs" routerLinkActive="active">
    Cheating Logs
  </a>
</nav>
```

### Option 2: Programmatic Navigation

```typescript
import { Router } from '@angular/router';

constructor(private router: Router) {}

navigateToExams() {
  this.router.navigate(['/exams']);
}
```

## Testing

Each component can be tested individually:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExamsComponent } from './exams.component';
import { ExamService } from '../../services/exam.service';

describe('ExamsComponent', () => {
  let component: ExamsComponent;
  let fixture: ComponentFixture<ExamsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ExamsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

## Troubleshooting

### Issue: Components not displaying

**Solution:** Make sure you've imported `CommonModule` and `FormsModule` in each component. All components already include these imports.

### Issue: Routing not working

**Solution:** Ensure you've configured routes properly and imported `RouterModule` or used `provideRouter` in your `app.config.ts`.

### Issue: Styling issues

**Solution:** Check that component CSS files are properly linked in the `styleUrls` array of each component.

## File Structure Reference

```
angular-admin/
├── components/
│   ├── dashboard/
│   │   ├── dashboard.component.ts
│   │   ├── dashboard.component.html
│   │   └── dashboard.component.css
│   ├── exams/
│   │   ├── exams.component.ts
│   │   ├── exams.component.html
│   │   └── exams.component.css
│   ├── questions/
│   │   ├── questions.component.ts
│   │   ├── questions.component.html
│   │   └── questions.component.css
│   ├── attempts/
│   │   ├── attempts.component.ts
│   │   ├── attempts.component.html
│   │   └── attempts.component.css
│   ├── cheating-logs/
│   │   ├── cheating-logs.component.ts
│   │   ├── cheating-logs.component.html
│   │   └── cheating-logs.component.css
│   └── create-exam/
│       ├── create-exam.component.ts
│       ├── create-exam.component.html
│       └── create-exam.component.css
├── models/
│   ├── exam.model.ts
│   ├── question.model.ts
│   ├── attempt.model.ts
│   └── cheating-log.model.ts
├── services/
│   ├── exam.service.ts
│   ├── question.service.ts
│   ├── attempt.service.ts
│   └── cheating-log.service.ts
├── README.md
└── INTEGRATION_GUIDE.md
```

## Support

All components are self-contained and follow Angular 18 best practices. They use:
- **Standalone Components** - No NgModule required
- **TypeScript Strict Mode** - Fully typed
- **Reactive Programming** - RxJS Observables
- **OnPush Change Detection** - Can be enabled for better performance

## Next Steps

1. Copy the `angular-admin` folder to your project
2. Configure routing in `app.routes.ts`
3. Replace mock data in services with your API calls
4. Customize styling as needed
5. Add authentication guards if required

Happy coding! 🚀
