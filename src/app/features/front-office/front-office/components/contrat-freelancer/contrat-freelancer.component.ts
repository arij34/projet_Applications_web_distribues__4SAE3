// ─────────────────────────────────────────────────────────────
//  CONTRAT-FREELANCER  –  List Component  (CORRIGÉ)
//
//  Flux exact :
//   DRAFT → [acceptProposal → /accept] → PENDING_SIGNATURE
//         → [openSignModal → /sign?role=FREELANCER] → freelancerSignedAt set
//         → Email au client → Client signe → ACTIVE + PDF
//
//  Règles d'affichage boutons :
//   • DRAFT       → bouton "Accept proposal" uniquement
//   • PENDING_SIGNATURE && !freelancerSignedAt → bouton "Sign electronically"
//   • PENDING_SIGNATURE && freelancerSignedAt && !clientSignedAt → badge "You signed — client notified"
//   • ACTIVE && pdfUrl → lien "Download signed PDF"
// ─────────────────────────────────────────────────────────────

import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ContractService } from '../../../../../core/services/contract.service';
import { Contract, ContractNotification } from '../../../../../core/models/contract.model';
import { AuthService } from '../../../../../core/auth/auth.service';

@Component({
  selector: 'app-contrat-freelancer',
  templateUrl: './contrat-freelancer.component.html',
  styleUrls: ['./contrat-freelancer.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ContratFreelancerComponent implements OnInit, OnDestroy {

  // ── DATA ──────────────────────────────────────────────────────
  contracts: Contract[] = [];
  filteredContracts: Contract[] = [];
  notifications: ContractNotification[] = [];
  unreadCount = 0;

  // ── UI STATE ──────────────────────────────────────────────────
  activeFilter: 'ALL' | 'DRAFT' | 'PENDING_SIGNATURE' | 'ACTIVE' | 'COMPLETED' = 'ALL';
  searchQuery = '';
  isLoading = true;
  errorMessage = '';
  showNotifPanel = false;

  // ── SIGNATURE MODAL STATE ─────────────────────────────────────
  showSignModal = false;
  selectedContract: Contract | null = null;
  isSigningLoading = false;
  signError = '';
  signSuccess = '';

  // Canvas signature
  isDrawing = false;
  hasDrawn = false;
  private ctx: CanvasRenderingContext2D | null = null;
  private canvas: HTMLCanvasElement | null = null;

  // Step du modal : 'draw' | 'confirm' | 'done'
  signStep: 'draw' | 'confirm' | 'done' = 'draw';

  // ── USER ──────────────────────────────────────────────────────
  freelancerId = 0;

  private _subs = new Subscription();

  constructor(
    private contractService: ContractService,
    private router: Router,
    private authService: AuthService
  ) {}

  // ── LIFECYCLE ─────────────────────────────────────────────────

  ngOnInit(): void {
    const id = localStorage.getItem('userId') || localStorage.getItem('freelancerId');
    this.freelancerId = id ? +id : 0;
    this.loadContracts();

    this._subs.add(
      this.contractService.notifications$.subscribe(notifs => {
        this.notifications = notifs;
        this.unreadCount = notifs.filter(n => !n.read).length;
      })
    );
  }

  ngOnDestroy(): void {
    this._subs.unsubscribe();
  }

  // ── LOAD ──────────────────────────────────────────────────────

  loadContracts(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.contractService.getAllContracts().subscribe({
      next: (data: Contract[]) => {
        this.contracts = this.freelancerId > 0
          ? data.filter(c => c.freelancerId === this.freelancerId)
          : data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les contrats.';
        this.isLoading = false;
      }
    });
  }

  // ── FILTERS ───────────────────────────────────────────────────

  applyFilters(): void {
    let result = [...this.contracts];
    if (this.activeFilter !== 'ALL') {
      result = result.filter(c => c.status === this.activeFilter);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(c =>
        c.title.toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q) ||
        (c.clientName || '').toLowerCase().includes(q)
      );
    }
    this.filteredContracts = result;
  }

  setFilter(f: 'ALL' | 'DRAFT' | 'PENDING_SIGNATURE' | 'ACTIVE' | 'COMPLETED'): void {
    this.activeFilter = f;
    this.applyFilters();
  }

  onSearchChange(): void { this.applyFilters(); }

  // ── NAVIGATION ────────────────────────────────────────────────

  viewContract(id: number): void {
    this.router.navigate(['/front-office/contracts-freelancer', id]);
  }

  // ── CONFIRMATION STATE (freelancer doit confirmer le contenu avant de signer) ─

  private hasConfirmedContract(contractId: number): boolean {
    try {
      return localStorage.getItem(`contract_confirmed_${contractId}`) === 'true';
    } catch {
      return false;
    }
  }

  // ── SIGNATURE STATE (empêcher une seconde signature dans le même navigateur) ─

  private isLocallySigned(contractId: number): boolean {
    try {
      return localStorage.getItem(`contract_signed_${contractId}`) === 'true';
    } catch {
      return false;
    }
  }

  // ── ÉTAPE 1 : ACCEPTER LA PROPOSITION (DRAFT → PENDING_SIGNATURE) ─────────
  //
  //  Le freelancer accepte le contrat tel quel.
  //  Appelle PUT /api/contracts/{id}/accept
  //  → Le backend passe le statut à PENDING_SIGNATURE
  //  → Un email est envoyé au freelancer pour qu'il signe

  acceptProposal(contract: Contract, event: Event): void {
    event.stopPropagation();
    if (contract.status !== 'DRAFT') return;

    this.contractService.acceptClientProposal(contract.id).subscribe({
      next: (res: any) => {
        // Mise à jour locale du statut
        const idx = this.contracts.findIndex(c => c.id === contract.id);
        if (idx !== -1) {
          this.contracts[idx] = {
            ...this.contracts[idx],
            status: res.status || 'PENDING_SIGNATURE'
          };
          this.applyFilters();
        }
        this.contractService.pushNotification({
          type: 'SIGNATURE_REQUIRED',
          title: '✅ Proposition acceptée',
          message: `Vous avez accepté le contrat "${contract.title}". Vous pouvez maintenant le signer électroniquement.`,
          color: 'green'
        });
      },
      error: (err: any) => {
        const msg = err.error?.error || err.error?.message || 'Erreur lors de l\'acceptation';
        this.contractService.pushNotification({
          type: 'SIGNATURE_REQUIRED',
          title: '❌ Erreur',
          message: msg,
          color: 'red'
        });
      }
    });
  }

  // ── ÉTAPE 2 : SIGNER ÉLECTRONIQUEMENT (PENDING_SIGNATURE, pas encore signé) ─
  //
  //  Visible uniquement si : status === PENDING_SIGNATURE && !freelancerSignedAt
  //  Ouvre le modal canvas de signature.

  openSignModal(contract: Contract, event: Event): void {
    event.stopPropagation();
    // Toujours rafraîchir depuis le backend pour connaître l'état réel
    this.contractService.getContractById(contract.id).subscribe({
      next: (fresh: Contract) => {
        // Synchroniser la liste locale
        const idx = this.contracts.findIndex(c => c.id === fresh.id);
        if (idx !== -1) {
          this.contracts[idx] = { ...this.contracts[idx], freelancerSignedAt: fresh.freelancerSignedAt, status: fresh.status };
          this.applyFilters();
        }

        // Si le contrat n'est plus en attente de signature (ex: vous avez envoyé
        // des modifications et le client doit les accepter) → bloquer ouverture
        if (fresh.status !== 'PENDING_SIGNATURE') {
          let msg = `Le contrat n'est pas en attente de votre signature.`;
          let title = 'Signature indisponible';
          let color: 'amber' | 'green' | 'red' = 'amber';

          if (fresh.status === 'DRAFT') {
            msg = `Vous avez modifié ce contrat ou envoyé des modifications.
Veuillez attendre la confirmation du client avant de signer.`;
            title = 'Attendre la confirmation du client';
          } else if (fresh.status === 'ACTIVE') {
            msg = `Le contrat est déjà actif. Aucune nouvelle signature n'est nécessaire.`;
            title = 'Contrat déjà actif';
            color = 'green';
          }

          alert(msg);
          this.contractService.pushNotification({
            type: 'SIGNATURE_REQUIRED',
            title,
            message: msg,
            color
          });
          return;
        }

        // Si déjà signé côté freelancer → bloquer ouverture
        if (fresh.freelancerSignedAt || this.isLocallySigned(fresh.id)) {
          alert('Votre contrat a déjà été signé. Aucune nouvelle signature n\'est possible.');
          this.contractService.pushNotification({
            type: 'SIGNATURE_REQUIRED',
            title: 'Contrat déjà signé',
            message: `Votre contrat "${fresh.title}" a déjà été signé.`,
            color: 'green'
          });
          return;
        }

        // ✅ Sécurité UX : obliger le freelancer à confirmer le contenu d'abord
        if (!this.hasConfirmedContract(fresh.id)) {
          alert('Veuillez d\'abord confirmer le contenu du contrat dans la page de détails (onglet Details), puis vous pourrez signer électroniquement.');
          this.contractService.pushNotification({
            type: 'SIGNATURE_REQUIRED',
            title: 'Confirmation requise',
            message: `Confirmez le contenu du contrat depuis l\'onglet Details avant de signer électroniquement.`,
            color: 'amber'
          });
          return;
        }

        // Tout est OK → ouvrir le modal avec les données fraîches
        this.selectedContract = fresh;
        this.signStep = 'draw';
        this.hasDrawn = false;
        this.signError = '';
        this.signSuccess = '';
        this.isSigningLoading = false;
        this.showSignModal = true;
        setTimeout(() => this.initCanvas(), 200);
      },
      error: () => {
        // En cas d'erreur API, on ne tente pas de signer à l'aveugle
        alert('Impossible de récupérer l\'état du contrat. Merci de réessayer plus tard.');
        this.contractService.pushNotification({
          type: 'SIGNATURE_REQUIRED',
          title: 'Erreur de chargement',
          message: `Impossible de vérifier l\'état du contrat avant la signature.`,
          color: 'red'
        });
      }
    });
  }

  closeSignModal(): void {
    if (this.isSigningLoading) return;
    this.showSignModal = false;
    this.selectedContract = null;
    this.signStep = 'draw';
    this.hasDrawn = false;
    this.signError = '';
    this.signSuccess = '';
    this.ctx = null;
    this.canvas = null;
  }

  // ── CANVAS ────────────────────────────────────────────────────

  initCanvas(): void {
    this.canvas = document.getElementById('signatureCanvas') as HTMLCanvasElement;
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx = this.canvas.getContext('2d');
    if (this.ctx) {
      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      this.ctx.strokeStyle = '#1e293b';
      this.ctx.lineWidth = 2.5;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
    }
  }

  onMouseDown(event: MouseEvent): void {
    if (!this.ctx || !this.canvas) return;
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.beginPath();
    this.ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top);
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isDrawing || !this.ctx || !this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    this.ctx.stroke();
    this.hasDrawn = true;
  }

  onMouseUp(): void { this.isDrawing = false; }
  onMouseLeave(): void { this.isDrawing = false; }

  onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    if (!this.ctx || !this.canvas) return;
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    const touch = event.touches[0];
    this.ctx.beginPath();
    this.ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
  }

  onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (!this.isDrawing || !this.ctx || !this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const touch = event.touches[0];
    this.ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    this.ctx.stroke();
    this.hasDrawn = true;
  }

  onTouchEnd(): void { this.isDrawing = false; }

  clearSignature(): void {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.hasDrawn = false;
  }

  goToConfirm(): void {
    if (!this.hasDrawn) return;
    this.signStep = 'confirm';
    setTimeout(() => {
      const preview = document.getElementById('signaturePreview') as HTMLCanvasElement;
      if (preview && this.canvas) {
        const previewCtx = preview.getContext('2d');
        if (previewCtx) {
          previewCtx.clearRect(0, 0, preview.width, preview.height);
          previewCtx.drawImage(this.canvas, 0, 0, preview.width, preview.height);
        }
      }
    }, 80);
  }

  goBackToDraw(): void {
    this.signStep = 'draw';
    setTimeout(() => this.initCanvas(), 100);
  }

  // ── CONFIRMER ET SIGNER (appel API) ───────────────────────────
  //
  //  PUT /api/contracts/{id}/sign?role=FREELANCER
  //  → Le backend enregistre freelancerSignedAt
  //  → Email envoyé au CLIENT pour qu'il signe à son tour

  confirmAndSign(): void {
    if (!this.selectedContract || this.isSigningLoading) return;

    this.isSigningLoading = true;
    this.signError = '';

    // Extraire l'image de signature depuis le canvas (base64 PNG)
    let signatureImageData: string | undefined;
    try {
      if (this.canvas) {
        signatureImageData = this.canvas.toDataURL('image/png');
      }
    } catch {
      signatureImageData = undefined;
    }

    this.contractService.signContract(this.selectedContract.id, 'FREELANCER', signatureImageData).subscribe({
      next: (res: any) => {
        this.isSigningLoading = false;
        this.signStep = 'done';
        this.signSuccess = res.message || '✅ Signature enregistrée. Le client a été notifié par email.';

        // Marquer localement le contrat comme signé pour bloquer toute future ouverture
        try {
          localStorage.setItem(`contract_signed_${this.selectedContract!.id}`, 'true');
        } catch {
          // ignore
        }

        // Mise à jour locale immédiate
        const idx = this.contracts.findIndex(c => c.id === this.selectedContract!.id);
        if (idx !== -1) {
          this.contracts[idx] = {
            ...this.contracts[idx],
            freelancerSignedAt: res.freelancerSignedAt || new Date().toISOString(),
            status: res.status || this.contracts[idx].status
          };
          this.applyFilters();
        }

        this.contractService.pushNotification({
          type: 'SIGNATURE_REQUIRED',
          title: '✍️ Contrat signé',
          message: `Signature enregistrée sur "${this.selectedContract?.title}". Un email a été envoyé au client.`,
          color: 'green'
        });

        // Recharger après 3 secondes
        setTimeout(() => this.loadContracts(), 3000);
      },
      error: (err: any) => {
        this.isSigningLoading = false;
        const msg = err.error?.error || err.error?.message || 'Erreur lors de la signature.';
        this.signError = msg;

        // Si le backend indique que le contrat est déjà signé,
        // on bloque désormais toute nouvelle tentative côté UI.
        const lower = (msg || '').toString().toLowerCase();
        if (lower.includes('déjà signé') || (lower.includes('already') && lower.includes('sign'))) {
          try {
            localStorage.setItem(`contract_signed_${this.selectedContract!.id}`, 'true');
          } catch {
            // ignore
          }

          const idx = this.contracts.findIndex(c => c.id === this.selectedContract!.id);
          if (idx !== -1) {
            this.contracts[idx] = {
              ...this.contracts[idx],
              freelancerSignedAt: this.contracts[idx].freelancerSignedAt || new Date().toISOString()
            };
            this.applyFilters();
          }

          this.contractService.pushNotification({
            type: 'SIGNATURE_REQUIRED',
            title: 'Contrat déjà signé',
            message: `Votre contrat "${this.selectedContract?.title}" est déjà signé.`,
            color: 'green'
          });

          // On peut fermer le modal pour éviter d'autres tentatives immédiates
          this.closeSignModal();
        }
      }
    });
  }

  // ── HELPERS AFFICHAGE ─────────────────────────────────────────

  /**
   * Bouton "Sign electronically" visible tant que :
   *  - le contrat n'est pas ACTIVE / COMPLETED
   *  - le freelancer n'a pas encore signé (ni côté backend, ni en localStorage)
   *
   * Même si le statut est DRAFT après l'envoi de modifications, le bouton
   * reste visible : au clic, openSignModal affichera une alerte demandant
   * d'attendre la confirmation du client.
   */
  canAttemptSign(contract: Contract): boolean {
    if (contract.status === 'ACTIVE'
      || contract.status === 'COMPLETED'
      || contract.status === 'CANCELLED') {
      return false;
    }
    if (contract.freelancerSignedAt || this.isLocallySigned(contract.id)) {
      return false;
    }
    return true;
  }

  /**
   * Retourne true si le bouton "Sign electronically" doit être affiché.
   * Conditions : PENDING_SIGNATURE ET le freelancer n'a PAS encore signé.
   */
  hasPendingSignature(contract: Contract): boolean {
    return contract.status === 'PENDING_SIGNATURE'
      && !contract.freelancerSignedAt
      && !this.isLocallySigned(contract.id);
  }

  /**
   * Retourne true si le freelancer a signé mais le client n'a pas encore signé.
   * Affiche le badge "You signed — client notified".
   */
  freelancerSignedClientPending(contract: Contract): boolean {
    return contract.status === 'PENDING_SIGNATURE'
      && !!contract.freelancerSignedAt
      && !contract.clientSignedAt;
  }

  /**
   * Contrat actif avec PDF disponible.
   */
  isActiveWithPdf(contract: Contract): boolean {
    return contract.status === 'ACTIVE' && !!contract.pdfUrl;
  }

  /**
   * URL complète du PDF signé.
   */
  getPdfUrl(contract: Contract): string {
    return 'http://localhost:8087/' + contract.pdfUrl;
  }

  isUrgent(contract: Contract): boolean {
    return contract.status === 'DRAFT' || contract.status === 'PENDING_SIGNATURE';
  }

  // ── NOTIFICATIONS ─────────────────────────────────────────────

  toggleNotifPanel(): void { this.showNotifPanel = !this.showNotifPanel; }

  markAllRead(): void {
    this.contractService.markAllRead();
    this.showNotifPanel = false;
  }

  getNotifIcon(color: string): string {
    const icons: Record<string, string> = {
      blue:   'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z',
      green:  'M20 6L9 17l-5-5',
      amber:  'M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
      purple: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
      red:    'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'
    };
    return icons[color] || icons['blue'];
  }

  getTimeAgo(timestamp: Date): string {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'À l\'instant';
    if (mins < 60) return `Il y a ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Il y a ${hrs}h`;
    return 'Hier';
  }

  countByStatus(status: string): number {
    if (status === 'ALL') return this.contracts.length;
    return this.contracts.filter(c => c.status === status).length;
  }

  // Libellé de statut affiché sur la carte.
  // Cas particulier : si le statut est PENDING_SIGNATURE mais que le freelancer a déjà signé,
  // on affiche "En attente client" pour éviter la confusion "À signer" côté freelancer.
  getCardStatusLabel(c: Contract): string {
    if (c.status === 'PENDING_SIGNATURE') {
      if (c.freelancerSignedAt && !c.clientSignedAt) {
        return 'En attente de la signature du client';
      }
    }
    return this.contractService.getStatusLabel(c.status);
  }

  getStatusLabel(s: string): string  { return this.contractService.getStatusLabel(s); }
  getStatusClass(s: string): string  { return this.contractService.getStatusClass(s); }
  formatDate(d: string | undefined): string { return this.contractService.formatDate(d); }
  formatAmount(a: number, c: string): string { return this.contractService.formatAmount(a, c); }
  getMilestonesProgress(c: Contract): number { return this.contractService.getMilestonesProgress(c); }
}