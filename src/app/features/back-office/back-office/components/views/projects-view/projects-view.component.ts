import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


interface Project {
  id: number;
  name: string;
  client: string;
  budget: string;
  deadline: string;
  status: 'Complété' | 'En cours' | 'En attente';
  team: string[];
  progress: number;
}

@Component({
  selector: 'app-projects-view',
  template: `
    <div class="space-y-6 animate-in fade-in duration-500">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Projets</h1>
          <p class="text-sm text-gray-500 mt-1">Gérez et suivez tous vos projets</p>
        </div>
        <button class="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Nouveau Projet
        </button>
      </div>

      <!-- Filters and Search -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div class="flex flex-col sm:flex-row gap-4">
          <!-- Search -->
          <div class="flex-1 relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input 
              type="text" 
              [(ngModel)]="searchTerm"
              placeholder="Rechercher des projets..." 
              class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
            />
          </div>

          <!-- Status Filter -->
          <div class="sm:w-48">
            <select 
              [(ngModel)]="statusFilter"
              class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all">
              <option value="Tous">Tous les statuts</option>
              <option value="En cours">En cours</option>
              <option value="En attente">En attente</option>
              <option value="Complété">Complété</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Projects Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div *ngFor="let project of filteredProjects" 
             class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all">
          
          <!-- Project Header -->
          <div class="flex justify-between items-start mb-4">
            <div class="flex-1">
              <h3 class="text-lg font-bold text-gray-900 mb-1">{{ project.name }}</h3>
              <p class="text-sm text-gray-500 flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                {{ project.client }}
              </p>
            </div>
            <button class="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
              </svg>
            </button>
          </div>

          <!-- Status Badge -->
          <div class="mb-4">
            <span [class]="'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ' + getStatusClass(project.status)">
              <span [innerHTML]="getStatusIcon(project.status)"></span>
              {{ project.status }}
            </span>
          </div>

          <!-- Project Details -->
          <div class="space-y-3 mb-4">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Budget:</span>
              <span class="font-semibold text-gray-900">{{ project.budget }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500 flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                Échéance:
              </span>
              <span class="font-semibold text-gray-900">{{ project.deadline }}</span>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="mb-4">
            <div class="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progression</span>
              <span class="font-semibold">{{ project.progress }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                [style.width.%]="project.progress" 
                [class]="'h-full rounded-full transition-all duration-500 ' + getProgressColor(project.progress)">
              </div>
            </div>
          </div>

          <!-- Team Avatars -->
          <div class="flex items-center justify-between">
            <div class="flex -space-x-2">
              <div *ngFor="let member of project.team" 
                   class="w-8 h-8 rounded-full border-2 border-white bg-indigo-100 overflow-hidden">
                <img [src]="member" alt="Team member" class="w-full h-full object-cover">
              </div>
            </div>
            <span class="text-xs text-gray-500">{{ project.team.length }} membre{{ project.team.length > 1 ? 's' : '' }}</span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="filteredProjects.length === 0" class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <h3 class="text-lg font-semibold text-gray-700 mb-2">Aucun projet trouvé</h3>
        <p class="text-sm text-gray-500">Essayez de modifier vos filtres de recherche</p>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .animate-in {
      animation: fade-in 0.5s ease-in;
    }
  `]
})
export class ProjectsViewComponent {
  searchTerm: string = '';
  statusFilter: string = 'Tous';

  projects: Project[] = [
    {
      id: 1,
      name: 'Refonte Site E-commerce',
      client: 'Acme Corp',
      budget: '12 500€',
      deadline: '15 Mar 2026',
      status: 'En cours',
      team: ['https://i.pravatar.cc/150?u=1', 'https://i.pravatar.cc/150?u=2'],
      progress: 65
    },
    {
      id: 2,
      name: 'Développement App Mobile',
      client: 'Stark Industries',
      budget: '45 000€',
      deadline: '22 Avr 2026',
      status: 'En attente',
      team: ['https://i.pravatar.cc/150?u=3'],
      progress: 10
    },
    {
      id: 3,
      name: 'Dashboard Marketing',
      client: 'Wayne Enterprises',
      budget: '8 200€',
      deadline: '28 Fév 2026',
      status: 'Complété',
      team: ['https://i.pravatar.cc/150?u=4', 'https://i.pravatar.cc/150?u=5', 'https://i.pravatar.cc/150?u=6'],
      progress: 100
    },
    {
      id: 4,
      name: 'Intégration Réseaux Sociaux',
      client: 'LexCorp',
      budget: '5 000€',
      deadline: '10 Mai 2026',
      status: 'En cours',
      team: ['https://i.pravatar.cc/150?u=7'],
      progress: 42
    },
    {
      id: 5,
      name: 'Migration Cloud',
      client: 'Cyberdyne Systems',
      budget: '22 000€',
      deadline: '30 Juin 2026',
      status: 'En attente',
      team: ['https://i.pravatar.cc/150?u=8', 'https://i.pravatar.cc/150?u=9'],
      progress: 0
    }
  ];

  get filteredProjects(): Project[] {
    return this.projects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                          project.client.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = this.statusFilter === 'Tous' || project.status === this.statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Complété':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'En cours':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'En attente':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Complété':
        return '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>';
      case 'En cours':
        return '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>';
      case 'En attente':
        return '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>';
      default:
        return '';
    }
  }

  getProgressColor(progress: number): string {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress > 0) return 'bg-orange-500';
    return 'bg-gray-300';
  }
}
