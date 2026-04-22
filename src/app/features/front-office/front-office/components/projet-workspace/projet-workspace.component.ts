import { Component, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProjectService } from '../../../../../core/services/project.service';
import { ProposalService } from '../../../../../core/services/proposal.service';
import { ChatService, ChatMessage } from '../../../../../core/services/Chat.service';
import { Project } from '../../../../../core/models/project.model';
import { HttpClient } from '@angular/common/http';

interface Activity {
  id: string;
  type: 'validation' | 'upload' | 'status_change' | 'message';
  user: string;
  action: string;
  time: string;
}

interface WorkspaceDocument {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'zip' | 'img' | 'other';
  size: string;
  date: string;
  file?: File;
  previewUrl?: string;
}

@Component({
  selector: 'app-projet-workspace',
  templateUrl: './projet-workspace.component.html',
  styleUrls: ['./projet-workspace.component.css']
})
export class ProjetWorkspaceComponent implements OnInit, OnDestroy {

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('chatMessages') chatMessagesRef!: ElementRef<HTMLDivElement>;

  project: Project | null = null;
  proposals: any[] = [];
  isLoading = true;
  errorMessage = '';

  activeTab = 'overview';
  isCompactDescription = false;
  newMessage = '';
  isDragging = false;
  analysisResult: any = null;
  isAnalyzing = false;

  // ── CHAT ──────────────────────────────────────────
  messages: ChatMessage[] = [];
  projectId = 0;
  isConnected = false;
  private chatSub?: Subscription;

  // ── Identité ──────────────────────────────────────
  currentUserName: string = 'Client Test';
  currentUserRole: 'CLIENT' | 'FREELANCER' = 'CLIENT';
  clientKeycloakId: string = ''; // ← ajout pour stocker le clientId depuis queryParams
  showNameModal = false;

  activities: Activity[] = [
    { id: '1', type: 'message',       user: 'Thomas D.', action: 'sent a message',         time: '2 hours ago' },
    { id: '2', type: 'validation',    user: 'You',       action: 'reviewed the proposals', time: '5 hours ago' },
    { id: '3', type: 'upload',        user: 'Marie L.',  action: 'submitted a proposal',   time: '1 day ago'   },
    { id: '4', type: 'status_change', user: 'You',       action: 'opened the project',     time: '2 days ago'  },
  ];

  documents: WorkspaceDocument[] = [];

  timelineSteps = [
    { label: 'Open',          icon: 'radio_button_checked', status: 'completed', phase: 'OPEN'          },
    { label: 'Étude',         icon: 'search',               status: 'pending',   phase: 'ETUDE'         },
    { label: 'Développement', icon: 'build',                status: 'pending',   phase: 'DEVELOPPEMENT' },
    { label: 'Test',          icon: 'science',              status: 'pending',   phase: 'TEST'          },
    { label: 'Déploiement',   icon: 'rocket_launch',        status: 'pending',   phase: 'DEPLOIEMENT'   },
    { label: 'Clôture',       icon: 'check_circle',         status: 'pending',   phase: 'CLOTURE'       },
  ];

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private proposalService: ProposalService,
    private chatService: ChatService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(qp => {
      if (qp['role'] === 'FREELANCER') {
        this.currentUserRole = 'FREELANCER';
        this.currentUserName = qp['name'] || 'Freelancer Test';
      } else {
        this.currentUserRole = 'CLIENT';
        this.currentUserName = qp['name'] || 'Client Test';
      }
      // ← récupérer le clientId depuis les queryParams
      this.clientKeycloakId = qp['clientId'] || '';
    });

    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id) {
        this.projectId = id;
        this.loadData(id);
        this.connectChat();
        this.loadSavedPhase(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.chatSub?.unsubscribe();
    this.chatService.disconnect();
    this.documents.forEach(doc => {
      if (doc.previewUrl) URL.revokeObjectURL(doc.previewUrl);
    });
  }

  // ── PHASE PERSISTÉE ───────────────────────────────

  private loadSavedPhase(projectId: number): void {
    this.http.get<{ phase: string }>(
      `http://localhost:8085/chat/${projectId}/phase`
    ).subscribe({
      next: (res) => {
        if (res.phase && res.phase !== 'OPEN') {
          this.updateTimeline(res.phase);
        }
      },
      error: () => {}
    });
  }

  // ── CHAT ──────────────────────────────────────────

  private connectChat(): void {
    this.chatService.getHistory(this.projectId).subscribe({
      next: (history: ChatMessage[]) => {
        this.messages = history;
        this.cdr.detectChanges();
        this.scrollToBottom();
      },
      error: (err: any) => console.error('History error:', err)
    });

    this.chatService.connect(() => {
      this.isConnected = true;
      this.cdr.detectChanges();
      this.chatService.subscribeToProject(this.projectId);

      if (!this.chatSub || this.chatSub.closed) {
        this.chatSub = this.chatService.getMessages().subscribe((msg: ChatMessage) => {
          const exists = this.messages.some(m =>
            m.sentAt === msg.sentAt &&
            m.senderName === msg.senderName &&
            m.content === msg.content
          );
          if (!exists) {
            this.messages = [...this.messages, msg];
            this.cdr.detectChanges();
            this.scrollToBottom();
          }
        });
      }
    });
  }

  updateTimeline(phase: string): void {
    const order = ['OPEN', 'ETUDE', 'DEVELOPPEMENT', 'TEST', 'DEPLOIEMENT', 'CLOTURE'];
    const currentIndex = order.indexOf(phase);

    this.timelineSteps = this.timelineSteps.map((step, i) => {
      if (i < currentIndex)   return { ...step, status: 'completed' };
      if (i === currentIndex) return { ...step, status: 'current'   };
      return                         { ...step, status: 'pending'   };
    });

    this.cdr.detectChanges();
  }

  sendMessage(): void {
    const content = this.newMessage.trim();
    if (!content || !this.currentUserName) return;
    this.chatService.sendMessage(
      this.projectId,
      this.currentUserName,
      this.currentUserRole,
      content
    );
    this.newMessage = '';
  }

  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.chatMessagesRef?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }

  isMyMessage(msg: ChatMessage): boolean {
    return msg.senderName === this.currentUserName;
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getRoleColor(role: string): string {
    return role === 'CLIENT' ? '#2563eb' : '#7c3aed';
  }

  formatTime(sentAt: any): string {
    if (!sentAt) return '';
    if (Array.isArray(sentAt)) {
      const h = String(sentAt[3]).padStart(2, '0');
      const m = String(sentAt[4]).padStart(2, '0');
      return `${h}:${m}`;
    }
    const d = new Date(sentAt);
    if (isNaN(d.getTime())) return '';
    return d.getHours().toString().padStart(2, '0') + ':' +
           d.getMinutes().toString().padStart(2, '0');
  }

  confirmIdentity(): void {
    if (!this.currentUserName.trim()) return;
    this.showNameModal = false;
  }

  // ── DATA LOADING ──────────────────────────────────

  private loadData(id: number): void {
    this.isLoading = true;
    this.projectService.getProjectById(id).subscribe({
      next: (p: Project) => {
        this.project = p;
        this.isLoading = false;
        this.loadProposals(id, p.clientId ?? undefined);
      },
      error: () => {
        this.errorMessage = 'Unable to load the project.';
        this.isLoading = false;
      }
    });
  }

  private loadProposals(projectId: number, clientId?: number): void {
    this.proposalService.getByProject(projectId, clientId).subscribe({
      next: (data: any[]) => { this.proposals = data; },
      error: () => {}
    });
  }

  // ── TABS ──────────────────────────────────────────

  setTab(tab: string): void { this.activeTab = tab; }

  // ── FILE UPLOAD ───────────────────────────────────

  triggerFileInput(): void {
    this.fileInputRef.nativeElement.value = '';
    this.fileInputRef.nativeElement.click();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.addFiles(Array.from(input.files));
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault(); event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault(); event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault(); event.stopPropagation();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files) this.addFiles(Array.from(files));
  }

  private addFiles(files: File[]): void {
    const today = new Date().toLocaleDateString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
    const newDocs: WorkspaceDocument[] = files.map(file => {
      const ext  = file.name.split('.').pop()?.toLowerCase() ?? '';
      const type = this.detectType(ext);
      const doc: WorkspaceDocument = {
        id: Date.now().toString() + Math.random(),
        name: file.name, type,
        size: this.formatSize(file.size),
        date: today, file,
      };
      if (type === 'img') doc.previewUrl = URL.createObjectURL(file);
      return doc;
    });
    this.documents = [...this.documents, ...newDocs];
  }

  private detectType(ext: string): WorkspaceDocument['type'] {
    if (['pdf'].includes(ext)) return 'pdf';
    if (['doc','docx','odt','txt','md'].includes(ext)) return 'doc';
    if (['zip','rar','7z','tar','gz'].includes(ext)) return 'zip';
    if (['png','jpg','jpeg','gif','svg','webp'].includes(ext)) return 'img';
    return 'other';
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1024 ** 2)   return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 ** 3)   return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  }

  removeFile(index: number): void {
    const doc = this.documents[index];
    if (doc.previewUrl) URL.revokeObjectURL(doc.previewUrl);
    this.documents = this.documents.filter((_, i) => i !== index);
  }

  previewFile(doc: WorkspaceDocument): void {
    const url = doc.previewUrl ?? (doc.file ? URL.createObjectURL(doc.file) : null);
    if (url) window.open(url, '_blank');
  }

  downloadFile(doc: WorkspaceDocument): void {
    if (!doc.file) return;
    const url = URL.createObjectURL(doc.file);
    const a = document.createElement('a');
    a.href = url; a.download = doc.name; a.click();
    URL.revokeObjectURL(url);
  }

  // ── CONFIG HELPERS ────────────────────────────────

  getStatusConfig(status: string | undefined): { label: string; cssClass: string } {
    switch (status) {
      case 'OPEN':        return { label: 'Open',        cssClass: 'status-open'      };
      case 'IN_PROGRESS': return { label: 'In Progress', cssClass: 'status-progress'  };
      case 'COMPLETED':   return { label: 'Completed',   cssClass: 'status-completed' };
      case 'DRAFT':       return { label: 'Draft',       cssClass: 'status-draft'     };
      default:            return { label: status || '-', cssClass: 'status-default'   };
    }
  }

  getStepClass(status: string): string {
    switch (status) {
      case 'completed': return 'step-completed';
      case 'current':   return 'step-current';
      default:          return 'step-pending';
    }
  }

  getActivityConfig(type: string): { icon: string; cssClass: string } {
    switch (type) {
      case 'validation':    return { icon: 'check_circle', cssClass: 'act-validation' };
      case 'upload':        return { icon: 'upload_file',  cssClass: 'act-upload'     };
      case 'status_change': return { icon: 'edit',         cssClass: 'act-status'     };
      case 'message':       return { icon: 'chat',         cssClass: 'act-message'    };
      default:              return { icon: 'info',         cssClass: ''               };
    }
  }

  getDocConfig(type: string): { icon: string; cssClass: string } {
    switch (type) {
      case 'pdf': return { icon: 'picture_as_pdf',    cssClass: 'doc-pdf'   };
      case 'doc': return { icon: 'description',       cssClass: 'doc-doc'   };
      case 'zip': return { icon: 'folder_zip',        cssClass: 'doc-zip'   };
      case 'img': return { icon: 'image',             cssClass: 'doc-img'   };
      default:    return { icon: 'insert_drive_file', cssClass: 'doc-other' };
    }
  }

  getProposalStatusConfig(status: string): { label: string; cssClass: string } {
    switch (status) {
      case 'ACCEPTED':  return { label: 'Accepted',  cssClass: 'prop-accepted'  };
      case 'REJECTED':  return { label: 'Rejected',  cssClass: 'prop-rejected'  };
      case 'WITHDRAWN': return { label: 'Withdrawn', cssClass: 'prop-withdrawn' };
      default:          return { label: 'Pending',   cssClass: 'prop-pending'   };
    }
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  getDaysUntilDeadline(deadline: string | undefined): number {
    if (!deadline) return 0;
    return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  getProgressColor(progress: number): string {
    if (progress >= 70) return '#16a34a';
    if (progress >= 40) return '#d97706';
    return '#2563eb';
  }

  get pendingProposals(): number  { return this.proposals.filter(p => p.status === 'PENDING').length; }
  get acceptedProposals(): number { return this.proposals.filter(p => p.status === 'ACCEPTED').length; }

  // ── AI ANALYSIS ───────────────────────────────────

  analyzeDiscussion(): void {
    if (this.messages.length === 0) return;
    this.isAnalyzing = true;
    this.analysisResult = null;

    this.http.get<any>(
      `http://localhost:8085/chat/${this.projectId}/analyze`,
      { params: { projectTitle: this.project?.title || 'Project' } }
    ).subscribe({
      next: (result) => {
        this.analysisResult = result;
        this.isAnalyzing = false;
        if (result.phase) {
          this.updateTimeline(result.phase);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isAnalyzing = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeAnalysis(): void {
    this.analysisResult = null;
  }

  getPhaseConfig(phase: string): { bg: string; text: string; icon: string } {
    switch (phase) {
      case 'ETUDE':         return { bg: '#dbeafe', text: '#1d4ed8', icon: '🔍' };
      case 'DEVELOPPEMENT': return { bg: '#fef3c7', text: '#d97706', icon: '⚙️' };
      case 'TEST':          return { bg: '#f3e8ff', text: '#7c3aed', icon: '🧪' };
      case 'DEPLOIEMENT':   return { bg: '#dcfce7', text: '#16a34a', icon: '🚀' };
      case 'CLOTURE':       return { bg: '#f0fdf4', text: '#15803d', icon: '✅' };
      default:              return { bg: '#f1f5f9', text: '#64748b', icon: '📋' };
    }
  }
}