import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../../../../core/services/project.service';
import { AnalysisService } from '../../../../../core/services/analysis.service';
import { Project } from '../../../../../core/models/project.model';

export interface ProjectAnalysis {
  id: number;
  budgetMin: number;
  budgetMax: number;
  budgetRecommended: number;
  hourlyRateAvg: number;
  durationMinWeeks: number;
  durationMaxWeeks: number;
  durationEstimatedWeeks: number;
  durationWarning: string | null;
  complexityLevel: string;
  complexityScore: number;
  riskLevel: string;
  riskScore: number;
  riskFactors: string;
  riskAdvice: string;
  platformRevenue: number;
  freelancerProfit: number;
  netProjectCost: number;
  freelancersEstimatedCount: number;
  freelancersAvailability: string;
  feasibilityScore: number;
}

@Component({
  selector: 'app-projet-detail',
  templateUrl: './projet-detail.component.html',
  styleUrls: ['./projet-detail.component.css']
})
export class ProjetDetailComponent implements OnInit {

  project: Project | null = null;
  analysis: ProjectAnalysis | null = null;
  isLoading = true;
  isLoadingAnalysis = false;
  errorMessage = '';

  statusConfig: Record<string, { label: string; cssClass: string; color: string }> = {
    DRAFT:       { label: 'Draft',       cssClass: 'badge-draft',     color: '#6b7280' },
    OPEN:        { label: 'Open',        cssClass: 'badge-open',      color: '#2563eb' },
    IN_PROGRESS: { label: 'In Progress', cssClass: 'badge-progress',  color: '#d97706' },
    COMPLETED:   { label: 'Completed',   cssClass: 'badge-completed', color: '#16a34a' }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private analysisService: AnalysisService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.projectService.getProjectById(+id).subscribe({
        next: (data: Project) => {
          this.project = data;
          this.isLoading = false;
          this.loadAnalysis(+id);
        },
        error: () => {
          this.errorMessage = 'Project not found.';
          this.isLoading = false;
        }
      });
    }
  }

  loadAnalysis(projectId: number): void {
    this.isLoadingAnalysis = true;
    this.analysisService.getProjectAnalysis(projectId).subscribe({
      next: (data: ProjectAnalysis) => {
        this.analysis = data;
        this.isLoadingAnalysis = false;
      },
      error: () => {
        // Pas d'analyse disponible pour ce projet
        this.isLoadingAnalysis = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/front-office/projects']);
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  formatDateTime(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  }

  getDaysLeft(deadline: string | undefined): number {
    if (!deadline) return 0;
    return Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  }

  getProgressValue(status: string | undefined): number {
    switch (status) {
      case 'COMPLETED':   return 100;
      case 'IN_PROGRESS': return 60;
      case 'OPEN':        return 20;
      default:            return 5;
    }
  }

  getRiskColor(): string {
    if (!this.analysis) return '#6b7280';
    switch (this.analysis.riskLevel) {
      case 'Low':    return '#16a34a';
      case 'Medium': return '#d97706';
      case 'High':   return '#dc2626';
      default:       return '#6b7280';
    }
  }

  getFeasibilityColor(): string {
    if (!this.analysis) return '#6b7280';
    const s = this.analysis.feasibilityScore;
    if (s >= 70) return '#16a34a';
    if (s >= 40) return '#d97706';
    return '#dc2626';
  }

  getFeasibilityLabel(): string {
    if (!this.analysis) return '';
    const s = this.analysis.feasibilityScore;
    if (s >= 70) return 'High Feasibility';
    if (s >= 40) return 'Medium Feasibility';
    return 'Low Feasibility';
  }

  getRiskFactorsArray(): string[] {
    if (!this.analysis?.riskFactors) return [];
    return this.analysis.riskFactors.split(';').filter(f => f.trim() !== '');
  }

  getComplexityColor(): string {
    if (!this.analysis) return '#6b7280';
    switch (this.analysis.complexityLevel) {
      case 'Simple':     return '#16a34a';
      case 'Medium':     return '#2563eb';
      case 'Complex':    return '#d97706';
      case 'Enterprise': return '#dc2626';
      default:           return '#6b7280';
    }
  }

  // Calcule le dashoffset pour un cercle SVG (r=54, circumference=339.3)
  getCircleDash(percent: number): number {
    const circumference = 2 * Math.PI * 54;
    return circumference - (circumference * percent / 100);
  }
}