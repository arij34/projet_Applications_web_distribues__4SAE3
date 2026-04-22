import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * 🔐 DocuSign eSignature Service
 * Gère la communication avec l'API de signature électronique
 */

export interface SignatureRequest {
  signerEmail: string;
  signerName: string;
}

export interface SignatureResponse {
  message: string;
  contractId: number;
  envelopeId: string;
  signingUrl: string;
}

export interface SignatureStatus {
  contractId: number;
  envelopeId: string;
  signatureStatus: 'PENDING' | 'SIGNED' | 'REJECTED' | 'EXPIRED';
  docuSignStatus: string;
  signedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocuSignService {
  private readonly API_URL = 'http://localhost:8087/api/contracts';

  constructor(private http: HttpClient) {}

  /**
   * Envoyer le contrat pour signature électronique
   * @param contractId ID du contrat
   * @param request Les infos du signataire
   * @returns Observable avec l'URL de signature
   */
  sendForSignature(contractId: number, request: SignatureRequest): Observable<SignatureResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<SignatureResponse>(
      `${this.API_URL}/${contractId}/send-for-signature`,
      request,
      { headers }
    );
  }

  /**
   * Obtenir le statut actuel de la signature
   * @param contractId ID du contrat
   * @returns Observable avec le statut
   */
  getSignatureStatus(contractId: number): Observable<SignatureStatus> {
    const headers = this.getAuthHeaders();
    return this.http.get<SignatureStatus>(
      `${this.API_URL}/${contractId}/signature-status`,
      { headers }
    );
  }

  /**
   * Télécharger le document signé en PDF
   * @param contractId ID du contrat
   * @returns Observable avec le blob PDF
   */
  downloadSignedDocument(contractId: number): Observable<Blob> {
    const headers = this.getAuthHeaders();
    return this.http.get(
      `${this.API_URL}/${contractId}/download-signed`,
      { headers, responseType: 'blob' }
    );
  }

  /**
   * Helper pour obtenir les headers d'authentification
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token') || '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  /**
   * Télécharger un fichier blob
   */
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
