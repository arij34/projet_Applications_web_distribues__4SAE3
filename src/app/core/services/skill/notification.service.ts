import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface AppNotification {
  id: number;
  type: 'PENDING_SKILL_ADDED' | 'SKILL_APPROVED' | 'SKILL_REJECTED';
  message: string;
  skillName: string;
  freelancerId: number;
  freelancerName: string;
  read: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private apiUrl = `${environment.apiUrl}/notifications`;
  private wsUrl  = `${environment.wsUrl}/ws-notifications`;

  private stompClient!: Client;
  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  private unreadCountSubject   = new BehaviorSubject<number>(0);

  notifications$ = this.notificationsSubject.asObservable();
  unreadCount$   = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ✅ CORRIGÉ : userId est string (Keycloak UUID) au lieu de number
  connect(role: 'ADMIN' | 'USER', userId?: string): void {

    // ✅ Sécurité : ne pas connecter si USER sans userId valide
    if (role === 'USER' && !userId) {
      console.warn('NotificationService: userId manquant, connexion WebSocket annulée');
      return;
    }

    this.stompClient = new Client({
      webSocketFactory: () => new (SockJS as any)(this.wsUrl),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('✅ WebSocket connecté — role:', role, '| userId:', userId);

        // ✅ CORRIGÉ : topic avec UUID Keycloak (string)
        const topic = role === 'ADMIN'
          ? '/topic/admin-notifications'
          : `/topic/user-notifications/${userId}`;

        this.stompClient.subscribe(topic, (msg: IMessage) => {
          const notif: AppNotification = JSON.parse(msg.body);
          this.onNewNotification(notif);
        });

        this.loadNotifications(role);
      },
      onStompError: (frame) => {
        console.error('❌ WebSocket erreur STOMP:', frame);
      }
    });

    this.stompClient.activate();
  }

  disconnect(): void {
    if (this.stompClient?.active) {
      this.stompClient.deactivate();
    }
  }

  private onNewNotification(notif: AppNotification): void {
    const current = this.notificationsSubject.getValue();
    this.notificationsSubject.next([notif, ...current]);
    if (!notif.read) {
      this.unreadCountSubject.next(this.unreadCountSubject.getValue() + 1);
    }
  }

  private loadNotifications(role: 'ADMIN' | 'USER'): void {
    // ✅ /user/me — token JWT injecté automatiquement par AuthTokenInterceptor
    const url = role === 'ADMIN'
      ? `${this.apiUrl}/admin`
      : `${this.apiUrl}/user/me`;

    this.http.get<AppNotification[]>(url).subscribe({
      next: (data) => {
        this.notificationsSubject.next(data);
        this.unreadCountSubject.next(data.filter(n => !n.read).length);
      },
      error: (err) => console.error('❌ Notifications non chargées:', err)
    });
  }

  getAdminNotifications(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(`${this.apiUrl}/admin`);
  }

  getAdminUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/admin/unread-count`);
  }

  getUserNotificationsForCurrentUser(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(`${this.apiUrl}/user/me`);
  }

  getUserUnreadCountForCurrentUser(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/user/me/unread-count`);
  }

  markAllReadAdmin(): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/admin/mark-all-read`, {});
  }

  markAllReadCurrentUser(): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/user/me/mark-all-read`, {});
  }

  markOneRead(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/read`, {});
  }

  markAllReadLocally(): void {
    const updated = this.notificationsSubject.getValue().map(n => ({ ...n, read: true }));
    this.notificationsSubject.next(updated);
    this.unreadCountSubject.next(0);
  }
}