import { Component, OnInit } from '@angular/core';
import { AdminStatsService, UsersStatsDto } from '../../../../../../core/services/admin-stats.service';

interface StatTile {
  title: string;
  value: string;
  icon: string;
  accent: string;
  bg: string;
  border: string;
  desc: string;
}

@Component({
  selector: 'app-stats-view',
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

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
      display: block;
      font-family: 'Inter', sans-serif;
    }

    /* ── Page ── */
    .page { display: flex; flex-direction: column; gap: 28px; }

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
      font-weight: 400;
    }

    /* ── Refresh button ── */
    .btn-refresh {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 22px;
      border-radius: 50px;
      border: 1.5px solid var(--blue-pale);
      background: var(--white);
      color: var(--text-mid);
      font-size: 0.83rem;
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(45,78,170,0.08);
    }
    .btn-refresh:hover {
      border-color: var(--blue-mid);
      color: var(--blue-main);
      box-shadow: 0 4px 16px rgba(45,78,170,0.15);
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

    /* ── Alert ── */
    .alert-error {
      padding: 13px 18px;
      border-radius: 14px;
      font-size: 0.83rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(239,68,68,0.07);
      border: 1.5px solid rgba(239,68,68,0.2);
      color: #dc2626;
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }

    /* ── Summary Banner ── */
    .summary-banner {
      background: linear-gradient(135deg, var(--blue-deep) 0%, var(--blue-main) 55%, var(--blue-mid) 100%);
      border-radius: 20px;
      padding: 28px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      flex-wrap: wrap;
      position: relative;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(45,78,170,0.25);
    }

    .banner-circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255,255,255,0.06);
      pointer-events: none;
    }
    .bc1 { width: 180px; height: 180px; top: -60px; right: 60px; }
    .bc2 { width: 100px; height: 100px; bottom: -30px; right: 180px; background: rgba(255,255,255,0.04); }
    .bc3 { width: 60px;  height: 60px;  top: 10px;   right: 150px; background: rgba(255,255,255,0.08); }

    .banner-left { position: relative; z-index: 1; }

    .banner-label {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.6);
      margin-bottom: 6px;
    }

    .banner-total {
      font-size: 3rem;
      font-weight: 800;
      color: #fff;
      line-height: 1;
      letter-spacing: -0.04em;
    }

    .banner-sub {
      font-size: 0.82rem;
      color: rgba(255,255,255,0.55);
      margin-top: 6px;
    }

    .banner-pills {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      position: relative;
      z-index: 1;
    }

    .banner-pill {
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 50px;
      padding: 7px 16px;
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .pill-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .pill-text {
      font-size: 0.78rem;
      font-weight: 600;
      color: rgba(255,255,255,0.9);
    }

    .pill-val {
      font-size: 0.78rem;
      font-weight: 800;
      color: #fff;
    }

    /* ── Grid ── */
    .tiles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 16px;
    }

    /* ── Tile ── */
    .tile {
      background: var(--white);
      border-radius: 18px;
      border: 1px solid rgba(197,216,248,0.5);
      padding: 22px 22px 20px;
      box-shadow: 0 2px 12px rgba(45,78,170,0.07);
      transition: all 0.22s ease;
      cursor: default;
      position: relative;
      overflow: hidden;
      animation: fadeIn 0.4s ease both;
    }

    .tile:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 32px rgba(45,78,170,0.14);
      border-color: var(--blue-pale);
    }

    /* Subtle top bar accent */
    .tile::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: var(--tile-accent);
      border-radius: 18px 18px 0 0;
      opacity: 0;
      transition: opacity 0.22s ease;
    }
    .tile:hover::before { opacity: 1; }

    .tile-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .tile-icon-wrap {
      width: 44px; height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: var(--tile-bg);
      border: 1px solid var(--tile-border);
    }

    .tile-icon-wrap svg {
      width: 20px; height: 20px;
      color: var(--tile-accent);
    }

    .tile-trend {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 20px;
      background: rgba(16,185,129,0.1);
      color: #059669;
      border: 1px solid rgba(16,185,129,0.18);
    }

    .tile-value {
      font-size: 2.2rem;
      font-weight: 800;
      color: var(--blue-deep);
      line-height: 1;
      letter-spacing: -0.04em;
    }

    .tile-title {
      font-size: 0.73rem;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: var(--text-light);
      margin-top: 6px;
    }

    .tile-desc {
      font-size: 0.75rem;
      color: var(--text-dim);
      margin-top: 4px;
    }

    /* ── Empty ── */
    .empty {
      padding: 80px 20px;
      text-align: center;
      color: var(--text-light);
      font-size: 0.85rem;
    }
    .empty-icon { font-size: 2.2rem; margin-bottom: 10px; opacity: 0.3; }

    /* ── Responsive ── */
    @media (max-width: 600px) {
      .summary-banner { padding: 22px 20px; }
      .banner-total { font-size: 2.2rem; }
      .banner-pills { display: none; }
      .tiles-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 400px) {
      .tiles-grid { grid-template-columns: 1fr; }
    }
  `],
  template: `
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">Statistics</h2>
          <p class="page-subtitle">User overview from Keycloak.</p>
        </div>
        <button class="btn-refresh" (click)="load()" [disabled]="loading">
          <span *ngIf="loading" class="spin-ring"></span>
          <span *ngIf="!loading">⟳</span>
          {{ loading ? 'Loading…' : 'Refresh' }}
        </button>
      </div>

      <!-- Error -->
      <div *ngIf="error" class="alert-error">
        <span>✕</span> {{ error }}
      </div>

      <!-- Summary Banner -->
      <div class="summary-banner" *ngIf="tiles.length">
        <div class="banner-circle bc1"></div>
        <div class="banner-circle bc2"></div>
        <div class="banner-circle bc3"></div>

        <div class="banner-left">
          <div class="banner-label">Total Registered Users</div>
          <div class="banner-total">{{ totalUsers }}</div>
          <div class="banner-sub">across all roles on the platform</div>
        </div>

        <div class="banner-pills">
          <div class="banner-pill">
            <span class="pill-dot" style="background:#6b9ae8;"></span>
            <span class="pill-text">Clients</span>
            <span class="pill-val">{{ clients }}</span>
          </div>
          <div class="banner-pill">
            <span class="pill-dot" style="background:#34d399;"></span>
            <span class="pill-text">Freelancers</span>
            <span class="pill-val">{{ freelancers }}</span>
          </div>
          <div class="banner-pill">
            <span class="pill-dot" style="background:#a78bfa;"></span>
            <span class="pill-text">Admins</span>
            <span class="pill-val">{{ admins }}</span>
          </div>
          <div class="banner-pill">
            <span class="pill-dot" style="background:#fbbf24;"></span>
            <span class="pill-text">New this month</span>
            <span class="pill-val">{{ newThisMonth }}</span>
          </div>
        </div>
      </div>

      <!-- Tiles Grid -->
      <div class="tiles-grid" *ngIf="tiles.length">
        <div
          class="tile"
          *ngFor="let t of tiles; let i = index"
          [style.--tile-accent]="t.accent"
          [style.--tile-bg]="t.bg"
          [style.--tile-border]="t.border"
          [style.animation-delay]="(i * 60) + 'ms'"
        >
          <div class="tile-top">
            <div class="tile-icon-wrap" [innerHTML]="t.icon"></div>
            <span class="tile-trend">↑ Live</span>
          </div>
          <div class="tile-value">{{ t.value }}</div>
          <div class="tile-title">{{ t.title }}</div>
          <div class="tile-desc">{{ t.desc }}</div>
        </div>
      </div>

      <!-- Empty -->
      <div *ngIf="!loading && !tiles.length && !error" class="empty">
        <div class="empty-icon">📊</div>
        No data available.
      </div>

    </div>
  `
})
export class StatsViewComponent implements OnInit {
  loading = false;
  error?: string;
  tiles: StatTile[] = [];

  totalUsers = 0;
  clients = 0;
  freelancers = 0;
  admins = 0;
  newThisMonth = 0;

  constructor(private readonly stats: AdminStatsService) {}

  ngOnInit(): void { void this.load(); }

  async load(): Promise<void> {
    this.loading = true;
    this.error = undefined;
    try {
      const data = await this.stats.users();
      this.totalUsers   = data.totalUsers        ?? 0;
      this.clients      = data.clients           ?? 0;
      this.freelancers  = data.freelancers        ?? 0;
      this.admins       = data.admins            ?? 0;
      this.newThisMonth = data.newUsersThisMonth  ?? 0;
      this.tiles = this.toTiles(data);
    } catch (e: any) {
      this.error = e?.error?.error || e?.message || 'Unable to load statistics';
      this.tiles = [];
    } finally {
      this.loading = false;
    }
  }

  private toTiles(d: UsersStatsDto): StatTile[] {
    return [
      {
        title: 'Total Users',
        value: String(d.totalUsers ?? 0),
        desc: 'All registered accounts',
        accent: '#2d4eaa',
        bg: 'rgba(45,78,170,0.08)',
        border: 'rgba(45,78,170,0.15)',
        icon: `<svg width="20" height="20" fill="none" stroke="#2d4eaa" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m8-4a4 4 0 10-8 0 4 4 0 008 0z"/>
        </svg>`
      },
      {
        title: 'Clients',
        value: String(d.clients ?? 0),
        desc: 'Users with CLIENT role',
        accent: '#0ea5e9',
        bg: 'rgba(14,165,233,0.08)',
        border: 'rgba(14,165,233,0.15)',
        icon: `<svg width="20" height="20" fill="none" stroke="#0ea5e9" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
        </svg>`
      },
      {
        title: 'Freelancers',
        value: String(d.freelancers ?? 0),
        desc: 'Users with FREELANCER role',
        accent: '#10b981',
        bg: 'rgba(16,185,129,0.08)',
        border: 'rgba(16,185,129,0.15)',
        icon: `<svg width="20" height="20" fill="none" stroke="#10b981" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>`
      },
      {
        title: 'Admins',
        value: String(d.admins ?? 0),
        desc: 'Users with ADMIN role',
        accent: '#8b5cf6',
        bg: 'rgba(139,92,246,0.08)',
        border: 'rgba(139,92,246,0.15)',
        icon: `<svg width="20" height="20" fill="none" stroke="#8b5cf6" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
        </svg>`
      },
      {
        title: 'Active Users',
        value: String(d.activeUsers ?? 0),
        desc: 'Enabled accounts',
        accent: '#059669',
        bg: 'rgba(5,150,105,0.08)',
        border: 'rgba(5,150,105,0.15)',
        icon: `<svg width="20" height="20" fill="none" stroke="#059669" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>`
      },
      {
        title: 'New This Month',
        value: String(d.newUsersThisMonth ?? 0),
        desc: 'Registrations this month',
        accent: '#f59e0b',
        bg: 'rgba(245,158,11,0.08)',
        border: 'rgba(245,158,11,0.15)',
        icon: `<svg width="20" height="20" fill="none" stroke="#f59e0b" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
        </svg>`
      }
    ];
  }
}