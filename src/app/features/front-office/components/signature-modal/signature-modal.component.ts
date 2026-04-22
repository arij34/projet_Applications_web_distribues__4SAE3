import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { DocuSignService, SignatureStatus } from '../../../../core/services/docusign.service';

/**
 * 📝 Signature Modal Component
 * Modal pour gérer la signature électronique des contrats
 */

@Component({
  selector: 'app-signature-modal',
  templateUrl: './signature-modal.component.html',
  styleUrls: ['./signature-modal.component.css']
})
export class SignatureModalComponent implements OnInit {
  @Input() contractId: number = 0;
  @Input() contractTitle: string = '';
  @Input() freelancerEmail: string = '';
  @Input() freelancerName: string = '';
  @Input() isOpen: boolean = false;
  
  @Output() close = new EventEmitter<void>();
  @Output() signatureCompleted = new EventEmitter<void>();

  // Form fields
  signerEmail: string = '';
  signerName: string = '';

  // State
  isLoading: boolean = false;
  isPolling: boolean = false;
  error: string = '';
  success: string = '';
  signingUrl: string = '';
  pollingCount: number = 0;
  maxPollingAttempts: number = 30; // 5 minutes avec intervalle de 10s

  signatureStatus: SignatureStatus | null = null;

  constructor(private docuSignService: DocuSignService) {}

  ngOnInit(): void {
    // Pré-remplir avec les données du freelancer
    if (!this.signerEmail && this.freelancerEmail) {
      this.signerEmail = this.freelancerEmail;
    }
    if (!this.signerName && this.freelancerName) {
      this.signerName = this.freelancerName;
    }
  }

  /**
   * Valider et envoyer le contrat pour signature
   */
  submitForSignature(): void {
    // Validation
    if (!this.signerEmail || !this.signerName) {
      this.error = 'Veuillez entrer le nom et l\'email du signataire';
      return;
    }

    if (!this.isValidEmail(this.signerEmail)) {
      this.error = 'Adresse email invalide';
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.success = '';

    this.docuSignService.sendForSignature(this.contractId, {
      signerEmail: this.signerEmail,
      signerName: this.signerName
    }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.success = '✅ Contrat envoyé pour signature !';
        this.signingUrl = response.signingUrl;
        
        // Afficher le message de confirmation et redirection
        setTimeout(() => {
          this.redirectToSigning();
        }, 2000);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Erreur lors de l\'envoi du contrat pour signature';
        console.error('Signature error:', err);
      }
    });
  }

  /**
   * Rediriger vers DocuSign pour la signature
   */
  redirectToSigning(): void {
    if (this.signingUrl) {
      window.location.href = this.signingUrl;
    }
  }

  /**
   * Ouvrir l'URL de signature dans une nouvelle fenêtre
   */
  openSigningInNewTab(): void {
    if (this.signingUrl) {
      window.open(this.signingUrl, '_blank');
      // Commencer à vérifier le statut
      this.startPollingSignatureStatus();
    }
  }

  /**
   * Vérifier le statut de la signature (polling)
   */
  startPollingSignatureStatus(): void {
    if (this.isPolling) return;
    
    this.isPolling = true;
    this.pollingCount = 0;
    this.pollStatus();
  }

  /**
   * Boucle de polling - vérifier toutes les 10 secondes
   */
  private pollStatus(): void {
    if (this.pollingCount >= this.maxPollingAttempts) {
      this.isPolling = false;
      this.error = 'Vérification du statut terminée. Le contrat est-il signé ?';
      return;
    }

    setTimeout(() => {
      this.docuSignService.getSignatureStatus(this.contractId).subscribe({
        next: (status: any) => {
          this.signatureStatus = status;

          if (status.signatureStatus === 'SIGNED') {
            this.isPolling = false;
            this.success = '✅ Contrat signé avec succès !';
            setTimeout(() => {
              this.signatureCompleted.emit();
              this.closeModal();
            }, 2000);
          } else if (status.signatureStatus === 'REJECTED' || status.signatureStatus === 'EXPIRED') {
            this.isPolling = false;
            this.error = `Signature ${status.signatureStatus === 'REJECTED' ? 'rejetée' : 'expirée'}`;
          } else {
            // Continuer le polling
            this.pollingCount++;
            this.pollStatus();
          }
        },
        error: (err: any) => {
          // Continuer malgré l'erreur lors du polling
          this.pollingCount++;
          this.pollStatus();
        }
      });
    }, 10000); // Vérifier toutes les 10 secondes
  }

  /**
   * Télécharger le document signé
   */
  downloadSignedDocument(): void {
    this.isLoading = true;
    this.docuSignService.downloadSignedDocument(this.contractId).subscribe({
      next: (blob: Blob) => {
        this.isLoading = false;
        const filename = `${this.contractTitle.replace(/[^a-z0-9]/gi, '_')}_signed_${Date.now()}.pdf`;
        this.docuSignService.downloadFile(blob, filename);
        this.success = '✅ Document téléchargé avec succès !';
      },
      error: (err: any) => {
        this.isLoading = false;
        this.error = 'Erreur lors du téléchargement du document signé';
        console.error('Download error:', err);
      }
    });
  }

  /**
   * Fermer le modal
   */
  closeModal(): void {
    this.isPolling = false;
    this.pollingCount = 0;
    this.error = '';
    this.success = '';
    this.signingUrl = '';
    this.signatureStatus = null;
    this.signerEmail = '';
    this.signerName = '';
    this.close.emit();
  }

  /**
   * Valider format email
   */
  private isValidEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * Obtenir le texte du statut à afficher
   */
  getStatusText(): string {
    if (!this.signatureStatus) return '';
    switch (this.signatureStatus.signatureStatus) {
      case 'PENDING':
        return '⏳ En attente de signature...';
      case 'SIGNED':
        return '✅ Contrat signé !';
      case 'REJECTED':
        return '❌ Signature rejetée';
      case 'EXPIRED':
        return '⏰ Signature expirée';
      default:
        return '';
    }
  }
}
