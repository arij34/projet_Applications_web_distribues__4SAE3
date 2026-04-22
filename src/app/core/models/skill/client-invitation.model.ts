export interface ClientInvitation {
  id: number;
  projectId: number;
  projectTitle: string;
  freelancerName: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'TRASH';
  invitedAt: string | null;
  respondedAt: string | null;
}