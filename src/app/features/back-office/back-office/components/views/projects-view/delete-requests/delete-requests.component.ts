import { Component, OnInit } from '@angular/core';
import { ProjectService } from '../../../../../../../core/services/project.service';
import { Project } from '../../../../../../../core/models/project.model';

@Component({
  selector: 'app-delete-requests',
  templateUrl: './delete-requests.component.html',
  styleUrls: ['./delete-requests.component.css']
})
export class DeleteRequestsComponent implements OnInit {

  requests: Project[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  successMessage: string = '';

  showConfirmModal: boolean = false;
  selectedProject: Project | null = null;
  actionType: 'approve' | 'reject' | null = null;
  isProcessing: boolean = false;

  // Stocke le résultat par id : 'approved' | 'rejected'
  processedMap: Record<number, 'approved' | 'rejected'> = {};

  statusConfig: Record<string, { label: string; cssClass: string }> = {
    OPEN:        { label: 'Open',        cssClass: 'badge-open' },
    IN_PROGRESS: { label: 'In Progress', cssClass: 'badge-progress' },
    COMPLETED:   { label: 'Completed',   cssClass: 'badge-completed' }
  };

  constructor(private projectService: ProjectService) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading = true;
    this.projectService.getDeleteRequests().subscribe({
      next: (data: Project[]) => {
        this.requests = data;
        this.isLoading = false;
      },
      error: (err: any) => {
        this.errorMessage = 'Error loading delete requests.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  openConfirm(project: Project, action: 'approve' | 'reject'): void {
    this.selectedProject = project;
    this.actionType = action;
    this.showConfirmModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeConfirm(): void {
    this.showConfirmModal = false;
    this.selectedProject = null;
    this.actionType = null;
    document.body.style.overflow = '';
  }

  confirmAction(): void {
    if (!this.selectedProject?.id || !this.actionType) return;
    this.isProcessing = true;

    const id = this.selectedProject.id!;
    const action = this.actionType;

    const action$ = action === 'approve'
      ? this.projectService.approveDelete(id)
      : this.projectService.rejectDelete(id);

    action$.subscribe({
      next: () => {
        // Marquer la ligne comme traitée au lieu de la supprimer
        this.processedMap[id] = action === 'approve' ? 'approved' : 'rejected';
        this.isProcessing = false;
        this.closeConfirm(); // fermeture immédiate

        // Retirer la ligne après 2s pour laisser voir l'icône
        setTimeout(() => {
          this.requests = this.requests.filter(r => r.id !== id);
          delete this.processedMap[id];
        }, 2000);
      },
      error: (err: any) => {
        console.error(err);
        this.isProcessing = false;
        this.closeConfirm();
      }
    });
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }
}