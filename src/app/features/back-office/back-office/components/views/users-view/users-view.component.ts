import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface KcUserRow {
  dbId?: number | null;
  firstName: string;
  lastName: string;
  email?: string | null;
  dbRole?: string | null;
  enabled: boolean;
  keycloakId: string;
  keycloakRoles: string[];
}

@Component({
  selector: 'app-users-view',
  styles: [`
    :host {
      --blue-deep:  #1a2b6b;
      --blue-main:  #2d4eaa;
      --blue-mid:   #4a72cc;
      --blue-soft:  #6b9ae8;
      --blue-pale:  #c5d8f8;
      --blue-bg:    #ddeaf8;
      --blue-bg2:   #eaf3fd;
      --white:      #ffffff;
      --text:       #1a2b6b;
      --text-mid:   #4a5a8a;
      --text-light: #8a9bc0;
      --text-dim:   #b8c7e0;
      --success:    #10b981;
      --error:      #ef4444;
      --warning:    #f59e0b;
      display: block;
      /* Avoid remote font import here (breaks production build budgets). */
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
    }

    /* ── Page wrapper ── */
    .page { display: flex; flex-direction: column; gap: 24px; }

    /* ── Header ── */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--blue-deep);
      margin: 0;
      letter-spacing: -0.03em;
    }

    .page-subtitle {
      font-size: 0.8rem;
      color: var(--text-light);
      margin: 3px 0 0;
    }

    .header-actions { display: flex; align-items: center; gap: 10px; }

    /* ── Buttons ── */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 10px 20px;
      border-radius: 50px;
      font-size: 0.83rem;
      font-family: 'Inter', sans-serif;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      outline: none;
      white-space: nowrap;
    }

    .btn-outline {
      background: var(--white);
      border: 1.5px solid var(--blue-pale);
      color: var(--text-mid);
      box-shadow: 0 1px 4px rgba(45,78,170,0.07);
    }
    .btn-outline:hover {
      border-color: var(--blue-mid);
      color: var(--blue-main);
      box-shadow: 0 4px 14px rgba(45,78,170,0.12);
      transform: translateY(-1px);
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--blue-deep), var(--blue-main));
      color: #fff;
      box-shadow: 0 4px 14px rgba(45,78,170,0.3);
    }
    .btn-primary:hover {
      box-shadow: 0 8px 24px rgba(45,78,170,0.4);
      transform: translateY(-1px);
    }

    .btn-sm {
      padding: 6px 14px;
      font-size: 0.76rem;
      border-radius: 8px;
    }

    .btn-view {
      background: var(--blue-bg2);
      border: 1px solid var(--blue-pale);
      color: var(--text-mid);
    }
    .btn-view:hover { background: var(--blue-bg); color: var(--blue-main); }

    .btn-edit {
      background: rgba(45,78,170,0.08);
      border: 1px solid rgba(45,78,170,0.15);
      color: var(--blue-main);
    }
    .btn-edit:hover { background: rgba(45,78,170,0.15); }

    .btn-delete {
      background: rgba(239,68,68,0.07);
      border: 1px solid rgba(239,68,68,0.18);
      color: #dc2626;
    }
    .btn-delete:hover { background: rgba(239,68,68,0.14); }

    /* Spin */
    .spin-ring {
      width: 12px; height: 12px;
      border: 2px solid var(--blue-pale);
      border-top-color: var(--blue-main);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Alert ── */
    .alert {
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 0.83rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 10px;
      animation: fadeIn 0.3s ease;
    }
    .alert-error {
      background: rgba(239,68,68,0.07);
      border: 1.5px solid rgba(239,68,68,0.2);
      color: #dc2626;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

    /* ── Table Card ── */
    .table-card {
      background: var(--white);
      border: 1px solid rgba(197,216,248,0.55);
      border-radius: 20px;
      box-shadow: 0 4px 24px rgba(45,78,170,0.09);
      overflow: hidden;
    }

    .table-top {
      padding: 16px 24px;
      border-bottom: 1px solid var(--blue-bg);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .table-meta {
      font-size: 0.8rem;
      color: var(--text-light);
    }

    .table-meta strong {
      color: var(--blue-main);
      font-weight: 700;
    }

    /* Search */
    .search-wrap {
      position: relative;
    }
    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-dim);
      font-size: 0.85rem;
      pointer-events: none;
    }
    .search-input {
      padding: 8px 14px 8px 34px;
      border: 1.5px solid var(--blue-bg);
      border-radius: 50px;
      background: var(--blue-bg2);
      color: var(--blue-deep);
      font-size: 0.82rem;
      font-family: 'Inter', sans-serif;
      width: 220px;
      outline: none;
      transition: all 0.2s;
    }
    .search-input:focus {
      border-color: var(--blue-mid);
      background: var(--white);
      box-shadow: 0 0 0 3px rgba(74,114,204,0.1);
    }

    /* ── Table ── */
    .tbl { width: 100%; border-collapse: collapse; font-size: 0.84rem; }

    .tbl thead tr {
      background: var(--blue-bg2);
      border-bottom: 1px solid var(--blue-bg);
    }

    .tbl th {
      padding: 11px 18px;
      text-align: left;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-light);
      white-space: nowrap;
    }

    .tbl th:last-child { text-align: right; }

    .tbl tbody tr {
      border-bottom: 1px solid rgba(221,234,248,0.6);
      transition: background 0.15s ease;
    }
    .tbl tbody tr:last-child { border-bottom: none; }
    .tbl tbody tr:hover { background: rgba(234,243,253,0.7); }
    .tbl tbody tr.selected-row { background: rgba(74,114,204,0.06); }

    .tbl td {
      padding: 14px 18px;
      vertical-align: middle;
    }
    .tbl td:last-child { text-align: right; }

    /* User cell */
    .user-cell { display: flex; align-items: center; gap: 12px; }

    .user-avatar {
      width: 36px; height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--blue-deep), var(--blue-mid));
      color: #fff;
      font-size: 0.78rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .user-name {
      font-weight: 600;
      color: var(--blue-deep);
      line-height: 1.2;
    }
    .user-id {
      font-size: 0.7rem;
      color: var(--text-dim);
      margin-top: 2px;
      font-family: monospace;
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Email */
    .email-cell { color: var(--text-mid); }

    /* Role badge */
    .role-badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin: 2px 3px 2px 0;
    }

    .role-ADMIN    { background: rgba(45,78,170,0.1);  color: var(--blue-main); border: 1px solid rgba(45,78,170,0.18); }
    .role-CLIENT   { background: rgba(107,154,232,0.12); color: #3b6fcf; border: 1px solid rgba(107,154,232,0.2); }
    .role-FREELANCER { background: rgba(16,185,129,0.1); color: #059669; border: 1px solid rgba(16,185,129,0.2); }
    .role-default  { background: var(--blue-bg2); color: var(--text-light); border: 1px solid var(--blue-bg); }

    /* Status dot */
    .status-dot {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 0.76rem;
      font-weight: 600;
    }
    .dot {
      width: 7px; height: 7px;
      border-radius: 50%;
    }
    .dot-on  { background: var(--success); box-shadow: 0 0 4px rgba(16,185,129,0.5); }
    .dot-off { background: #e5e7eb; }

    /* Action buttons group */
    .action-group { display: inline-flex; align-items: center; gap: 6px; }

    /* ── Detail Panel ── */
    .detail-panel {
      background: var(--white);
      border: 1px solid rgba(197,216,248,0.55);
      border-radius: 20px;
      box-shadow: 0 4px 24px rgba(45,78,170,0.09);
      overflow: hidden;
      animation: fadeIn 0.3s ease;
    }

    .detail-header {
      padding: 18px 24px;
      border-bottom: 1px solid var(--blue-bg);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .detail-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--blue-deep);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .detail-avatar {
      width: 40px; height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--blue-deep), var(--blue-mid));
      color: #fff;
      font-size: 0.9rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .detail-body {
      padding: 20px 24px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }

    .detail-item label {
      display: block;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-light);
      margin-bottom: 4px;
    }

    .detail-item span {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--blue-deep);
      word-break: break-all;
    }

    .btn-close {
      background: transparent;
      border: 1px solid var(--blue-bg);
      color: var(--text-light);
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 0.78rem;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-close:hover { background: var(--blue-bg2); color: var(--text-mid); }

    /* ── Modal ── */
    .modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(10, 18, 50, 0.5);
      cursor: pointer;
    }

    .modal-box {
      position: relative;
      width: 100%;
      max-width: 520px;
      background: #ffffff;
      border-radius: 24px;
      box-shadow: 0 24px 80px rgba(10,18,50,0.30), 0 4px 16px rgba(10,18,50,0.12);
      border: 1px solid rgba(197,216,248,0.5);
      animation: slideUp 0.28s cubic-bezier(.22,.68,0,1.2) both;
      cursor: default;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(28px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0)    scale(1);    }
    }

    .modal-header {
      padding: 22px 26px 18px;
      border-bottom: 1px solid var(--blue-bg);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-title {
      font-size: 1rem;
      font-weight: 800;
      color: var(--blue-deep);
      letter-spacing: -0.02em;
    }

    .modal-close {
      background: var(--blue-bg2);
      border: none;
      color: var(--text-light);
      width: 30px; height: 30px;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .modal-close:hover { background: var(--blue-bg); color: var(--blue-main); }

    .modal-body { padding: 22px 26px; }

    .modal-fields {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .modal-field { display: flex; flex-direction: column; gap: 5px; }
    .modal-field.span-2 { grid-column: 1 / -1; }

    .modal-field label {
      font-size: 0.73rem;
      font-weight: 700;
      color: var(--text-mid);
      letter-spacing: 0.04em;
    }

    .field-input, .field-select {
      padding: 10px 14px;
      border: 1.5px solid var(--blue-bg);
      border-radius: 10px;
      background: var(--blue-bg2);
      color: var(--blue-deep);
      font-size: 0.86rem;
      font-family: 'Inter', sans-serif;
      font-weight: 500;
      outline: none;
      transition: all 0.2s;
      width: 100%;
      box-sizing: border-box;
    }
    .field-input::placeholder { color: var(--text-dim); font-weight: 400; }
    .field-input:focus, .field-select:focus {
      border-color: var(--blue-mid);
      background: var(--white);
      box-shadow: 0 0 0 3px rgba(74,114,204,0.1);
    }

    .modal-footer {
      padding: 16px 26px 22px;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      border-top: 1px solid var(--blue-bg);
    }

    /* ── Empty state ── */
    .empty { padding: 60px 20px; text-align: center; color: var(--text-light); font-size: 0.85rem; }
    .empty-icon { font-size: 2rem; margin-bottom: 10px; opacity: 0.4; }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      .modal-fields { grid-template-columns: 1fr; }
      .modal-field.span-2 { grid-column: 1; }
      .search-input { width: 160px; }
      .user-id { display: none; }
    }
  `],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">Users</h2>
          <p class="page-subtitle">Manage all registered users on the platform.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline" (click)="load()" [disabled]="loading">
            <span *ngIf="loading" class="spin-ring"></span>
            <span *ngIf="!loading">⟳</span>
            {{ loading ? 'Refreshing…' : 'Refresh' }}
          </button>
          <button class="btn btn-primary" (click)="openAdd()">
            + Add User
          </button>
        </div>
      </div>

      <!-- Alert -->
      <div *ngIf="error" class="alert alert-error">
        <span>✕</span> {{ error }}
      </div>

      <ng-container *ngIf="!selected; else detailsPage">
        <!-- Table Card -->
        <div class="table-card">
          <div class="table-top">
            <span class="table-meta">
              <strong>{{ filtered.length }}</strong> user{{ filtered.length !== 1 ? 's' : '' }} found
            </span>
            <div class="search-wrap">
              <span class="search-icon">⌕</span>
              <input
                class="search-input"
                placeholder="Search users…"
                [(ngModel)]="searchQuery"
                (ngModelChange)="applyFilter()"
              />
            </div>
          </div>

          <div style="overflow-x:auto;">
            <table class="tbl">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Roles</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let u of filtered">
                  <!-- User -->
                  <td>
                    <div class="user-cell">
                      <div class="user-avatar">
                        {{ u.firstName[0] || '?' }}{{ u.lastName[0] || '' }}
                      </div>
                      <div>
                        <div class="user-name">{{ u.firstName }} {{ u.lastName }}</div>
                        <div class="user-id" [title]="u.keycloakId">{{ u.keycloakId }}</div>
                      </div>
                    </div>
                  </td>

                  <!-- Email -->
                  <td class="email-cell">{{ u.email || '—' }}</td>

                  <!-- Roles -->
                  <td>
                    <ng-container *ngIf="u.keycloakRoles?.length; else noRole">
                      <span
                        *ngFor="let r of u.keycloakRoles"
                        class="role-badge"
                        [ngClass]="getRoleCss(r)"
                      >{{ r }}</span>
                    </ng-container>
                    <ng-template #noRole>
                      <span class="role-badge role-default">—</span>
                    </ng-template>
                  </td>

                  <!-- Status -->
                  <td>
                    <span class="status-dot">
                      <span class="dot" [class.dot-on]="u.enabled" [class.dot-off]="!u.enabled"></span>
                      {{ u.enabled ? 'Active' : 'Inactive' }}
                    </span>
                  </td>

                  <!-- Actions -->
                  <td>
                    <div class="action-group">
                      <button class="btn btn-sm btn-view" (click)="view(u)">View</button>
                      <button class="btn btn-sm btn-edit" (click)="openUpdate(u)">Update</button>
                      <button class="btn btn-sm btn-delete" (click)="remove(u)">Delete</button>
                    </div>
                  </td>
                </tr>

                <tr *ngIf="!filtered.length && !loading">
                  <td colspan="5">
                    <div class="empty">
                      <div class="empty-icon">👤</div>
                      No users found.
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ng-container>

      <ng-template #detailsPage>
        <div class="detail-panel">
          <div class="detail-header">
            <div class="detail-title">
              <div class="detail-avatar">{{ selected!.firstName[0] || '?' }}{{ selected!.lastName[0] || '' }}</div>
              {{ selected!.firstName }} {{ selected!.lastName }}
            </div>

            <div style="display:flex; align-items:center; gap:10px;">
              <button class="btn btn-outline btn-sm" style="border-radius:10px;" (click)="closeDetails()">
                ← Back to list
              </button>
              <button class="btn btn-primary btn-sm" style="border-radius:10px;" (click)="openUpdate(selected!)">
                ✎ Edit
              </button>
            </div>
          </div>

          <div class="detail-body">
            <div class="detail-item">
              <label>First name</label>
              <span>{{ selected!.firstName }}</span>
            </div>
            <div class="detail-item">
              <label>Last name</label>
              <span>{{ selected!.lastName }}</span>
            </div>
            <div class="detail-item">
              <label>Email</label>
              <span>{{ selected!.email || '—' }}</span>
            </div>
            <div class="detail-item">
              <label>Status</label>
              <span>
                <span class="status-dot">
                  <span class="dot" [class.dot-on]="selected!.enabled" [class.dot-off]="!selected!.enabled"></span>
                  {{ selected!.enabled ? 'Active' : 'Inactive' }}
                </span>
              </span>
            </div>
            <div class="detail-item" style="grid-column:1/-1">
              <label>Keycloak ID</label>
              <span style="font-family:monospace;font-size:0.78rem;">{{ selected!.keycloakId }}</span>
            </div>
            <div class="detail-item" style="grid-column:1/-1">
              <label>Roles</label>
              <span>
                <span *ngFor="let r of selected!.keycloakRoles" class="role-badge" [ngClass]="getRoleCss(r)">{{ r }}</span>
                <span *ngIf="!selected!.keycloakRoles.length">—</span>
              </span>
            </div>
          </div>
        </div>
      </ng-template>

      <!-- Modal -->
      <div class="modal-overlay" *ngIf="modalOpen" (click)="closeModal()">
        <div class="modal-box" (click)="$event.stopPropagation()">

          <div class="modal-header">
            <span class="modal-title">{{ modalMode === 'add' ? '+ Add New User' : '✎ Update User' }}</span>
            <button class="modal-close" (click)="closeModal()">✕</button>
          </div>

          <div class="modal-body">
            <div class="modal-fields">
              <div class="modal-field">
                <label>First name</label>
                <input class="field-input" [(ngModel)]="form.firstName" placeholder="John" />
              </div>
              <div class="modal-field">
                <label>Last name</label>
                <input class="field-input" [(ngModel)]="form.lastName" placeholder="Doe" />
              </div>
              <div class="modal-field span-2">
                <label>Email</label>
                <input class="field-input" [(ngModel)]="form.email" type="email" placeholder="john@example.com" />
              </div>
              <div class="modal-field span-2">
                <label>Password {{ modalMode === 'update' ? '(leave empty to keep)' : '' }}</label>
                <input class="field-input" [(ngModel)]="form.password" type="password" placeholder="••••••••" />
              </div>
              <div class="modal-field">
                <label>Role</label>
                <select class="field-select" [(ngModel)]="form.role">
                  <option value="ADMIN">ADMIN</option>
                  <option value="CLIENT">CLIENT</option>
                  <option value="FREELANCER">FREELANCER</option>
                </select>
              </div>
              <div class="modal-field" *ngIf="modalMode === 'update'">
                <label>Status</label>
                <select class="field-select" [(ngModel)]="form.enabled">
                  <option [ngValue]="true">Active</option>
                  <option [ngValue]="false">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline btn-sm" style="border-radius:10px;" (click)="closeModal()">Cancel</button>
            <button class="btn btn-primary btn-sm" style="border-radius:10px;" (click)="save()" [disabled]="saving">
              <span *ngIf="saving" class="spin-ring"></span>
              {{ saving ? 'Saving…' : (modalMode === 'add' ? 'Create User' : 'Save Changes') }}
            </button>
          </div>

        </div>
      </div>

    </div>
  `
})
export class UsersViewComponent implements OnInit {
  users: KcUserRow[] = [];
  filtered: KcUserRow[] = [];
  selected?: KcUserRow;
  error?: string;
  loading = false;
  saving = false;
  searchQuery = '';

  private readonly baseUrl = 'http://localhost:8090/api/admin/users';

  modalOpen = false;
  modalMode: 'add' | 'update' = 'add';
  editingId?: string;
  form: any = {
    firstName: '', lastName: '', email: '',
    password: '', role: 'CLIENT', enabled: true
  };

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void { void this.load(); }

  async load(): Promise<void> {
    this.error = undefined;
    this.loading = true;
    try {
      this.users = await firstValueFrom(this.http.get<KcUserRow[]>(this.baseUrl));
      this.applyFilter();
    } catch (e: any) {
      this.error = e?.message || 'Failed to load users';
    } finally { this.loading = false; }
  }

  applyFilter(): void {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) { this.filtered = [...this.users]; return; }
    this.filtered = this.users.filter(u =>
      `${u.firstName} ${u.lastName} ${u.email || ''} ${u.keycloakRoles?.join(' ') || ''}`.toLowerCase().includes(q)
    );
  }

  getRoleCss(role: string): string {
    if (role === 'ADMIN') return 'role-ADMIN';
    if (role === 'CLIENT') return 'role-CLIENT';
    if (role === 'FREELANCER') return 'role-FREELANCER';
    return 'role-default';
  }

  view(u: KcUserRow): void { this.selected = u; }

  closeDetails(): void {
    this.selected = undefined;
  }

  openAdd(): void {
    this.modalMode = 'add';
    this.editingId = undefined;
    this.form = { firstName: '', lastName: '', email: '', password: '', role: 'CLIENT', enabled: true };
    this.modalOpen = true;
  }

  openUpdate(u: KcUserRow): void {
    this.modalMode = 'update';
    this.editingId = u.keycloakId;
    const primaryRole = (u.keycloakRoles || []).find(r => ['ADMIN', 'CLIENT', 'FREELANCER'].includes(r)) || 'CLIENT';
    this.form = { firstName: u.firstName, lastName: u.lastName, email: u.email || '', password: '', role: primaryRole, enabled: u.enabled };
    this.modalOpen = true;
  }

  closeModal(): void { this.modalOpen = false; }

  async save(): Promise<void> {
    this.error = undefined;
    this.saving = true;
    try {
      if (this.modalMode === 'add') {
        await firstValueFrom(this.http.post(this.baseUrl, {
          firstName: this.form.firstName, lastName: this.form.lastName,
          email: this.form.email, password: this.form.password, role: this.form.role
        }));
      } else {
        await firstValueFrom(this.http.put(`${this.baseUrl}/${this.editingId}`, {
          firstName: this.form.firstName, lastName: this.form.lastName,
          email: this.form.email, password: this.form.password,
          enabled: this.form.enabled, role: this.form.role
        }));
      }
      this.modalOpen = false;
      await this.load();
    } catch (e: any) {
      this.error = e?.error?.error || e?.message || 'Save failed';
    } finally { this.saving = false; }
  }

  async remove(u: KcUserRow): Promise<void> {
    if (!confirm(`Delete user ${u.email || u.keycloakId}?`)) return;
    this.error = undefined;
    try {
      await firstValueFrom(this.http.delete(`${this.baseUrl}/${u.keycloakId}`));
      await this.load();
      this.selected = undefined;
    } catch (e: any) {
      this.error = e?.message || 'Delete failed';
    }
  }
}