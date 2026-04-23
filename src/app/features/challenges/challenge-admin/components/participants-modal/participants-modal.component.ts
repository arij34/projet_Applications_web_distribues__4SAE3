import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Participant } from '@core/models/participant.model';

@Component({
  selector: 'app-participants-modal',
  templateUrl: './participants-modal.component.html',
  styleUrls: ['./participants-modal.component.css']
})
export class ParticipantsModalComponent {
  @Input() isOpen: boolean = false;
  @Input() challenge: any = null;
  @Input() participants: Participant[] = [];
  @Output() close = new EventEmitter<void>();

  searchQuery: string = '';
  filterStatus: string = 'all';

  get activeCount(): number {
    return this.participants.filter(p => p.status === 'Active').length;
  }

  get completedCount(): number {
    return this.participants.filter(p => p.status === 'Completed').length;
  }

  get filteredParticipants(): Participant[] {
    return this.participants.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                           p.email.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesStatus = this.filterStatus === 'all' || p.status === this.filterStatus;
      return matchesSearch && matchesStatus;
    });
  }

  onClose(): void {
    this.close.emit();
  }

  onExport(): void {
    console.log('Exporting participants data...');
    // Implement export logic
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700 border-green-200';
      case 'Completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Dropped': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.onClose();
    }
  }

  trackByParticipant(index: number, participant: Participant): string {
    return participant.id;
  }
}
