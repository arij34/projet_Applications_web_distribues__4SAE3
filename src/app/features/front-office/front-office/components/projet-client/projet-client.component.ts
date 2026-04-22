import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProjectService } from '../../../../../core/services/project.service';
import { AnalysisService, AnalysisResult } from '../../../../../core/services/analysis.service';
import { ProposalService } from '../../../../../core/services/proposal.service';
import { Project } from '../../../../../core/models/project.model';
import { AuthService } from '../../../../../core/auth/auth.service';
@Component({
  selector: 'app-projet-client',
  templateUrl: './projet-client.component.html',
  styleUrls: ['./projet-client.component.css']
})
export class ProjetClientComponent implements OnInit {

  projects: Project[] = [];
  filteredProjects: Project[] = [];
  searchQuery: string = '';
  filterStatus: string = 'ALL';
  sortBy: string = 'newest';
  isLoading: boolean = true;
  errorMessage: string = '';
  clientKeycloakId: string = '';

  get clientId(): number {
    const id = localStorage.getItem('userId') || localStorage.getItem('clientId');
    return id ? +id : 1;
  }
  today: string = new Date().toISOString().split('T')[0];

  // ── Phases IA par projet ───────────────────────────
  private projectPhases: Record<number, string> = {};

  statusConfig: Record<string, { label: string; cssClass: string }> = {
    DRAFT:       { label: 'Draft',       cssClass: 'status-draft' },
    OPEN:        { label: 'Open',        cssClass: 'status-open' },
    IN_PROGRESS: { label: 'In Progress', cssClass: 'status-progress' },
    COMPLETED:   { label: 'Completed',   cssClass: 'status-completed' }
  };

  // Delete
  showDeleteModal: boolean = false;
  projectToDelete: Project | null = null;
  isDeleting: boolean = false;
  deleteMessage: string = '';
  isDraftDelete: boolean = false;

  // Toast
  showToast: boolean = false;
  toastMessage: string = '';

  // Edit
  showEditModal: boolean = false;
  projectToEdit: Project | null = null;
  editForm = { title: '', description: '', deadline: '', status: '' };
  editErrors: Record<string, string> = {};
  isUpdating: boolean = false;
  updateError: string = '';

  // Re-analyse
  isReanalyzing: boolean = false;
  reanalysisResult: AnalysisResult | null = null;
  analysisOutdated: boolean = false;
  private originalTitle: string = '';
  private originalDescription: string = '';
  private reanalysisTimer: any = null;
 
  showAddForm: boolean = false;

  // Proposals
  showProposalsModal: boolean = false;
  selectedProjectForProposals: Project | null = null;
  proposals: any[] = [];
  isLoadingProposals: boolean = false;
  proposalsFilter: string = 'ALL';
  updatingProposalId: number | null = null;

  constructor(
    private projectService: ProjectService,
    private analysisService: AnalysisService,
    private proposalService: ProposalService,
    private router: Router,
    private http: HttpClient,
    private auth: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const token: any = this.auth.getUserInfo();
    const keycloakId = token?.sub;

    if (!keycloakId) {
      this.errorMessage = 'Error loading projects.';
      this.isLoading = false;
      return;
    }

    // ← stocker le keycloakId pour l'utiliser dans loadProposals
    this.clientKeycloakId = keycloakId;

    this.http.get<Project[]>(`http://localhost:8085/projects/client/by-keycloak/${keycloakId}`)
      .subscribe({
        next: (data: Project[]) => {
          this.projects = data;
          this.applyFilters();
          this.isLoading = false;
          this.loadAllPhases();
        },
        error: () => {
          this.errorMessage = 'Error loading projects.';
          this.isLoading = false;
        }
      });
  }

  private loadProjectsByEmail(email: string): void {
    this.http.get<Project[]>(`http://localhost:8077/projects/client/by-email/${email}`)
      .subscribe({
        next: (data: Project[]) => {
          this.projects = data;
          this.applyFilters();
          this.isLoading = false;
          this.loadAllPhases();
        },
        error: (err) => {
          console.error('❌ Erreur:', err);
          this.errorMessage = 'Error loading projects.';
          this.isLoading = false;
        }
      });
  }

  loadProjects(): void {
    this.isLoading = true;
    this.projectService.getProjectsByClient(this.clientId).subscribe({
      next: (data: Project[]) => {
        this.projects = data;
        this.applyFilters();
        this.isLoading = false;
        this.loadAllPhases();
      },
      error: () => {
        this.errorMessage = 'Error loading projects.';
        this.isLoading = false;
      }
    });
  }

  // ── PHASES IA ─────────────────────────────────────

  private loadAllPhases(): void {
    this.projects.forEach(p => {
      if (!p.id) return;
      this.http.get<{ phase: string }>(
        `http://localhost:8085/chat/${p.id}/phase`
      ).subscribe({
        next: (res) => {
          if (res.phase) {
            this.projectPhases[p.id!] = res.phase;

            const project = this.projects.find(proj => proj.id === p.id);
            if (project) {
              if (res.phase === 'CLOTURE') {
                project.status = 'COMPLETED';
              } else if (['ETUDE', 'DEVELOPPEMENT', 'TEST', 'DEPLOIEMENT'].includes(res.phase)) {
                project.status = 'IN_PROGRESS';
              }
            }

            this.applyFilters();
          }
        },
        error: () => {}
      });
    });
  }

  getProgressValue(projectId: number | undefined, status: string | undefined): number {
    if (projectId) {
      const phase = this.projectPhases[projectId];
      if (phase) {
        switch (phase) {
          case 'ETUDE':         return 20;
          case 'DEVELOPPEMENT': return 50;
          case 'TEST':          return 75;
          case 'DEPLOIEMENT':   return 90;
          case 'CLOTURE':       return 100;
          default:              return 0;
        }
      }
    }
    switch (status) {
      case 'COMPLETED':   return 100;
      case 'IN_PROGRESS': return 60;
      case 'OPEN':        return 20;
      default:            return 5;
    }
  }

  // ── NAVIGATION ────────────────────────────────────

  viewProject(id: number | undefined): void {
    if (id) this.router.navigate(['/front-office/projects', id]);
  }

  goToWorkspace(project: Project): void {
    if (!project?.id) return;
    const clientId = project.clientId ?? this.clientId;
    this.router.navigate(
      ['/front-office/projects', project.id, 'workspace'],
      {
        queryParams: {
          role: 'CLIENT',
          userId: clientId,
          name: localStorage.getItem('userName') || 'Client'
        }
      }
    );
  }

  onProjectAdded(): void {
    this.showAddForm = false;
    this.loadProjects();
  }

  // ── FILTERS ───────────────────────────────────────

  applyFilters(): void {
    let result = [...this.projects];
    if (this.searchQuery) {
      result = result.filter(p =>
        p.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
    if (this.filterStatus !== 'ALL') {
      result = result.filter(p => p.status === this.filterStatus);
    }
    result.sort((a, b) => {
      if (this.sortBy === 'deadline') {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    });
    this.filteredProjects = result;
  }

  onSearchChange(): void { this.applyFilters(); }
  onFilterChange(): void { this.applyFilters(); }
  onSortChange(): void   { this.applyFilters(); }

  get totalProjects():      number { return this.projects.length; }
  get openProjects():       number { return this.projects.filter(p => p.status === 'OPEN').length; }
  get completedProjects():  number { return this.projects.filter(p => p.status === 'COMPLETED').length; }
  get inProgressProjects(): number { return this.projects.filter(p => p.status === 'IN_PROGRESS').length; }

  // ── FORMATTERS ────────────────────────────────────

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: '2-digit', year: 'numeric'
    });
  }

  formatDateTime(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  goToStats(): void {
    const cid = this.projects[0]?.clientId ?? this.clientId;
    this.router.navigate(['/front-office/stats'], { queryParams: { clientId: cid } });
  }

  // ── TOAST ─────────────────────────────────────────

  showSuccessToast(message: string): void {
    this.toastMessage = message;
    this.showToast    = true;
    setTimeout(() => { this.showToast = false; }, 3500);
  }

  // ── DELETE ────────────────────────────────────────

  openDeleteModal(project: Project): void {
    this.projectToDelete = project;
    this.isDraftDelete   = project.status === 'DRAFT';
    this.showDeleteModal = true;
    this.deleteMessage   = '';
    document.body.style.overflow = 'hidden';
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.projectToDelete = null;
    this.deleteMessage   = '';
    document.body.style.overflow = '';
  }

  confirmDelete(): void {
    if (!this.projectToDelete?.id) return;
    this.isDeleting = true;

    if (this.isDraftDelete) {
      this.projectService.deleteProject(this.projectToDelete.id!).subscribe({
        next: () => {
          this.projects = this.projects.filter(p => p.id !== this.projectToDelete!.id);
          this.applyFilters();
          this.isDeleting = false;
          this.closeDeleteModal();
          this.showSuccessToast('Project deleted successfully.');
        },
        error: () => { this.isDeleting = false; }
      });
    } else {
      this.projectService.requestDeleteProject(this.projectToDelete.id!).subscribe({
        next: () => {
          this.isDeleting = false;
          this.closeDeleteModal();
          this.showSuccessToast('Deletion request sent to the admin for approval.');
        },
        error: () => {
          this.isDeleting = false;
          this.closeDeleteModal();
          this.showSuccessToast('Deletion request sent to the admin for approval.');
        }
      });
    }
  }

  // ── EDIT ──────────────────────────────────────────

  openEditModal(project: Project): void {
    this.projectToEdit       = project;
    this.editForm            = {
      title:       project.title,
      description: project.description,
      deadline:    project.deadline || '',
      status:      project.status   || 'OPEN'
    };
    this.originalTitle       = project.title;
    this.originalDescription = project.description;
    this.editErrors          = {};
    this.updateError         = '';
    this.reanalysisResult    = null;
    this.analysisOutdated    = false;
    this.showEditModal       = true;
    document.body.style.overflow = 'hidden';
  }
  

  closeEditModal(): void {
    this.showEditModal    = false;
    this.projectToEdit    = null;
    this.updateError      = '';
    this.editErrors       = {};
    this.reanalysisResult = null;
    this.analysisOutdated = false;
    document.body.style.overflow = '';
  }

  onEditFieldChange(): void {
    const titleChanged = this.editForm.title.trim()       !== this.originalTitle.trim();
    const descChanged  = this.editForm.description.trim() !== this.originalDescription.trim();

    if (titleChanged || descChanged) {
      this.analysisOutdated = true;
      this.triggerReanalysis();
    } else {
      this.analysisOutdated = false;
      this.reanalysisResult = null;
    }
  }

  triggerReanalysis(): void {
    clearTimeout(this.reanalysisTimer);
    this.reanalysisTimer = setTimeout(() => {
      if (!this.editForm.title || this.editForm.title.length < 5) return;
      this.isReanalyzing    = true;
      this.reanalysisResult = null;

      this.analysisService.analyzeProject(
        this.editForm.title,
        this.editForm.description || this.editForm.title,
        this.editForm.deadline
      ).subscribe({
        next: (result: AnalysisResult) => {
          this.reanalysisResult = result;
          this.analysisOutdated = false;
          this.isReanalyzing    = false;
        },
        error: () => { this.isReanalyzing = false; }
      });
    }, 1200);
  }

  validateEditForm(): boolean {
    this.editErrors = {};

    if (!this.editForm.title || this.editForm.title.trim().length < 5)
      this.editErrors['title'] = 'Title must be at least 5 characters.';

    if (!this.editForm.description || this.editForm.description.trim().length < 20)
      this.editErrors['description'] = 'Description must be at least 20 characters.';

    if (!this.editForm.deadline) {
      this.editErrors['deadline'] = 'Deadline is required.';
    } else if (this.editForm.deadline < this.today) {
      this.editErrors['deadline'] = 'Deadline cannot be in the past.';
    }

    return Object.keys(this.editErrors).length === 0;
  }

  confirmUpdate(): void {
    if (!this.projectToEdit?.id) return;
    if (!this.validateEditForm()) return;

    this.isUpdating = true;
    const updatedProject: Project = {
      ...this.projectToEdit,
      title:       this.editForm.title,
      description: this.editForm.description,
      deadline:    this.editForm.deadline,
      status:      this.editForm.status as 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED'
    };

    this.projectService.updateProject(this.projectToEdit.id!, updatedProject).subscribe({
      next: (res: Project) => {
        const index = this.projects.findIndex(p => p.id === this.projectToEdit!.id);
        if (index !== -1) this.projects[index] = res;
        this.applyFilters();

        if (this.reanalysisResult && this.projectToEdit?.id) {
          const projectId        = this.projectToEdit.id!;
          const result           = this.reanalysisResult;
          const feasibilityScore = Math.max(0, 100 - result.risk.score - result.complexity.score);

          this.analysisService.saveProjectSkills(projectId, result.skills).subscribe();
          this.analysisService.saveProjectAnalysis(projectId, result, feasibilityScore).subscribe({
            next:  () => { this.isUpdating = false; this.closeEditModal(); this.showSuccessToast('Project updated successfully.'); },
            error: () => { this.isUpdating = false; this.closeEditModal(); this.showSuccessToast('Project updated successfully.'); }
          });
        } else {
          this.isUpdating = false;
          this.closeEditModal();
          this.showSuccessToast('Project updated successfully.');
        }
      },
      error: () => {
        this.updateError = 'Error updating project.';
        this.isUpdating  = false;
      }
    });
  }

  getDaysUntilDeadline(): number {
    if (!this.editForm.deadline) return 0;
    const diff = new Date(this.editForm.deadline).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // ── PROPOSALS ─────────────────────────────────────

  openProposalsModal(project: Project): void {
    this.selectedProjectForProposals = project;
    this.showProposalsModal          = true;
    this.proposalsFilter             = 'ALL';
    this.loadProposals(project.id!);
    document.body.style.overflow = 'hidden';
  }

  closeProposalsModal(): void {
    this.showProposalsModal          = false;
    this.selectedProjectForProposals = null;
    this.proposals                   = [];
    document.body.style.overflow     = '';
  }

  loadProposals(projectId: number): void {
    this.isLoadingProposals = true;
    const clientId = this.selectedProjectForProposals?.clientId ?? this.clientId;
    this.proposalService.getByProject(projectId, clientId).subscribe({
      next: (data: any[]) => {
        this.proposals          = data;
        this.isLoadingProposals = false;
      },
      error: () => { this.isLoadingProposals = false; }
    });
  }

  get filteredProposals(): any[] {
    if (this.proposalsFilter === 'ALL') return this.proposals;
    return this.proposals.filter(p => p.status === this.proposalsFilter);
  }

  updateProposalStatus(proposalId: number, status: string): void {
    const proposal = this.proposals.find(p => p.id === proposalId);
    if (!proposal) return;

    this.updatingProposalId = proposalId;

    this.proposalService.updateStatus(proposalId, status).subscribe({
      next: () => {
        proposal.status         = status;
        this.updatingProposalId = null;
        this.showSuccessToast(
          status === 'ACCEPTED' ? 'Proposal accepted — email sent!' : 'Proposal rejected — email sent!'
        );
      },
      error: (err: any) => {
        console.error(err);
        this.updatingProposalId = null;
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

  getStatusBg(status: string): string {
    switch (status) {
      case 'ACCEPTED':  return '#dcfce7';
      case 'REJECTED':  return '#fee2e2';
      case 'WITHDRAWN': return '#f1f5f9';
      default:          return '#fef3c7';
    }
  }

  countByStatus(status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'): number {
    return this.proposals?.filter(p => p.status === status).length ?? 0;
  }
  goToContracts(project: any): void {
  this.router.navigate(['/front/contracts'], {
    queryParams: { 
      projectId: project.id,
      clientKeycloakId: this.clientKeycloakId
    }
  });
}
  
  //////////////////////////////
  goToMatching(projectId: number | undefined): void {
  if (projectId) {
    this.router.navigate(['/front/matching'], { 
      queryParams: { projectId: projectId } 
    });
  }}
    goToInvitations(project: Project): void {
  if (!project.id) { return; }
  this.router.navigate(['/front-office/projects', project.id, 'invitations']);
  
}


}

