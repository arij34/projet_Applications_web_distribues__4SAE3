import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-header-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <!-- Mobile Menu Button -->
        <button 
          (click)="menuClick.emit()"
          class="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
        
        <!-- Search Bar -->
        <div class="hidden sm:flex items-center gap-2 bg-gray-100/50 px-3 py-2 rounded-lg w-96 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
  </svg>
  <input 
    type="text" 
    placeholder="Rechercher (Ctrl+/)" 
    class="bg-transparent border-none outline-none text-sm text-gray-700 w-full placeholder:text-gray-400"
  />
  <span class="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">⌘K</span>
</div>
      </div>

      <!-- Right Side -->
      <div class="flex items-center gap-2 sm:gap-4">
        <!-- Notifications -->
        <button class="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
          </svg>
          <span class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <!-- User Profile -->
        <div class="flex items-center gap-3 pl-2 sm:pl-4 border-l border-gray-200">
          <div class="hidden sm:block text-right">
            <p class="text-sm font-semibold text-gray-800">John Doe</p>
            <p class="text-xs text-gray-500">Admin</p>
          </div>
          <div class="w-10 h-10 rounded-full bg-indigo-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" 
              alt="Profile" 
              class="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class HeaderComponent {
  @Output() menuClick = new EventEmitter<void>();
}
