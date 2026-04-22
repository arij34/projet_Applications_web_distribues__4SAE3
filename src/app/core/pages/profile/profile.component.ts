import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { KeycloakService } from 'keycloak-angular';
import { MeDto, MeService } from '../../services/me.service';
import { KC_ROLES } from '../../auth/roles';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-profile-page',
  styles: [`
    :host {
      --blue-deep:    #1a2b6b;
      --blue-main:    #2d4eaa;
      --blue-mid:     #4a72cc;
      --blue-soft:    #6b9ae8;
      --blue-pale:    #c5d8f8;
      --blue-bg:      #ddeaf8;
      --blue-bg2:     #eaf3fd;
      --white:        #ffffff;
      --text:         #1a2b6b;
      --text-mid:     #4a5a8a;
      --text-light:   #8a9bc0;
      --text-dim:     #b8c7e0;
      --success:      #10b981;
      --error:        #ef4444;
      --shadow-sm:    0 2px 8px rgba(45,78,170,0.10);
      --shadow-md:    0 8px 32px rgba(45,78,170,0.14);
      --shadow-lg:    0 20px 60px rgba(45,78,170,0.18);
      display: block;
      /* Avoid remote font import here (breaks production build budgets). */
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
    }

    /* ── Shell ── */
    .profile-shell {
      min-height: calc(100vh - 72px);
      background: var(--blue-bg2);
      position: relative;
      overflow: hidden;
      padding: 48px 20px 80px;
    }

    /* Wave blobs — same feel as the homepage */
    .wave-blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
      z-index: 0;
    }
    .blob-1 {
      width: 700px; height: 500px;
      background: rgba(107,154,232,0.22);
      top: -120px; right: -150px;
    }
    .blob-2 {
      width: 500px; height: 400px;
      background: rgba(197,216,248,0.35);
      bottom: -80px; left: -100px;
    }
    .blob-3 {
      width: 300px; height: 300px;
      background: rgba(45,78,170,0.08);
      top: 40%; left: 30%;
    }

    /* Sparkles like the homepage */
    .sparkle {
      position: absolute;
      color: var(--blue-soft);
      font-size: 20px;
      opacity: 0.5;
      pointer-events: none;
      z-index: 0;
      animation: twinkle 3s ease-in-out infinite;
    }
    @keyframes twinkle {
      0%, 100% { opacity: 0.35; transform: scale(1); }
      50%       { opacity: 0.7;  transform: scale(1.2); }
    }

    /* ── Container ── */
    .container {
      max-width: 860px;
      margin: 0 auto;
      position: relative;
      z-index: 1;
      animation: fadeUp 0.55s cubic-bezier(.22,.68,0,1.2) both;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(32px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Page Title ── */
    .page-title-row {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      margin-bottom: 28px;
      gap: 16px;
      flex-wrap: wrap;
    }

    .page-title {
      font-size: clamp(1.5rem, 3.5vw, 2.2rem);
      font-weight: 800;
      color: var(--blue-deep);
      margin: 0;
      line-height: 1.1;
      letter-spacing: -0.03em;
    }

    .page-sub {
      margin: 5px 0 0;
      font-size: 0.85rem;
      color: var(--text-light);
      font-weight: 400;
    }

    /* ── Refresh Button ── */
    .btn-refresh {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 50px;
      border: 1.5px solid var(--blue-pale);
      background: var(--white);
      color: var(--text-mid);
      font-size: 0.83rem;
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: var(--shadow-sm);
    }
    .btn-refresh:hover {
      border-color: var(--blue-mid);
      color: var(--blue-main);
      box-shadow: var(--shadow-md);
      transform: translateY(-1px);
    }
    .btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    .spin-ring {
      width: 13px; height: 13px;
      border: 2px solid var(--blue-pale);
      border-top-color: var(--blue-main);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Alerts ── */
    .alert {
      padding: 13px 18px;
      border-radius: 14px;
      font-size: 0.84rem;
      font-weight: 500;
      margin-bottom: 22px;
      display: flex;
      align-items: center;
      gap: 10px;
      animation: fadeUp 0.3s ease;
    }
    .alert-success {
      background: rgba(16,185,129,0.08);
      border: 1.5px solid rgba(16,185,129,0.22);
      color: #059669;
    }
    .alert-error {
      background: rgba(239,68,68,0.07);
      border: 1.5px solid rgba(239,68,68,0.2);
      color: #dc2626;
    }
    .alert-icon { font-size: 1rem; flex-shrink: 0; }

    /* ── Main Card ── */
    .card {
      background: var(--white);
      border-radius: 24px;
      box-shadow: var(--shadow-lg);
      overflow: hidden;
      border: 1px solid rgba(197,216,248,0.6);
    }

    /* ── Hero Band ── */
    .hero-band {
      background: linear-gradient(135deg, var(--blue-deep) 0%, var(--blue-main) 50%, var(--blue-mid) 100%);
      padding: 36px 36px 52px;
      position: relative;
      overflow: hidden;
    }

    .hero-circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255,255,255,0.06);
      pointer-events: none;
    }
    .hc1 { width: 220px; height: 220px; top: -60px; right: -40px; }
    .hc2 { width: 140px; height: 140px; bottom: -50px; right: 100px; background: rgba(255,255,255,0.04); }
    .hc3 { width: 80px;  height: 80px;  top: 20px; right: 140px; background: rgba(255,255,255,0.08); }

    .hero-content {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 22px;
    }

    .avatar {
      width: 68px;
      height: 68px;
      border-radius: 20px;
      background: rgba(255,255,255,0.18);
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255,255,255,0.3);
      color: #fff;
      font-size: 1.3rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      letter-spacing: 0.02em;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    }

    .hero-info { flex: 1; min-width: 0; }

    .hero-name {
      font-size: 1.3rem;
      font-weight: 800;
      color: #fff;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      letter-spacing: -0.02em;
    }

    .hero-email {
      font-size: 0.82rem;
      color: rgba(255,255,255,0.65);
      margin-top: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .hero-badges {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      flex-wrap: wrap;
    }

    .badge {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 50px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .badge-role {
      background: rgba(255,255,255,0.18);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.25);
    }
    .badge-active {
      background: rgba(16,185,129,0.25);
      color: #6ee7b7;
      border: 1px solid rgba(16,185,129,0.3);
    }
    .badge-disabled {
      background: rgba(239,68,68,0.2);
      color: #fca5a5;
      border: 1px solid rgba(239,68,68,0.25);
    }

    /* Curve that connects hero to form */
    .hero-bottom-curve {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 28px;
      background: var(--white);
      border-radius: 28px 28px 0 0;
    }

    /* ── Form Section ── */
    .form-section {
      padding: 32px 36px 36px;
    }

    .section-label {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text-dim);
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section-label::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--blue-bg);
    }

    .fields-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .field.span-2 { grid-column: 1 / -1; }

    .field label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-mid);
      letter-spacing: 0.03em;
    }

    .field-input {
      width: 100%;
      padding: 12px 16px;
      border: 1.5px solid var(--blue-bg);
      border-radius: 12px;
      background: var(--blue-bg2);
      color: var(--blue-deep);
      font-size: 0.88rem;
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
      font-weight: 500;
      transition: all 0.2s ease;
      box-sizing: border-box;
      outline: none;
    }
    .field-input::placeholder { color: var(--text-dim); font-weight: 400; }
    .field-input:hover { border-color: var(--blue-pale); background: #f0f7ff; }
    .field-input:focus {
      border-color: var(--blue-mid);
      background: var(--white);
      box-shadow: 0 0 0 4px rgba(74,114,204,0.12);
    }

    /* ── Actions ── */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 28px;
      padding-top: 24px;
      border-top: 1px solid var(--blue-bg);
    }

    .btn {
      padding: 12px 28px;
      border-radius: 50px;
      font-size: 0.86rem;
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      outline: none;
    }

    .btn-ghost {
      background: transparent;
      border: 1.5px solid var(--blue-pale);
      color: var(--text-mid);
    }
    .btn-ghost:hover {
      background: var(--blue-bg2);
      border-color: var(--blue-soft);
      color: var(--blue-main);
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--blue-deep), var(--blue-main));
      color: #fff;
      box-shadow: 0 4px 18px rgba(45,78,170,0.35);
    }
    .btn-primary:hover {
      box-shadow: 0 8px 28px rgba(45,78,170,0.45);
      transform: translateY(-1px);
    }
    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    /* ── Empty ── */
    .empty-state {
      padding: 80px 20px;
      text-align: center;
      color: var(--text-light);
      font-size: 0.9rem;
    }

    /* ── Responsive ── */
    @media (max-width: 600px) {
      .hero-band { padding: 28px 22px 44px; }
      .form-section { padding: 24px 22px 28px; }
      .fields-grid { grid-template-columns: 1fr; }
      .field.span-2 { grid-column: 1; }
      .form-actions { flex-direction: column-reverse; }
      .btn { width: 100%; text-align: center; }
    }
  `],
  template: `
    <div class="profile-shell">

      <!-- Background atmosphere -->
      <div class="wave-blob blob-1"></div>
      <div class="wave-blob blob-2"></div>
      <div class="wave-blob blob-3"></div>

      <!-- Sparkles (like the Freelancy homepage) -->
      <span class="sparkle" style="top:15%;left:12%;">✦</span>
      <span class="sparkle" style="top:20%;right:18%;animation-delay:.8s;font-size:14px;">✦</span>
      <span class="sparkle" style="top:70%;right:10%;animation-delay:1.5s;font-size:22px;">✦</span>
      <span class="sparkle" style="bottom:22%;left:20%;animation-delay:.4s;font-size:12px;">✦</span>
      <span class="sparkle" style="top:55%;right:28%;animation-delay:2s;font-size:18px;">✦</span>

      <div class="container">

        <!-- Title Row -->
        <div class="page-title-row">
          <div>
            <h1 class="page-title">My Profile</h1>
            <p class="page-sub">Manage your account information and password.</p>
          </div>
          <button class="btn-refresh" (click)="load()" [disabled]="loading">
            <span *ngIf="loading" class="spin-ring"></span>
            <span *ngIf="!loading">⟳</span>
            {{ loading ? 'Refreshing…' : 'Refresh' }}
          </button>
        </div>

        <!-- Alerts -->
        <div *ngIf="success" class="alert alert-success">
          <span class="alert-icon">✓</span> {{ success }}
        </div>
        <div *ngIf="error" class="alert alert-error">
          <span class="alert-icon">✕</span> {{ error }}
        </div>

        <!-- Card -->
        <div class="card" *ngIf="me">

          <!-- Hero Band -->
          <div class="hero-band">
            <div class="hero-circle hc1"></div>
            <div class="hero-circle hc2"></div>
            <div class="hero-circle hc3"></div>

            <div class="hero-content">
              <div class="avatar">{{ (me.firstName[0] || 'U') }}{{ (me.lastName[0] || '') }}</div>
              <div class="hero-info">
                <div class="hero-name">{{ me.firstName }} {{ me.lastName }}</div>
                <div class="hero-email">{{ me.email }}</div>
                <div class="hero-badges">
                  <span class="badge badge-role">{{ me.role || '—' }}</span>
                  <span class="badge" [class.badge-active]="me.enabled" [class.badge-disabled]="!me.enabled">
                    {{ me.enabled ? '● Active' : '● Disabled' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="hero-bottom-curve"></div>
          </div>

          <!-- Form Section -->
          <div class="form-section">
            <div class="section-label">Edit information</div>

            <div class="fields-grid">
              <div class="field">
                <label>First name</label>
                <input class="field-input" [(ngModel)]="form.firstName" autocomplete="given-name" placeholder="John" />
              </div>
              <div class="field">
                <label>Last name</label>
                <input class="field-input" [(ngModel)]="form.lastName" autocomplete="family-name" placeholder="Doe" />
              </div>
              <div class="field span-2">
                <label>Email address</label>
                <input class="field-input" [(ngModel)]="form.email" type="email" autocomplete="email" placeholder="john.doe@example.com" />
              </div>
              <div class="field span-2">
                <label>New password <span style="color:var(--text-dim);font-weight:400;">(optional)</span></label>
                <input class="field-input" [(ngModel)]="form.password" type="password"
                       placeholder="Leave empty to keep current password" autocomplete="new-password" />
              </div>
            </div>

            <div class="form-actions">
              <button class="btn btn-ghost" (click)="cancel()">Cancel</button>
              <button class="btn btn-primary" (click)="save()" [disabled]="!me || saving">
                {{ saving ? 'Saving…' : 'Save changes' }}
              </button>
            </div>
          </div>

        </div>

        <!-- Empty -->
        <div *ngIf="!me && !loading" class="empty-state">No profile data available.</div>

      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  me?: MeDto;
  error?: string;
  success?: string;
  loading = false;
  saving = false;

  form: { firstName: string; lastName: string; email: string; password: string } = {
    firstName: '', lastName: '', email: '', password: ''
  };

  private readonly baseUrl = 'http://localhost:8090/api/me';

  constructor(
    private readonly meService: MeService,
    private readonly http: HttpClient,
    private readonly keycloak: KeycloakService,
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void { void this.load(); }

  async load(): Promise<void> {
    this.error = undefined;
    this.success = undefined;
    this.loading = true;
    try {
      const loggedIn = await this.auth.isLoggedIn();
      if (!loggedIn) { await this.auth.login(window.location.origin + '/profile'); return; }
      try { await this.keycloak.updateToken(30); } catch { /* ignore */ }
      await this.meService.sync();
      this.me = await this.meService.me();
      this.resetForm();
    } catch (e: any) {
      this.error = e?.error?.error || e?.message || 'Failed to load profile';
    } finally { this.loading = false; }
  }

  resetForm(): void {
    if (!this.me) return;
    this.form = { firstName: this.me.firstName, lastName: this.me.lastName, email: this.me.email, password: '' };
  }

  async save(): Promise<void> {
    this.error = undefined;
    this.success = undefined;
    this.saving = true;
    try {
      const loggedIn = await this.auth.isLoggedIn();
      if (!loggedIn) { await this.auth.login(window.location.origin + '/profile'); return; }
      try { await this.keycloak.updateToken(30); } catch { /* ignore */ }

      const updated = await firstValueFrom(this.http.put<MeDto>(`${this.baseUrl}`, {
        firstName: this.form.firstName, lastName: this.form.lastName,
        email: this.form.email, password: this.form.password
      }));

      this.me = updated;
      this.resetForm();
      this.success = 'Profile updated successfully.';
      try { this.me = await this.meService.me(); this.resetForm(); } catch { /* ignore */ }
    } catch (e: any) {
      this.error = e?.error?.error || e?.message || 'Update failed';
    } finally {
      this.saving = false;
    }
  }

  async cancel(): Promise<void> {
    // Ensure Keycloak session is fresh; avoids RoleGuard redirecting to /signin.
    try {
      await this.keycloak.updateToken(30);
    } catch {
      // ignore
    }

    const role = (this.me?.role || '').toUpperCase();

    // If DB says CLIENT/FREELANCER but Keycloak realm role is missing,
    // assign it then refresh token so RoleGuard will allow /client or /freelancer.
    try {
      const kcRoles = this.auth.getUserRoles().map(r => String(r).toUpperCase());
      const needsRealmRole = (role === KC_ROLES.CLIENT || role === KC_ROLES.FREELANCER) && !kcRoles.includes(role);
      if (needsRealmRole) {
        await this.meService.setRole(role as any);
        // Force refresh to pick up the new realm role in the token
        await this.keycloak.updateToken(9999);
      }
    } catch {
      // If role assignment fails, we'll just navigate and let the guard decide.
    }

    // Requested behavior:
    // - ADMIN -> /back-office/dashboard
    // - CLIENT -> /client
    // - FREELANCER -> /freelancer
    let target = this.auth.getDefaultRouteByRole();
    if (role === 'ADMIN') target = '/back-office/dashboard';
    else if (role === 'CLIENT') target = '/client';
    else if (role === 'FREELANCER') target = '/freelancer';

    await this.router.navigateByUrl(target);
  }
}