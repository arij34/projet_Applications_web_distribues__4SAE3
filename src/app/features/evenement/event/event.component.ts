import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EventService } from '../../../services/event.service';

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

  // 👉 Erreurs de dates
  addDateError = '';
  editDateError = '';

  // 👉 Contrôle affichage des fenêtres (modals)
  showAddModal = false;
  showEditModal = false;

  constructor(private readonly eventService: EventService, private readonly router: Router) {}

  ngOnInit(): void {
    this.loadEvents();
    setInterval(() => this.loadEvents(), 30000);
    // ✅ Rafraîchir toutes les minutes pour voir les changements automatiques
    
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
    this.validateAddDates();
    if (this.addDateError) {
      return;
    }
    this.eventService.addEvent(this.newEvent).subscribe(() => {
      this.loadEvents();
      this.newEvent = {}; // reset
      this.showAddModal = false; // fermer la fenêtre après ajout
    });
  }

  // ✏ Préparer édition
  startEdit(event: any): void {
    this.editEvent = { ...event }; // copie l'événement
    this.showEditModal = true;     // ouvrir la fenêtre d'édition
  }

  // ✏ Mettre à jour
  updateEvent(): void {
    if (this.editEvent && this.editEvent.id) {
      this.validateEditDates();
      if (this.editDateError) {
        return;
      }
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
      (!this.searchQuery || e.titre?.toLowerCase().includes(this.searchQuery.toLowerCase())) &&
      (!this.selectedStatus || e.status === this.selectedStatus)
    );
  }

  // 📊 Analyse IA (résultats attachés à l'événement sélectionné)
  analyseEvent(event: any): void {
    this.eventService.analyse(event.id).subscribe(res => {
      event.rate = res.rate;
      event.classification = res.classification;
      event.suggestedTime = res.suggestedTime;
    });
  }

  // ✅ Validation dates pour l'ajout
  validateAddDates(): void {
    if (this.newEvent?.dateDebut && this.newEvent?.dateFin) {
      const start = new Date(this.newEvent.dateDebut);
      const end = new Date(this.newEvent.dateFin);
      this.addDateError = end > start ? '' : 'La date de fin doit être supérieure à la date de début.';
    } else {
      this.addDateError = '';
    }
  }

  // ✅ Validation dates pour l'édition
  validateEditDates(): void {
    if (this.editEvent?.dateDebut && this.editEvent?.dateFin) {
      const start = new Date(this.editEvent.dateDebut);
      const end = new Date(this.editEvent.dateFin);
      this.editDateError = end > start ? '' : 'La date de fin doit être supérieure à la date de début.';
    } else {
      this.editDateError = '';
    }
  }

  cancel(): void {
    this.router.navigateByUrl('/freelancer');
  }

}