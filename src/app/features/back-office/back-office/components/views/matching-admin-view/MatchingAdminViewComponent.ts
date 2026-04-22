// matching-admin-view.component.ts
import { Component, OnInit } from '@angular/core';
import { AdminMatchingService } from '../../../../../../core/services/skill/admin-matching.service';
import { AdminMatchingRow } from '../../../../../../core/models/skill/admin-matching.model';
import { AdminInvitation } from '../../../../../../core/models/skill/admin-invitation.model';
import { AdminMatchingStats } from '../../../../../../core/models/skill/admin-matching-stats.model';

@Component({
  selector: 'app-matching-admin-view',
  templateUrl: './matching-admin-view.component.html',
  styleUrls: ['./matching-admin-view.component.css']
})
export class MatchingAdminViewComponent implements OnInit {

  // Sous-onglets internes
  activeSubTab: 'matching' | 'invitations' = 'matching';

  // Données
  matchings: AdminMatchingRow[] = [];
  invitations: AdminInvitation[] = [];
  stats: AdminMatchingStats | null = null;

  isLoading = false;
  errorMessage = '';

  constructor(private adminService: AdminMatchingService) {}

  ngOnInit(): void {
    // Au chargement : stats + matching table
    this.loadStats();
    this.loadMatchings();
  }

  switchSubTab(tab: 'matching' | 'invitations'): void {
    this.activeSubTab = tab;
    if (tab === 'matching' && this.matchings.length === 0) {
      this.loadMatchings();
    }
    if (tab === 'invitations' && this.invitations.length === 0) {
      this.loadInvitations();
    }
  }

  // ===== Stats globales =====
  loadStats(): void {
    this.adminService.getGlobalStats().subscribe({
      next: (data) => {
        this.stats = data;
      },
      error: (err) => {
        console.error('Erreur stats matching:', err);
        // on ne bloque pas la page si les stats plantent
      }
    });
  }

  // ===== Tables =====
  loadMatchings(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.adminService.getAllMatchings().subscribe({
      next: (data) => {
        this.matchings = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Erreur lors du chargement du tableau Matching.';
        this.isLoading = false;
      }
    });
  }

  loadInvitations(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.adminService.getAllInvitations().subscribe({
      next: (data) => {
        this.invitations = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Erreur lors du chargement du tableau Invitations.';
        this.isLoading = false;
      }
    });
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  }
}