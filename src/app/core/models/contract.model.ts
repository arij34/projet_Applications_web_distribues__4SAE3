// ─────────────────────────────────────────────────────────────
//  CONTRACT MODEL  –  Freelancy Platform
//  src/app/core/models/contract.model.ts
// ─────────────────────────────────────────────────────────────

export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED';
export type ContractStatus  = 'DRAFT' | 'PENDING_SIGNATURE' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

export interface ContractMilestone {
  id?: number;
  title: string;
  description?: string;
  amount: number;
  deadline?: string;
  status: MilestoneStatus;
  orderIndex: number;
  completedAt?: string;
  approvedAt?: string;
  createdAt?: string;
}

export interface ContractClause {
  id?: number;
  article: string;
  title: string;
  text: string;
  modified?: boolean;
}

export interface ContractNotification {
  id: string;
  type: 'DRAFT_RECEIVED' | 'REVISION_REQUESTED' | 'PAYMENT_RECEIVED' | 'SIGNATURE_REQUIRED' | 'CONTRACT_ACTIVE' | 'CLAUSE_MODIFIED' | 'MILESTONE_ADDED' | 'MILESTONE_UPDATED' | 'MILESTONE_DELETED';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  contractId?: number;
  color: 'blue' | 'green' | 'amber' | 'purple' | 'red';
}

export interface ContractActivity {
  icon: string;
  text: string;
  time: string;
  timestamp: Date;
}

export interface ContractHistoryEntry {
  id: number;
  action: string;
  performedBy: number;
  oldValue?: string;
  newValue?: string;
  aiSummary?: string;
  performedAt: string;
}

export interface Contract {
  id: number;
  title: string;
  description?: string;
  projectId: number;
  proposalId: number;
  clientId: number;
  freelancerId: number;
  clientName?: string;
  clientCompany?: string;
  freelancerName?: string;
  totalAmount: number;
  currency: string;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  milestones: ContractMilestone[];
  clauses?: ContractClause[];
  pdfUrl?: string;
  clientSignedAt?: string;
  freelancerSignedAt?: string;
  createdAt?: string;
  reference?: string;
}