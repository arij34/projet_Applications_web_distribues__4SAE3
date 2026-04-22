import { Component, OnInit } from '@angular/core';
import { Availability } from '../../../../../core/models/skill/availability.model';
import { AvailabilityService } from '../../../../../core/services/skill/availability.service';

@Component({
  selector: 'app-availability-list',
  templateUrl: './availability-list.component.html',
  styleUrl: './availability-list.component.css'
})
export class AvailabilityListComponent implements OnInit {

  items: Availability[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';
  // ✅ SUPPRIMÉ : currentUserId = 1  (inutile, le token JWT gère l'identité)

  constructor(private availabilityService: AvailabilityService) {}

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.loading = true;
    this.availabilityService.getAll().subscribe({
      next: (data: Availability[]) => {
        this.items = data;
        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.errorMessage = 'Error loading availability';
        this.loading = false;
      }
    });
  }

  deleteItem(id: number): void {
    if (confirm('Delete this availability?')) {
      this.availabilityService.delete(id).subscribe({
        next: () => {
          this.successMessage = 'Availability deleted.';
          this.loadAll();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err: any) => {
          console.error(err);
          this.errorMessage = 'Error deleting availability';
        }
      });
    }
  }

  getPeriodLabel(status: string): string {
    if (!status) return '';
    let icons = '';
    if (status.includes('MORNING'))   icons += '🌅';
    if (status.includes('AFTERNOON')) icons += '☀️';
    if (status.includes('NIGHT'))     icons += '🌙';
    if (status.includes('ALL_DAY'))   icons += '🕐';
    return icons;
  }

  getStatusClass(status: string): string {
    if (!status) return 'bg-secondary';
    if (status.startsWith('AVAILABLE')) return 'bg-success';
    if (status.startsWith('PART_TIME')) return 'bg-warning text-dark';
    return 'bg-secondary';
  }
}