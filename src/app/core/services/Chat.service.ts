import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Client, IMessage } from '@stomp/stompjs';
import { Observable, Subject } from 'rxjs';

export interface ChatMessage {
  projectId: number;
  senderName: string;
  senderRole: string;
  content: string;
  sentAt: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {

  private client!: Client;
  private messageSubject = new Subject<ChatMessage>();
  private onConnectedCallback?: () => void;
  private apiUrl = 'http://localhost:8085'; // ← adapte le port si nécessaire

  constructor(private http: HttpClient) {}

  get isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  getHistory(projectId: number): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/chat/${projectId}/history`);
  }

  connect(onConnected?: () => void): void {
    this.onConnectedCallback = onConnected;

    this.client = new Client({
      brokerURL: 'ws://localhost:8085/ws-chat/websocket',
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('✅ WebSocket connected');
        if (this.onConnectedCallback) this.onConnectedCallback();
      },
      onDisconnect: () => console.log('❌ WebSocket disconnected'),
      onStompError: (frame) => console.error('❌ STOMP error', frame),
    });

    this.client.activate();
  }

  subscribeToProject(projectId: number): void {
    this.client.subscribe(`/topic/chat/${projectId}`, (msg: IMessage) => {
      const parsed: ChatMessage = JSON.parse(msg.body);
      this.messageSubject.next(parsed);
    });
  }

  getMessages(): Observable<ChatMessage> {
    return this.messageSubject.asObservable();
  }

  // ── Charge l'historique depuis la base ──
  loadHistory(projectId: number): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/chat/history/${projectId}`);
  }

  sendMessage(projectId: number, senderName: string, senderRole: string, content: string): void {
    if (!this.client?.connected) return;
    this.client.publish({
      destination: `/app/chat/${projectId}`,
      body: JSON.stringify({ projectId, senderName, senderRole, content })
    });
  }

  disconnect(): void {
    this.client?.deactivate();
  }
}