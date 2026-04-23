import { Component, OnInit } from '@angular/core';
import { ProjectService } from '../../../../../core/services/project.service';
import { SavedProjectService } from '../../../../../core/services/saved-project.service';
import { Project } from '../../../../../core/models/project.model';
import { Router } from '@angular/router';
import { AuthService } from '../../../../../core/auth/auth.service';

@Component({
  selector: 'app-projet-freelancer',
  templateUrl: './projet-freelancer.component.html',
  styleUrls: ['./projet-freelancer.component.css']
})
export class ProjetFreelancerComponent implements OnInit {

  activeTab: 'all' | 'saved' | 'discussion' = 'all';
  allProjects: Project[] = [];
  savedProjects: Project[] = [];
  filteredProjects: Project[] = [];
  acceptedProjects: Project[] = [];

  searchQuery: string = '';
  sortBy: string = 'newest';
  isLoading: boolean = true;
  errorMessage: string = '';

  keycloakId: string = '';

  get freelancerId(): number {
    const id = localStorage.getItem('userId') || localStorage.getItem('freelancerId');
    return id ? +id : 0;
  }

  constructor(
    private projectService: ProjectService,
    private savedService: SavedProjectService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.getAccessToken().then(() => {
      this.keycloakId = this.authService.getKeycloakSub();
      this.loadAllProjects();
    });
  }

  loadAllProjects(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.projectService.getAllProjects().subscribe({
      next: (data: Project[]) => {
        this.allProjects = data.filter(p => p.status === 'OPEN');
        this.filteredProjects = this.allProjects;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err: any) => {
        this.errorMessage = 'Error loading projects.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  loadSavedProjects(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.savedService.getSavedProjectsByKeycloak(this.keycloakId).subscribe({
      next: (data: Project[]) => {
        this.savedProjects = data;
        this.filteredProjects = data;
        this.isLoading = false;
      },
      error: (err: any) => {
        this.errorMessage = 'Error loading saved projects.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  loadAcceptedProjects(): void {
    const fid = this.freelancerId;
    if (!fid || fid <= 0) {
      this.errorMessage = 'Connectez-vous pour voir vos projets acceptés.';
      this.isLoading = false;
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    this.projectService.getAcceptedProjects(fid).subscribe({
      next: (data: Project[]) => {
        this.acceptedProjects = data;
        this.filteredProjects = data;
        this.isLoading = false;
      },
      error: (err: any) => {
        this.errorMessage = 'Erreur lors du chargement des projets en discussion.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  switchTab(tab: 'all' | 'saved' | 'discussion'): void {
    this.activeTab = tab;
    this.searchQuery = '';
    if (tab === 'all') {
      if (this.allProjects.length === 0) {
        this.loadAllProjects();
      } else {
        this.filteredProjects = this.allProjects;
        this.applyFilters();
      }
    } else if (tab === 'saved') {
      this.loadSavedProjects();
    } else if (tab === 'discussion') {
      this.loadAcceptedProjects();
    }
  }

  applyFilters(): void {
    if (this.activeTab === 'saved') {
      this.filteredProjects = this.savedProjects;
      return;
    }
    let result = [...this.allProjects];
    if (this.searchQuery) {
      result = result.filter(p =>
        p.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
    result.sort((a, b) => {
      if (this.sortBy === 'deadline') {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    });
    this.filteredProjects = result;
  }

  onSearchChange(): void { this.applyFilters(); }
  onSortChange(): void   { this.applyFilters(); }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: '2-digit', year: 'numeric'
    });
  }

  getDaysLeft(deadline: string | undefined): string {
    if (!deadline) return '-';
    const diff = new Date(deadline).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0)  return 'Expired';
    if (days === 0) return 'Today';
    return `${days} days left`;
  }

  getDaysLeftClass(deadline: string | undefined): string {
    if (!deadline) return '';
    const diff = new Date(deadline).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days <= 0)  return 'urgent';
    if (days <= 7)  return 'urgent';
    if (days <= 14) return 'warning';
    return 'normal';
  }

  viewProject(id: number | undefined): void {
    if (id) this.router.navigate(['/front-office/discover', id]);
  }

  goToWorkspace(projectId: number | undefined): void {
    if (projectId) {
      this.router.navigate(
        ['/front-office/projects', projectId, 'workspace'],
        {
          queryParams: {
            role: 'FREELANCER',
            userId: this.freelancerId,
            name: localStorage.getItem('userName') || 'Freelancer'
          }
        }
      );
    }
  }
}
