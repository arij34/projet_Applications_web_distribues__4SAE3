import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Availability } from '../../../../../core/models/skill/availability.model';
import { AvailabilityService } from '../../../../../core/services/skill/availability.service';

@Component({
  selector: 'app-availability-form',
  templateUrl: './availability-form.component.html',
  styleUrl: './availability-form.component.css'
})
export class AvailabilityFormComponent implements OnInit {

  item: Availability = {
    hoursPerDay: 0,
    selectedDays: [],
    selectedPeriods: []
  };

  preview: Availability | null = null;
  previewLoading = false;

  isEditMode = false;
  itemId?: number;
  errorMessage = '';
  loading = false;

  daysOfWeek = [
    { key: 'MON', label: 'Monday' },
    { key: 'TUE', label: 'Tuesday' },
    { key: 'WED', label: 'Wednesday' },
    { key: 'THU', label: 'Thursday' },
    { key: 'FRI', label: 'Friday' },
    { key: 'SAT', label: 'Saturday' },
    { key: 'SUN', label: 'Sunday' }
  ];

 periods = [
  { key: 'MORNING',   label: 'Morning (6h-12h)' },
  { key: 'AFTERNOON', label: 'Afternoon (12h-18h)' },
  { key: 'NIGHT',     label: 'Night (18h-00h)' },
  { key: 'ALL_DAY',   label: 'All Day (24h)' }
];

  constructor(
    private availabilityService: AvailabilityService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const url = this.route.snapshot.url.map(s => s.path).join('/');
  if (url.includes('edit')) {
    this.isEditMode = true;
    this.itemId = Number(this.route.snapshot.paramMap.get('id'));
    this.loading = true;
    this.availabilityService.getById(this.itemId).subscribe({
      next: (data) => {
        this.item = {
          hoursPerDay:     data.hoursPerDay,
          selectedDays:    data.selectedDays ?? [],
          selectedPeriods: data.selectedPeriods ?? []
        };
        this.preview = data;
        this.loading = false;
      },
      error: () => { this.errorMessage = 'Error loading data'; this.loading = false; }
    });
  }
  }

  getMaxHours(): number {
    if (this.item.selectedPeriods.includes('ALL_DAY')) return 24;
    return this.item.selectedPeriods.length * 6;
  }

  toggleDay(day: string): void {
    const i = this.item.selectedDays.indexOf(day);
    i > -1 ? this.item.selectedDays.splice(i, 1) : this.item.selectedDays.push(day);
    this.refreshPreview();
  }

  isDaySelected(day: string): boolean {
    return this.item.selectedDays.includes(day);
  }

  togglePeriod(period: string): void {
    if (period === 'ALL_DAY') {
      this.item.selectedPeriods = ['ALL_DAY'];
    } else {
      this.item.selectedPeriods = this.item.selectedPeriods.filter(p => p !== 'ALL_DAY');
      const i = this.item.selectedPeriods.indexOf(period);
      i > -1 ? this.item.selectedPeriods.splice(i, 1) : this.item.selectedPeriods.push(period);
    }
    const max = this.getMaxHours();
    if (this.item.hoursPerDay > max) this.item.hoursPerDay = max;
    this.refreshPreview();
  }

  isPeriodSelected(period: string): boolean {
    return this.item.selectedPeriods.includes(period);
  }

  onHoursChange(): void {
    this.refreshPreview();
  }

  refreshPreview(): void {
    if (
      this.item.hoursPerDay <= 0 ||
      this.item.selectedDays.length === 0 ||
      this.item.selectedPeriods.length === 0
    ) {
      this.preview = null;
      return;
    }
    this.previewLoading = true;
    this.availabilityService.preview(this.item).subscribe({
      next: (result) => { this.preview = result; this.previewLoading = false; },
      error: () => { this.previewLoading = false; }
    });
  }

 getStatusClass(status: string): string {

  if (!status) return 'status-gray';

  // ⚠ IMPORTANT : vérifier UNAVAILABLE avant AVAILABLE
  if (status.includes('UNAVAILABLE')) {
    return 'status-red';
  }

  if (status.includes('FULL')) {
    return 'status-green';
  }

  if (status.includes('LIMITED')) {
    return 'status-orange';
  }

  if (status.includes('AVAILABLE')) {
    return 'status-blue';
  }

  return 'status-gray';
}

formatStatus(status: string): string {
  return status
    ?.toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

  onSubmit(): void {
    this.errorMessage = '';
    this.loading = true;
    if (this.isEditMode && this.itemId !== undefined) {
      this.availabilityService.update(this.itemId, this.item).subscribe({
        next: () => this.router.navigate(['/front/availability']),
        error: (err) => { this.errorMessage = err?.error?.message || 'Error updating'; this.loading = false; }
      });
    } else {
      this.availabilityService.create(this.item).subscribe({
        next: () => this.router.navigate(['/front/availability']),
        error: (err) => { this.errorMessage = err?.error?.message || 'Error creating'; this.loading = false; }
      });
    }
  }
}