export interface Step {
  id: number;
  title: string;
}

export interface JoinProcessState {
  currentView: 'steps' | 'success';
  activeStep: number;
  challengeId: string;
  githubUsername: string;
  isLoading: boolean;
  errorMessage: string;
  participationId: string;
  repoUrl: string;
  repoName: string;
  invitationAccepted: boolean;
  copiedRepo: boolean;
  copiedCommands: boolean;
}
