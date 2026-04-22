import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { ApiExam } from '../../models/api.models';
import { ExamFormData } from '../../models/exam.model';
import { QuestionDetail, Answer } from '../../models/question.model';
import {
  mapAnswerToApi,
  mapFormToExamCreateApi,
  mapFormToExamSettingCreateApi,
  mapQuestionDetailToQuestionApi
} from '../../models/mappers';
import { ExamService } from '../../services/exam.service';
import { QuestionService } from '../../services/question.service';

interface Step {
  id: number;
  name: string;
}

@Component({
  selector: 'app-create-exam',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-exam.component.html',
  styleUrls: ['./create-exam.component.css']
})
export class CreateExamComponent implements OnInit {
  currentStep: number = 1;
  steps: Step[] = [
    { id: 1, name: 'Basic Info' },
    { id: 2, name: 'Questions' },
    { id: 3, name: 'Anti-Cheating' },
    { id: 4, name: 'Exam Settings' },
    { id: 5, name: 'Review' },
  ];

  formData: ExamFormData = {
    title: '',
    description: '',
    duration: 60,
    passingScore: 60,
    examType: 'Exam',
    maxAttempts: 1,
    showResult: false,
    oneQuestionPerPage: false,
    requireFullscreen: false,
    preventTabSwitch: false,
    preventCopyPaste: false,
    webcamRequired: false,
    autoSubmitOnTabSwitch: false,
    tabSwitchLimit: 2,
    ipRestriction: false,
    oneAttemptPerUser: true,
    deviceFingerprintRequired: false,
    enableSecureSessionToken: true,
    enableDeviceFingerprinting: true,
    suspiciousScoreThreshold: 12,
    autoSubmitOnHighScore: true,
    strictnessLevel: 'MEDIUM',
    detectScreenRecording: false,
    detectVpnProxy: false,
    minutesBetweenAttempts: 0,
    randomizeQuestions: false,
    randomizeAnswers: false,
    timedQuestions: false,
    autoGrade: false,
    instantFeedback: false,
    practiceMode: false,
  };

  questions: QuestionDetail[] = [];
  isSaving = false;
  saveError = '';
  saveSuccess = '';

  constructor(
    private readonly examService: ExamService,
    private readonly questionService: QuestionService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {}

  nextStep(): void {
    if (this.currentStep < this.steps.length) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  addQuestion(): void {
    const newQuestion: QuestionDetail = {
      id: Date.now().toString(),
      text: '',
      type: 'MCQ',
      difficultyLevel: 'MEDIUM',
      answers: [
        { id: '1', text: '', isCorrect: false },
        { id: '2', text: '', isCorrect: false },
      ],
    };
    this.questions.push(newQuestion);
  }

  removeQuestion(id: string): void {
    this.questions = this.questions.filter(q => q.id !== id);
  }

  addAnswer(questionId: string): void {
    const question = this.questions.find(q => q.id === questionId);
    if (question) {
      question.answers.push({
        id: Date.now().toString(),
        text: '',
        isCorrect: false
      });
    }
  }

  updateAnswerText(questionId: string, answerId: string, text: string): void {
    const question = this.questions.find(q => q.id === questionId);
    if (question) {
      const answer = question.answers.find(a => a.id === answerId);
      if (answer) {
        answer.text = text;
      }
    }
  }

  toggleCorrectAnswer(questionId: string, answerId: string): void {
    const question = this.questions.find(q => q.id === questionId);
    if (question) {
      question.answers.forEach(a => {
        a.isCorrect = a.id === answerId;
      });
    }
  }

  saveExam(): void {
    if (this.isSaving) return;
    this.saveError = '';
    this.saveSuccess = '';

    if (!this.formData.title.trim()) {
      this.saveError = 'Exam title is required.';
      return;
    }
    if (this.formData.passingScore < 0 || this.formData.passingScore > 100) {
      this.saveError = 'Passing score must be between 0 and 100.';
      return;
    }
    if (this.questions.length === 0) {
      this.saveError = 'Please add at least one question.';
      return;
    }

    this.isSaving = true;
    const examPayload = mapFormToExamCreateApi(this.formData);

    this.examService.createExam(examPayload).pipe(
      switchMap((createdExam: ApiExam) => {
        const examId = String(createdExam.id ?? '');
        if (!examId) {
          throw new Error('Exam created without an ID');
        }

        const settingPayload = mapFormToExamSettingCreateApi(this.formData, examId);
        const createSettings$ = this.examService.createExamSetting(settingPayload);

        const questionRequests = this.questions.map((question) => {
          const questionPayload = mapQuestionDetailToQuestionApi(question, examId);
          return this.questionService.createQuestion(questionPayload).pipe(
            switchMap((createdQuestion) => {
              const questionId = String(createdQuestion.id ?? '');
              if (!questionId) return of(null);

              const answerRequests = question.answers
                .filter((answer) => !!answer.text.trim())
                .map((answer: Answer) => this.questionService.createAnswer(mapAnswerToApi(answer, questionId)));

              if (answerRequests.length === 0) return of(null);
              return forkJoin(answerRequests).pipe(map(() => null));
            })
          );
        });

        const createQuestions$ = questionRequests.length > 0 ? forkJoin(questionRequests) : of([]);
        return forkJoin([createSettings$, createQuestions$]).pipe(map(() => createdExam));
      })
    ).subscribe({
      next: () => {
        this.isSaving = false;
        this.saveSuccess = 'Exam created successfully.';
        setTimeout(() => {
          void this.router.navigate(['/admin/exam-quiz/exams']);
        }, 600);
      },
      error: (err: Error) => {
        this.isSaving = false;
        this.saveError = err.message || 'Failed to create exam. Please try again.';
      }
    });
  }

  goBack(): void {
    void this.router.navigate(['/admin/exam-quiz/exams']);
  }
}