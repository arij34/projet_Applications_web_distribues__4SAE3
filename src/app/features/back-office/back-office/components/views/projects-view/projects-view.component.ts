import { Component, OnInit } from '@angular/core';
import { ProjectService } from '../../../../../../core/services/project.service';
import { Project } from '../../../../../../core/models/project.model';

@Component({
  selector: 'app-projects-view',
  templateUrl: './projects-view.component.html',
  styleUrls: ['./projects-view.component.css']
})
export class ProjectsViewComponent implements OnInit {

  projects: Project[] = [];
  filteredProjects: Project[] = [];
  searchQuery: string = '';
  filterStatus: string = 'ALL';
  isLoading: boolean = true;
  errorMessage: string = '';

  // ── Drawer historique ──
  showHistoryDrawer: boolean = false;
  deleteHistory: any[] = [];
  isLoadingHistory: boolean = false;

  statusOptions = [
    { value: 'ALL',         label: 'Tous les statuts' },
    { value: 'DRAFT',       label: 'Brouillon' },
    { value: 'OPEN',        label: 'Ouvert' },
    { value: 'IN_PROGRESS', label: 'En cours' },
    { value: 'COMPLETED',   label: 'Terminé' }
  ];

  statusConfig: Record<string, { label: string; cssClass: string }> = {
    DRAFT:       { label: 'Draft',       cssClass: 'badge-draft' },
    OPEN:        { label: 'Open',        cssClass: 'badge-open' },
    IN_PROGRESS: { label: 'In Progress', cssClass: 'badge-progress' },
    COMPLETED:   { label: 'Completed',   cssClass: 'badge-completed' }
  };

  constructor(private projectService: ProjectService) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.isLoading = true;
    this.projectService.getAllProjects().subscribe({
      next: (data: Project[]) => {
        this.projects = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err: any) => {
        this.errorMessage = 'Erreur lors du chargement des projets.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  openHistoryDrawer(): void {
    this.showHistoryDrawer = true;
    this.isLoadingHistory = true;
    document.body.style.overflow = 'hidden';
    this.projectService.getDeleteHistory().subscribe({
      next: (data: any[]) => {
        this.deleteHistory = data;
        this.isLoadingHistory = false;
      },
      error: () => {
        this.isLoadingHistory = false;
      }
    });
  }

  closeHistoryDrawer(): void {
    this.showHistoryDrawer = false;
    document.body.style.overflow = '';
  }

  applyFilters(): void {
    this.filteredProjects = this.projects.filter(p => {
      const matchesStatus = this.filterStatus === 'ALL'
        ? p.status !== 'DRAFT'
        : p.status === this.filterStatus;
      const matchesSearch = !this.searchQuery ||
        p.title.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }

  onSearchChange(): void { this.applyFilters(); }
  onFilterChange(): void { this.applyFilters(); }

  get totalProjects(): number {
    return this.projects.filter(p =>
      p.status === 'OPEN' || p.status === 'IN_PROGRESS' || p.status === 'COMPLETED'
    ).length;
  }
  get openProjects():       number { return this.projects.filter(p => p.status === 'OPEN').length; }
  get inProgressProjects(): number { return this.projects.filter(p => p.status === 'IN_PROGRESS').length; }
  get completedProjects():  number { return this.projects.filter(p => p.status === 'COMPLETED').length; }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  formatDateTime(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}