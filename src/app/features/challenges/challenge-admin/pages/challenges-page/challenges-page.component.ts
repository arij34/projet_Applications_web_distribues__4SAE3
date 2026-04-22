import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ChallengeAdminService } from '@core/services/challenge-admin.service';
import { Participant } from '@core/models/participant.model';

@Component({
  selector: 'app-challenges-page',
  templateUrl: './challenges-page.component.html',
  styleUrls: ['./challenges-page.component.css']
})
export class ChallengesPageComponent implements OnInit {
  challenges: any[] = [];
  filteredChallenges: any[] = [];
  searchTerm = '';
  isEditModalOpen: boolean = false;
  showSaveSuccess = false;
  isLoading = true;
  loadError: string | null = null;
  private saveSuccessTimeout: ReturnType<typeof setTimeout> | null = null;
  isParticipantsModalOpen: boolean = false;
  isViewTasksModalOpen = false;
  isDeleteModalOpen = false;
  challengeToDelete: any = null;
  selectedChallenge: any = null;
  selectedChallengeForView: any = null;
  selectedChallengeParticipants: Participant[] = [];
  viewTasksLoading = false;
  isSidebarOpen = false;
  isMobile = false;

  constructor(
    private challengeAdminService: ChallengeAdminService,
    private router: Router
  ) {
    this.checkMobile();
    window.addEventListener('resize', () => this.checkMobile());
  }

  private checkMobile(): void {
    this.isMobile = window.innerWidth < 1024;
    if (!this.isMobile) this.isSidebarOpen = false;
  }

  onToggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  onTabChange(tab: string): void {
    if (tab === 'Challenge') {
      this.router.navigate(['/admin/challenges']);
    } else {
      this.router.navigate(['/admin'], { queryParams: { tab } });
    }
    if (this.isMobile) this.isSidebarOpen = false;
  }

  ngOnInit(): void {
    this.refreshChallenges();
  }

  onBack(): void {
    this.router.navigate(['/admin/challenges']);
  }

  onCreateChallenge(): void {
    this.router.navigate(['/challenges/wizard']);
  }

  onSearchChange(): void {
    this.applySearch();
  }

  private applySearch(): void {
    const term = (this.searchTerm || '').toLowerCase().trim();
    if (!term) {
      this.filteredChallenges = [...this.challenges];
      return;
    }
    this.filteredChallenges = this.challenges.filter(
      c =>
        (c.title || '').toLowerCase().includes(term) ||
        (c.description || '').toLowerCase().includes(term) ||
        (c.category || '').toLowerCase().includes(term)
    );
  }

  onViewChallenge(challenge: any): void {
    this.selectedChallengeForView = { ...challenge, tasks: [] };
    this.isViewTasksModalOpen = true;
    this.viewTasksLoading = true;

    this.challengeAdminService.getTasksByChallengeId(challenge.id).subscribe({
      next: tasks => {
        this.selectedChallengeForView = { ...challenge, tasks: tasks || [] };
        this.viewTasksLoading = false;
      },
      error: () => {
        this.selectedChallengeForView = { ...challenge, tasks: [] };
        this.viewTasksLoading = false;
      }
    });
  }

  onCloseViewTasksModal(): void {
    this.isViewTasksModalOpen = false;
    this.selectedChallengeForView = null;
  }

  onEditFromViewTasks(challenge: any): void {
    this.isViewTasksModalOpen = false;
    this.selectedChallengeForView = null;
    this.onEditChallenge(challenge);
  }

  onTaskUpdated(updatedTask: any): void {
    const taskId = updatedTask.id ?? updatedTask.idTask;
    if (!taskId) return;
    const payload = {
      title: updatedTask.title,
      description: updatedTask.description,
      status: updatedTask.status,
      deadline: updatedTask.deadline || null
    };
    this.challengeAdminService.updateTask(taskId, payload).subscribe({
      next: () => {
        if (this.selectedChallengeForView?.tasks) {
          const idx = this.selectedChallengeForView.tasks.findIndex(
            (t: any) => (t.id ?? t.idTask) === taskId
          );
          if (idx >= 0) {
            this.selectedChallengeForView.tasks = [...this.selectedChallengeForView.tasks];
            this.selectedChallengeForView.tasks[idx] = updatedTask;
          }
        }
      },
      error: () => {
        if (this.selectedChallengeForView?.tasks) {
          const idx = this.selectedChallengeForView.tasks.findIndex(
            (t: any) => (t.id ?? t.idTask) === taskId
          );
          if (idx >= 0) {
            this.selectedChallengeForView.tasks = [...this.selectedChallengeForView.tasks];
            this.selectedChallengeForView.tasks[idx] = updatedTask;
          }
        }
      }
    });
  }

  onTaskDeleted(task: any): void {
    const id = task.id ?? task.idTask;
    if (!id) return;
    this.challengeAdminService.deleteTask(id).subscribe({
      next: () => {
        if (this.selectedChallengeForView?.tasks) {
          this.selectedChallengeForView.tasks = this.selectedChallengeForView.tasks.filter(
            (t: any) => (t.id ?? t.idTask) !== id
          );
        }
      },
      error: () => {
        if (this.selectedChallengeForView?.tasks) {
          this.selectedChallengeForView.tasks = this.selectedChallengeForView.tasks.filter(
            (t: any) => (t.id ?? t.idTask) !== id
          );
        }
      }
    });
  }

  onEditChallenge(challenge: any): void {
    this.selectedChallenge = challenge;
    this.isEditModalOpen = true;
  }

  onSaveChallenge(updatedChallenge: any): void {
    this.challengeAdminService.updateChallenge(updatedChallenge).subscribe({
      next: () => {
        this.isEditModalOpen = false;
        this.selectedChallenge = null;
        this.refreshChallenges();
        this.showSaveSuccessToast();
      },
      error: () => {
        this.refreshChallenges();
      }
    });
  }

  private showSaveSuccessToast(): void {
    if (this.saveSuccessTimeout) clearTimeout(this.saveSuccessTimeout);
    this.showSaveSuccess = true;
    this.saveSuccessTimeout = setTimeout(() => {
      this.showSaveSuccess = false;
      this.saveSuccessTimeout = null;
    }, 3000);
  }

  onCloseEditModal(): void {
    this.isEditModalOpen = false;
    this.selectedChallenge = null;
  }

  onDuplicateChallenge(challenge: any): void {
    this.challengeAdminService.duplicateChallenge(challenge).subscribe({
      next: () => this.refreshChallenges(),
      error: () => this.refreshChallenges()
    });
  }

  onViewParticipants(challenge: any): void {
    this.selectedChallenge = challenge;
    
    // Load participants for this challenge
    this.challengeAdminService.getParticipants(challenge.id).subscribe(participants => {
      this.selectedChallengeParticipants = participants;
      this.isParticipantsModalOpen = true;
    });
  }

  onCloseParticipantsModal(): void {
    this.isParticipantsModalOpen = false;
    this.selectedChallenge = null;
    this.selectedChallengeParticipants = [];
  }

  onDeleteChallenge(challenge: any): void {
    this.challengeToDelete = challenge;
    this.isDeleteModalOpen = true;
  }

  onConfirmDelete(): void {
    if (this.challengeToDelete) {
      this.challengeAdminService.deleteChallenge(this.challengeToDelete.id).subscribe({
        next: () => {
          this.isDeleteModalOpen = false;
          this.challengeToDelete = null;
          this.refreshChallenges();
        },
        error: () => {
          this.isDeleteModalOpen = false;
          this.challengeToDelete = null;
          this.refreshChallenges();
        }
      });
    }
  }

  onCancelDelete(): void {
    this.isDeleteModalOpen = false;
    this.challengeToDelete = null;
  }

  private refreshChallenges(): void {
    this.isLoading = true;
    this.loadError = null;
    this.challengeAdminService.getChallenges().subscribe({
      next: challenges => {
        this.challenges = challenges;
        this.applySearch();
        this.isLoading = false;
      },
      error: err => {
        this.isLoading = false;
        const status = err?.status;
        const msg = err?.error?.message || err?.error?.error || (typeof err?.error === 'string' ? err.error : null);
        if (status === 500 && msg) {
          this.loadError = `Server error (500): ${msg}. See BACKEND_TASKS_FIX.md for the tasks serialization fix.`;
        } else if (status) {
          this.loadError = `Could not load challenges (HTTP ${status}). ${msg || 'Check backend logs.'}`;
        } else {
          this.loadError = 'Could not load challenges. Is the backend server running on port 8080?';
        }
        this.challenges = [];
        this.applySearch();
      }
    });
  }

  onRetryLoad(): void {
    this.refreshChallenges();
  }
}
