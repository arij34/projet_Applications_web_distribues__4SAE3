import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExamQuizShellComponent } from './exam-quiz-shell.component';

const routes: Routes = [
  {
    path: '',
    component: ExamQuizShellComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'exams',
        loadComponent: () =>
          import('./components/exams/exams.component').then((m) => m.ExamsComponent)
      },
      {
        path: 'exams/create',
        loadComponent: () =>
          import('./components/create-exam/create-exam.component').then((m) => m.CreateExamComponent)
      },
      {
        path: 'exams/:id',
        loadComponent: () =>
          import('./components/exam-detail/exam-detail.component').then((m) => m.ExamDetailComponent)
      },
      {
        path: 'questions',
        loadComponent: () =>
          import('./components/questions/questions.component').then((m) => m.QuestionsComponent)
      },
      {
        path: 'attempts',
        loadComponent: () =>
          import('./components/attempts/attempts.component').then((m) => m.AttemptsComponent)
      },
      {
        path: 'cheating-logs',
        loadComponent: () =>
          import('./components/cheating-logs/cheating-logs.component').then((m) => m.CheatingLogsComponent)
      },
      // ── Freelancer Exam Flow ──────────────────────────────────────────────
      {
        path: 'freelancer/exams',
        loadComponent: () =>
          import('./components/freelancer-exam-catalog/freelancer-exam-catalog.component').then((m) => m.FreelancerExamCatalogComponent)
      },
      {
        path: 'freelancer/exams/:id/take',
        loadComponent: () =>
          import('./components/freelancer-exam-session/freelancer-exam-session.component').then((m) => m.FreelancerExamSessionComponent)
      },
      {
        path: 'freelancer/exams/:id/result',
        loadComponent: () =>
          import('./components/freelancer-exam-result/freelancer-exam-result.component').then((m) => m.FreelancerExamResultComponent)
      },
      {
        path: 'freelancer/exams/:id',
        loadComponent: () =>
          import('./components/freelancer-exam-preview/freelancer-exam-preview.component').then((m) => m.FreelancerExamPreviewComponent)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ExamQuizRoutingModule {}
