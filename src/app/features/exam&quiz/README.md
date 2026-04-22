# Angular 18 Admin Dashboard Components

This folder contains Angular 18 modular components converted from the React admin dashboard.

## Structure

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
└── services/
    ├── exam.service.ts
    ├── question.service.ts
    ├── attempt.service.ts
    └── cheating-log.service.ts
```

## Installation

### Prerequisites
- Angular 18
- Node.js 18+
- npm or yarn

### Integration Steps

1. Copy the `angular-admin` folder into your existing Angular project
2. Import required modules in your app module or standalone components
3. Add required dependencies:

```bash
npm install lucide-angular
npm install recharts
```

4. Import components in your routing module:

```typescript
import { DashboardComponent } from './angular-admin/components/dashboard/dashboard.component';
import { ExamsComponent } from './angular-admin/components/exams/exams.component';
// ... other imports
```

5. Configure routes:

```typescript
const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'exams', component: ExamsComponent },
  { path: 'questions', component: QuestionsComponent },
  { path: 'attempts', component: AttemptsComponent },
  { path: 'cheating-logs', component: CheatingLogsComponent },
  { path: 'exams/create', component: CreateExamComponent }
];
```

## Features

- **Modular Architecture**: Each feature is a standalone component
- **TypeScript**: Fully typed models and interfaces
- **Responsive Design**: Mobile-first approach
- **Professional UI**: Corporate design with primary color #4483f3
- **Real-time Filtering**: Search and filter functionality
- **Anti-Cheating Features**: Comprehensive security monitoring

## Component Details

### Dashboard
- Overview statistics
- Charts and graphs (attempts, exam types, cheating events)
- Recent activities feed

### Exams Management
- List all exams with filtering
- Search functionality
- Status badges (Active, Draft, Archived)
- CRUD operations

### Questions Management
- Question bank management
- Multiple question types (MCQ, True/False, Short Answer)
- Linked to exams

### Attempts Monitoring
- Track all exam attempts
- Score visualization
- Suspicious event tracking
- Real-time status

### Cheating Logs
- Security event monitoring
- Severity levels (Low, Medium, High, Critical)
- Event type filtering
- Detailed activity logs

### Create Exam
- Multi-step wizard
- Question builder
- Anti-cheating settings
- Quiz flow configuration

## Color Scheme

- Primary: `#4483f3`
- Background: Beige/nude tones
- Text: Neutral grays
- Success: `#10b981`
- Warning: `#f59e0b`
- Danger: `#dc3545`

## Notes

- All components are standalone and can be integrated individually
- Mock data is included for testing
- Services use observables for reactive data handling
- Components follow Angular 18 best practices
