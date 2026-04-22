// 🔹 nouveau fichier : admin-matching-stats.model.ts
export interface AdminMatchingStats {
  totalInvitations: number;
  pendingInvitations: number;
  acceptedInvitations: number;
  declinedInvitations: number;
  trashInvitations: number;

  totalMatchings: number;
  avgFinalScore: number;
  maxFinalScore: number;
  minFinalScore: number;
}