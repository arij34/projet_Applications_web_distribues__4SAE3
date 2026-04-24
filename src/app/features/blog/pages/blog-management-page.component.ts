import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { BlogApiService, BlogPostDto, BlogStatus, getRestrictedWord } from '../services/blog-api.service';
import { BLOG_DASHBOARD_STYLES } from './blog-shared-styles';

@Component({
  selector: 'app-blog-management-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrapper">
      <div class="page-content">
        <div class="page-header">
          <div>
            <h1 class="page-title">Blog</h1>
            <p class="page-subtitle">Approved posts are public. Your posts are tracked below with approval status.</p>
          </div>
          <div class="selects-wrapper">
            <button class="btn-outline" (click)="goToFront()">Back To Front</button>
            <button class="btn-new-project" (click)="loadData()" [disabled]="loading">Refresh</button>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-top">
              <div class="stat-icon icon-indigo">A</div>
              <span class="stat-badge">Public</span>
            </div>
            <p class="stat-label">Approved Posts</p>
            <p class="stat-value">{{ approvedPosts.length }}</p>
          </div>
          <div class="stat-card">
            <div class="stat-top">
              <div class="stat-icon icon-violet">M</div>
              <span class="stat-badge">Mine</span>
            </div>
            <p class="stat-label">My Posts</p>
            <p class="stat-value">{{ myPosts.length }}</p>
          </div>
          <div class="stat-card">
            <div class="stat-top">
              <div class="stat-icon icon-emerald">P</div>
              <span class="stat-badge">Review</span>
            </div>
            <p class="stat-label">Pending</p>
            <p class="stat-value">{{ pendingCount }}</p>
          </div>
          <div class="stat-card">
            <div class="stat-top">
              <div class="stat-icon icon-amber">R</div>
              <span class="stat-badge">Rejected</span>
            </div>
            <p class="stat-label">Rejected</p>
            <p class="stat-value">{{ rejectedCount }}</p>
          </div>
        </div>

        <div class="success-state" *ngIf="success">{{ success }}</div>
        <div class="error-state" *ngIf="error">{{ error }}</div>

        <div class="table-shell" style="padding:1rem;margin-bottom:1rem;">
          <h3 style="margin:0 0 0.75rem 0;color:#1e293b;">{{ editingId ? 'Edit My Blog' : 'Create New Blog' }}</h3>
          <div class="project-grid" style="grid-template-columns:1fr 1fr;gap:0.75rem;">
            <input class="search-input" [(ngModel)]="form.title" placeholder="Post title" />
            <input class="search-input" [ngModel]="currentAuthor" disabled />
          </div>
          <textarea class="search-input" style="min-height:130px;margin-top:0.75rem;padding:0.75rem;" [(ngModel)]="form.content" placeholder="Write post content"></textarea>
          <div class="card-actions" style="margin-top:0.75rem;">
            <button class="btn-new-project" (click)="savePost()" [disabled]="loading">{{ editingId ? 'Update Post' : 'Submit For Approval' }}</button>
            <button class="btn-outline" (click)="resetForm()" [disabled]="loading">Reset</button>
            <button *ngIf="editingId" class="btn-outline" (click)="cancelEdit()" [disabled]="loading">Cancel Edit</button>
          </div>
        </div>

        <div class="filter-bar">
          <div class="search-wrapper">
            <span class="search-icon">⌕</span>
            <input class="search-input" [(ngModel)]="searchTerm" (ngModelChange)="recomputeViews()" placeholder="Search posts..." />
          </div>
          <div class="selects-wrapper">
            <div class="select-wrapper">
              <span class="select-icon">↓</span>
              <select class="custom-select" [(ngModel)]="sortMode" (ngModelChange)="recomputeViews()">
                <option value="latest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>
        </div>

        <div class="loading-state" *ngIf="loading">
          <div class="spinner"></div>
          <p>Loading posts...</p>
        </div>

        <div class="table-shell" *ngIf="!loading" style="margin-bottom:1rem;">
          <table>
            <thead>
              <tr>
                <th>Public Approved Posts</th>
                <th>Author</th>
                <th>Created At</th>
                <th>Compteurs</th>
                <th>Reactions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let post of filteredApprovedPosts" class="border-t">
                <td>
                  <strong>{{ post.title }}</strong>
                  <div style="color:#64748b;font-size:0.8rem;">{{ truncate(post.content) }}</div>
                </td>
                <td>{{ post.author }}</td>
                <td>{{ formatDate(post.createdAt) }}</td>
                <td>
                  <div class="reaction-group">
                    <span class="reaction-count like-count">👍 {{ getLikeCount(post) }}</span>
                    <span class="reaction-count dislike-count">👎 {{ getDislikeCount(post) }}</span>
                  </div>
                </td>
                <td>
                  <div class="reaction-group">
                    <button class="reaction-btn like symbol" (click)="toggleLike(post)" [disabled]="loading" [title]="hasLiked(post) ? 'Remove like' : 'Like'">
                      {{ hasLiked(post) ? '−👍' : '+👍' }}
                    </button>
                    <button class="reaction-btn dislike symbol" (click)="toggleDislike(post)" [disabled]="loading" [title]="hasDisliked(post) ? 'Remove dislike' : 'Dislike'">
                      {{ hasDisliked(post) ? '+👎' : '−👎' }}
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredApprovedPosts.length === 0">
                <td colspan="5" style="text-align:center;color:#94a3b8;">No approved public posts found.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="table-shell" *ngIf="!loading">
          <table>
            <thead>
              <tr>
                <th>My Blogs</th>
                <th>Status</th>
                <th>Message</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let post of filteredMyPosts" class="border-t">
                <td>
                  <strong>{{ post.title }}</strong>
                  <div style="color:#64748b;font-size:0.8rem;">{{ truncate(post.content) }}</div>
                </td>
                <td>
                  <span class="badge-status"
                        [ngClass]="{
                          'status-pending': getStatus(post) === 'PENDING',
                          'status-approved': getStatus(post) === 'APPROVED',
                          'status-rejected': getStatus(post) === 'REJECTED'
                        }">
                    {{ getStatus(post) }}
                  </span>
                </td>
                <td>{{ statusMessage(getStatus(post)) }}</td>
                <td>{{ formatDate(post.createdAt) }}</td>
                <td>
                  <div class="card-actions">
                    <button class="action-btn" (click)="editPost(post)" [disabled]="loading">Edit</button>
                    <button class="action-btn" (click)="deletePost(post)" [disabled]="loading">Delete</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredMyPosts.length === 0">
                <td colspan="5" style="text-align:center;color:#94a3b8;">You have no blog posts yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [BLOG_DASHBOARD_STYLES]
})
export class BlogManagementPageComponent implements OnInit {
  loading = false;
  error = '';
  success = '';

  approvedPosts: BlogPostDto[] = [];
  myPosts: BlogPostDto[] = [];

  filteredApprovedPosts: BlogPostDto[] = [];
  filteredMyPosts: BlogPostDto[] = [];

  reactionStates: Record<string, { liked: boolean; disliked: boolean }> = {};

  searchTerm = '';
  sortMode: 'latest' | 'oldest' = 'latest';

  editingId?: number;
  form: BlogPostDto = { title: '', content: '', author: '' };
  currentAuthor = 'User';

  constructor(
    private readonly blogApi: BlogApiService,
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const displayName = this.auth.getDisplayName() || this.auth.getUsername() || 'User';
    this.currentAuthor = displayName;
    this.form.author = displayName;
    void this.loadData();
  }

  get pendingCount(): number {
    return this.myPosts.filter((p) => this.getStatus(p) === 'PENDING').length;
  }

  get rejectedCount(): number {
    return this.myPosts.filter((p) => this.getStatus(p) === 'REJECTED').length;
  }

  async loadData(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const [approved, mine] = await Promise.all([
        this.blogApi.getApproved(),
        this.blogApi.getByAuthor(this.currentAuthor)
      ]);
      this.approvedPosts = approved;
      this.myPosts = mine;
      this.recomputeViews();
    } catch (e: any) {
      this.error = e?.message || 'Failed to load blog posts';
    } finally {
      this.loading = false;
    }
  }

  async savePost(): Promise<void> {
    if (!this.form.title.trim() || !this.form.content.trim()) {
      this.error = 'Title and content are required.';
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
        await this.blogApi.update(this.editingId, {
          title: this.form.title.trim(),
          content: this.form.content.trim(),
          author: this.currentAuthor
        });
        this.success = 'Blog updated successfully.';
      } else {
        await this.blogApi.add({
          title: this.form.title.trim(),
          content: this.form.content.trim(),
          author: this.currentAuthor,
          status: 'PENDING'
        });
        this.success = 'Blog created with PENDING status. Waiting for admin approval.';
      }
      this.resetForm();
      await this.loadData();
    } catch (e: any) {
      this.error = e?.message || 'Failed to save blog post';
    } finally {
      this.loading = false;
    }
  }

  resetForm(): void {
    this.editingId = undefined;
    this.form = { title: '', content: '', author: this.currentAuthor };
  }

  cancelEdit(): void {
    this.resetForm();
  }

  editPost(post: BlogPostDto): void {
    this.editingId = post.idPost;
    this.form = {
      title: post.title,
      content: post.content,
      author: this.currentAuthor
    };
  }

  async deletePost(post: BlogPostDto): Promise<void> {
    if (!post.idPost) return;
    this.loading = true;
    this.error = '';
    this.success = '';
    try {
      await this.blogApi.delete(post.idPost);
      this.success = 'Blog post deleted successfully.';
      if (this.editingId === post.idPost) {
        this.resetForm();
      }
      await this.loadData();
    } catch (e: any) {
      this.error = e?.message || 'Failed to delete blog post';
    } finally {
      this.loading = false;
    }
  }

  goToFront(): void {
    void this.router.navigateByUrl('/front');
  }

  recomputeViews(): void {
    const term = this.searchTerm.trim().toLowerCase();

    this.filteredApprovedPosts = this.sortPosts(this.approvedPosts)
      .filter((p) => p.title?.toLowerCase().includes(term));

    this.filteredMyPosts = this.sortPosts(this.myPosts)
      .filter((p) => p.title?.toLowerCase().includes(term));
  }

  async toggleLike(post: BlogPostDto): Promise<void> {
    if (!post.idPost) return;
    const state = this.getReactionState(post);
    this.loading = true;
    this.error = '';
    try {
      if (state.liked) {
        await this.blogApi.removeLike(post.idPost);
        state.liked = false;
      } else {
        await this.blogApi.like(post.idPost);
        state.liked = true;
        if (state.disliked) {
          await this.blogApi.removeDislike(post.idPost);
          state.disliked = false;
        }
      }
      this.reactionStates[String(post.idPost)] = state;
      await this.loadData();
    } catch (e: any) {
      this.error = e?.message || 'Failed to update like';
    } finally {
      this.loading = false;
    }
  }

  async toggleDislike(post: BlogPostDto): Promise<void> {
    if (!post.idPost) return;
    const state = this.getReactionState(post);
    this.loading = true;
    this.error = '';
    try {
      if (state.disliked) {
        await this.blogApi.removeDislike(post.idPost);
        state.disliked = false;
      } else {
        await this.blogApi.dislike(post.idPost);
        state.disliked = true;
        if (state.liked) {
          await this.blogApi.removeLike(post.idPost);
          state.liked = false;
        }
      }
      this.reactionStates[String(post.idPost)] = state;
      await this.loadData();
    } catch (e: any) {
      this.error = e?.message || 'Failed to update dislike';
    } finally {
      this.loading = false;
    }
  }

  getLikeCount(post: BlogPostDto): number {
    return post.likes || 0;
  }

  getDislikeCount(post: BlogPostDto): number {
    return post.dislikes || 0;
  }

  hasLiked(post: BlogPostDto): boolean {
    return !!post.idPost && !!this.getReactionState(post).liked;
  }

  hasDisliked(post: BlogPostDto): boolean {
    return !!post.idPost && !!this.getReactionState(post).disliked;
  }

  getStatus(post: BlogPostDto): BlogStatus {
    return post.status || 'PENDING';
  }

  statusMessage(status: BlogStatus): string {
    if (status === 'APPROVED') return 'Approved and visible';
    if (status === 'REJECTED') return 'Your blog was rejected';
    return 'Waiting for admin approval';
  }

  formatDate(raw?: string): string {
    if (!raw) return '-';
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? raw : d.toLocaleString();
  }

  truncate(content?: string): string {
    if (!content) return '';
    return content.length > 90 ? `${content.slice(0, 90)}...` : content;
  }

  private sortPosts(posts: BlogPostDto[]): BlogPostDto[] {
    return [...posts].sort((a, b) => {
      const aTime = this.parseDate(a.createdAt);
      const bTime = this.parseDate(b.createdAt);
      return this.sortMode === 'latest' ? bTime - aTime : aTime - bTime;
    });
  }

  private parseDate(raw?: string): number {
    if (!raw) return 0;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  }

  private getReactionState(post: BlogPostDto): { liked: boolean; disliked: boolean } {
    if (!post.idPost) {
      return { liked: false, disliked: false };
    }

    return this.reactionStates[String(post.idPost)] || { liked: false, disliked: false };
  }
}
