import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface StatCard {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: string;
  colorClass: string;
}

@Component({
  selector: 'app-dashboard-view',
  template: `
    <div class="space-y-6 animate-in fade-in duration-500">
      
      <!-- Top Section: Welcome & Stats Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Welcome Card -->
        <div class="col-span-1 lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5 relative overflow-hidden">
  <div class="flex flex-col md:flex-row items-center justify-between h-full relative z-10">
  <div class="w-full md:w-2/3 pr-4">
  <h2 class="text-3xl font-bold text-indigo-600 mb-3">Hi, admin! </h2>
  <p class="text-gray-600 text-base mb-5">
    Have a wonderful day and keep up the great work!
  </p>
        <div class="flex gap-6">
  <a href="#" class="text-black hover:text-indigo-600 text-base font-semibold transition-all flex items-center gap-2 hover:border-b-2 hover:border-indigo-600 pb-1">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
    </svg>
    Check Email
  </a>
  <a href="#" class="text-black hover:text-indigo-600 text-base font-semibold transition-all flex items-center gap-2 hover:border-b-2 hover:border-indigo-600 pb-1">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
    </svg>
    Check Calendar
  </a>
</div>
      </div>
    <div class="hidden md:block w-1/3 h-full relative">
      <div class="absolute right-0 bottom-0 w-80 h-64">
        <img 
          src="assets/img/dashboard_1 .png"
          alt="Success" 
          class="w-full h-full object-contain object-bottom"
        />
      </div>
    </div>
  </div>
</div>

        <!-- Stats Grid (Right Side) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div *ngFor="let stat of stats" class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
            <div class="flex justify-between items-start mb-2">
              <div [class]="'p-2 rounded-lg ' + stat.colorClass">
                <span [innerHTML]="stat.icon"></span>
              </div>
              <button class="p-1.5 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                </svg>
              </button>
            </div>
            <div>
              <span class="text-gray-500 text-xs font-semibold uppercase tracking-wider">{{ stat.title }}</span>
              <h3 class="text-xl font-bold text-gray-900 mt-1 mb-1">{{ stat.value }}</h3>
              <div [class]="'flex items-center text-xs font-bold ' + (stat.isPositive ? 'text-green-500' : 'text-red-500')">
                <svg *ngIf="stat.isPositive" class="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                </svg>
                <svg *ngIf="!stat.isPositive" class="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                {{ stat.change }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Middle Section: Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Total Revenue Chart -->
        <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5 min-h-[350px]">
          <div class="flex justify-between items-center mb-6">
            <div>
              <h3 class="text-lg font-bold text-gray-800">Revenus totaux</h3>
              <div class="flex items-center gap-4 mt-1 text-sm">
                <div class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  <span class="text-gray-600">2025</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                  <span class="text-gray-600">2024</span>
                </div>
              </div>
            </div>
          </div>
          <div class="h-[250px] flex items-end gap-2 pb-4">
            <div *ngFor="let month of revenueData" class="flex-1 flex flex-col items-center gap-2">
              <div class="relative w-full flex gap-1 items-end h-[200px]">
                <div [style.height.%]="getBarHeight(month.y2025)" 
                     class="flex-1 bg-indigo-500 rounded-t transition-all hover:bg-indigo-600"
                     [title]="'2025: ' + month.y2025 + 'k'">
                </div>
                <div [style.height.%]="getBarHeight(month.y2024)" 
                     class="flex-1 bg-cyan-400 rounded-t transition-all hover:bg-cyan-500"
                     [title]="'2024: ' + month.y2024 + 'k'">
                </div>
              </div>
              <span class="text-xs text-gray-500">{{ month.name }}</span>
            </div>
          </div>
        </div>

        <!-- Growth Chart -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-bold text-gray-800">Croissance</h3>
          </div>
          <div class="flex flex-col items-center justify-center h-[250px]">
            <div class="relative w-40 h-40">
              <svg class="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="70" fill="none" stroke="#e0e7ff" stroke-width="16"/>
                <circle cx="80" cy="80" r="70" fill="none" stroke="#6366f1" stroke-width="16"
                        stroke-dasharray="439.6" stroke-dashoffset="97.5" stroke-linecap="round"/>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center">
                  <div class="text-3xl font-bold text-gray-900">78%</div>
                  <div class="text-xs text-gray-500">Croissance</div>
                </div>
              </div>
            </div>
            <div class="mt-6 text-center">
              <p class="text-sm text-gray-600">Augmentation de la croissance</p>
              <p class="text-xs text-gray-500 mt-1">par rapport à l'année dernière</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Section: Recent Activity -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Order Statistics -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 class="text-lg font-bold text-gray-800 mb-4">Statistiques des commandes</h3>
          <div class="space-y-3">
            <div *ngFor="let order of orderStats" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div class="flex items-center gap-3">
                <div [class]="'w-10 h-10 rounded-full flex items-center justify-center ' + order.colorClass">
                  <span [innerHTML]="order.icon"></span>
                </div>
                <div>
                  <p class="text-sm font-semibold text-gray-800">{{ order.label }}</p>
                  <p class="text-xs text-gray-500">{{ order.count }} commandes</p>
                </div>
              </div>
              <span class="text-lg font-bold text-gray-900">{{ order.value }}</span>
            </div>
          </div>
        </div>

        <!-- Activity Timeline -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 class="text-lg font-bold text-gray-800 mb-4">Notifications</h3>
          <div class="space-y-4">
            <div *ngFor="let activity of activities" class="flex gap-3">
              <div class="flex flex-col items-center">
                <div [class]="'w-8 h-8 rounded-full flex items-center justify-center ' + activity.colorClass">
                  <span [innerHTML]="activity.icon"></span>
                </div>
                <div class="w-0.5 h-full bg-gray-200 mt-2"></div>
              </div>
              <div class="flex-1 pb-4">
                <p class="text-sm font-medium text-gray-800">{{ activity.title }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ activity.description }}</p>
                <span class="text-xs text-gray-400 mt-2 inline-block">{{ activity.time }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .animate-in {
      animation: fade-in 0.5s ease-in;
    }
  `]
})
export class DashboardViewComponent {
  stats: StatCard[] = [
    {
      title: 'FREELANCERS', 
      value: '12',
      change: '+72.8%',
      isPositive: true,
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>',
      colorClass: 'bg-green-100 text-green-600'
    },
    {
      title: 'CLIENTS',
      value: '30',
      change: '+28.42%',
      isPositive: true,
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
      colorClass: 'bg-cyan-100 text-cyan-600'
    },
    { 
      title: 'PROJECTS',
      value: '29',
      change: '-14.82%',
      isPositive: false,
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>',
      colorClass: 'bg-orange-100 text-orange-600'
    },
    {
      title: 'EVENTS',
      value: '14 ',
      change: '+28.14%',
      isPositive: true,
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>',
      colorClass: 'bg-indigo-100 text-indigo-600'
    } 
  ];

  revenueData = [
    { name: 'Jan', y2024: 18, y2025: 25 },
    { name: 'Fév', y2024: 7, y2025: 19 },
    { name: 'Mar', y2024: 15, y2025: 24 },
    { name: 'Avr', y2024: 29, y2025: 32 },
    { name: 'Mai', y2024: 18, y2025: 28 },
    { name: 'Juin', y2024: 12, y2025: 26 },
    { name: 'Juil', y2024: 9, y2025: 22 }
  ];

  orderStats = [
    {
      label: 'Complétées',
      count: 82,
      value: '12.5k€',
      icon: '<svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>',
      colorClass: 'bg-green-100'
    },
    {
      label: 'En cours',
      count: 23,
      value: '4.2k€',
      icon: '<svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>',
      colorClass: 'bg-blue-100'
    },
    {
      label: 'Annulées',
      count: 5,
      value: '0.8k€',
      icon: '<svg class="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>',
      colorClass: 'bg-red-100'
    }
  ];

  activities = [
    {
      title: 'Nouvelle commande reçue',
      description: 'Commande #3847 de Client XYZ',
      time: 'Il y a 12 minutes',
      icon: '<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/></svg>',
      colorClass: 'bg-indigo-500'
    },
    {
      title: 'Paiement reçu',
      description: 'Paiement de 2,450€ validé',
      time: 'Il y a 1 heure',
      icon: '<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg>',
      colorClass: 'bg-green-500'
    },
    {
      title: 'Expédition effectuée',
      description: 'Commande #3842 expédiée',
      time: 'Il y a 3 heures',
      icon: '<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"/></svg>',
      colorClass: 'bg-orange-500'
    }
  ];

  getBarHeight(value: number): number {
    const maxValue = 35;
    return (Math.abs(value) / maxValue) * 100;
  }
}
