import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../../../../core/services/project.service';
import { AnalysisService } from '../../../../../core/services/analysis.service';
import { SavedProjectService } from '../../../../../core/services/saved-project.service';
import { ProposalService } from '../../../../../core/services/proposal.service';
import { AuthService } from '../../../../../core/auth/auth.service'; // ← AJOUT
import { Project } from '../../../../../core/models/project.model';

@Component({
  selector: 'app-projet-freelancer-detail',
  templateUrl: './projet-freelancer-detail.component.html',
  styleUrls: ['./projet-freelancer-detail.component.css']
})
export class ProjetFreelancerDetailComponent implements OnInit {

  project: Project | null = null;
  analysis: any = null;
  isLoading: boolean = true;
  errorMessage: string = '';
  clientStats: { totalProjects: number; completedProjects: number } | null = null;

  // Save project
  freelancerId: number = 1;
  keycloakId: string = '';             // ← AJOUT
  isSaved: boolean = false;
  isSaving: boolean = false;
  saveMessage: string = '';

  // Proposal
  hasProposal: boolean = false;
  proposalStatus: string = '';
  isSubmitting: boolean = false;
  submitMessage: string = '';
  submitError: string = '';
  proposalCount: number = 0;
  today: string = new Date().toISOString().split('T')[0];

  proposalForm = {
    bidAmount:        '',
    deliveryWeeks:    '',
    availableFrom:    '',
    portfolioUrl:     '',
    coverLetter:      '',
    questionToClient: ''
  };

  proposalErrors: Record<string, string> = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private analysisService: AnalysisService,
    private savedProjectService: SavedProjectService,
    private proposalService: ProposalService,
    private authService: AuthService  // ← AJOUT
  ) {}

 ngOnInit(): void {
  this.authService.getAccessToken().then(() => {
    this.keycloakId = this.authService.getKeycloakSub();
    const storedId = localStorage.getItem('userId') || localStorage.getItem('freelancerId');
    if (storedId) this.freelancerId = +storedId;

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.projectService.getProjectById(+id).subscribe({
        next: (data: Project) => {
          this.project = data;
          this.isLoading = false;
          this.loadClientStats(data.clientId);
          this.checkIfSaved();
          this.checkProposal();
          this.loadProposalCount();
          this.analysisService.getProjectAnalysis(+id).subscribe({
            next: (a: any) => { this.analysis = a; },
            error: () => { this.analysis = null; }
          });
        },
        error: () => {
          this.errorMessage = 'Project not found.';
          this.isLoading = false;
        }
      });
    }
  });
}

  loadClientStats(clientId: number): void {
    this.projectService.getProjectsByClient(clientId).subscribe({
      next: (projects: Project[]) => {
        this.clientStats = {
          totalProjects:     projects.filter((p: Project) => p.status !== 'DRAFT').length,
          completedProjects: projects.filter((p: Project) => p.status === 'COMPLETED').length
        };
      },
      error: () => {
        this.clientStats = { totalProjects: 0, completedProjects: 0 };
      }
    });
  }

  // ── SAVE ──
  checkIfSaved(): void {
    if (!this.project?.id) return;
    // ← utilise keycloakId si disponible, sinon fallback freelancerId
    if (this.keycloakId) {
      this.savedProjectService.checkSavedByKeycloak(this.keycloakId, this.project.id).subscribe({
        next: (res) => { this.isSaved = res.saved; },
        error: () => {}
      });
    } else {
      this.savedProjectService.checkSaved(this.freelancerId, this.project.id).subscribe({
        next: (res) => { this.isSaved = res.saved; },
        error: () => {}
      });
    }
  }

  toggleSave(): void {
    if (!this.project?.id) return;
    this.isSaving = true;
    this.saveMessage = '';

    if (this.isSaved) {
      this.savedProjectService.unsaveProjectByKeycloak(this.keycloakId, this.project.id).subscribe({
        next: () => {
          this.isSaved     = false;
          this.isSaving    = false;
          this.saveMessage = 'removed';
          setTimeout(() => this.saveMessage = '', 2500);
        },
        error: () => { this.isSaving = false; }
      });
    } else {
      this.savedProjectService.saveProjectByKeycloak(this.keycloakId, this.project.id).subscribe({
        next: () => {
          this.isSaved     = true;
          this.isSaving    = false;
          this.saveMessage = 'saved';
          setTimeout(() => this.saveMessage = '', 2500);
        },
        error: () => { this.isSaving = false; }
      });
    }
  }

  // ── PROPOSAL ──
  checkProposal(): void {
    if (!this.project?.id) return;
    if (this.keycloakId) {
      this.proposalService.checkByKeycloak(this.project.id, this.keycloakId).subscribe({
        next: (res) => {
          this.hasProposal    = res.hasProposal;
          this.proposalStatus = res.status || '';
        },
        error: () => {}
      });
    } else {
      this.proposalService.check(this.project.id, this.freelancerId).subscribe({
        next: (res) => {
          this.hasProposal    = res.hasProposal;
          this.proposalStatus = res.status || '';
        },
        error: () => {}
      });
    }
  }

  loadProposalCount(): void {
    if (!this.project?.id) return;
    this.proposalService.countProposals(this.project.id).subscribe({
      next: (res) => { this.proposalCount = res.count; },
      error: () => {}
    });
  }

  validateProposal(): boolean {
    this.proposalErrors = {};
    if (!this.proposalForm.bidAmount || +this.proposalForm.bidAmount <= 0)
      this.proposalErrors['bid'] = 'Please enter a valid bid amount.';
    if (!this.proposalForm.deliveryWeeks || +this.proposalForm.deliveryWeeks <= 0)
      this.proposalErrors['weeks'] = 'Please enter delivery time in weeks.';
    if (!this.proposalForm.coverLetter || this.proposalForm.coverLetter.length < 50)
      this.proposalErrors['cover'] = 'Cover letter must be at least 50 characters.';
    return Object.keys(this.proposalErrors).length === 0;
  }

  submitProposal(): void {
    if (!this.validateProposal()) return;
    this.isSubmitting = true;
    this.submitError  = '';

    const payload: any = {
      projectId:        this.project!.id,
      freelancerId:     this.freelancerId,
      bidAmount:        +this.proposalForm.bidAmount,
      deliveryWeeks:    +this.proposalForm.deliveryWeeks,
      availableFrom:    this.proposalForm.availableFrom || null,
      portfolioUrl:     this.proposalForm.portfolioUrl  || null,
      coverLetter:      this.proposalForm.coverLetter,
      questionToClient: this.proposalForm.questionToClient || null
    };
    if (this.keycloakId) payload.freelancerKeycloakId = this.keycloakId;

    this.proposalService.submit(payload).subscribe({
      next: () => {
        this.hasProposal    = true;
        this.proposalStatus = 'PENDING';
        this.isSubmitting   = false;
        this.submitMessage  = 'success';
        this.proposalCount++;
      },
      error: (err) => {
        this.submitError  = err.error?.error || 'Error submitting proposal.';
        this.isSubmitting = false;
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'ACCEPTED':  return '#16a34a';
      case 'REJECTED':  return '#dc2626';
      case 'WITHDRAWN': return '#64748b';
      default:          return '#d97706';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'ACCEPTED':  return '✅';
      case 'REJECTED':  return '❌';
      case 'WITHDRAWN': return '↩️';
      default:          return '⏳';
    }
  }

  goBack(): void {
    this.router.navigate(['/front-office/discover']);
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: '2-digit', year: 'numeric'
    });
  }

  getDaysLeft(deadline: string | undefined): number {
    if (!deadline) return 0;
    return Math.ceil(
      (new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  getProgressValue(status: string | undefined): number {
    switch (status) {
      case 'COMPLETED':   return 100;
      case 'IN_PROGRESS': return 60;
      case 'OPEN':        return 20;
      default:            return 5;
    }
  }

  getProgressOffset(): number {
    return 283 - (283 * this.getProgressValue(this.project?.status) / 100);
  }

  getRiskColor(level: string): string {
    switch (level?.toLowerCase()) {
      case 'low':    return '#16a34a';
      case 'medium': return '#d97706';
      case 'high':   return '#dc2626';
      default:       return '#64748b';
    }
  }

  getRiskBg(level: string): string {
    switch (level?.toLowerCase()) {
      case 'low':    return '#dcfce7';
      case 'medium': return '#fef3c7';
      case 'high':   return '#fee2e2';
      default:       return '#f1f5f9';
    }
  }

  getComplexityColor(level: string): string {
    switch (level?.toLowerCase()) {
      case 'low':    return '#16a34a';
      case 'medium': return '#d97706';
      case 'high':   return '#dc2626';
      default:       return '#2563eb';
    }
  }

  getComplexityBg(level: string): string {
    switch (level?.toLowerCase()) {
      case 'low':    return '#dcfce7';
      case 'medium': return '#fef3c7';
      case 'high':   return '#fee2e2';
      default:       return '#eff6ff';
    }
  }
}