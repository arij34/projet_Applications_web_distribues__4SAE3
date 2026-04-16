import { Component, OnInit } from '@angular/core';
import { EventService } from '../../services/event.service';

@Component({
  selector: 'app-event',
  templateUrl: './event.component.html',
  styleUrls: ['./event.component.css']
})
export class EventComponent implements OnInit {
  events: any[] = [];
  filteredEvents: any[] = [];

  searchQuery = '';
  selectedStatus: string | null = null;
  statuses = ['OPEN', 'CLOSED'];

  // 👉 Ajout et édition
  newEvent: any = {};
  editEvent: any = null;

  // 👉 Contrôle affichage des fenêtres (modals)
  showAddModal = false;
  showEditModal = false;

  constructor(private eventService: EventService) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  // 📥 Charger tous les événements
  loadEvents(): void {
    this.eventService.getAllEvents().subscribe(data => {
      this.events = data;
      this.applyFilters();
    });
  }

  // ❌ Supprimer
  deleteEvent(id: number): void {
    this.eventService.deleteEvent(id).subscribe(() => {
      this.loadEvents();
    });
  }

  // ➕ Ajouter
  addEvent(): void {
    this.eventService.addEvent(this.newEvent).subscribe(() => {
      this.loadEvents();
      this.newEvent = {}; 
      this.showAddModal = false; // fermer la fenêtre après ajout
    });
  }

  // ✏ Préparer édition
  startEdit(event: any): void {
    this.editEvent = { ...event };
    this.showEditModal = true; // ouvrir la fenêtre d'édition
  }

  // ✏ Mettre à jour
  updateEvent(): void {
    if (this.editEvent) {
      this.eventService.updateEvent(this.editEvent.id, this.editEvent).subscribe(() => {
        this.loadEvents();
        this.editEvent = null;
        this.showEditModal = false; // fermer la fenêtre après update
      });
    }
  }

  // 🔎 Recherche et filtres
  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = null;
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredEvents = this.events.filter(e =>
      (!this.searchQuery || e.titre.toLowerCase().includes(this.searchQuery.toLowerCase())) &&
      (!this.selectedStatus || e.status === this.selectedStatus)
    );
  }
}