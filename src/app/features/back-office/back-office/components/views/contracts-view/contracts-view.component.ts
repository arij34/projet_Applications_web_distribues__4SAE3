import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Contract {
  id: string;
  project: string;
  freelancer: string;
  amount: string;
  paid: string;
  status: 'Actif' | 'Fermé' | 'En attente' | 'Brouillon';
  paymentStatus: 'Payé' | 'Partiel' | 'Impayé';
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-contracts-view',
  template: `
    <div class="space-y-6 animate-in fade-in duration-500">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Contrats</h1>
          <p class="text-sm text-gray-500 mt-1">Gérez les contrats et les paiements</p>
        </div>
        <button class="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Nouveau Contrat
        </button>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm text-gray-500 font-medium">Total Contrats</p>
              <h3 class="text-2xl font-bold text-gray-900 mt-1">{{ contracts.length }}</h3>
            </div>
            <div class="p-2 bg-indigo-100 rounded-lg">
              <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm text-gray-500 font-medium">Contrats Actifs</p>
              <h3 class="text-2xl font-bold text-gray-900 mt-1">{{ getActiveContracts() }}</h3>
            </div>
            <div class="p-2 bg-blue-100 rounded-lg">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm text-gray-500 font-medium">Valeur Totale</p>
              <h3 class="text-2xl font-bold text-gray-900 mt-1">92 700€</h3>
            </div>
            <div class="p-2 bg-green-100 rounded-lg">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm text-gray-500 font-medium">En Attente</p>
              <h3 class="text-2xl font-bold text-gray-900 mt-1">{{ getPendingContracts() }}</h3>
            </div>
            <div class="p-2 bg-orange-100 rounded-lg">
              <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1 relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input 
              type="text" 
              [(ngModel)]="searchTerm"
              placeholder="Rechercher des contrats..." 
              class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all"
            />
          </div>
          <select 
            [(ngModel)]="statusFilter"
            class="sm:w-48 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all">
            <option value="Tous">Tous les statuts</option>
            <option value="Actif">Actif</option>
            <option value="En attente">En attente</option>
            <option value="Fermé">Fermé</option>
            <option value="Brouillon">Brouillon</option>
          </select>
        </div>
      </div>

      <!-- Contracts Table -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Projet</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Freelancer</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Montant</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Paiement</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Dates</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr *ngFor="let contract of filteredContracts" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-semibold text-indigo-600">{{ contract.id }}</span>
                </td>
                <td class="px-6 py-4">
                  <p class="text-sm font-medium text-gray-900">{{ contract.project }}</p>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-semibold">
                      {{ getInitials(contract.freelancer) }}
                    </div>
                    <span class="text-sm text-gray-900">{{ contract.freelancer }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm">
                    <p class="font-semibold text-gray-900">{{ contract.amount }}</p>
                    <p class="text-xs text-gray-500">Payé: {{ contract.paid }}</p>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [class]="'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ' + getContractStatusClass(contract.status)">
                    <span [innerHTML]="getContractStatusIcon(contract.status)"></span>
                    {{ contract.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [class]="'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ' + getPaymentStatusClass(contract.paymentStatus)">
                    <span [innerHTML]="getPaymentStatusIcon(contract.paymentStatus)"></span>
                    {{ contract.paymentStatus }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="text-xs text-gray-600">
                    <p>Début: {{ contract.startDate }}</p>
                    <p>Fin: {{ contract.endDate }}</p>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <button class="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-indigo-600 transition-colors">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                      </svg>
                    </button>
                    <button class="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div *ngIf="filteredContracts.length === 0" class="p-12 text-center">
          <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <h3 class="text-lg font-semibold text-gray-700 mb-2">Aucun contrat trouvé</h3>
          <p class="text-sm text-gray-500">Essayez de modifier vos filtres de recherche</p>
        </div>
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
export class ContractsViewComponent {
  searchTerm: string = '';
  statusFilter: string = 'Tous';

  contracts: Contract[] = [
    {
      id: '#CN-7890',
      project: 'Refonte Site E-commerce',
      freelancer: 'Sarah Jenkins',
      amount: '12 500€',
      paid: '8 000€',
      status: 'Actif',
      paymentStatus: 'Partiel',
      startDate: '15 Jan 2026',
      endDate: '15 Mar 2026'
    },
    {
      id: '#CN-7891',
      project: 'Développement App Mobile',
      freelancer: 'Mike Ross',
      amount: '45 000€',
      paid: '0€',
      status: 'En attente',
      paymentStatus: 'Impayé',
      startDate: '01 Fév 2026',
      endDate: '22 Avr 2026'
    },
    {
      id: '#CN-7892',
      project: 'Dashboard Marketing',
      freelancer: 'Jessica Pearson',
      amount: '8 200€',
      paid: '8 200€',
      status: 'Fermé',
      paymentStatus: 'Payé',
      startDate: '05 Jan 2026',
      endDate: '28 Fév 2026'
    },
    {
      id: '#CN-7893',
      project: 'Intégration Réseaux Sociaux',
      freelancer: 'Harvey Specter',
      amount: '5 000€',
      paid: '2 500€',
      status: 'Actif',
      paymentStatus: 'Partiel',
      startDate: '20 Fév 2026',
      endDate: '10 Mai 2026'
    },
    {
      id: '#CN-7894',
      project: 'Migration Cloud',
      freelancer: 'Louis Litt',
      amount: '22 000€',
      paid: '0€',
      status: 'Brouillon',
      paymentStatus: 'Impayé',
      startDate: '01 Mar 2026',
      endDate: '30 Juin 2026'
    }
  ];

  get filteredContracts(): Contract[] {
    return this.contracts.filter(contract => {
      const matchesSearch = 
        contract.project.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        contract.freelancer.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        contract.id.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = this.statusFilter === 'Tous' || contract.status === this.statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  getActiveContracts(): number {
    return this.contracts.filter(c => c.status === 'Actif').length;
  }

  getPendingContracts(): number {
    return this.contracts.filter(c => c.status === 'En attente').length;
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  getContractStatusClass(status: string): string {
    switch (status) {
      case 'Actif':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Fermé':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'En attente':
        return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'Brouillon':
        return 'bg-slate-100 text-slate-500 border-slate-200';
      default:
        return 'bg-gray-50 text-gray-500';
    }
  }

  getContractStatusIcon(status: string): string {
    switch (status) {
      case 'Actif':
        return '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>';
      case 'Fermé':
        return '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>';
      case 'En attente':
        return '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>';
      default:
        return '';
    }
  }

  getPaymentStatusClass(status: string): string {
    switch (status) {
      case 'Payé':
        return 'bg-green-100 text-green-700';
      case 'Partiel':
        return 'bg-yellow-100 text-yellow-700';
      case 'Impayé':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  getPaymentStatusIcon(status: string): string {
    switch (status) {
      case 'Payé':
        return '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>';
      case 'Partiel':
        return '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>';
      case 'Impayé':
        return '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>';
      default:
        return '';
    }
  }
}
