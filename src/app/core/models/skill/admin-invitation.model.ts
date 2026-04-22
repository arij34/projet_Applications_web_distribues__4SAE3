export interface AdminInvitation {
  id: number;
  projectId: number;
  freelancerId: number;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'TRASH';
  createdAt: string;
  trashedAt?: string;
}