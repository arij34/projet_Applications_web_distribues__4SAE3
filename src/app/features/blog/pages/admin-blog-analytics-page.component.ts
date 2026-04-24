import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BlogAnalyticsApiService, BlogAnalyticsDto, BlogStatDto } from '../services/blog-analytics-api.service';
import { BLOG_DASHBOARD_STYLES } from './blog-shared-styles';

@Component({
  selector: 'app-admin-blog-analytics-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrapper">
      <div class="page-content">
        <div class="page-header">
          <div>
            <h1 class="page-title">Admin Blog Analytics</h1>
            <p class="page-subtitle">Track metrics and maintain key analytics values.</p>
          </div>
          <button class="btn-new-project" (click)="loadAll()" [disabled]="loading">
            {{ loading ? 'Refreshing...' : 'Refresh' }}
          </button>
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
              <span class="stat-badge">Selected</span>
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
              <div class="stat-icon icon-amber">F</div>
              <span class="stat-badge">Form</span>
            </div>
            <p class="stat-label">Form Mode</p>
            <p class="stat-value" style="font-size:1rem;line-height:1.2">{{ editingMetricId ? 'Edit Existing' : 'Create / Upsert' }}</p>
          </div>
        </div>

        <div class="success-state" *ngIf="success">{{ success }}</div>
        <div class="error-state" *ngIf="error">{{ error }}</div>

        <div class="filter-bar">
          <div class="search-wrapper">
            <span class="search-icon">⌕</span>
            <input class="search-input" [(ngModel)]="statMetric" placeholder="Metric name" />
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of metrics" class="border-t">
                <td><strong>{{ item.metric }}</strong></td>
                <td>{{ item.value }}</td>
                <td>
                  <div class="card-actions">
                    <button class="action-btn action-edit" (click)="editMetric(item)">Edit</button>
                    <button class="action-btn action-delete" (click)="deleteMetric(item)" [disabled]="loading">Delete</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="!loading && metrics.length === 0">
                <td colspan="3" style="text-align:center;color:#94a3b8;">No analytics metrics found.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="table-shell" style="padding:1rem;margin-top:1rem;">
          <h3 style="margin:0 0 0.75rem 0;color:#1e293b;">{{ editingMetricId ? 'Edit metric' : 'Create / Upsert metric' }}</h3>
          <div class="project-grid" style="grid-template-columns:1fr 1fr;gap:0.75rem;">
            <input class="search-input" [(ngModel)]="form.metric" placeholder="Metric name" />
            <input class="search-input" type="number" [(ngModel)]="form.value" placeholder="Metric value" />
          </div>
          <div class="card-actions" style="margin-top:0.75rem;">
            <button class="btn-new-project" (click)="saveMetric()" [disabled]="loading">{{ editingMetricId ? 'Update Metric' : 'Save Metric' }}</button>
            <button class="btn-outline" (click)="resetForm()" [disabled]="loading">Reset</button>
            <button *ngIf="editingMetricId" class="btn-outline" (click)="cancelEdit()">Cancel Edit</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [BLOG_DASHBOARD_STYLES]
})
export class AdminBlogAnalyticsPageComponent implements OnInit {
  loading = false;
  error = '';
  success = '';

  metrics: BlogAnalyticsDto[] = [];
  currentStat?: BlogStatDto;
  statMetric = '';

  editingMetricId?: number;
  form: BlogAnalyticsDto = { metric: '', value: 0 };

  constructor(private readonly analyticsApi: BlogAnalyticsApiService) {}

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
    this.success = '';
    try {
      this.currentStat = await this.analyticsApi.getStat(this.statMetric.trim());
      this.success = 'Metric stat loaded.';
    } catch (e: any) {
      this.error = e?.message || 'Failed to load metric stat';
    } finally {
      this.loading = false;
    }
  }

  editMetric(item: BlogAnalyticsDto): void {
    this.editingMetricId = item.idAnalytics;
    this.form = {
      idAnalytics: item.idAnalytics,
      metric: item.metric,
      value: item.value
    };
  }

  cancelEdit(): void {
    this.resetForm();
  }

  async saveMetric(): Promise<void> {
    if (!this.form.metric.trim() || this.form.value === undefined || this.form.value === null) {
      this.error = 'Metric and value are required.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';
    try {
      if (this.editingMetricId) {
        await this.analyticsApi.update(this.editingMetricId, {
          idAnalytics: this.editingMetricId,
          metric: this.form.metric.trim(),
          value: Number(this.form.value)
        });
        this.success = 'Metric updated successfully.';
      } else {
        await this.analyticsApi.upsert(this.form.metric.trim(), Number(this.form.value));
        this.success = 'Metric saved successfully.';
      }
      this.resetForm();
      await this.loadAll();
    } catch (e: any) {
      this.error = e?.message || 'Failed to save metric';
    } finally {
      this.loading = false;
    }
  }

  async deleteMetric(item: BlogAnalyticsDto): Promise<void> {
    if (!item.idAnalytics) {
      this.error = 'Metric id is missing; cannot delete.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';
    try {
      await this.analyticsApi.delete(item.idAnalytics);
      this.success = 'Metric deleted successfully.';
      if (this.editingMetricId === item.idAnalytics) {
        this.resetForm();
      }
      await this.loadAll();
    } catch (e: any) {
      this.error = e?.message || 'Failed to delete metric';
    } finally {
      this.loading = false;
    }
  }

  resetForm(): void {
    this.editingMetricId = undefined;
    this.form = { metric: '', value: 0 };
  }
}
