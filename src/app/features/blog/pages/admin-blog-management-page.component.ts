import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BlogApiService, BlogPostDto, BlogStatus, getRestrictedWord } from '../services/blog-api.service';
import { BLOG_DASHBOARD_STYLES } from './blog-shared-styles';

type ModerationState = 'PENDING' | 'APPROVED' | 'REJECTED';

@Component({
  selector: 'app-admin-blog-management-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrapper">
      <div class="page-content">
        <div class="page-header">
          <div>
            <h1 class="page-title">Admin Blog</h1>
            <p class="page-subtitle">Manage posts, moderation status, and publishing quality.</p>
          </div>
          <button class="btn-new-project" (click)="startCreate()" [disabled]="loading">
            New Post
          </button>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-top">
              <div class="stat-icon icon-indigo">P</div>
              <span class="stat-badge">Total</span>
            </div>
            <p class="stat-label">Total Posts</p>
            <p class="stat-value">{{ allPosts.length }}</p>
          </div>
          <div class="stat-card">
            <div class="stat-top">
              <div class="stat-icon icon-violet">L</div>
              <span class="stat-badge">Latest</span>
            </div>
            <p class="stat-label">Latest Post</p>
            <p class="stat-value" style="font-size:1rem;line-height:1.2">{{ latestPostTitle }}</p>
          </div>
          <div class="stat-card">
            <div class="stat-top">
              <div class="stat-icon icon-emerald">A</div>
              <span class="stat-badge">Authors</span>
            </div>
            <p class="stat-label">Total Authors</p>
            <p class="stat-value">{{ totalAuthors }}</p>
          </div>
          <div class="stat-card">
            <div class="stat-top">
              <div class="stat-icon icon-amber">M</div>
              <span class="stat-badge">Moderation</span>
            </div>
            <p class="stat-label">Pending / Rejected</p>
            <p class="stat-value">{{ pendingCount }} / {{ rejectedCount }}</p>
          </div>
        </div>

        <div class="success-state" *ngIf="success">{{ success }}</div>
        <div class="error-state" *ngIf="error">{{ error }}</div>

        <div class="filter-bar">
          <div class="search-wrapper">
            <span class="search-icon">⌕</span>
            <input class="search-input" [(ngModel)]="searchTerm" (ngModelChange)="onSearchChange()" placeholder="Search posts..." />
          </div>
          <div class="selects-wrapper">
            <div class="select-wrapper">
              <span class="select-icon">↓</span>
              <select class="custom-select" [(ngModel)]="sortMode" (ngModelChange)="recomputeView()">
                <option value="latest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
            <div class="select-wrapper">
              <span class="select-icon">◎</span>
              <select class="custom-select" [(ngModel)]="statusFilter" (ngModelChange)="recomputeView()">
                <option value="ALL">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <button class="btn-outline" (click)="loadPosts()" [disabled]="loading">
            {{ loading ? 'Refreshing...' : 'Refresh' }}
            </button>
          </div>
        </div>

        <div class="loading-state" *ngIf="loading">
          <div class="spinner"></div>
          <p>Loading admin blog data...</p>
        </div>

        <div class="table-shell" *ngIf="!loading">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Created At</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let post of pagedPosts" class="border-t align-top">
                <td><strong>{{ post.title }}</strong></td>
                <td>{{ post.author }}</td>
                <td>{{ formatDate(post.createdAt) }}</td>
                <td>
                  <span class="badge-status"
                        [ngClass]="{
                          'status-approved': getStatus(post.idPost) === 'APPROVED',
                          'status-pending': getStatus(post.idPost) === 'PENDING',
                          'status-rejected': getStatus(post.idPost) === 'REJECTED'
                        }">
                    {{ getStatus(post.idPost) }}
                  </span>
                </td>
                <td>
                  <div class="card-actions">
                    <button class="action-btn action-edit" (click)="editPost(post)">Edit</button>
                    <button class="action-btn action-delete" (click)="deletePost(post)" [disabled]="loading">Delete</button>
                    <button class="action-btn action-approve" (click)="setModeration(post, 'APPROVED')">Approve</button>
                    <button class="action-btn action-reject" (click)="setModeration(post, 'REJECTED')">Reject</button>
                    <span class="admin-counter like-counter">👍 {{ post.likes || 0 }}</span>
                    <span class="admin-counter dislike-counter">👎 {{ post.dislikes || 0 }}</span>
                  </div>
                </td>
              </tr>
              <tr *ngIf="!loading && pagedPosts.length === 0">
                <td colspan="5" style="text-align:center;color:#94a3b8;">No posts found.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="table-shell" style="padding:1rem;margin-top:1rem;">
          <h3 style="margin:0 0 0.75rem 0;color:#1e293b;">{{ editingId ? 'Edit post' : 'Create post' }}</h3>
          <div class="project-grid" style="grid-template-columns:1fr 1fr;gap:0.75rem;">
            <input class="search-input" [(ngModel)]="form.title" placeholder="Post title" />
            <input class="search-input" [(ngModel)]="form.author" placeholder="Author name" />
          </div>
          <textarea class="search-input" style="min-height:130px;margin-top:0.75rem;padding:0.75rem;" [(ngModel)]="form.content" placeholder="Write post content"></textarea>
          <div class="card-actions" style="margin-top:0.75rem;">
            <button class="btn-new-project" (click)="savePost()" [disabled]="loading">{{ editingId ? 'Update Post' : 'Create Post' }}</button>
            <button class="btn-outline" (click)="resetForm()" [disabled]="loading">Reset</button>
            <button *ngIf="editingId" class="btn-outline" (click)="cancelEdit()">Cancel Edit</button>
          </div>
        </div>

        <div class="pagination">
          <div class="text-sm" style="color:#64748b;">Total: {{ filteredPosts.length }} posts</div>
          <div class="pagination-controls">
            <button class="btn-outline" (click)="prevPage()" [disabled]="page <= 1">Prev</button>
            <span class="text-sm">Page {{ page }} / {{ totalPages }}</span>
            <button class="btn-outline" (click)="nextPage()" [disabled]="page >= totalPages">Next</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [BLOG_DASHBOARD_STYLES]
})
export class AdminBlogManagementPageComponent implements OnInit {
  loading = false;
  error = '';
  success = '';

  allPosts: BlogPostDto[] = [];
  filteredPosts: BlogPostDto[] = [];
  pagedPosts: BlogPostDto[] = [];

  searchTerm = '';
  sortMode: 'latest' | 'oldest' = 'latest';
  statusFilter: 'ALL' | ModerationState = 'ALL';

  page = 1;
  pageSize = 6;
  totalPages = 1;

  editingId?: number;
  form: BlogPostDto = { title: '', content: '', author: '' };

  constructor(private readonly blogApi: BlogApiService) {}

  ngOnInit(): void {
    void this.loadPosts();
  }

  get pendingCount(): number {
    return this.allPosts.filter((p) => this.getStatus(p.idPost) === 'PENDING').length;
  }

  get rejectedCount(): number {
    return this.allPosts.filter((p) => this.getStatus(p.idPost) === 'REJECTED').length;
  }

  get latestPostTitle(): string {
    if (this.allPosts.length === 0) return '-';
    const latest = [...this.allPosts].sort((a, b) => this.parseDate(b.createdAt) - this.parseDate(a.createdAt))[0];
    return latest?.title || '-';
  }

  get totalAuthors(): number {
    return new Set(this.allPosts.map((p) => (p.author || '').trim().toLowerCase()).filter(Boolean)).size;
  }

  async loadPosts(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      this.allPosts = await this.blogApi.getAll();
      this.recomputeView();
    } catch (e: any) {
      this.error = e?.message || 'Failed to load posts';
    } finally {
      this.loading = false;
    }
  }

  startCreate(): void {
    this.resetForm();
  }

  onSearchChange(): void {
    this.page = 1;
    this.recomputeView();
  }

  recomputeView(): void {
    const term = this.searchTerm.trim().toLowerCase();
    const byStatus = this.statusFilter === 'ALL'
      ? this.allPosts
      : this.allPosts.filter((p) => this.getStatus(p.idPost) === this.statusFilter);

    const bySearch = byStatus.filter((p) => p.title?.toLowerCase().includes(term));

    const sorted = [...bySearch].sort((a, b) => {
      const aTime = this.parseDate(a.createdAt);
      const bTime = this.parseDate(b.createdAt);
      return this.sortMode === 'latest' ? bTime - aTime : aTime - bTime;
    });

    this.filteredPosts = sorted;
    this.totalPages = Math.max(1, Math.ceil(this.filteredPosts.length / this.pageSize));
    if (this.page > this.totalPages) this.page = this.totalPages;

    const start = (this.page - 1) * this.pageSize;
    this.pagedPosts = this.filteredPosts.slice(start, start + this.pageSize);
  }

  async savePost(): Promise<void> {
    if (!this.form.title.trim() || !this.form.content.trim() || !this.form.author.trim()) {
      this.error = 'Title, content and author are required.';
      return;
    }

    const badTitleWord = getRestrictedWord(this.form.title);
    const badContentWord = getRestrictedWord(this.form.content);
    if (badTitleWord || badContentWord) {
      this.error = `Inappropriate word detected: "${badTitleWord || badContentWord}". Please remove it before saving.`;
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';
    try {
      if (this.editingId) {
        await this.blogApi.update(this.editingId, this.form);
        this.success = 'Post updated successfully.';
      } else {
        await this.blogApi.add(this.form);
        this.success = 'Post created successfully.';
      }

      this.resetForm();
      await this.loadPosts();
    } catch (e: any) {
      this.error = e?.message || 'Failed to save post';
    } finally {
      this.loading = false;
    }
  }

  editPost(post: BlogPostDto): void {
    this.editingId = post.idPost;
    this.form = {
      title: post.title,
      content: post.content,
      author: post.author
    };
  }

  cancelEdit(): void {
    this.resetForm();
  }

  async deletePost(post: BlogPostDto): Promise<void> {
    if (!post.idPost) return;
    this.loading = true;
    this.error = '';
    this.success = '';
    try {
      await this.blogApi.delete(post.idPost);
      this.success = 'Post deleted successfully.';
      await this.loadPosts();
    } catch (e: any) {
      this.error = e?.message || 'Failed to delete post';
    } finally {
      this.loading = false;
    }
  }

  setModeration(post: BlogPostDto, state: ModerationState): void {
    void this.changeModeration(post, state);
  }

  getStatus(id?: number): ModerationState {
    const post = this.allPosts.find((p) => p.idPost === id);
    return (post?.status as ModerationState) || 'PENDING';
  }

  resetForm(): void {
    this.editingId = undefined;
    this.form = { title: '', content: '', author: '' };
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.recomputeView();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.recomputeView();
    }
  }

  formatDate(raw?: string): string {
    if (!raw) return '-';
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? raw : d.toLocaleString();
  }

  private parseDate(raw?: string): number {
    if (!raw) return 0;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  }

  private async changeModeration(post: BlogPostDto, state: BlogStatus): Promise<void> {
    if (!post.idPost) return;
    this.loading = true;
    this.error = '';
    this.success = '';
    try {
      if (state === 'APPROVED') {
        await this.blogApi.approve(post.idPost);
      } else if (state === 'REJECTED') {
        await this.blogApi.reject(post.idPost);
      }
      this.success = `Post marked as ${state}.`;
      await this.loadPosts();
    } catch (e: any) {
      this.error = e?.message || 'Failed to update post status';
    } finally {
      this.loading = false;
    }
  }
}
