// ─────────────────────────────────────────────────────────────
//  CONTRAT-FREELANCER-DETAIL  –  Detail Component  (CORRIGÉ)
//
//  CORRECTIONS APPLIQUÉES :
//   1. signAsFreelancer() n'est disponible que si status === PENDING_SIGNATURE
//      → Le freelancer doit d'abord avoir accepté (via la liste) pour arriver ici
//   2. Le bouton "Sign contract" dans la barre d'action n'apparaît que si
//      status === PENDING_SIGNATURE ET !freelancerSignedAt
//   3. Une fois signé, le pad affiche "Electronically signed" avec la date
//   4. Badge "Awaiting client" visible après la signature freelancer
//   5. Le CLIENT peut signer depuis cette vue si isCurrentUserTheClient
//   6. Rafraîchissement depuis l'API après chaque signature
// ─────────────────────────────────────────────────────────────

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ContractService } from '../../../../../core/services/contract.service';
import {
  Contract, ContractMilestone, ContractClause, ContractActivity, ContractHistoryEntry
} from '../../../../../core/models/contract.model';

type ActiveTab = 'details' | 'milestones' | 'clauses' | 'signature';

@Component({
  selector: 'app-contrat-freelancer-detail',
  templateUrl: './contrat-freelancer-detail.component.html',
  styleUrls: ['./contrat-freelancer-detail.component.css']
})
export class ContratFreelancerDetailComponent implements OnInit, OnDestroy {

  Math = Math;

  // ── DATA ──────────────────────────────────────────────────────
  contract: Contract | null = null;
  summary: string[] = [];
  activities: ContractActivity[] = [];
  historyEntries: ContractHistoryEntry[] = [];

  // ── UI STATE ──────────────────────────────────────────────────
  activeTab: ActiveTab = 'details';
  isLoading = true;
  isSummaryLoading = false;
  isSigning = false;
  isSigningAsClient = false;
  isSubmitting = false;
  summaryLoaded = false;
  errorMessage = '';
  signError = '';
  signSuccess = '';
  showToastMessage = '';
  showToastType: 'success' | 'info' | 'warn' = 'success';
  showToastVisible = false;
  showPdfModal = false;
  showMsModal = false;
  showClauseModal = false;
  showLoadingOverlay = false;
  loadingTitle = '';
  loadingSub = '';

  // ── CONFIRMATION CONTENU ─────────────────────────────────────
  contentConfirmed = false;

  // ── MODAL SIGNATURE CLIENT ────────────────────────────────────
  showSignClientModal = false;
  signClientError = '';
  signClientSuccess = '';

  // ── MILESTONE EDITOR ──────────────────────────────────────────
  editingMsIndex = -1;
  msForm: Partial<ContractMilestone> = {};

  // ── CLAUSE EDITOR ─────────────────────────────────────────────
  editingClauseIndex = 0;
  clauseText = '';

  clauses: ContractClause[] = [
    { id: 1, article: 'Art. 1', title: 'Intellectual Property',
      text: 'All intellectual property rights including code, designs, and assets produced under this contract are transferred to the Client upon full payment of all contract installments.' },
    { id: 2, article: 'Art. 2', title: 'Confidentiality',
      text: 'The Freelancer agrees to maintain strict confidentiality of all information, data, and specifications of the Client for a period of 3 years following the end of this contract.' },
    { id: 3, article: 'Art. 3', title: 'Modifications & Revisions',
      text: 'Minor revision requests (< 2 hours) are included in the agreed price. Major modifications or out-of-scope requests are subject to a separate fee proposal requiring prior written approval from the Client.' },
    { id: 4, article: 'Art. 4', title: 'Termination',
      text: 'In the event of early termination by either party, all payments corresponding to deliverables already completed and accepted remain fully due to the Freelancer.' }
  ];

  private _subs = new Subscription();
  private _toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contractService: ContractService
  ) {}

  // ── LIFECYCLE ─────────────────────────────────────────────────

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadContract(id);
    this._subs.add(
      this.contractService.activities$.subscribe(acts => { this.activities = acts; })
    );
  }

  ngOnDestroy(): void {
    this._subs.unsubscribe();
    if (this._toastTimer) clearTimeout(this._toastTimer);
  }

  // ── USER CONTEXT ──────────────────────────────────────────────

  get currentUserId(): number {
    const id = localStorage.getItem('userId') || localStorage.getItem('freelancerId') || '0';
    return +id;
  }

  get isCurrentUserTheClient(): boolean {
    if (!this.contract?.clientId) return false;
    return this.contract.clientId === this.currentUserId;
  }

  get isCurrentUserTheFreelancer(): boolean {
    if (!this.contract?.freelancerId) return false;
    return this.contract.freelancerId === this.currentUserId;
  }

  // ── LOAD ──────────────────────────────────────────────────────

  loadContract(id: number): void {
    this.isLoading = true;
    this.contractService.getContractById(id).subscribe({
      next: (apiContract) => {
        if (apiContract) {
          this.contract = {
            ...apiContract,
            freelancerName: apiContract.freelancerName || '',
            clientName:     apiContract.clientName     || '',
            clientCompany:  apiContract.clientCompany  || '',
          };
          // Lire l'état de confirmation local (si déjà confirmé auparavant)
          try {
            this.contentConfirmed = this.contract?.id
              ? localStorage.getItem(`contract_confirmed_${this.contract.id}`) === 'true'
              : false;
          } catch {
            this.contentConfirmed = false;
          }
          if (this.contract?.clauses && this.contract.clauses.length > 0) {
            this.clauses = this.contract.clauses;
          }
          // Charger l'historique des modifications (IA)
          this.loadHistory(this.contract!.id);
          this.isLoading = false;
          if (this.contract?.status === 'PENDING_SIGNATURE' || this.contract?.status === 'ACTIVE') {
            this.loadSummary();
          }
        } else {
          this.errorMessage = 'Contract not found.';
          this.isLoading = false;
        }
      },
      error: () => {
        this.errorMessage = 'Error loading contract.';
        this.isLoading = false;
      }
    });
  }

  private loadHistory(contractId: number): void {
    this.contractService.getContractHistory(contractId).subscribe({
      next: (entries) => {
        this.historyEntries = entries;
        // Mapper l'historique vers la liste "Recent Activity" avec résumé AI
        this.activities = entries.map(e => ({
          icon: '📝',
          text: e.aiSummary || e.newValue || e.oldValue || e.action,
          time: '',
          timestamp: new Date(e.performedAt)
        }));
      },
      error: () => {
        // on garde les activités locales si l'historique n'est pas dispo
      }
    });
  }

  private refreshContract(): void {
    if (!this.contract?.id) return;
    this.contractService.getContractById(this.contract.id).subscribe({
      next: (fresh) => {
        if (fresh) {
          this.contract = {
            ...fresh,
            freelancerName: fresh.freelancerName || this.contract?.freelancerName || '',
            clientName:     fresh.clientName     || this.contract?.clientName     || '',
            clientCompany:  fresh.clientCompany  || this.contract?.clientCompany  || '',
          };
        }
      },
      error: () => { /* silencieux */ }
    });
  }

  loadSummary(): void {
    if (!this.contract) return;
    this.isSummaryLoading = true;
    this.contractService.getContractSummary(this.contract.id).subscribe({
      next: (res) => {
        this.summary = res.summary;
        this.summaryLoaded = true;
        this.isSummaryLoading = false;
      },
      error: () => {
        this.summary = [
          `Contract valued at <strong>${this.formatAmount(this.contract!.totalAmount, this.contract!.currency)}</strong> for: ${this.contract!.title}.`,
          `<strong>${this.contract!.milestones?.length || 0} progressive payment milestones</strong>, each conditional upon validation of a deliverable.`,
          'Transfer of <strong>intellectual property</strong> to Client only upon full payment.',
          '3-year <strong>confidentiality clause</strong> post-contract.',
          'Major revisions outside scope subject to a <strong>separate fee proposal</strong>.'
        ];
        this.summaryLoaded = true;
        this.isSummaryLoading = false;
      }
    });
  }

  // ── TABS ──────────────────────────────────────────────────────

  setTab(tab: ActiveTab): void { this.activeTab = tab; }

  // ── WORKFLOW ACTIONS ──────────────────────────────────────────

  /**
   * Le FREELANCER accepte la proposition du client.
   * DRAFT → PENDING_SIGNATURE
   * Appelle PUT /api/contracts/{id}/accept
   */
  acceptClientProposal(): void {
    if (!this.contract) return;
    if (this.contract.status !== 'DRAFT') {
      this.toast('Contract must be in DRAFT status', 'warn');
      return;
    }
    this.showLoading('Accepting proposal…', 'Transitioning to signature phase');
    this.contractService.acceptClientProposal(this.contract.id).subscribe({
      next: (response: any) => {
        this.hideLoading();
        if (this.contract) {
          const newStatus = response?.status || 'PENDING_SIGNATURE';
          this.contract = { ...this.contract, ...response, status: newStatus };
          this.contractService.pushNotification({
            type: 'SIGNATURE_REQUIRED',
            title: 'Contract ready to sign',
            message: 'Proposal accepted. You can now sign electronically.',
            color: 'blue'
          });
          this.contractService.pushActivity('✅', 'Proposal accepted — contract is now PENDING_SIGNATURE');
          this.loadSummary();
          this.setTab('signature');
        }
        this.toast('✅ Proposal accepted — you can now sign the contract', 'success');
      },
      error: (err: any) => {
        this.hideLoading();
        const msg = err.error?.error || err.error?.message || 'Error accepting proposal';
        this.toast('❌ ' + msg, 'warn');
      }
    });
  }

  sendModifications(): void {
    if (!this.contract) return;
    if (this.contract.status !== 'DRAFT' &&
        !(this.contract.status === 'PENDING_SIGNATURE' && !this.contract.freelancerSignedAt)) {
      this.toast('Modifications can only be sent before you sign the contract.', 'warn');
      return;
    }
    this.showLoading('Sending modifications…', 'Client will be notified by email');
    this.contractService.submitModifications(this.contract.id).subscribe({
      next: (res: any) => {
        this.hideLoading();
        // Mettre à jour le statut local (le backend peut repasser PENDING_SIGNATURE → DRAFT)
        const newStatus = res?.status || 'DRAFT';
        this.contract = { ...this.contract!, status: newStatus };
        this.contractService.pushNotification({
          type: 'REVISION_REQUESTED',
          title: 'Modifications submitted',
          message: `The client has been notified of your modifications on "${this.contract?.title}".`,
          color: 'purple'
        });
        this.contractService.pushActivity('📤', 'Modifications sent to client by email');
        this.toast('✅ Modifications sent — client notified by email', 'success');
      },
      error: (err: any) => {
        this.hideLoading();
        const msg = err.error?.error || err.error?.message || 'Error sending modifications';
        this.toast('❌ ' + msg, 'warn');
      }
    });
  }

  // ── CONFIRMATION CONTENU (freelancer a bien lu le contrat) ────

  confirmContractContent(): void {
    if (!this.contract?.id) return;
    try {
      localStorage.setItem(`contract_confirmed_${this.contract.id}`, 'true');
    } catch {
      // ignore storage errors (mode privé, quota, ...)
    }
    // Mettre à jour l'état local pour masquer le bouton
    this.contentConfirmed = true;
    this.toast('✅ Contract content confirmed. You can now sign from the list.', 'success');
  }

  // ── SIGNATURE FREELANCER ──────────────────────────────────────
  //
  //  Conditions pour signer :
  //   ✅ status === PENDING_SIGNATURE  (freelancer a déjà accepté)
  //   ✅ !freelancerSignedAt           (pas encore signé)
  //
  //  Appelle PUT /api/contracts/{id}/sign?role=FREELANCER

  signAsFreelancer(): void {
    if (!this.contract) return;

    // Vérification statut
    if (this.contract.status !== 'PENDING_SIGNATURE') {
      this.toast('The contract must be in PENDING_SIGNATURE status to sign. Accept the proposal first.', 'warn');
      return;
    }

    // Vérification déjà signé
    if (this.contract.freelancerSignedAt) {
      this.toast('You have already signed this contract.', 'info');
      this.refreshContract();
      return;
    }

    this.isSigning = true;
    this.signError = '';
    this.signSuccess = '';
    this.showLoading('Signing in progress…', 'Recording your digital signature');

    this.contractService.signContract(this.contract.id, 'FREELANCER').subscribe({
      next: (response: any) => {
        this.hideLoading();
        this.isSigning = false;

        if (this.contract) {
          this.contract = {
            ...this.contract,
            freelancerSignedAt: response.freelancerSignedAt || new Date().toISOString(),
            clientSignedAt:     response.clientSignedAt    || this.contract.clientSignedAt,
            status:             response.status            || this.contract.status,
            pdfUrl:             response.pdfUrl            || this.contract.pdfUrl
          };
        }

        this.signSuccess = '✅ Your signature has been registered! The client has been notified by email.';

        this.contractService.pushNotification({
          type: 'SIGNATURE_REQUIRED',
          title: 'Signature registered',
          message: 'Your signature has been recorded. The client has received an email to sign.',
          color: 'green'
        });
        this.contractService.pushActivity('✍️', 'Freelancer signed — email sent to client');
        this.toast('✅ Signature registered — email sent to client', 'success');

        if (response.status === 'ACTIVE') {
          this._onContractActivated(response.pdfUrl);
        }

        setTimeout(() => this.refreshContract(), 1000);
      },
      error: (err: any) => {
        this.hideLoading();
        this.isSigning = false;
        const msg = err.error?.error || err.error?.message || 'Error during signing';
        this.signError = msg;
        this.toast('❌ ' + msg, 'warn');

        if (msg.includes('déjà signé') || msg.includes('already signed')) {
          this.refreshContract();
        }
      }
    });
  }

  // ── SIGNATURE CLIENT (depuis la vue détail) ───────────────────

  openSignClientModal(): void {
    if (!this.contract) return;
    if (this.contract.status !== 'PENDING_SIGNATURE') {
      this.toast('Contract must be PENDING_SIGNATURE', 'warn');
      return;
    }
    if (!this.contract.freelancerSignedAt) {
      this.toast('The freelancer must sign first', 'warn');
      return;
    }
    if (this.contract.clientSignedAt) {
      this.toast('You have already signed this contract', 'info');
      return;
    }
    this.signClientError = '';
    this.signClientSuccess = '';
    this.showSignClientModal = true;
  }

  closeSignClientModal(): void {
    this.showSignClientModal = false;
    this.signClientError = '';
    this.signClientSuccess = '';
  }

  confirmSignAsClient(): void {
    if (!this.contract?.id) return;

    this.isSigningAsClient = true;
    this.signClientError = '';
    this.signClientSuccess = '';

    this.contractService.signContract(this.contract.id, 'CLIENT').subscribe({
      next: (response: any) => {
        this.isSigningAsClient = false;
        this.signClientSuccess = '🎉 Your signature has been registered! The contract is now ACTIVE.';

        if (this.contract) {
          this.contract = {
            ...this.contract,
            clientSignedAt: response.clientSignedAt || new Date().toISOString(),
            status:         response.status         || 'ACTIVE',
            pdfUrl:         response.pdfUrl         || this.contract.pdfUrl
          };
        }

        this.contractService.pushNotification({
          type: 'CONTRACT_ACTIVE',
          title: '🎉 Contract ACTIVE!',
          message: 'Both parties signed. PDF generated and sent by email.',
          color: 'green'
        });
        this.contractService.pushActivity('🎉', 'Contract ACTIVE — PDF sent to both parties');

        setTimeout(() => {
          this.closeSignClientModal();
          this.toast('🎉 Contract ACTIVE — PDF sent to both parties by email', 'success');
          this.refreshContract();
        }, 2000);
      },
      error: (err: any) => {
        this.isSigningAsClient = false;
        const msg = err.error?.error || err.error?.message || 'Error during signing';
        this.signClientError = msg;

        if (msg.includes('déjà signé') || msg.includes('already signed')) {
          this.refreshContract();
        }
      }
    });
  }

  private _onContractActivated(pdfUrl?: string): void {
    if (!this.contract) return;
    this.contract = {
      ...this.contract,
      status: 'ACTIVE',
      pdfUrl: pdfUrl || this.contract.pdfUrl
    };
    this.contractService.pushNotification({
      type: 'CONTRACT_ACTIVE',
      title: '🎉 Contract ACTIVE!',
      message: 'Both parties signed. PDF generated and sent by email.',
      color: 'green'
    });
    this.contractService.pushActivity('🎉', 'Contract ACTIVE — PDF sent to both parties');
    this.toast('🎉 Contract ACTIVE — PDF sent to both parties by email', 'success');
  }

  downloadPdf(): void {
    if (this.contract?.pdfUrl) {
      window.open('http://localhost:8087/' + this.contract.pdfUrl, '_blank');
    }
    this.toast('Downloading PDF…', 'success');
  }

  // ── MILESTONE MODAL ───────────────────────────────────────────

  openMsModal(index: number): void {
    this.editingMsIndex = index;
    if (index >= 0 && this.contract?.milestones[index]) {
      const ms = this.contract.milestones[index];
      this.msForm = { ...ms, deadline: this.formatDateForInput(ms.deadline) };
    } else {
      this.msForm = {
        title: '', amount: 0, deadline: '', description: '',
        status: 'PENDING',
        orderIndex: (this.contract?.milestones?.length || 0) + 1
      };
    }
    this.showMsModal = true;
  }

  closeMsModal(): void { this.showMsModal = false; }

  saveMilestone(): void {
    if (!this.msForm.title?.trim()) { this.toast('Title is required', 'warn'); return; }
    if (!this.msForm.amount || this.msForm.amount <= 0) { this.toast('Amount must be > 0', 'warn'); return; }
    if (!this.msForm.deadline?.trim()) { this.toast('Deadline is required', 'warn'); return; }
    if (!this.contract) return;

    const deadlineStr  = this.msForm.deadline!.trim();
    const startDateStr = this.formatDateForInput(this.contract.startDate);
    const endDateStr   = this.formatDateForInput(this.contract.endDate);

    if (deadlineStr < startDateStr) {
      this.toast(`Deadline cannot be before ${this.formatDate(this.contract.startDate)}`, 'warn');
      return;
    }
    if (deadlineStr > endDateStr) {
      this.toast(`Deadline cannot exceed ${this.formatDate(this.contract.endDate)}`, 'warn');
      return;
    }

    this.showLoadingOverlay = true;
    this.loadingTitle = this.editingMsIndex >= 0 ? 'Updating milestone' : 'Adding milestone';
    this.loadingSub = 'Saving…';

    if (this.editingMsIndex >= 0) {
      const milestone = this.contract.milestones?.[this.editingMsIndex];
      if (!milestone?.id) { this.toast('Missing milestone data', 'warn'); this.showLoadingOverlay = false; return; }

      this.contractService.updateMilestone(this.contract.id, milestone.id, {
        title: this.msForm.title,
        amount: this.msForm.amount,
        deadline: this.msForm.deadline,
        description: this.msForm.description
      }).subscribe({
        next: (updated) => {
          const milestones = [...(this.contract!.milestones || [])];
          milestones[this.editingMsIndex] = updated;
          this.contract = { ...this.contract!, milestones, totalAmount: milestones.reduce((s, m) => s + (m.amount || 0), 0) };
          this.contractService.pushActivity('📝', `Milestone "${this.msForm.title}" updated`);
          this.toast('Milestone updated', 'success');
          this.showLoadingOverlay = false;
          this.closeMsModal();
        },
        error: () => {
          const milestones = [...(this.contract!.milestones || [])];
          milestones[this.editingMsIndex] = { ...milestones[this.editingMsIndex], title: this.msForm.title!, amount: this.msForm.amount!, deadline: this.msForm.deadline!, description: this.msForm.description } as ContractMilestone;
          this.contract = { ...this.contract!, milestones, totalAmount: milestones.reduce((s, m) => s + (m.amount || 0), 0) };
          this.toast('Milestone updated locally (API unavailable)', 'info');
          this.showLoadingOverlay = false;
          this.closeMsModal();
        }
      });
    } else {
      this.contractService.addMilestone(this.contract.id, {
        title: this.msForm.title!,
        amount: this.msForm.amount!,
        deadline: this.msForm.deadline!,
        description: this.msForm.description || '',
        orderIndex: (this.contract!.milestones?.length || 0) + 1
      }).subscribe({
        next: (newMilestone) => {
          const milestones = [...(this.contract!.milestones || []), newMilestone];
          this.contract = { ...this.contract!, milestones, totalAmount: milestones.reduce((s, m) => s + (m.amount || 0), 0) };
          this.contractService.pushActivity('➕', `Milestone "${this.msForm.title}" added`);
          this.toast('✅ Milestone added', 'success');
          this.showLoadingOverlay = false;
          this.closeMsModal();
        },
        error: (err) => {
          const errorMsg = err.error?.message || err.error?.error || 'Unable to save';
          this.toast('❌ API Error: ' + errorMsg, 'warn');
          this.showLoadingOverlay = false;
        }
      });
    }
  }

  deleteMilestone(index: number): void {
    if (!this.contract) return;
    const ms = this.contract.milestones[index];
    if (!confirm(`Delete milestone "${ms.title}"?`)) return;

    this.showLoadingOverlay = true;
    this.loadingTitle = 'Deleting milestone';
    this.loadingSub = 'Deleting…';

    this.contractService.deleteMilestone(this.contract.id!, ms.id!).subscribe({
      next: () => {
        const milestones = this.contract!.milestones.filter((_, i) => i !== index);
        this.contract = { ...this.contract!, milestones, totalAmount: milestones.reduce((s, m) => s + (m.amount || 0), 0) };
        this.contractService.pushActivity('🗑️', `Milestone "${ms.title}" deleted`);
        this.toast('Milestone deleted', 'warn');
        this.showLoadingOverlay = false;
      },
      error: () => {
        this.toast('Error deleting milestone', 'warn');
        this.showLoadingOverlay = false;
      }
    });
  }

  // ── CLAUSE MODAL ──────────────────────────────────────────────

  openClauseModal(): void {
    this.editingClauseIndex = 0;
    this.clauseText = this.clauses[0]?.text || '';
    this.showClauseModal = true;
  }

  closeClauseModal(): void { this.showClauseModal = false; }

  onClauseSelect(idx: number): void {
    this.editingClauseIndex = idx;
    this.clauseText = this.clauses[idx]?.text || '';
  }

  saveClause(): void {
    if (!this.clauseText.trim()) { this.toast('Clause text cannot be empty', 'warn'); return; }
    const clause = this.clauses[this.editingClauseIndex];
    if (!clause || !clause.id) { this.toast('Unable to save clause: missing ID', 'warn'); return; }
    if (!this.contract) return;

    this.contractService.updateClause(this.contract.id, clause.id, { text: this.clauseText }).subscribe({
      next: (updatedClause) => {
        this.clauses[this.editingClauseIndex] = { ...updatedClause, modified: true };
        this.contractService.pushActivity('📋', `Clause "${clause.article}" modified`);
        this.toast('Clause saved — client has been notified', 'success');
        this.closeClauseModal();
      },
      error: (err) => {
        this.toast('Error saving clause: ' + (err.error?.error || 'Unknown error'), 'warn');
      }
    });
  }

  formatClauseText(text?: string): string {
    if (!text) return '';
    // Préserver les retours à la ligne dans l'affichage
    return text.replace(/\n/g, '<br>');
  }

  // ── PDF MODAL ─────────────────────────────────────────────────

  openPdfModal(): void  { this.showPdfModal = true; }
  closePdfModal(): void { this.showPdfModal = false; }

  // ── NAVIGATION ────────────────────────────────────────────────

  goBack(): void { this.router.navigate(['/front-office/contracts-freelancer']); }

  // ── HELPERS ───────────────────────────────────────────────────

  getStatusLabel(s: string): string  {
    const map: Record<string, string> = {
      DRAFT: 'Draft',
      PENDING_SIGNATURE: 'Pending signature',
      ACTIVE: 'Active',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      DISPUTED: 'Disputed'
    };
    return map[s] || s;
  }
  getStatusClass(s: string): string  { return this.contractService.getStatusClass(s); }

  formatDate(d: string | undefined): string {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  formatAmount(a: number, c: string): string {
    if (a == null || isNaN(a)) return `0 ${c}`;
    return a.toLocaleString('en-US', { minimumFractionDigits: 0 }) + ' ' + c;
  }

  formatDateForInput(dateStr: string | undefined): string {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().split('T')[0];
  }

  formatDatetime(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  get milestonesTotal(): number {
    return this.contract?.milestones?.reduce((s, m) => s + (m.amount || 0), 0) || 0;
  }

  get getSortedMilestones(): ContractMilestone[] {
    if (!this.contract?.milestones) return [];
    return [...this.contract.milestones].sort((a, b) =>
      new Date(a.deadline || '').getTime() - new Date(b.deadline || '').getTime());
  }

  get milestonesProgress(): number {
    return this.contract ? this.contractService.getMilestonesProgress(this.contract) : 0;
  }

  get milestonesCompletedCount(): number {
    return this.contract?.milestones?.filter(m =>
      m.status === 'COMPLETED' || m.status === 'APPROVED').length || 0;
  }

  getApprovedMilestonesAmount(): number {
    return this.contract?.milestones?.filter(m => m.status === 'APPROVED')
      .reduce((s, m) => s + (m.amount || 0), 0) || 0;
  }

  getApprovedMilestonesPercentage(): number {
    if (!this.contract?.totalAmount) return 0;
    return (this.getApprovedMilestonesAmount() / this.contract.totalAmount) * 100;
  }

  getSignaturesCount(): number {
    return (this.freelancerAlreadySigned ? 1 : 0) + (this.clientAlreadySigned ? 1 : 0);
  }

  getSignaturesPercentage(): number { return this.getSignaturesCount() * 50; }

  get freelancerAlreadySigned(): boolean { return !!this.contract?.freelancerSignedAt; }
  get clientAlreadySigned(): boolean     { return !!this.contract?.clientSignedAt; }
  get bothSigned(): boolean              { return this.freelancerAlreadySigned && this.clientAlreadySigned; }

  getMsStatusLabel(s: string): string {
    const map: Record<string, string> = {
      PENDING: 'To do', IN_PROGRESS: 'In progress', COMPLETED: 'Delivered', APPROVED: 'Approved'
    };
    return map[s] || s;
  }

  getMsStatusClass(s: string): string {
    const map: Record<string, string> = {
      PENDING: 'ms-pending', IN_PROGRESS: 'ms-inprogress',
      COMPLETED: 'ms-completed', APPROVED: 'ms-approved'
    };
    return map[s] || '';
  }

  getProgressStepClass(step: number): string {
    const statusOrder: Record<string, number> = {
      DRAFT: 1, PENDING_SIGNATURE: 3, ACTIVE: 4, COMPLETED: 5
    };
    const current = statusOrder[this.contract?.status || 'DRAFT'] || 0;
    if (step < current) return 'done';
    if (step === current) return 'active';
    return '';
  }

  getTimeAgo(timestamp: Date): string {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return 'Yesterday';
  }

  toast(msg: string, type: 'success' | 'info' | 'warn' = 'success', duration = 3500): void {
    this.showToastMessage = msg;
    this.showToastType = type;
    this.showToastVisible = true;
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => { this.showToastVisible = false; }, duration);
  }

  showLoading(title: string, sub: string): void {
    this.loadingTitle = title;
    this.loadingSub = sub;
    this.showLoadingOverlay = true;
  }
  hideLoading(): void { this.showLoadingOverlay = false; }
}