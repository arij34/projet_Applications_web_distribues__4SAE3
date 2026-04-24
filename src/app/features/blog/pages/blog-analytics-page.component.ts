import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BlogAnalyticsApiService, BlogAnalyticsDto, BlogStatDto } from '../services/blog-analytics-api.service';
import { BLOG_DASHBOARD_STYLES } from './blog-shared-styles';

@Component({
  selector: 'app-blog-analytics-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrapper">
      <div class="page-content">
        <div class="page-header">
        <div>
            <h1 class="page-title">Blog Analytics</h1>
            <p class="page-subtitle">View blog metrics and quick insights.</p>
          </div>
          <div class="selects-wrapper">
            <button class="btn-outline" (click)="goToFront()">Back To Front</button>
            <button class="btn-new-project" (click)="loadAll()" [disabled]="loading">
              Refresh
            </button>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-top">
              <div class="stat-icon icon-indigo">M</div>
              <span class="stat-badge">Total</span>
            </div>
            <p class="stat-label">Metrics</p>
            <p class="stat-value">{{ metrics.length }}</p>
          </div>
          <div class="stat-card">
            <div class="stat-top">
              <div class="stat-icon icon-violet">S</div>
              <span class="stat-badge">Lookup</span>
            </div>
            <p class="stat-label">Selected Metric</p>
            <p class="stat-value" style="font-size:1rem;line-height:1.2">{{ currentStat?.metric || '-' }}</p>
          </div>
          <div class="stat-card">
            <div class="stat-top">
              <div class="stat-icon icon-emerald">V</div>
              <span class="stat-badge">Value</span>
            </div>
            <p class="stat-label">Selected Value</p>
            <p class="stat-value">{{ currentStat?.value ?? 0 }}</p>
          </div>
          <div class="stat-card">
            <div class="stat-top">
              <div class="stat-icon icon-amber">R</div>
              <span class="stat-badge">Ready</span>
            </div>
            <p class="stat-label">Status</p>
            <p class="stat-value" style="font-size:1rem;line-height:1.2">{{ loading ? 'Loading' : 'Ready' }}</p>
          </div>
        </div>

        <div class="error-state" *ngIf="error">{{ error }}</div>

        <div class="filter-bar">
          <div class="search-wrapper">
            <span class="search-icon">⌕</span>
            <input class="search-input" [(ngModel)]="statMetric" placeholder="Metric for stat" />
          </div>
          <div class="selects-wrapper">
            <button class="btn-outline" (click)="fetchStat()" [disabled]="loading">Get Stat</button>
          </div>
        </div>

        <div class="loading-state" *ngIf="loading">
          <div class="spinner"></div>
          <p>Loading analytics...</p>
        </div>

        <div class="table-shell" *ngIf="!loading">
          <table>
            <thead>
            <tr>
                <th>Metric</th>
                <th>Value</th>
            </tr>
            </thead>
            <tbody>
            <tr *ngFor="let item of metrics" class="border-t">
                <td><strong>{{ item.metric }}</strong></td>
                <td>{{ item.value }}</td>
            </tr>
            <tr *ngIf="!loading && metrics.length === 0">
                <td colspan="2" style="text-align:center;color:#94a3b8;">No analytics metrics found.</td>
            </tr>
            </tbody>
          </table>
        </div>

        <div class="chat-bubble" (click)="toggleChat()" title="Ask about metrics">
          ?
        </div>

        <div class="chat-panel" *ngIf="chatOpen">
          <div class="chat-panel-header">
            <div>
              <h3>Metric Helper</h3>
              <p>Ask what to choose or what a metric means.</p>
            </div>
            <button class="chat-close" (click)="toggleChat()">×</button>
          </div>
          <div class="chat-messages">
            <div *ngFor="let message of chatMessages" class="chat-message" [ngClass]="message.role">
              {{ message.text }}
            </div>
          </div>
          <div class="chat-input-row">
            <input class="search-input" [(ngModel)]="chatInput" placeholder="Ask about a metric..." (keydown.enter)="sendChatMessage()" />
            <button class="btn-new-project" (click)="sendChatMessage()" [disabled]="!chatInput.trim()">Send</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [BLOG_DASHBOARD_STYLES]
})
export class BlogAnalyticsPageComponent implements OnInit {
  loading = false;
  error = '';

  metrics: BlogAnalyticsDto[] = [];
  currentStat?: BlogStatDto;

  statMetric = '';
  chatOpen = false;
  chatInput = '';
  chatMessages: Array<{ role: 'user' | 'bot'; text: string }> = [
    { role: 'bot', text: 'Ask me which metric to choose or what a metric means.' }
  ];

  constructor(
    private readonly analyticsApi: BlogAnalyticsApiService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    void this.loadAll();
  }

  async loadAll(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      this.metrics = await this.analyticsApi.getAll();
    } catch (e: any) {
      this.error = e?.message || 'Failed to load analytics';
    } finally {
      this.loading = false;
    }
  }

  async fetchStat(): Promise<void> {
    if (!this.statMetric.trim()) {
      this.error = 'Metric is required for stat lookup.';
      return;
    }

    this.loading = true;
    this.error = '';
    try {
      this.currentStat = await this.analyticsApi.getStat(this.statMetric.trim());
    } catch (e: any) {
      this.error = e?.message || 'Failed to load metric stat';
    } finally {
      this.loading = false;
    }
  }

  goToFront(): void {
    void this.router.navigateByUrl('/front');
  }

  toggleChat(): void {
    this.chatOpen = !this.chatOpen;
  }

  sendChatMessage(): void {
    const question = this.chatInput.trim();
    if (!question) return;

    this.chatMessages.push({ role: 'user', text: question });
    this.chatMessages.push({ role: 'bot', text: this.buildChatAnswer(question) });
    this.chatInput = '';
  }

  private buildChatAnswer(question: string): string {
    const q = question.toLowerCase();
    const metricNames = this.metrics.map((m) => m.metric);
    const matchedMetric = this.metrics.find((m) => q.includes(m.metric.toLowerCase()));

    if (q.includes('what should i choose') || q.includes('which metric') || q.includes('recommend')) {
      const topMetric = this.metrics[0];
      if (topMetric) {
        return `Choose ${topMetric.metric} if you want the most direct signal from the list. Other available metrics are: ${metricNames.join(', ')}.`;
      }
      return 'No metrics are loaded yet. Refresh first, then I can recommend one.';
    }

    if (matchedMetric) {
      return this.describeMetric(matchedMetric.metric, matchedMetric.value);
    }

    if (q.includes('metric')) {
      return 'A metric is a number that tracks something important in your blog analytics, like total posts or views. You can type a metric name from the table and I will explain it.';
    }

    return `Try asking: "Which metric should I choose?" or type one of these metric names: ${metricNames.join(', ')}.`;
  }

  private describeMetric(metric: string, value: number): string {
    const normalized = metric.toLowerCase();
    if (normalized.includes('post')) {
      return `The ${metric} metric currently equals ${value}. It usually represents how many blog posts you have.`;
    }
    if (normalized.includes('view')) {
      return `The ${metric} metric currently equals ${value}. It usually represents the number of views or visits.`;
    }
    if (normalized.includes('like')) {
      return `The ${metric} metric currently equals ${value}. It represents positive reactions on posts.`;
    }
    return `The ${metric} metric currently equals ${value}. It is one of your tracked blog analytics values.`;
  }
}
