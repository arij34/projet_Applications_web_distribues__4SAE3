import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http'; // ✅ ajouter
import { AuthService } from '../../../core/auth/auth.service';
import { KC_ROLES } from '../../../core/auth/roles';
import { map } from 'rxjs/operators'; // ✅ ajouter

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  isScrolled = false;
  isMobileMenuOpen = false;
  isUserMenuOpen = false;
  isClient = false;
  isLoggedIn = false;
  username?: string;
  isFreelancer = false;
  pendingInvitationsCount = 0;

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 20;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.isUserMenuOpen = false;
    }
  }

  @HostListener('window:focus')
  async onWindowFocus(): Promise<void> {
    await this.refreshAuthState();
  }

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly http: HttpClient // ✅ ajouter
  ) {}

  ngOnInit(): void {
    this.onWindowScroll();
    this.refreshAuthState();
  }

  async refreshAuthState(): Promise<void> {
    this.isLoggedIn   = await this.auth.isLoggedIn();
    this.username     = this.isLoggedIn ? this.auth.getDisplayName() : undefined;
    this.isClient     = this.isLoggedIn && this.auth.hasRole(KC_ROLES.CLIENT);
    this.isFreelancer = this.isLoggedIn && this.auth.hasRole(KC_ROLES.FREELANCER);

    if (this.isFreelancer) {
      this.loadPendingCount();
    } else {
      this.pendingInvitationsCount = 0;
    }
  }

  loadPendingCount(): void {
    // ✅ Récupérer freelancerId depuis localStorage
    const freelancerId = localStorage.getItem('userId')
                      || localStorage.getItem('freelancerId');

    if (!freelancerId) {
      console.warn('freelancerId non trouvé');
      return;
    }

    this.http.get<{ count: number }>(
      `http://localhost:8087/invitations/freelancer/${freelancerId}/pending-count`
    ).subscribe({
      next: (res) => {
        this.pendingInvitationsCount = res.count;
      },
      error: () => {
        this.pendingInvitationsCount = 0;
      }
    });
  }

  toggleMobileMenu(): void { this.isMobileMenuOpen = !this.isMobileMenuOpen; }
  toggleUserMenu():   void { this.isUserMenuOpen   = !this.isUserMenuOpen; }

  async signIn(): Promise<void> {
    await this.router.navigateByUrl('/signin');
  }

  async signUp(): Promise<void> {
    await this.auth.register(window.location.origin + '/front');
  }

  goToProfile(): void {
    this.router.navigateByUrl('/profile');
    this.isUserMenuOpen = false;
  }

  async logout(): Promise<void> {
    await this.auth.logout(window.location.origin + '/front');
    this.isUserMenuOpen = false;
    this.pendingInvitationsCount = 0;
    await this.refreshAuthState();
  }

  closeMobileMenu(): void { this.isMobileMenuOpen = false; }
}