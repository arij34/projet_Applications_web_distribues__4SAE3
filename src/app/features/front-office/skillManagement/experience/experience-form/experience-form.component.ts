import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Experience } from '../../../../../core/models/skill/experience.model';
import { ExperienceService } from '../../../../../core/services/skill/experience.service';

@Component({
  selector: 'app-experience-form',
  templateUrl: './experience-form.component.html',
  styleUrl: './experience-form.component.css'
})
export class ExperienceFormComponent implements OnInit {

  item: Experience = { title: '', company: '', description: '' };

  isEditMode = false;
  itemId?: number;
  userId?: number;
  dateError: string = '';
calculatedDuration: number = 0;

  errorMessage = '';
  loading = false;

  constructor(
    private experienceService: ExperienceService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {

    // récupérer id (edit)
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.isEditMode = true;
      this.itemId = Number(idParam);
      this.loadExperience();
    }

    // récupérer userId (create)
    const userIdParam = this.route.snapshot.paramMap.get('userId');
    if (userIdParam) {
      this.userId = Number(userIdParam);
    }

  }

  loadExperience(): void {

    if (!this.itemId) return;

    this.loading = true;

    this.experienceService.getById(this.itemId).subscribe({

      next: (data) => {

  this.item = data;

  // Convertir en format yyyy-MM-dd pour input date
  if (this.item.startDate) {
    this.item.startDate = this.item.startDate.split('T')[0];
  }

  if (this.item.endDate) {
    this.item.endDate = this.item.endDate.split('T')[0];
  }

  this.loading = false;
},
      error: () => {
        this.errorMessage = 'Erreur de chargement';
        this.loading = false;
      }

    });

  }

  onSubmit(): void {

    if (!this.item.title?.trim() || !this.item.company?.trim()) {
      this.errorMessage = 'Poste et entreprise requis';
      return;
    }

    this.loading = true;

    const payload: Experience = {
  id: this.itemId,
  title: this.item.title.trim(),
  company: this.item.company.trim(),
  description: this.item.description?.trim(),
  startDate: this.item.startDate
    ? new Date(this.item.startDate).toISOString().split('T')[0]
    : undefined,
  endDate: this.item.endDate
    ? new Date(this.item.endDate).toISOString().split('T')[0]
    : undefined
};

    // ✅ UPDATE
    if (this.isEditMode) {

      this.experienceService.update(payload).subscribe({

        next: () => this.router.navigate(['/front/experience']),

        error: (err) => {
          this.errorMessage = err?.error?.message || 'Erreur update';
          this.loading = false;
        }

      });

    }

    // ✅ CREATE
    else {

      if (!this.userId) {
        this.errorMessage = 'UserId manquant';
        this.loading = false;
        return;
      }

     this.experienceService.create(payload).subscribe({

        next: () => this.router.navigate(['/front/experience']),

        error: (err) => {
          this.errorMessage = err?.error?.message || 'Erreur create';
          this.loading = false;
        }

      });

    }

  }
  private formatDate(date: Date): string {
  const d = new Date(date);
  return d.toISOString().split('T')[0]; // yyyy-MM-dd
}
validateDates(): void {

  this.dateError = '';
  this.calculatedDuration = 0;

  if (!this.item.startDate) return;

  const start = new Date(this.item.startDate);
  const today = new Date();

  if (start > today) {
    this.dateError = 'Start date cannot be in the future';
    return;
  }

  if (this.item.endDate) {

    const end = new Date(this.item.endDate);

    if (end < start) {
      this.dateError = 'End date must be after start date';
      return;
    }

    if (end > today) {
      this.dateError = 'End date cannot be in the future';
      return;
    }

    const diff = end.getFullYear() - start.getFullYear();
    this.calculatedDuration = diff;

    if (diff > 50) {
      this.dateError = 'Experience duration seems unrealistic';
    }
  }
}

}
