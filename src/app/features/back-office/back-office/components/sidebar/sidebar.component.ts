import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../../core/auth/auth.service';
import { NotificationService } from '../../../../../core/services/skill/notification.service';
import { Subscription } from 'rxjs';

interface MenuItem {
  icon: string;
  label: string;
  key: string;
  children?: { label: string; key: string }[];
}

@Component({
  selector: 'app-backoffice-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Mobile Overlay -->
    <div *ngIf="isMobile && isOpen"
         class="fixed inset-0 bg-black/50 z-40"
         (click)="toggleSidebar.emit()">
    </div>

    <!-- Sidebar -->
    <aside [class]="getSidebarClasses()">

      <!-- Logo -->
      <div class="h-16 flex items-center px-6 border-b border-gray-50">
        <div class="flex items-center gap-2">
          <img src="assets/img/freelancy.jpg" alt="Logo" class="h-18 w-auto">
        </div>
        <button *ngIf="isMobile"
                (click)="toggleSidebar.emit()"
                class="ml-auto text-gray-400 hover:text-gray-600">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Menu Items -->
      <div class="flex-1 overflow-y-auto py-4 px-3 space-y-1">

        <div class="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu</div>

        <ng-container *ngFor="let item of mainMenuItems">

          <!-- Item AVEC sous-menu (Skills) -->
          <ng-container *ngIf="item.children; else simpleItem">

            <button (click)="toggleSubmenu(item.key)" [class]="getMenuItemClasses(item.key)">
              <span [innerHTML]="item.icon" class="shrink-0"></span>
              <span class="ml-3 truncate">{{ item.label }}</span>

              <!-- ✅ Badge rouge notifications pending skills -->
              <span *ngIf="item.key === 'skills' && unreadCount > 0"
                    class="ml-auto inline-flex items-center justify-center
                           min-w-[20px] h-5 px-1.5 rounded-full
                           bg-red-500 text-white text-xs font-bold animate-pulse">
                {{ unreadCount > 99 ? '99+' : unreadCount }}
              </span>

              <!-- Flèche accordéon -->
              <svg *ngIf="!(item.key === 'skills' && unreadCount > 0)"
                   class="ml-auto w-4 h-4 transition-transform duration-200"
                   [class.rotate-180]="openSubmenu === item.key"
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            <!-- Sous-menu déroulant -->
            <div *ngIf="openSubmenu === item.key"
                 class="ml-4 mt-1 space-y-1 border-l-2 border-indigo-100 pl-3">
              <button *ngFor="let child of item.children"
                      (click)="onTabClick(child.key)"
                      [class]="getSubMenuItemClasses(child.key)">
                <span class="w-1.5 h-1.5 rounded-full bg-current mr-2 shrink-0"></span>
                {{ child.label }}
              </button>
            </div>

          </ng-container>

          <!-- Item SIMPLE -->
          <ng-template #simpleItem>
            <button (click)="onTabClick(item.key)" [class]="getMenuItemClasses(item.key)">
              <span [innerHTML]="item.icon" class="shrink-0"></span>
              <span class="ml-3 truncate">{{ item.label }}</span>
              <div *ngIf="activeTab === item.key"
                   class="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
            </button>
          </ng-template>

        </ng-container>

        <div class="px-3 mt-8 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Gestion</div>

        <button *ngFor="let item of managementMenuItems"
                (click)="onTabClick(item.key)"
                [class]="getMenuItemClasses(item.key)">
          <span [innerHTML]="item.icon" class="shrink-0"></span>
          <span class="ml-3 truncate">{{ item.label }}</span>
          <div *ngIf="activeTab === item.key"
               class="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
        </button>

      </div>

      <!-- Logout -->
      <div class="p-4 border-t border-gray-50">
        <button (click)="logout()"
                class="flex items-center w-full p-2 text-gray-500
                       hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          <span class="ml-3 font-medium">Déconnexion</span>
        </button>
      </div>

    </aside>
  `,
  styles: [`:host { display: contents; }`]
})
export class SidebarComponent implements OnInit, OnDestroy {

  @Input() activeTab: string = 'dashboard';
  @Input() isOpen: boolean = false;
  @Input() isMobile: boolean = false;
  @Output() tabChange     = new EventEmitter<string>();
  @Output() toggleSidebar = new EventEmitter<void>();

  unreadCount  = 0;
  openSubmenu: string | null = null;
  private sub!: Subscription;

  constructor(
    private readonly auth: AuthService,
    private readonly notifService: NotificationService
  ) {}

  ngOnInit(): void {
    this.notifService.connect('ADMIN');
    this.sub = this.notifService.unreadCount$.subscribe(c => this.unreadCount = c);

    // Ouvrir automatiquement le sous-menu si on est déjà sur skills/pending-skills
    if (this.activeTab === 'skills' || this.activeTab === 'pending-skills') {
      this.openSubmenu = 'skills';
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.notifService.disconnect();
  }

  toggleSubmenu(key: string): void {
    this.openSubmenu = this.openSubmenu === key ? null : key;
    // Reset badge au clic sur Skills
    if (key === 'skills' && this.openSubmenu === 'skills') {
      this.notifService.markAllReadAdmin().subscribe();
      this.notifService.markAllReadLocally();
    }
  }

  onTabClick(key: string): void {
    this.tabChange.emit(key);
  }

  logout(): void {
    void this.auth.logout();
  }

  // ── Menu principal ────────────────────────────────────────────────
  mainMenuItems: MenuItem[] = [
    {
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>',
      label: 'Dashboard', key: 'dashboard'
    },
    {
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-6a2 2 0 114 0v6m-6 0h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2h-3l-2-2H10L8 5H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>',
      label: 'Statistiques', key: 'stats'
    },
    {
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>',
      label: 'Project', key: 'projects'
    },
    {
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>',
      label: 'contract', key: 'contracts'
    },
    {
      // ✅ CORRIGÉ : key 'skills' minuscule + sous-menu enfants
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>',
      label: 'Skill',
      key: 'skills',
      children: [
        { label: 'Skills',         key: 'skills' },
        { label: 'Pending Skills', key: 'pending-skills' }
      ]
    },
    {
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>',
      label: 'Challenge', key: 'Challenge'
    },
    {
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>',
      label: 'Roadmap', key: 'Roadmap'
    },
    {
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>',
      label: 'Blog', key: 'Blog'
    },
    {
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>',
      label: 'Blog Analytics', key: 'Blog Analytics'
    }
  ];

  managementMenuItems: MenuItem[] = [
    {
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>',
      label: 'Utilisateurs', key: 'users'
    },
    {
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2v1h6v-1c0-1.105-1.343-2-3-2z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 11v6a2 2 0 002 2h8a2 2 0 002-2v-6"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V6a4 4 0 018 0v1"/></svg>',
      label: 'Abonnements', key: 'subscriptions'
    },
    {
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3v18m4-16h6M3 7h6m8 4h6M3 11h6m8 4h6M3 15h6m8 4h6M3 19h6"/></svg>',
      label: 'Stats Abonnements', key: 'subscription-stats'
    },
    {
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
      label: 'Paramètres', key: 'settings'
    }
  ];

  getSidebarClasses(): string {
    const base = 'fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-gray-100 flex flex-col transition-all duration-300 ease-in-out h-full shadow-lg lg:shadow-none w-64';
    const open = this.isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0';
    return `${base} ${open}`;
  }

  getMenuItemClasses(key: string): string {
    const base = 'flex items-center w-full p-3 rounded-lg transition-all duration-200 group relative';
    const isActive = this.activeTab === key
                  || (key === 'skills' && this.activeTab === 'pending-skills');
    const active = isActive
      ? 'bg-indigo-50 text-indigo-600 font-medium shadow-sm'
      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900';
    return `${base} ${active}`;
  }

  getSubMenuItemClasses(key: string): string {
    const base = 'flex items-center w-full px-3 py-2 rounded-lg text-sm transition-all duration-200';
    const active = this.activeTab === key
      ? 'text-indigo-600 font-medium bg-indigo-50'
      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50';
    return `${base} ${active}`;
  }
}
