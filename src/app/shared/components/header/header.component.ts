import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { KC_ROLES } from '../../../core/auth/roles';

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

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 20;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // close the dropdown when clicking outside
    if (!target.closest('.user-menu')) {
      this.isUserMenuOpen = false;
    }
  }

  @HostListener('window:focus')
  async onWindowFocus(): Promise<void> {
    // After returning from Keycloak login/register/logout, refresh UI
    await this.refreshAuthState();
  }

  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  ngOnInit(): void {
    this.onWindowScroll();
    this.refreshAuthState();
  }

  async refreshAuthState(): Promise<void> {
    this.isLoggedIn = await this.auth.isLoggedIn();
    this.username = this.isLoggedIn ? this.auth.getDisplayName() : undefined;
    this.isClient = this.isLoggedIn && this.auth.hasRole(KC_ROLES.CLIENT);

    // Role-based UI
    this.isFreelancer = this.isLoggedIn && this.auth.hasRole(KC_ROLES.FREELANCER);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  async signIn(): Promise<void> {
    // IMPORTANT:
    // Do NOT redirect directly to Keycloak from the header.
    // We want the user to land on our Angular /signin page first so we can:
    // - show the "Sign in with Google" button
    // - ask the user to choose their role (CLIENT/FREELANCER) BEFORE Google login
    // The /signin page will then redirect to Keycloak with the right parameters.
    await this.router.navigateByUrl('/signin');
  }

  async signUp(): Promise<void> {
    // After Keycloak register, go back to landing page
    await this.auth.register(window.location.origin + '/front');
  }

  goToProfile(): void {
    this.router.navigateByUrl('/profile');
    this.isUserMenuOpen = false;
  }

  async logout(): Promise<void> {
    await this.auth.logout(window.location.origin + '/front');
    this.isUserMenuOpen = false;
    await this.refreshAuthState();
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }
}
