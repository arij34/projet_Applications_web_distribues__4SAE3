// ─────────────────────────────────────────────────────────────
//  CONTRACT SERVICE  –  Freelancy Platform
//  src/app/core/services/contract.service.ts
// ─────────────────────────────────────────────────────────────

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Contract, ContractMilestone, ContractClause, ContractNotification, ContractActivity, ContractHistoryEntry } from '../models/contract.model';

@Injectable({ providedIn: 'root' })
export class ContractService {

  private readonly BASE = 'http://localhost:8087/api/contracts';
  private readonly PAYMENTS_BASE = 'http://localhost:8087/api/payments';

  // ── Notification & Activity streams ──────────────────────────
  private _notifications$ = new BehaviorSubject<ContractNotification[]>([]);
  private _activities$    = new BehaviorSubject<ContractActivity[]>([]);

  notifications$ = this._notifications$.asObservable();
  activities$    = this._activities$.asObservable();

  constructor(private http: HttpClient) {
    this._initMockNotifications();
  }

  // ── HTTP HEADERS ─────────────────────────────────────────────
  // ✅ FIX : fallback sur toutes les clés possibles utilisées dans l'app
  private headers(): HttpHeaders {
    const token = localStorage.getItem('access_token')
               || localStorage.getItem('token')
               || localStorage.getItem('authToken')
               || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // ── CONTRACT CRUD ─────────────────────────────────────────────

  getAllContracts(): Observable<Contract[]> {
    return this.http.get<Contract[]>(this.BASE, { headers: this.headers() });
  }

  getContractById(id: number): Observable<Contract> {
    return this.http.get<Contract>(`${this.BASE}/${id}`, { headers: this.headers() });
  }

  getContractsByProject(projectId: number): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.BASE}/project/${projectId}`, { headers: this.headers() });
  }

  // ── MILESTONE OPERATIONS ──────────────────────────────────────

  updateMilestone(contractId: number, milestoneId: number, data: Partial<ContractMilestone>): Observable<ContractMilestone> {
    return this.http.put<ContractMilestone>(
      `${this.BASE}/${contractId}/milestones/${milestoneId}`,
      data,
      { headers: this.headers() }
    );
  }

  addMilestone(contractId: number, data: {
    title: string;
    amount: number;
    deadline: string;
    description?: string;
    orderIndex?: number;
  }): Observable<ContractMilestone> {
    return this.http.post<ContractMilestone>(
      `${this.BASE}/${contractId}/milestones`,
      data,
      { headers: this.headers() }
    );
  }

  deleteMilestone(contractId: number, milestoneId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.BASE}/${contractId}/milestones/${milestoneId}`,
      { headers: this.headers() }
    );
  }

  // ── CLAUSE OPERATIONS ─────────────────────────────────────────

  updateClause(contractId: number, clauseId: number, data: Partial<ContractClause>): Observable<ContractClause> {
    return this.http.put<ContractClause>(
      `${this.BASE}/${contractId}/clauses/${clauseId}`,
      data,
      { headers: this.headers() }
    );
  }

  // ── CONTRACT WORKFLOW ─────────────────────────────────────────

  /** Freelancer envoie ses modifications au client */
  submitModifications(contractId: number): Observable<any> {
    return this.http.put(
      `${this.BASE}/${contractId}/send-modifications`,
      {},
      { headers: this.headers() }
    );
  }

  /** Client accepte directement la proposition → PENDING_SIGNATURE */
  acceptClientProposal(contractId: number): Observable<any> {
    return this.http.put(
      `${this.BASE}/${contractId}/accept`,
      {},
      { headers: this.headers() }
    );
  }

  /** Client accepte les modifications du freelancer → PENDING_SIGNATURE */
  clientAcceptModifications(contractId: number): Observable<any> {
    return this.http.put(
      `${this.BASE}/${contractId}/accept-modifications`,
      {},
      { headers: this.headers() }
    );
  }

  /** Client refuse les modifications du freelancer → DISPUTED */
  clientRejectModifications(contractId: number): Observable<any> {
    return this.http.put(
      `${this.BASE}/${contractId}/reject-modifications`,
      {},
      { headers: this.headers() }
    );
  }

  /** Résumé IA en 5 points */
  getContractSummary(contractId: number): Observable<{ contractId: number; summary: string[] }> {
    // Hint the backend to respond in English when generating the AI summary
    const headers = this.headers().set('Accept-Language', 'en');
    return this.http.get<{ contractId: number; summary: string[] }>(
      `${this.BASE}/${contractId}/summary?lang=en`,
      { headers }
    );
  }

  /** Historique complet des modifications du contrat (backend) */
  getContractHistory(contractId: number): Observable<ContractHistoryEntry[]> {
    return this.http.get<ContractHistoryEntry[]>(
      `${this.BASE}/${contractId}/history`,
      { headers: this.headers() }
    );
  }

  // ── PAYMENTS (FAKE PROVIDER) ─────────────────────────────────

  /**
   * Initialise un paiement fictif pour une milestone et renvoie
   * l'ID du paiement + l'URL de fake checkout.
   */
  initMilestonePayment(milestoneId: number, clientId: number): Observable<{ paymentId: number; amount: number; status: string; redirectUrl: string }> {
    return this.http.post<{ paymentId: number; amount: number; status: string; redirectUrl: string }>(
      `${this.PAYMENTS_BASE}/milestones/${milestoneId}/init?clientId=${clientId}`,
      {},
      { headers: this.headers() }
    );
  }

  /**
   * Simule le callback du prestataire (succès/échec) pour un
   * paiement donné. Utile pour les tests académiques.
   */
  simulatePayment(paymentId: number, success: boolean): Observable<{ paymentId: number; status: string; paidAt?: string }> {
    return this.http.post<{ paymentId: number; status: string; paidAt?: string }>(
      `${this.PAYMENTS_BASE}/${paymentId}/simulate?success=${success}`,
      {},
      { headers: this.headers() }
    );
  }

  /** Signer le contrat (optionnellement avec image de signature en base64) */
  signContract(contractId: number, role: 'FREELANCER' | 'CLIENT', signatureImageData?: string): Observable<any> {
    const body = signatureImageData ? { signatureImageData } : {};
    return this.http.put(
      `${this.BASE}/${contractId}/sign?role=${role}`,
      body,
      { headers: this.headers() }
    );
  }

  /** Soumettre pour signature */
  submitForSignature(contractId: number): Observable<any> {
    return this.http.put(
      `${this.BASE}/${contractId}/submit`,
      {},
      { headers: this.headers() }
    );
  }

  // ── NOTIFICATION MANAGEMENT ───────────────────────────────────

  pushNotification(notif: Omit<ContractNotification, 'id' | 'timestamp' | 'read'>): void {
    const current = this._notifications$.getValue();
    const newNotif: ContractNotification = {
      ...notif,
      id: `notif_${Date.now()}`,
      timestamp: new Date(),
      read: false
    };
    this._notifications$.next([newNotif, ...current]);
  }

  markAllRead(): void {
    const updated = this._notifications$.getValue().map(n => ({ ...n, read: true }));
    this._notifications$.next(updated);
  }

  get unreadCount(): number {
    return this._notifications$.getValue().filter(n => !n.read).length;
  }

  // ── ACTIVITY MANAGEMENT ───────────────────────────────────────

  pushActivity(icon: string, text: string): void {
    const current = this._activities$.getValue();
    this._activities$.next([
      { icon, text, time: 'À l\'instant', timestamp: new Date() },
      ...current
    ]);
  }

  // ── MOCK INIT ─────────────────────────────────────────────────

  private _initMockNotifications(): void {
    this._notifications$.next([
      {
        id: 'n1', type: 'DRAFT_RECEIVED',
        title: 'Nouveau contrat — Brouillon',
        message: 'TechStart SARL vous a envoyé un contrat de 8 000 TND à réviser et valider.',
        timestamp: new Date(Date.now() - 5 * 60000), read: false, color: 'blue'
      },
      {
        id: 'n2', type: 'REVISION_REQUESTED',
        title: 'Révision demandée',
        message: 'Le client souhaite modifier le montant du milestone 2 (Backend & API).',
        timestamp: new Date(Date.now() - 22 * 60000), read: false, color: 'amber'
      },
      {
        id: 'n3', type: 'PAYMENT_RECEIVED',
        title: 'Paiement reçu',
        message: 'Milestone 1 — App mobile fintech · 2 500 TND crédités.',
        timestamp: new Date(Date.now() - 24 * 3600000), read: true, color: 'green'
      }
    ]);

    this._activities$.next([
      { icon: '📄', text: 'Contrat envoyé en brouillon par TechStart SARL', time: 'Il y a 5 min', timestamp: new Date(Date.now() - 5 * 60000) },
      { icon: '✏️', text: 'Demande de révision du milestone 2', time: 'Il y a 22 min', timestamp: new Date(Date.now() - 22 * 60000) },
      { icon: '💰', text: 'Paiement M1 reçu — App mobile fintech', time: 'Hier 14:30', timestamp: new Date(Date.now() - 24 * 3600000) }
    ]);
  }

  // ── HELPERS ───────────────────────────────────────────────────

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'Brouillon', PENDING_SIGNATURE: 'À signer',
      ACTIVE: 'Actif', COMPLETED: 'Terminé',
      CANCELLED: 'Annulé', DISPUTED: 'Litige'
    };
    return map[status] || status;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'status-draft', PENDING_SIGNATURE: 'status-pending',
      ACTIVE: 'status-active', COMPLETED: 'status-completed',
      CANCELLED: 'status-cancelled', DISPUTED: 'status-disputed'
    };
    return map[status] || '';
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatAmount(amount: number, currency: string): string {
    return amount.toLocaleString('fr-TN', { minimumFractionDigits: 0 }) + ' ' + currency;
  }

  getMilestonesProgress(contract: Contract): number {
    if (!contract.milestones?.length) return 0;
    const done = contract.milestones.filter(m => m.status === 'COMPLETED' || m.status === 'APPROVED').length;
    return Math.round((done / contract.milestones.length) * 100);
  }

  getMilestonesTotal(contract: Contract): number {
    return contract.milestones?.reduce((s, m) => s + (m.amount || 0), 0) || 0;
  }
  
}