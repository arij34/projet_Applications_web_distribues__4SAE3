import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ParticipantService, Participant } from '../../../services/participant.service';
import { EventService, Event } from '../../../services/event.service';

@Component({
  selector: 'app-participant',
  templateUrl: './participant.component.html',
  styleUrls: ['./participant.component.css']
})
export class ParticipantComponent implements OnInit {
  participants: Participant[] = [];
  filteredParticipants: Participant[] = [];
  events: Event[] = [];
  closedEvents: string[] = [];



  // ✅ initialisation sans champ nom
  newParticipant: Participant = { status: 'PENDING', event: undefined };
  editParticipant: Participant | null = null;

  showAddModal = false;
  showEditModal = false;

  searchQuery = '';
  statuses: string[] = ['PENDING', 'ACCEPTED', 'REJECTED'];
  selectedStatus: string | null = null;

  constructor(
    private participantService: ParticipantService,
    private eventService: EventService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadParticipants();
    this.loadEvents();
    
  }
  checkClosedParticipants(): void {
    this.eventService.getAllEvents().subscribe((data: Event[]) => {
      // Prendre tous les événements fermés et leurs titres (sans doublons)
      const eventNames: string[] = Array.from(
        new Set(
          data
            .filter(e => e.status === 'CLOSED')
            .map(e => e.titre)
            .filter((name): name is string => !!name)
        )
      );
      this.closedEvents = eventNames;
    });
  }




  
  




  // ✅ Charger participants et appliquer filtre
  loadParticipants(): void {
    this.participantService.getAllParticipants().subscribe((data: Participant[]) => {
      this.participants = data;
      this.applyFilters();
    });
  }

  // ✅ Charger événements mais exclure ceux qui sont CLOSED
  loadEvents(): void {
  this.eventService.getAllEvents().subscribe((data: Event[]) => {
    // ✅ garder uniquement les événements ouverts
    this.events = data.filter(e => e.status !== 'CLOSED');
  });
}

  addParticipant(): void {
    this.participantService.addParticipant(this.newParticipant).subscribe(() => {
      this.loadParticipants();
      this.newParticipant = { status: 'PENDING', event: undefined };
      this.showAddModal = false;
    });
  }

  startEdit(p: Participant): void {
    this.editParticipant = { ...p };
    this.showEditModal = true;
  }

  updateParticipant(): void {
    if (this.editParticipant && this.editParticipant.id) {
      this.participantService.updateParticipant(this.editParticipant.id, this.editParticipant).subscribe(() => {
        this.loadParticipants();
        this.editParticipant = null;
        this.showEditModal = false;
      });
    }
  }

  deleteParticipant(id: number): void {
    this.participantService.deleteParticipant(id).subscribe(() => {
      this.loadParticipants();
    });
  }

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

  /**
   * ✅ Filtrage :
   * - Exclut les participants dont l'événement est CLOSED
   * - Applique recherche et filtre par statut
   */
  private applyFilters(): void {
    this.filteredParticipants = this.participants.filter(p => {
      if (p.event?.status === 'CLOSED') {
        return false;
      }

      const matchesSearch = this.searchQuery
        ? (p.event?.titre?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
           p.status.toLowerCase().includes(this.searchQuery.toLowerCase()))
        : true;

      const matchesStatus = this.selectedStatus ? p.status === this.selectedStatus : true;

      return matchesSearch && matchesStatus;
    });
  }

  cancel(): void {
    this.router.navigateByUrl('/freelancer');
  }
}