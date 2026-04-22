import {
  Component, OnInit, OnDestroy,
  Input, HostListener, ElementRef
} from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationService, AppNotification } from '../../../core/services/skill/notification.service';

@Component({
  selector: 'app-notification-bell',
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.css']
})
export class NotificationBellComponent implements OnInit, OnDestroy {

  /** 'ADMIN' pour le backoffice, 'USER' pour le frontoffice */
  @Input() role: 'ADMIN' | 'USER' = 'USER';

  /** Requis si role === 'USER' */
  @Input() userId: number = 1;

  notifications: AppNotification[] = [];
  unreadCount   = 0;
  isOpen        = false;

  private subs: Subscription[] = [];

  constructor(
    private notifService: NotificationService,
    private elRef: ElementRef
  ) {}

  ngOnInit(): void {
    // Connexion WebSocket
this.notifService.connect(this.role, String(this.userId));

    // S'abonner aux streams
    this.subs.push(
      this.notifService.notifications$.subscribe(data => {
        this.notifications = data;
      }),
      this.notifService.unreadCount$.subscribe(count => {
        this.unreadCount = count;
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.notifService.disconnect();
  }

  // ── Toggle panneau ──────────────────────────────────────────────
  togglePanel(): void {
    this.isOpen = !this.isOpen;

    if (this.isOpen && this.unreadCount > 0) {
      // Marquer comme lues côté API
      const obs = this.role === 'ADMIN'
        ? this.notifService.markAllReadAdmin()
        : this.notifService.markAllReadCurrentUser()
      obs.subscribe(() => this.notifService.markAllReadLocally());
    }
  }

  // ── Fermer si clic en dehors ────────────────────────────────────
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────
  getIcon(type: string): string {
    switch (type) {
      case 'PENDING_SKILL_ADDED': return '🆕';
      case 'SKILL_APPROVED':      return '✅';
      case 'SKILL_REJECTED':      return '❌';
      default:                    return '🔔';
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'PENDING_SKILL_ADDED': return 'New Skill Submitted';
      case 'SKILL_APPROVED':      return 'Skill Approved';
      case 'SKILL_REJECTED':      return 'Skill Rejected';
      default:                    return 'Notification';
    }
  }

  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }
}