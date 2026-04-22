import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ViewChildren, QueryList, ViewEncapsulation,
  ApplicationRef, Injector, ChangeDetectorRef
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CdkPortal, DomPortalOutlet } from '@angular/cdk/portal';
import { ContractHistoryEntry } from '../../../../../core/models/contract.model';
import { ContractService } from 'src/app/core/services/contract.service';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface ContractMilestone {
  id?: number;
  title: string;
  description?: string;
  amount: number;
  deadline: string;
  orderIndex: number;
  status?: string;
}

interface Contract {
  id?: number;
  title: string;
  description?: string;
  projectId: number;
  proposalId: number;
  clientId?: number;
  freelancerId: number;
  freelancerName?: string;
  freelancerEmail?: string;
  // ── Champs signature (Étape 3) ──────────────────────────────────────────────
  freelancerSignedAt?: string;
  clientSignedAt?: string;
  pdfUrl?: string;
  // ────────────────────────────────────────────────────────────────────────────
  totalAmount: number;
  currency: string;
  startDate: string;
  endDate: string;
  deadline?: string;
  status: string;
  milestones?: ContractMilestone[];
  clauses?: { article: string; title: string; text: string; modified?: boolean }[];
  createdAt?: string;
}

interface ContractForm {
  title: string;
  description: string;
  projectId: number | null;
  proposalId: number | null;
  freelancerId: number | null;
  totalAmount: number | null;
  currency: string;
  startDate: string;
  endDate: string;
  deadline: string;
  milestones: ContractMilestone[];
}

interface AcceptedFreelancer {
  proposalId: number;
  freelancerId: number;
  freelancerName: string;
  bidAmount: number;
  availableFrom?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-contracts',
  templateUrl: './contracts.component.html',
  styleUrls: ['./contracts.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ContractsComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChildren(CdkPortal) portals!: QueryList<CdkPortal>;
  private portalOutlets: DomPortalOutlet[] = [];

  private readonly API_URL      = 'http://localhost:8087/api/contracts';
  private readonly PROPOSAL_URL = 'http://localhost:8085/proposals';

  currentProjectId: number | null = null;

  get currentClientId(): number {
    const id = localStorage.getItem('userId') || localStorage.getItem('clientId');
    return id ? +id : 0;
  }

  // ─── State ───────────────────────────────────────────────────────────────────
  contracts: Contract[]              = [];
  filteredContracts: Contract[]      = [];
  selectedContract: Contract | null  = null;
  contractToDelete: Contract | null  = null;
  isLoading    = false;
  isSubmitting = false;
  isEditMode   = false;

  acceptedFreelancers: AcceptedFreelancer[] = [];
  isLoadingFreelancers = false;

  searchQuery  = '';
  statusFilter = '';

  // ─── 🔐 Signature State (Étape 3) ────────────────────────────────────────────
  showSignatureModal    = false;
  contractForSignature: Contract | null = null;
  // État pour la signature CLIENT directe
  isSigningAsClient     = false;
  signClientError       = '';
  signClientSuccess     = '';

  // ─── Canvas e-signature state ─────────────────────────────────────────────
  esignStep: 'draw' | 'confirm' | 'done' = 'draw';
  esignHasDrawn   = false;
  esignIsDrawing  = false;
  private esignCanvas: HTMLCanvasElement | null = null;
  private esignCtx: CanvasRenderingContext2D | null = null;
  showSignClientConfirm = false;
  contractToSignAsClient: Contract | null = null;

  sortOrder    = 'newest';
  showModal       = false;
  showDeleteModal = false;
  errorMessage    = '';
  showDetailModal  = false;
  detailContract: Contract | null = null;
  detailHistory: ContractHistoryEntry[] = [];
  isHistoryLoading = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  contractForm: ContractForm = this.emptyForm();

  // ─── Contraintes de dates ─────────────────────────────────────────────────────
  minStartDate = '';
  minEndDate   = '';
  minDeadline  = '';

  get milestoneMinDate(): string { return this.contractForm.startDate || this.todayStr; }
  get milestoneMaxDate(): string { return this.contractForm.endDate   || ''; }

  get todayStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  get datesContextLabel(): string {
    const s = this.contractForm.startDate;
    const e = this.contractForm.endDate;
    if (!s && !e) return '';
    const fmt = (d: string) => d
      ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';
    return `${fmt(s)} → ${fmt(e)}`;
  }

  // ─── Calendar ────────────────────────────────────────────────────────────────
  monthNames = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
  dayNames     = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  currentDate  = new Date();
  currentMonth = new Date().getMonth();
  currentYear  = new Date().getFullYear();
  calendarDays: (number | null)[] = [];
  selectedDay  = new Date().getDate();

  constructor(
    private http:     HttpClient,
    private route:    ActivatedRoute,
    private router:   Router,
    private appRef:   ApplicationRef,
    private injector: Injector,
    private cdr:      ChangeDetectorRef,
    private contractService: ContractService
  ) {}

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.buildCalendar();
    this.route.queryParams.subscribe(params => {
      if (params['projectId']) {
        this.currentProjectId       = Number(params['projectId']);
        this.contractForm.projectId = this.currentProjectId;
      }
      const autoSignId = params['signContractId'] ? Number(params['signContractId']) : null;
      this.loadContracts(autoSignId);
      this.loadAcceptedFreelancers();
    });
  }

  ngAfterViewInit(): void {
    this.portals.forEach(portal => {
      const outlet = new DomPortalOutlet(document.body, undefined as any, this.appRef, this.injector);
      outlet.attach(portal);
      this.portalOutlets.push(outlet);
    });
  }

  ngOnDestroy(): void {
    this.portalOutlets.forEach(outlet => {
      if (outlet.hasAttached()) outlet.detach();
      outlet.dispose();
    });
  }

  // ─── Auth Header ─────────────────────────────────────────────────────────────

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // ─── Load Contracts ──────────────────────────────────────────────────────────

  loadContracts(autoSignId?: number | null): void {
    this.isLoading = true;
    const token   = localStorage.getItem('access_token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();

    this.http.get<Contract[]>(this.API_URL, { headers }).subscribe({
      next: (data) => {
        if (this.currentProjectId) {
          this.contracts = data.filter(c => c.projectId === this.currentProjectId);
        } else if (this.currentClientId > 0) {
          this.contracts = data.filter(c => c.clientId === this.currentClientId);
        } else {
          this.contracts = data;
        }
        this.applyFilters();
        if (this.contracts.length > 0) this.selectedContract = this.contracts[0];
        this.isLoading = false;

        // Rafraîchir le detailContract si le modal de détail est ouvert
        if (this.showDetailModal && this.detailContract?.id) {
          const refreshed = this.contracts.find(c => c.id === this.detailContract!.id);
          if (refreshed) this.detailContract = refreshed;
        }

        // Rafraîchir le selectedContract
        if (this.selectedContract?.id) {
          const refreshedSelected = this.contracts.find(c => c.id === this.selectedContract!.id);
          if (refreshedSelected) this.selectedContract = refreshedSelected;
        }

        // Auto-ouvrir le modal de signature si lien email
        if (autoSignId) {
          const target = this.contracts.find(c => c.id === autoSignId);
          if (target
            && target.status === 'PENDING_SIGNATURE'
            && target.freelancerSignedAt
            && !target.clientSignedAt) {
            setTimeout(() => {
              this.openSignClientConfirm(target, new Event('auto'));
            }, 400);
          }
        }
      },
      error: (err) => {
        console.error('Erreur HTTP :', err);
        this.contracts = [];
        this.isLoading = false;
      }
    });
  }

  // ─── Load Accepted Freelancers ───────────────────────────────────────────────

  loadAcceptedFreelancers(): void {
    if (!this.currentProjectId) return;
    this.isLoadingFreelancers = true;

    this.http.get<any[]>(`${this.PROPOSAL_URL}/project/${this.currentProjectId}/accepted`)
      .subscribe({
        next: (data) => {
          this.acceptedFreelancers = data.map(p => ({
            proposalId:     p.id,
            freelancerId:   p.freelancerId,
            freelancerName: `Freelancer #${p.freelancerId}`,
            bidAmount:      p.bidAmount,
            availableFrom:  p.availableFrom
          }));
          this.isLoadingFreelancers = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.acceptedFreelancers  = [];
          this.isLoadingFreelancers = false;
          this.cdr.detectChanges();
        }
      });
  }

  onFreelancerSelected(freelancerId: number | null): void {
    if (!freelancerId) return;
    const found = this.acceptedFreelancers.find(f => f.freelancerId === freelancerId);
    if (found) {
      this.contractForm.proposalId = found.proposalId;
      if (!this.contractForm.totalAmount) this.contractForm.totalAmount = found.bidAmount;
    }
  }

  // ─── Filters ─────────────────────────────────────────────────────────────────

  applyFilters(): void {
    let result = [...this.contracts];
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.freelancerName?.toLowerCase().includes(q)
      );
    }
    if (this.statusFilter) result = result.filter(c => c.status === this.statusFilter);
    switch (this.sortOrder) {
      case 'newest':      result.sort((a, b) => new Date(b.createdAt||0).getTime() - new Date(a.createdAt||0).getTime()); break;
      case 'oldest':      result.sort((a, b) => new Date(a.createdAt||0).getTime() - new Date(b.createdAt||0).getTime()); break;
      case 'amount_desc': result.sort((a, b) => b.totalAmount - a.totalAmount); break;
      case 'amount_asc':  result.sort((a, b) => a.totalAmount - b.totalAmount); break;
    }
    this.filteredContracts = result;
  }

  selectContract(contract: Contract): void { this.selectedContract = contract; }
  viewContract(contract: Contract, event: Event): void { event.stopPropagation(); this.selectedContract = contract; }
  goBackToProjects(): void { this.router.navigate(['/front/projects']); }

  // ─── Detail & History Modals ──────────────────────────────────────────────────

  isHistoryOnly = false;

  openContractDetail(contract: Contract, event: Event): void {
    event.stopPropagation();
    this.detailContract  = contract;
    this.isHistoryOnly   = false;
    this.showDetailModal = true;
    document.body.style.overflow = 'hidden';
    if (contract.id) {
      this.loadContractHistory(contract.id);
    } else {
      this.detailHistory = [];
    }
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.isHistoryOnly   = false;
    this.detailContract  = null;
    this.detailHistory   = [];
    document.body.style.overflow = '';
  }

  openHistoryOnly(contract: Contract, event: Event): void {
    event.stopPropagation();
    this.detailContract = contract;
    this.isHistoryOnly   = true;
    this.showDetailModal = true;
    document.body.style.overflow = 'hidden';
    if (contract.id) {
      this.loadContractHistory(contract.id);
    } else {
      this.detailHistory = [];
    }
  }

  loadContractHistory(contractId: number): void {
    this.isHistoryLoading = true;
    const headers = this.getAuthHeaders();
    this.http.get<ContractHistoryEntry[]>(`${this.API_URL}/${contractId}/history`, { headers })
      .subscribe({
        next: (entries) => {
          this.detailHistory = entries || [];
          this.isHistoryLoading = false;
        },
        error: () => {
          this.detailHistory = [];
          this.isHistoryLoading = false;
        }
      });
  }

  getShortDescription(description?: string): string {
    if (!description) return '';
    const firstPart = description.split('===')[0].trim();
    return firstPart.length <= 150 ? firstPart : firstPart.substring(0, 150) + '...';
  }

  // ─── Calendar helpers ─────────────────────────────────────────────────────────

  isContractStartDate(day: number | null): boolean {
    if (!day || !this.selectedContract) return false;
    const d = new Date(this.selectedContract.startDate);
    return d.getDate() === day && d.getMonth() === this.currentMonth && d.getFullYear() === this.currentYear;
  }

  isContractDeadline(day: number | null): boolean {
    if (!day || !this.selectedContract) return false;
    const endDate = this.selectedContract.deadline || this.selectedContract.endDate;
    const d = new Date(endDate);
    return d.getDate() === day && d.getMonth() === this.currentMonth && d.getFullYear() === this.currentYear;
  }

  getDayTooltip(day: number | null): string {
    if (!day || !this.selectedContract) return '';
    if (this.isContractStartDate(day)) return 'Start: ' + this.selectedContract.title;
    if (this.isContractDeadline(day))  return 'Deadline: ' + this.selectedContract.title;
    return '';
  }

  getMilestoneStatusClass(status?: string): string {
    if (status === 'PAID' || status === 'APPROVED')         return 'status-badge ms-done';
    if (status === 'IN_PROGRESS' || status === 'SUBMITTED') return 'status-badge ms-active';
    if (status === 'DISPUTED')                              return 'status-badge ms-disputed';
    return 'status-badge ms-pending';
  }

  getMilestoneStatusLabel(status?: string): string {
    const map: Record<string, string> = {
      PENDING: 'Pending', IN_PROGRESS: 'In Progress', SUBMITTED: 'Submitted',
      APPROVED: 'Approved', PAID: 'Paid', DISPUTED: 'Disputed'
    };
    return map[status || ''] || 'Pending';
  }

  // ─── Payments (fake provider) ──────────────────────────────────────────────

  payMilestone(m: ContractMilestone, contract: Contract, event: Event): void {
    event.stopPropagation();

    if (!contract.id || !m.id) {
      this.showToast('Impossible de payer cette milestone (identifiant manquant).', 'error');
      return;
    }

    if (contract.status !== 'ACTIVE') {
      this.showToast('Le contrat doit être en statut OPEN (ACTIVE) pour payer une milestone.', 'error');
      return;
    }

    if (m.status === 'PAID') {
      this.showToast('Cette milestone est déjà payée.', 'error');
      return;
    }

    const clientId = this.currentClientId;
    if (!clientId) {
      this.showToast('Client non identifié — connexion requise pour payer.', 'error');
      return;
    }

    this.showToast('Initialisation du paiement de la milestone...', 'success');

    this.contractService.initMilestonePayment(m.id, clientId).subscribe({
      next: (res) => {
        const paymentId = res.paymentId;
        // Pour le projet académique : on simule immédiatement un paiement réussi
        this.contractService.simulatePayment(paymentId, true).subscribe({
          next: () => {
            this.showToast('✅ Paiement de la milestone simulé avec succès.', 'success');
            // Recharger la liste pour mettre à jour le statut de la milestone
            this.loadContracts();
          },
          error: (err) => {
            this.showToast(err.error?.error || 'Erreur lors de la simulation de paiement', 'error');
          }
        });
      },
      error: (err) => {
        this.showToast(err.error?.error || 'Erreur lors de l\'initialisation du paiement', 'error');
      }
    });
  }

  // ─── CREATE Modal ─────────────────────────────────────────────────────────────

  openCreateModal(): void {
    this.isEditMode   = false;
    this.contractForm = this.emptyForm();
    if (this.currentProjectId) this.contractForm.projectId = this.currentProjectId;
    this.loadAcceptedFreelancers();
    this.errorMessage = '';
    this.showModal    = true;
    this.recalcDateConstraints();
    document.body.style.overflow = 'hidden';
  }

  // ─── EDIT Modal ───────────────────────────────────────────────────────────────

  editContract(contract: Contract, event: Event): void {
    if (contract.status !== 'DRAFT') {
      event.stopPropagation();
      return;
    }
    event.stopPropagation();
    this.isEditMode   = true;
    this.errorMessage = '';

    const normalizeDate = (d: any): string => {
      if (!d) return '';
      const s = typeof d === 'string' ? d : String(d);
      return s.length >= 10 ? s.substring(0, 10) : s;
    };

    this.contractForm = {
      title:        contract.title,
      description:  contract.description || '',
      projectId:    contract.projectId,
      proposalId:   contract.proposalId,
      freelancerId: contract.freelancerId,
      totalAmount:  contract.totalAmount,
      currency:     contract.currency,
      startDate:    normalizeDate(contract.startDate),
      endDate:      normalizeDate(contract.endDate),
      deadline:     normalizeDate(contract.deadline),
      milestones:   (contract.milestones || []).map(m => ({
        ...m,
        deadline: normalizeDate(m.deadline)
      }))
    };

    const proposalId = contract.proposalId;
    if (proposalId) {
      this.http.get<any>(`${this.PROPOSAL_URL}/${proposalId}`).subscribe({
        next: (proposal) => {
          if (proposal?.availableFrom) {
            const af = normalizeDate(proposal.availableFrom);
            this.contractForm.startDate = af;
            this.recalcDateConstraints(af);
          } else {
            this.recalcDateConstraints();
          }
          this.cdr.detectChanges();
        },
        error: () => { this.recalcDateConstraints(); }
      });
    } else {
      this.recalcDateConstraints();
    }

    this.selectedContract = contract;
    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.showModal    = false;
    this.errorMessage = '';
    document.body.style.overflow = '';
  }

  // ─── Date constraints ─────────────────────────────────────────────────────────

  recalcDateConstraints(availableFrom?: string): void {
    const today = this.todayStr;
    this.minStartDate = (availableFrom && availableFrom > today) ? availableFrom : today;

    if (this.contractForm.startDate) {
      const d = new Date(this.contractForm.startDate);
      d.setDate(d.getDate() + 1);
      this.minEndDate = d.toISOString().split('T')[0];
    } else {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      this.minEndDate = d.toISOString().split('T')[0];
    }

    if (this.contractForm.endDate) {
      const d = new Date(this.contractForm.endDate);
      d.setDate(d.getDate() + 1);
      this.minDeadline = d.toISOString().split('T')[0];
    } else {
      this.minDeadline = '';
    }
  }

  onStartDateChange(): void {
    if (this.contractForm.endDate && this.contractForm.startDate) {
      if (this.contractForm.endDate <= this.contractForm.startDate) {
        this.contractForm.endDate = '';
      }
    }
    this.fixMilestoneDeadlines();
    this.recalcDateConstraints();
  }

  onEndDateChange(): void {
    this.fixMilestoneDeadlines();
    this.recalcDateConstraints();
  }

  private fixMilestoneDeadlines(): void {
    const start = this.contractForm.startDate;
    const end   = this.contractForm.endDate;
    if (!start && !end) return;
    this.contractForm.milestones.forEach(m => {
      if (!m.deadline) return;
      if (start && m.deadline < start) m.deadline = '';
      if (end   && m.deadline > end)   m.deadline = '';
    });
  }

  isMilestoneDeadlineValid(deadline: string): boolean {
    if (!deadline) return false;
    const s = this.contractForm.startDate;
    const e = this.contractForm.endDate;
    if (s && deadline < s) return false;
    if (e && deadline > e) return false;
    return true;
  }

  getMilestoneDeadlineError(deadline: string): string {
    if (!deadline) return 'La deadline est obligatoire';
    const s = this.contractForm.startDate;
    const e = this.contractForm.endDate;
    if (s && deadline < s) return `Doit être ≥ date de début (${s})`;
    if (e && deadline > e) return `Doit être ≤ date de fin (${e})`;
    return '';
  }

  // ─── Text sanitizer ───────────────────────────────────────────────────────────

  private sanitizeText(s: string): string {
    if (!s) return '';
    return s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  }

  // ─── SUBMIT (PUT or POST) ─────────────────────────────────────────────────────

  submitForm(): void {
    if (!this.validateForm()) return;

    this.isSubmitting = true;
    this.errorMessage = '';

    const cleanMilestones = this.contractForm.milestones.map((m, i) => ({
      title:       m.title?.trim() || '',
      description: m.description  || '',
      amount:      Number(m.amount) || 0,
      deadline:    m.deadline ? String(m.deadline).substring(0, 10) : null,
      orderIndex:  i + 1
    }));

    const body = {
      title:        this.contractForm.title?.trim(),
      description:  this.sanitizeText(this.contractForm.description || ''),
      projectId:    this.contractForm.projectId,
      proposalId:   this.contractForm.proposalId || null,
      freelancerId: this.contractForm.freelancerId || null,
      totalAmount:  Number(this.contractForm.totalAmount),
      currency:     this.contractForm.currency || 'TND',
      startDate:    this.contractForm.startDate,
      endDate:      this.contractForm.endDate,
      deadline:     this.contractForm.deadline || null,
      milestones:   cleanMilestones
    };

    if (this.isEditMode && this.selectedContract?.id) {
      this.http.put(`${this.API_URL}/${this.selectedContract.id}`, body, { headers: this.getAuthHeaders(), observe: 'response' }).subscribe({
        next: () => {
          this.loadContracts();
          this.showModal = false;
          this.isSubmitting = false;
          document.body.style.overflow = '';
          this.showToast('Contract updated successfully! ✅', 'success');
        },
        error: (err: any) => {
          if (err.status === 200 || err.status === 204) {
            this.loadContracts();
            this.showModal = false;
            this.isSubmitting = false;
            document.body.style.overflow = '';
            this.showToast('Contract updated successfully! ✅', 'success');
            return;
          }
          this.errorMessage = err.error?.message || err.error || err.message || 'Failed to update contract.';
          this.isSubmitting = false;
        }
      });
    } else {
      this.http.post(this.API_URL, body, { headers: this.getAuthHeaders(), observe: 'response' }).subscribe({
        next: () => {
          this.loadContracts();
          this.showModal = false;
          this.isSubmitting = false;
          document.body.style.overflow = '';
          this.showToast('Contract created successfully! ✅', 'success');
        },
        error: (err: any) => {
          if (err.status === 200 || err.status === 201) {
            this.loadContracts();
            this.showModal = false;
            this.isSubmitting = false;
            document.body.style.overflow = '';
            this.showToast('Contract created successfully! ✅', 'success');
            return;
          }
          this.errorMessage = err.error?.message || err.error || err.message || 'Failed to create contract.';
          this.isSubmitting = false;
        }
      });
    }
  }

  // ─── DELETE ──────────────────────────────────────────────────────────────────

  confirmDelete(contract: Contract, event: Event): void {
    event.stopPropagation();
    this.contractToDelete = contract;
    this.showDeleteModal  = true;
    document.body.style.overflow = 'hidden';
  }

  deleteContract(): void {
    if (!this.contractToDelete?.id) return;
    this.isSubmitting = true;
    this.http.delete(`${this.API_URL}/${this.contractToDelete.id}`, { headers: this.getAuthHeaders() })
      .subscribe({
        next: () => {
          this.contracts = this.contracts.filter(c => c.id !== this.contractToDelete!.id);
          if (this.selectedContract?.id === this.contractToDelete!.id) {
            this.selectedContract = this.contracts[0] || null;
          }
          this.applyFilters();
          this.showDeleteModal  = false;
          this.contractToDelete = null;
          this.isSubmitting     = false;
          document.body.style.overflow = '';
          this.showToast('Contract deleted successfully!', 'success');
        },
        error: (err) => {
          this.isSubmitting    = false;
          this.showDeleteModal = false;
          document.body.style.overflow = '';
          this.showToast(err.error?.message || 'Failed to delete contract.', 'error');
        }
      });
  }

  // ─── Milestones ──────────────────────────────────────────────────────────────

  addMilestone(): void {
    this.contractForm.milestones.push({
      title: '', description: '', amount: 0, deadline: '',
      orderIndex: this.contractForm.milestones.length + 1
    });
  }

  removeMilestone(index: number): void {
    this.contractForm.milestones.splice(index, 1);
  }

  getMilestonesTotal(): number {
    return this.contractForm.milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  }

  // ─── Form validation ─────────────────────────────────────────────────────────

  private validateForm(): boolean {
    const today = this.todayStr;
    if (!this.contractForm.title?.trim())                            { this.errorMessage = 'Le titre est obligatoire.'; return false; }
    if (!this.contractForm.totalAmount || this.contractForm.totalAmount <= 0) { this.errorMessage = 'Le montant total doit être supérieur à 0.'; return false; }
    if (!this.contractForm.startDate)                                { this.errorMessage = 'La date de début est obligatoire.'; return false; }
    if (!this.contractForm.endDate)                                  { this.errorMessage = 'La date de fin est obligatoire.'; return false; }
    if (this.contractForm.startDate < today)                         { this.errorMessage = `La date de début doit être ≥ aujourd'hui (${today}).`; return false; }
    if (this.contractForm.endDate <= today)                          { this.errorMessage = `La date de fin doit être supérieure à aujourd'hui (${today}).`; return false; }
    if (this.contractForm.endDate <= this.contractForm.startDate)    { this.errorMessage = 'La date de fin doit être strictement supérieure à la date de début.'; return false; }
    if (this.contractForm.deadline && this.contractForm.deadline <= this.contractForm.endDate) { this.errorMessage = 'La deadline globale doit être supérieure à la date de fin.'; return false; }

    if (!this.isEditMode) {
      if (!this.contractForm.projectId)    { this.errorMessage = 'Project ID requis.';  return false; }
      if (!this.contractForm.proposalId)   { this.errorMessage = 'Proposal ID requis.'; return false; }
      if (!this.contractForm.freelancerId) { this.errorMessage = 'Freelancer requis.';  return false; }
    }

    for (let i = 0; i < this.contractForm.milestones.length; i++) {
      const m = this.contractForm.milestones[i];
      if (!m.title?.trim())    { this.errorMessage = `Le titre du milestone #${i + 1} est obligatoire.`; return false; }
      if (!m.amount || m.amount <= 0) { this.errorMessage = `Le montant du milestone #${i + 1} doit être > 0.`; return false; }
      if (!m.deadline)         { this.errorMessage = `La deadline du milestone #${i + 1} est obligatoire.`; return false; }
      if (m.deadline < this.contractForm.startDate) { this.errorMessage = `La deadline du milestone #${i + 1} doit être ≥ date de début.`; return false; }
      if (m.deadline > this.contractForm.endDate)   { this.errorMessage = `La deadline du milestone #${i + 1} doit être ≤ date de fin.`; return false; }
    }

    if (this.contractForm.milestones.length > 0) {
      const total = this.getMilestonesTotal();
      if (total !== Number(this.contractForm.totalAmount)) {
        this.errorMessage = `Total milestones (${total}) ≠ montant du contrat (${this.contractForm.totalAmount}).`;
        return false;
      }
    }
    return true;
  }

  // ─── Calendar ────────────────────────────────────────────────────────────────

  buildCalendar(): void {
    const firstDay    = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    this.calendarDays = [];
    for (let i = 0; i < firstDay; i++)     this.calendarDays.push(null);
    for (let i = 1; i <= daysInMonth; i++) this.calendarDays.push(i);
  }

  prevMonth(): void {
    if (this.currentMonth === 0) { this.currentMonth = 11; this.currentYear--; } else this.currentMonth--;
    this.buildCalendar();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) { this.currentMonth = 0; this.currentYear++; } else this.currentMonth++;
    this.buildCalendar();
  }

  isToday(day: number | null): boolean {
    if (!day) return false;
    const today = new Date();
    return day === today.getDate() && this.currentMonth === today.getMonth() && this.currentYear === today.getFullYear();
  }

  dayHasDeadline(day: number | null): boolean {
    if (!day) return false;
    return this.contracts.some(c => {
      const d = new Date(c.endDate);
      return d.getDate() === day && d.getMonth() === this.currentMonth && d.getFullYear() === this.currentYear;
    });
  }

  // ─── UI Helpers ──────────────────────────────────────────────────────────────

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'status-draft', PENDING_SIGNATURE: 'status-pending', ACTIVE: 'status-active',
      COMPLETED: 'status-completed', CANCELLED: 'status-cancelled', DISPUTED: 'status-disputed'
    };
    return map[status] || 'status-draft';
  }

  formatStatus(status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'Draft', PENDING_SIGNATURE: 'Pending Signature', ACTIVE: 'Open',
      COMPLETED: 'Completed', CANCELLED: 'Closed', DISPUTED: 'Disputed'
    };
    return map[status] || status;
  }

  getProgress(contract: Contract): number {
    if (!contract.milestones?.length) return 0;
    const done = contract.milestones.filter(m => m.status === 'PAID' || m.status === 'APPROVED').length;
    return Math.round((done / contract.milestones.length) * 100);
  }

  getMilestoneIcon(status?: string): string {
    const map: Record<string, string> = {
      PAID: '✅', APPROVED: '✅', IN_PROGRESS: '🔄', SUBMITTED: '🔄', PENDING: '⏳', DISPUTED: '⚠️'
    };
    return map[status || ''] || '⏳';
  }

  getMilestoneClass(status?: string): string {
    if (status === 'PAID' || status === 'APPROVED')         return 'milestone-done';
    if (status === 'IN_PROGRESS' || status === 'SUBMITTED') return 'milestone-active';
    return 'milestone-pending';
  }

  getAvatarColor(id: number): string {
    const colors = ['#4A90E2', '#A78BFA', '#34D399', '#F59E0B', '#EF4444', '#2F6FED'];
    return colors[id % colors.length];
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType    = type;
    setTimeout(() => this.toastMessage = '', 3000);
  }

  // ─── Helpers : info signature ─────────────────────────────────────────────────

  get contractFreelancerSigned(): boolean {
    return !!this.selectedContract?.freelancerSignedAt;
  }

  get contractClientSigned(): boolean {
    return !!this.selectedContract?.clientSignedAt;
  }

  formatDatetime(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  // ─── 🔐 Signature Methods (ÉTAPE 3) ──────────────────────────────────────────

  // ─── 🔐 Signature CLIENT — flux canvas (draw → confirm → done) ───────────────

  openSignClientConfirm(contract: Contract, event: Event): void {
    event.stopPropagation();
    if (contract.status !== 'PENDING_SIGNATURE') {
      this.showToast('Contract must be in "Pending signature" status.', 'error');
      return;
    }
    if (!contract.freelancerSignedAt) {
      this.showToast('The freelancer must sign first.', 'error');
      return;
    }
    if (contract.clientSignedAt) {
      this.showToast('You have already signed this contract.', 'error');
      return;
    }
    this.contractToSignAsClient = contract;
    this.esignStep       = 'draw';
    this.esignHasDrawn   = false;
    this.esignIsDrawing  = false;
    this.signClientError = '';
    this.signClientSuccess = '';
    this.isSigningAsClient = false;
    this.showSignClientConfirm = true;
    document.body.style.overflow = 'hidden';
    setTimeout(() => this.esignInitCanvas(), 150);
  }

  closeSignClientConfirm(): void {
    if (this.isSigningAsClient) return;
    this.showSignClientConfirm  = false;
    this.contractToSignAsClient = null;
    this.signClientError        = '';
    this.signClientSuccess      = '';
    this.esignStep       = 'draw';
    this.esignHasDrawn   = false;
    this.esignCanvas     = null;
    this.esignCtx        = null;
    document.body.style.overflow = '';
  }

  // ── Canvas helpers ──────────────────────────────────────────────────────────

  esignInitCanvas(): void {
    this.esignCanvas = document.getElementById('clientSignCanvas') as HTMLCanvasElement;
    if (!this.esignCanvas) return;
    const rect = this.esignCanvas.getBoundingClientRect();
    this.esignCanvas.width  = rect.width  * window.devicePixelRatio;
    this.esignCanvas.height = rect.height * window.devicePixelRatio;
    this.esignCtx = this.esignCanvas.getContext('2d');
    if (this.esignCtx) {
      this.esignCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
      this.esignCtx.strokeStyle = '#1e293b';
      this.esignCtx.lineWidth   = 2.5;
      this.esignCtx.lineCap     = 'round';
      this.esignCtx.lineJoin    = 'round';
    }
  }

  esignMouseDown(e: MouseEvent): void {
    if (!this.esignCtx || !this.esignCanvas) return;
    this.esignIsDrawing = true;
    const r = this.esignCanvas.getBoundingClientRect();
    this.esignCtx.beginPath();
    this.esignCtx.moveTo(e.clientX - r.left, e.clientY - r.top);
  }

  esignMouseMove(e: MouseEvent): void {
    if (!this.esignIsDrawing || !this.esignCtx || !this.esignCanvas) return;
    const r = this.esignCanvas.getBoundingClientRect();
    this.esignCtx.lineTo(e.clientX - r.left, e.clientY - r.top);
    this.esignCtx.stroke();
    this.esignHasDrawn = true;
  }

  esignMouseUp():    void { this.esignIsDrawing = false; }
  esignMouseLeave(): void { this.esignIsDrawing = false; }

  esignTouchStart(e: TouchEvent): void {
    e.preventDefault();
    if (!this.esignCtx || !this.esignCanvas) return;
    this.esignIsDrawing = true;
    const r = this.esignCanvas.getBoundingClientRect();
    const t = e.touches[0];
    this.esignCtx.beginPath();
    this.esignCtx.moveTo(t.clientX - r.left, t.clientY - r.top);
  }

  esignTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (!this.esignIsDrawing || !this.esignCtx || !this.esignCanvas) return;
    const r = this.esignCanvas.getBoundingClientRect();
    const t = e.touches[0];
    this.esignCtx.lineTo(t.clientX - r.left, t.clientY - r.top);
    this.esignCtx.stroke();
    this.esignHasDrawn = true;
  }

  esignTouchEnd(): void { this.esignIsDrawing = false; }

  esignClear(): void {
    if (!this.esignCtx || !this.esignCanvas) return;
    this.esignCtx.clearRect(0, 0, this.esignCanvas.width, this.esignCanvas.height);
    this.esignHasDrawn = false;
  }

  esignGoToConfirm(): void {
    if (!this.esignHasDrawn) return;
    this.esignStep = 'confirm';
    setTimeout(() => {
      const preview = document.getElementById('clientSignPreview') as HTMLCanvasElement;
      if (preview && this.esignCanvas) {
        const ctx = preview.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, preview.width, preview.height);
          ctx.drawImage(this.esignCanvas, 0, 0, preview.width, preview.height);
        }
      }
    }, 80);
  }

  esignBackToDraw(): void {
    this.esignStep = 'draw';
    this.signClientError = '';
    setTimeout(() => this.esignInitCanvas(), 100);
  }

  // ── Confirmation finale → API ───────────────────────────────────────────────

  confirmSignAsClient(): void {
    const contract = this.contractToSignAsClient;
    if (!contract?.id || this.isSigningAsClient) return;

    this.isSigningAsClient = true;
    this.signClientError   = '';

    const token   = localStorage.getItem('access_token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    // Extraire l'image de signature depuis le canvas (base64 PNG)
    let signatureImageData: string | undefined;
    try {
      if (this.esignCanvas) {
        signatureImageData = this.esignCanvas.toDataURL('image/png');
      }
    } catch {
      signatureImageData = undefined;
    }

    const body = signatureImageData ? { signatureImageData } : {};

    this.http.put<any>(
      `${this.API_URL}/${contract.id}/sign?role=CLIENT`,
      body,
      { headers }
    ).subscribe({
      next: (response: any) => {
        this.isSigningAsClient = false;
        this.esignStep = 'done';
        this.signClientSuccess = response.message || '🎉 Contrat activé avec succès !';

        const updated: Contract = {
          ...contract,
          clientSignedAt: response.clientSignedAt || new Date().toISOString(),
          status:         response.status         || 'ACTIVE',
          pdfUrl:         response.pdfUrl         || contract.pdfUrl
        };
        this.contracts = this.contracts.map(c => c.id === contract.id ? updated : c);
        this.applyFilters();
        if (this.selectedContract?.id === contract.id) this.selectedContract = updated;
        // Mettre à jour le detailContract si ouvert
        if (this.detailContract?.id === contract.id) this.detailContract = updated;

        setTimeout(() => {
          this.closeSignClientConfirm();
          this.showToast('🎉 Contrat ACTIF ! PDF envoyé par email aux deux parties.', 'success');
          this.loadContracts();
        }, 3000);
      },
      error: (err: any) => {
        this.isSigningAsClient = false;
        this.signClientError   = err.error?.error || err.error?.message || 'Erreur lors de la signature';
      }
    });
  }

  /**
   * Ouvrir le modal DocuSign (signature électronique externe).
   * Conservé pour compatibilité — utilisez confirmSignAsClient() pour la signature directe.
   */
  openSignatureModal(contract: Contract, event: Event): void {
    event.stopPropagation();
    if (contract.status !== 'PENDING_SIGNATURE') {
      this.showToast('Contract must be in "Pending signature" status.', 'error');
      return;
    }
    this.contractForSignature = contract;
    this.showSignatureModal   = true;
    document.body.style.overflow = 'hidden';
  }

  closeSignatureModal(): void {
    this.showSignatureModal   = false;
    this.contractForSignature = null;
    document.body.style.overflow = '';
  }

  onSignatureCompleted(): void {
    this.closeSignatureModal();
    this.showToast('✅ Contrat signé avec succès !', 'success');
    this.loadContracts();
  }

  /**
   * Le CLIENT accepte les modifications du freelancer → PENDING_SIGNATURE + notif freelancer
   */
  acceptFreelancerModifications(contract: Contract, event: Event): void {
    event.stopPropagation();
    if (contract.status !== 'DISPUTED') {
      this.showToast('Le contrat doit être en DISPUTED pour accepter des modifications', 'error');
      return;
    }
    const headers = this.getAuthHeaders();
    this.http.put<any>(`${this.API_URL}/${contract.id}/accept-modifications`, {}, { headers }).subscribe({
      next: (response: any) => {
        const updated: Contract = { ...contract, status: response.status || 'PENDING_SIGNATURE' };
        this.contracts = this.contracts.map(c => c.id === contract.id ? updated : c);
        if (this.selectedContract?.id === contract.id) this.selectedContract = updated;
        this.applyFilters();
        this.showToast('✅ Modifications acceptées — le freelancer a été notifié pour signer.', 'success');
      },
      error: (err: any) => {
        this.showToast(err.error?.error || err.error?.message || 'Erreur lors de l\'acceptation des modifications', 'error');
      }
    });
  }

  /**
   * Le CLIENT refuse les modifications du freelancer → contrat fermé (CANCELLED)
   */
  rejectFreelancerModifications(contract: Contract, event: Event): void {
    event.stopPropagation();
    if (contract.status !== 'DISPUTED') {
      this.showToast('Le contrat doit être en DISPUTED pour refuser des modifications', 'error');
      return;
    }
    if (!confirm(`Confirmer le refus des modifications ?\nLe contrat "${contract.title}" sera définitivement fermé (CANCELLED).`)) return;

    const headers = this.getAuthHeaders();
    this.http.put<any>(`${this.API_URL}/${contract.id}/reject-modifications`, {}, { headers }).subscribe({
      next: (response: any) => {
        const updated: Contract = { ...contract, status: response.status || 'CANCELLED' };
        this.contracts = this.contracts.map(c => c.id === contract.id ? updated : c);
        if (this.selectedContract?.id === contract.id) this.selectedContract = updated;
        this.applyFilters();
        this.showToast('⚠️ Modifications refusées — contrat fermé (CANCELLED).', 'error');
      },
      error: (err: any) => {
        this.showToast(err.error?.error || err.error?.message || 'Erreur lors du refus des modifications', 'error');
      }
    });
  }

  private emptyForm(): ContractForm {
    return {
      title: '', description: '', projectId: this.currentProjectId,
      proposalId: null, freelancerId: null, totalAmount: null,
      currency: 'TND', startDate: '', endDate: '', deadline: '', milestones: []
    };
  }

  // ─── Contract paper helpers ───────────────────────────────────────────────────

  getContractPreamble(description?: string): string {
    if (!description) return '';
    const separatorIndex = description.indexOf('===');
    if (separatorIndex !== -1) {
      return description.substring(0, separatorIndex).trim();
    }
    const clauseMatch = description.search(/\bClause\s+\d/i);
    if (clauseMatch > 0) {
      return description.substring(0, clauseMatch).trim();
    }
    return description.trim();
  }

  getContractClauses(description?: string): string[] {
    if (!description) return [];
    const separatorIndex = description.indexOf('===');
    if (separatorIndex !== -1) {
      const clauseBlock = description.substring(separatorIndex + 3).trim();
      return clauseBlock.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    }
    const lines = description.split('\n');
    const clauseLines = lines.filter(l => /^\s*Clause\s+\d/i.test(l));
    if (clauseLines.length > 0) return clauseLines.map(l => l.trim());
    const clauseRegex = /(Clause\s+\d[^.]*\.[^C]*)/gi;
    const matches = description.match(clauseRegex);
    if (matches && matches.length > 0) return matches.map(m => m.trim());
    return [];
  }
  submitContractForSignature(contract: Contract, event: Event): void {
    event.stopPropagation();

    const headers = this.getAuthHeaders();
    this.http.put<any>(
      `${this.API_URL}/${contract.id}/submit`,
      {},
      { headers }
    ).subscribe({
      next: () => {
        const updated: Contract = { ...contract, status: 'PENDING_SIGNATURE' };
        this.contracts = this.contracts.map(c => c.id === contract.id ? updated : c);
        if (this.selectedContract?.id === contract.id) this.selectedContract = updated;
        if (this.detailContract?.id === contract.id) this.detailContract = updated;
        this.applyFilters();
        this.showToast('✅ Contract submitted! Freelancer notified to sign.', 'success');
      },
      error: (err: any) => {
        this.showToast(err.error?.error || 'Failed to submit contract.', 'error');
      }
    });
  }
}