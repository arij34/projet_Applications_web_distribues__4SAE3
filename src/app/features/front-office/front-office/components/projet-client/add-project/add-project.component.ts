import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ProjectService } from '../../../../../../core/services/project.service';
import { AnalysisService, AnalysisResult } from '../../../../../../core/services/analysis.service';
import { AuthService } from '../../../../../../core/auth/auth.service';

export interface FormData {
  title: string;
  shortDescription: string;
  fullDescription: string;
  deadline: string;
  clientId: number;
  clientEmail: string;
    keycloakId: string; // 👈 ajouter
  budget: number;
}

export interface Step {
  number: number;
  title: string;
  description: string;
}

@Component({
  selector: 'app-add-project',
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.css']
})
export class AddProjectComponent implements OnInit, OnDestroy {

  currentStep = 1;
  successMessage = '';
  errorMessage = '';
  errors: Record<string, string> = {};

  analysisResult: AnalysisResult | null = null;
  isAnalyzing = false;
  analysisError = '';

  formData: FormData = {
    title: '',
    shortDescription: '',
    fullDescription: '',
    deadline: '',
    clientId: 0,      // ✅ valeur numérique, pas le type
    clientEmail: '',
    keycloakId: '',  
    budget: 5000
  };

  steps: Step[] = [
    { number: 1, title: 'Basic Info',  description: 'Title & Overview' },
    { number: 2, title: 'Details',     description: 'Full Specification' },
    { number: 3, title: 'AI Insights', description: 'Smart Analysis' },
    { number: 4, title: 'Review',      description: 'Final Check' }
  ];

  budgetValue = 5000;
  minDate = '';
  private subscriptions = new Subscription();

  constructor(
    private projectService: ProjectService,
    private analysisService: AnalysisService,  // ✅ virgule ajoutée
    private auth: AuthService
  ) {}

  ngOnInit(): void {
  this.minDate = new Date().toISOString().split('T')[0];
  const token: any = this.auth.getUserInfo();
  this.formData.keycloakId = token?.sub || '';
}

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // ── STEPPER ──
  isCompleted(step: Step): boolean { return this.currentStep > step.number; }
  isCurrent(step: Step): boolean   { return this.currentStep === step.number; }
  isUpcoming(step: Step): boolean  { return this.currentStep < step.number; }
  getProgressPercentage(): number  {
    return Math.round(((this.currentStep - 1) / (this.steps.length - 1)) * 100);
  }

  // ── GETTERS ──
  get titleValid(): boolean       { return this.formData.title.length >= 5; }
  get descriptionValid(): boolean { return this.formData.shortDescription.length >= 20; }
  get allValid(): boolean         { return this.titleValid && this.descriptionValid; }

  getDaysUntilDeadline(): number {
    if (!this.formData.deadline) return 0;
    const diff = new Date(this.formData.deadline).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  setPresetBudget(amount: number): void {
    this.budgetValue = amount;
    this.formData.budget = amount;
  }

  onFieldChange(event: { field: string; value: string | number }): void {
    (this.formData as any)[event.field] = event.value;
    if (this.errors[event.field]) delete this.errors[event.field];
  }

  // ── VALIDATION ──
  validateStep(): boolean {
    this.errors = {};
    if (this.currentStep === 1) {
      if (this.formData.title.length < 5)
        this.errors['title'] = 'Title must be at least 5 characters';
      if (this.formData.shortDescription.length < 20)
        this.errors['shortDescription'] = 'Description must be at least 20 characters';
    }
    if (this.currentStep === 2) {
      if (this.formData.fullDescription.length < 50)
        this.errors['fullDescription'] = 'Full description must be at least 50 characters';
      if (!this.formData.deadline)
        this.errors['deadline'] = 'Please select a deadline';
    }
    return Object.keys(this.errors).length === 0;
  }

  // ── NAVIGATION ──
  handleNext(): void {
    if (!this.validateStep()) return;
    if (this.currentStep === 2) {
      this.currentStep = 3;
      this.runAnalysis();
    } else {
      this.currentStep++;
    }
  }

  handlePrevious(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

  // ── ANALYSIS ──
  runAnalysis(): void {
    this.isAnalyzing = true;
    this.analysisError = '';
    this.analysisResult = null;

    this.analysisService.analyzeProject(
      this.formData.title,
      this.formData.fullDescription || this.formData.shortDescription,
      this.formData.deadline
    ).subscribe({
      next: (result: AnalysisResult) => {
        this.analysisResult = result;
        this.isAnalyzing = false;
      },
      error: (err: any) => {
        this.analysisError = 'Analysis service unavailable.';
        this.isAnalyzing = false;
        console.error(err);
      }
    });
  }

  // ── SCORE METHODS ──
  getGlobalScore(): number {
    if (!this.analysisResult) return 0;
    const riskPenalty     = this.analysisResult.risk.score * 5;
    const complexityBonus = this.analysisResult.complexity.multiplier * 10;
    const freelancerBonus = Math.min(this.analysisResult.freelancers.estimated_count / 2, 20);
    return Math.min(100, Math.max(0, Math.round(70 + complexityBonus - riskPenalty + freelancerBonus)));
  }

  getScoreColor(): string {
    const score = this.getGlobalScore();
    if (score >= 70) return '#16a34a';
    if (score >= 40) return '#f59e0b';
    return '#dc2626';
  }

  getScoreLabel(): string {
    const score = this.getGlobalScore();
    if (score >= 70) return 'High Feasibility';
    if (score >= 40) return 'Medium Feasibility';
    return 'Low Feasibility';
  }

  getSuccessProbability(): number {
    if (!this.analysisResult) return 0;
    const base = 60;
    const riskBonus = this.analysisResult.risk.level === 'Low'    ? 25 :
                      this.analysisResult.risk.level === 'Medium' ? 10 : -10;
    const freelancerBonus = this.analysisResult.freelancers.availability === 'High'   ? 15 :
                            this.analysisResult.freelancers.availability === 'Medium' ?  5 : -5;
    return Math.min(99, Math.max(10, base + riskBonus + freelancerBonus));
  }

  // ── SAVE DRAFT ──
  handleSaveDraft(): void {
    const project = {
      title: this.formData.title,
      description: this.formData.shortDescription,
      deadline: this.formData.deadline,
      clientId: this.formData.clientId,
      clientEmail: this.formData.clientEmail,
      keycloakId: this.formData.keycloakId,
      status: 'DRAFT'
    };
    this.projectService.addProject(project as any).subscribe({
      next: () => { this.successMessage = 'Projet sauvegardé comme brouillon !'; },
      error: () => { this.errorMessage = 'Erreur lors de la sauvegarde.'; }
    });
  }

  // ── PUBLISH ──
  handlePublish(): void {
    if (!this.validateStep()) return;

    const project = {
      title: this.formData.title,
      description: this.formData.fullDescription || this.formData.shortDescription,
      deadline: this.formData.deadline,
      clientId: this.formData.clientId,
      clientEmail: this.formData.clientEmail,
      keycloakId: this.formData.keycloakId,
      status: 'OPEN'
      
    };

    this.projectService.addProject(project as any).subscribe({
      next: (createdProject: any) => {
        if (this.analysisResult && this.analysisResult.skills.length > 0) {
          this.analysisService.saveProjectSkills(
            createdProject.id,
            this.analysisResult.skills
          ).subscribe();
        }
        if (this.analysisResult) {
          this.analysisService.saveProjectAnalysis(
            createdProject.id,
            this.analysisResult,
            this.getGlobalScore()
          ).subscribe();
        }
        this.successMessage = 'Projet publié avec succès !';
        this.resetForm();
      },
      error: () => { this.errorMessage = 'Erreur lors de la publication.'; }
    });
  }

  // ── RESET ──
  resetForm(): void {
    const token: any = this.auth.getUserInfo();
    this.formData = {
      title: '',
      shortDescription: '',
      fullDescription: '',
      deadline: '',
      clientId: 0,
      clientEmail: token?.email || '',
      keycloakId: token?.sub || '',
      budget: 5000
    };
    this.budgetValue = 5000;
    this.currentStep = 1;
    this.errors = {};
    this.analysisResult = null;
    this.successMessage = '';
    this.errorMessage = '';
  }
}