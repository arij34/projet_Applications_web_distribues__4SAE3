import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApplicationQuestion } from '../../../core/models/skill/application-question.model';
import { AuthService } from '../../../core/auth/auth.service';
import { InvitationService } from '../../../core/services/skill/invitation.service';

export interface ProjectInvitation {
  id: number;
  projectTitle: string;
  projectDescription: string;
  clientName: string;
  clientEmail: string;
  matchScore: number;
  deadline: string;
  budget: number;
  budgetMax?: number;
  durationWeeks: number;
  requiredSkills: string[];
  invitedAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'TRASH';
  trashedAt?: string;
}

export interface ApplicationResponseDto {
  id: number;
  invitationId: number;
  freelancerId: number;
  projectId: number;
  answerQ1: string;
  answerQ2: string;
  answerQ3: string;
  answerQ4: string;
  answerQ5: string;
  createdAt?: string;
  lastUpdatedAt?: string;
}

@Component({
  selector: 'app-project-invitations',
  templateUrl: './project-invitations.component.html',
  styleUrls: ['./project-invitations.component.css']
})
export class ProjectInvitationsComponent implements OnInit {

  loading = false;
  activeTab: 'all' | 'pending' | 'accepted' | 'declined' | 'trash' = 'all';

  invitations: ProjectInvitation[] = [];
  trashedInvitations: ProjectInvitation[] = [];
  filteredInvitations: ProjectInvitation[] = [];

  // ===== Formulaire dynamique =====
  activeFormId: number | null = null;
  expandedInvitationId: number | null = null; // 🔹 invitation dont on voit les détails
  questions: ApplicationQuestion[] = [];
  currentQuestionIndex = 0;
  currentAnswer = '';
  isSubmitting = false;
  currentError = '';
  reviewMode = false;      // affiche l’écran de review (lecture seule)
  globalError = '';

  // réponses par invitation & question
  answersByInvitation: {
    [invitationId: number]: { [questionId: number]: string }
  } = {};

  // peut‑on encore éditer (<=24h) ?
  canEditMap: { [invitationId: number]: boolean } = {};

  private baseUrl = 'http://localhost:8087/invitations';
  private formResponseUrl = 'http://localhost:8087/form-response';

  constructor(
    private http: HttpClient,
    private invitationService: InvitationService,
    private authService: AuthService
  ) {}

  // ===== Lifecycle =====

  async ngOnInit(): Promise<void> {
    const isLogged = await this.authService.isLoggedIn();
    if (!isLogged) {
      this.invitations = [];
      this.filteredInvitations = [];
      return;
    }

    const freelancerId = this.authService.getUserId();
    if (!freelancerId) {
      console.warn('No freelancerId found in localStorage');
      this.invitations = [];
      this.filteredInvitations = [];
      return;
    }

    this.loadInvitations(freelancerId);
  }

  // ===== Chargement des invitations / corbeille =====

  private loadInvitations(freelancerId: number): void {
    this.loading = true;

    this.invitationService.getMyInvitations(freelancerId).subscribe({
      next: (data) => {
        this.invitations = data
          .filter(inv => inv.status !== 'TRASH')
          .map(inv => ({
            id: inv.id,
            projectTitle: inv.projectTitle || 'Projet sans titre',
            projectDescription: inv.projectDescription || '',
            clientName: inv.clientName || '',
            clientEmail: inv.clientEmail || '',
            matchScore: inv.matchScore || 0,
            deadline: inv.deadline || '',
            budget: inv.budgetRecommended || 0,
            budgetMax: inv.budgetMax ?? null,
            durationWeeks: inv.durationEstimatedWeeks || 0,
            requiredSkills: inv.requiredSkills || [],
            invitedAt: inv.invitedAt || '',
            status: inv.status
          }));
        this.applyTab();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement invitations:', err);
        this.loading = false;
      }
    });
  }

  loadTrash(): void {
    const freelancerId = this.authService.getUserId();
    if (!freelancerId) {
      console.warn('No freelancerId for trash');
      return;
    }

    this.invitationService.getTrash(freelancerId).subscribe({
      next: (data) => {
        this.trashedInvitations = data.map(inv => ({
          id: inv.id,
          projectTitle: inv.projectTitle || 'Projet sans titre',
          projectDescription: inv.projectDescription || '',
          clientName: inv.clientName || '',
          clientEmail: inv.clientEmail || '',          matchScore: inv.matchScore || 0,
          deadline: inv.deadline || '',
          budget: inv.budgetRecommended || 0,
          budgetMax: inv.budgetMax ?? null,
          durationWeeks: inv.durationEstimatedWeeks || 0,
          requiredSkills: inv.requiredSkills || [],
          invitedAt: inv.invitedAt || '',
          status: inv.status,
          trashedAt: inv.trashedAt || ''
        }));
        if (this.activeTab === 'trash') this.applyTab();
      },
      error: (err) => console.error('Erreur corbeille:', err)
    });
  }

  // ===== Tabs & filtres =====

  setTab(tab: 'all' | 'pending' | 'accepted' | 'declined' | 'trash'): void {
    this.activeTab = tab;
    if (tab === 'trash') this.loadTrash();
    this.applyTab();
  }

  applyTab(): void {
    if (this.activeTab === 'trash') {
      this.filteredInvitations = [...this.trashedInvitations];
    } else if (this.activeTab === 'all') {
      this.filteredInvitations = [...this.invitations];
    } else {
      this.filteredInvitations = this.invitations.filter(
        inv => inv.status.toLowerCase() === this.activeTab
      );
    }
  }

  get pendingCount():  number { return this.invitations.filter(i => i.status === 'PENDING').length; }
  get acceptedCount(): number { return this.invitations.filter(i => i.status === 'ACCEPTED').length; }
  get declinedCount(): number { return this.invitations.filter(i => i.status === 'DECLINED').length; }
  get trashCount():    number { return this.trashedInvitations.length; }

  // ===== Actions corbeille / statut =====

  moveToTrash(inv: ProjectInvitation): void {
    this.http.put(`${this.baseUrl}/${inv.id}/trash`, {}).subscribe({
      next: () => {
        this.invitations = this.invitations.filter(i => i.id !== inv.id);
        const trashed: ProjectInvitation = {
          ...inv,
          status: 'TRASH',
          trashedAt: new Date().toISOString()
        };
        this.trashedInvitations.push(trashed);
        this.applyTab();
      },
      error: (err) => {
        console.error('Erreur trash — status:', err.status);
        console.error('Erreur trash — url:', err.url);
        console.error('Erreur trash — body:', err.error);
      }
    });
  }

  restoreInvitation(inv: ProjectInvitation): void {
    this.http.put(`${this.baseUrl}/${inv.id}/restore`, {}).subscribe({
      next: () => {
        this.trashedInvitations = this.trashedInvitations.filter(i => i.id !== inv.id);
        const restored: ProjectInvitation = {
          ...inv,
          status: 'PENDING',
          trashedAt: undefined
        };
        this.invitations.push(restored);
        this.applyTab();
      },
      error: (err) => console.error('Erreur restauration:', err)
    });
  }

  restoreFromDeclined(inv: ProjectInvitation): void {
    this.http.put(`${this.baseUrl}/${inv.id}/restore`, {}).subscribe({
      next: () => {
        inv.status = 'PENDING';
        this.applyTab();
      },
      error: (err) => console.error('Erreur restore depuis declined:', err)
    });
  }

  deletePermanently(inv: ProjectInvitation): void {
    if (!confirm('Supprimer définitivement cette invitation ?')) return;
    this.http.delete(`${this.baseUrl}/${inv.id}`).subscribe({
      next: () => {
        this.trashedInvitations = this.trashedInvitations.filter(i => i.id !== inv.id);
        this.applyTab();
      },
      error: (err) => console.error('Erreur suppression:', err)
    });
  }

  declineInvitation(inv: ProjectInvitation): void {
    if (!confirm(`Refuser "${inv.projectTitle}" ?`)) return;
    this.http.put(`${this.baseUrl}/${inv.id}/decline`, {}).subscribe({
      next: () => {
        inv.status = 'DECLINED';
        this.applyTab();
      },
      error: (err) => console.error('Erreur déclinaison:', err)
    });
  }

  // ===== Formulaire dynamique : ouverture/fermeture =====

  openForm(inv: ProjectInvitation): void {
    this.activeFormId = inv.id;
    this.currentQuestionIndex = 0;
    this.currentAnswer = '';
    this.currentError = '';
    this.globalError = '';
    this.reviewMode = false;

    if (!this.answersByInvitation[inv.id]) {
      this.answersByInvitation[inv.id] = {};
    }

    // 1) charger les questions
    this.questions = [];
    this.http.get<ApplicationQuestion[]>(`http://localhost:8087/application-questions/invitation/${inv.id}`)
      .subscribe({
        next: (qs) => {
          this.questions = qs || [];
          // 2) charger une éventuelle réponse existante pour pré-remplir
          this.loadExistingResponse(inv);
        },
        error: (err) => {
          console.error('Erreur chargement questions:', err);
          this.questions = [];
        }
      });

    // 3) savoir si on peut encore éditer (<=24h)
    this.http.get<{ canEdit: boolean }>(`${this.formResponseUrl}/${inv.id}/can-edit`)
      .subscribe({
        next: (res) => {
          this.canEditMap[inv.id] = res.canEdit;
        },
        error: () => {
          this.canEditMap[inv.id] = true;
        }
      });
  }

  private loadExistingResponse(inv: ProjectInvitation): void {
    this.http.get<ApplicationResponseDto>(`${this.formResponseUrl}/${inv.id}`)
      .subscribe({
        next: (resp) => {
          const map: { [qid: number]: string } = this.answersByInvitation[inv.id] || {};
          if (this.questions[0]) map[this.questions[0].id] = resp.answerQ1 || '';
          if (this.questions[1]) map[this.questions[1].id] = resp.answerQ2 || '';
          if (this.questions[2]) map[this.questions[2].id] = resp.answerQ3 || '';
          if (this.questions[3]) map[this.questions[3].id] = resp.answerQ4 || '';
          if (this.questions[4]) map[this.questions[4].id] = resp.answerQ5 || '';
          this.answersByInvitation[inv.id] = map;

          if (this.questions.length > 0) {
            const firstQ = this.questions[0];
            this.currentQuestionIndex = 0;
            this.currentAnswer = map[firstQ.id] || '';
          }
        },
        error: (err) => {
          if (err.status !== 404) {
            console.error('Erreur récupération réponses existantes:', err);
          }
          if (this.questions.length > 0) {
            const firstQ = this.questions[0];
            this.currentQuestionIndex = 0;
            this.currentAnswer = this.answersByInvitation[inv.id][firstQ.id] || '';
          }
        }
      });
  }

  closeForm(): void {
    this.activeFormId = null;
    this.questions = [];
    this.currentAnswer = '';
    this.currentQuestionIndex = 0;
    this.currentError = '';
    this.globalError = '';
    this.reviewMode = false;
  }

  // ===== Validation front sur la question courante =====

  private validateCurrentQuestion(inv: ProjectInvitation): boolean {
    this.currentError = '';
    if (!this.questions.length) return true;

    const q = this.questions[this.currentQuestionIndex];
    const value = (this.currentAnswer ?? '').toString().trim();

    if (q.required && !value) {
      this.currentError = 'This question is required. Type "no answer" if you really have nothing to say.';
      return false;
    }

    if (value && value.length > 2000) {
      this.currentError = 'Your answer is too long (max 2000 characters).';
      return false;
    }

    return true;
  }

  // ===== Navigation entre questions (bouton Next/Review) =====

  goToNextQuestion(inv: ProjectInvitation): void {
    if (!this.questions.length) return;

    if (!this.validateCurrentQuestion(inv)) {
      return;
    }

    const currentQ = this.questions[this.currentQuestionIndex];

    if (!this.answersByInvitation[inv.id]) {
      this.answersByInvitation[inv.id] = {};
    }
    this.answersByInvitation[inv.id][currentQ.id] = this.currentAnswer;

    if (this.currentQuestionIndex === this.questions.length - 1) {
      this.reviewMode = true;
      this.currentError = '';
      return;
    }

    this.currentQuestionIndex++;
    const nextQ = this.questions[this.currentQuestionIndex];
    this.currentAnswer = this.answersByInvitation[inv.id][nextQ.id] || '';
    this.currentError = '';
  }

  // ===== REVIEW : items (lecture seule) =====

  getReviewItems(inv: ProjectInvitation): { label: string; value: string }[] {
    if (!this.questions.length) return [];
    const map = this.answersByInvitation[inv.id] || {};
    return this.questions.map(q => ({
      label: q.label,
      value: (map[q.id] || '').toString().trim() || '(no answer)'
    }));
  }

  backToForm(inv: ProjectInvitation): void {
    this.reviewMode = false;
    this.currentError = '';
    this.globalError = '';

    // on revient sur la première question, déjà pré-remplie
    if (this.questions.length > 0) {
      this.currentQuestionIndex = 0;
      const firstQ = this.questions[0];
      this.currentAnswer = this.answersByInvitation[inv.id]?.[firstQ.id] || '';
    }
  }

  // ===== Soumission des réponses (création / update) =====

  submitAnswers(inv: ProjectInvitation): void {
    if (!this.questions.length) return;

    const map = this.answersByInvitation[inv.id] || {};

    const q1 = this.questions[0] ? (map[this.questions[0].id] || '') : '';
    const q2 = this.questions[1] ? (map[this.questions[1].id] || '') : '';
    const q3 = this.questions[2] ? (map[this.questions[2].id] || '') : '';
    const q4 = this.questions[3] ? (map[this.questions[3].id] || '') : '';
    const q5 = this.questions[4] ? (map[this.questions[4].id] || '') : '';

    if (!q1.toString().trim() || !q2.toString().trim() || !q3.toString().trim()) {
      this.globalError = 'Please answer all required questions. Type "no answer" if you really have nothing to say.';
      return;
    }

    const payload = {
      invitationId: inv.id,
      q1, q2, q3, q4, q5
    };

    this.isSubmitting = true;
    this.currentError = '';
    this.globalError = '';

    this.http.post<ApplicationResponseDto>(this.formResponseUrl, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.reviewMode = true; // rester sur review après sauvegarde
      },
      error: (err) => {
        console.error('Erreur sauvegarde formulaire:', err);
        this.isSubmitting = false;

        const msg: string = err?.error?.error || 'An error occurred while saving the form.';
        const lower = msg.toLowerCase();

        if (lower.includes('budget') && this.questions.length > 3) {
          this.reviewMode = false;
          this.currentQuestionIndex = 3;
          const qBudget = this.questions[3];
          this.currentAnswer = map[qBudget.id] || '';
          this.currentError = msg;
        } else if ((lower.includes('timeline') || lower.includes('duration')) && this.questions.length > 2) {
          this.reviewMode = false;
          this.currentQuestionIndex = 2;
          const qTimeline = this.questions[2];
          this.currentAnswer = map[qTimeline.id] || '';
          this.currentError = msg;
        } else {
          this.globalError = msg;
        }
      }
    });
  }

  // ===== Valider & accepter l'invitation =====

  confirmAndAccept(inv: ProjectInvitation): void {
    const canEdit = this.canEditMap[inv.id];
    if (canEdit === false) {
      this.globalError = 'You can no longer edit or submit this application after 24 hours.';
      return;
    }

    this.isSubmitting = true;
    this.globalError = '';

    this.http.put(`${this.baseUrl}/${inv.id}/accept`, {}).subscribe({
      next: () => {
        inv.status = 'ACCEPTED';
        this.isSubmitting = false;
        this.activeFormId = null;
        this.reviewMode = false;
        this.applyTab();
      },
      error: (err) => {
        console.error('Erreur accept invitation:', err);
        this.isSubmitting = false;
        this.globalError = 'An error occurred while accepting the invitation.';
      }
    });
  }

  // ===== Utils =====

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: '2-digit', year: 'numeric'
    });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING':  return 'Pending';
      case 'ACCEPTED': return 'Accepted';
      case 'DECLINED': return 'Declined';
      case 'TRASH':    return 'Trash';
      default: return status;
    }
  }

  isExpiringSoon(inv: ProjectInvitation): boolean {
    if (!inv.invitedAt || inv.status !== 'PENDING') {
      return false;
    }

    const invitedTime = new Date(inv.invitedAt).getTime();
    if (isNaN(invitedTime)) {
      return false;
    }

    const now = Date.now();
    const diffHours = (now - invitedTime) / (1000 * 60 * 60);

    return diffHours >= 48 && diffHours < 72;
  }
  toggleDetails(inv: ProjectInvitation): void {
  if (this.expandedInvitationId === inv.id) {
    this.expandedInvitationId = null;
  } else {
    this.expandedInvitationId = inv.id;
  }
}
}