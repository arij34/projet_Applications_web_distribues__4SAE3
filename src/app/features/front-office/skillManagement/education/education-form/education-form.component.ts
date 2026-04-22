import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Education } from '../../../../../core/models/skill/education.model';
import { EducationService } from '../../../../../core/services/skill/education.service';

@Component({
  selector: 'app-education-form',
  templateUrl: './education-form.component.html',
  styleUrls: ['./education-form.component.css'] // ✅ correction ici
})
export class EducationFormComponent implements OnInit {

  // ✅ Initialisation propre avec fieldOfStudy
  item: Education = {
    degree: '',
    fieldOfStudy: '',
    institution: '',
    year: new Date().getFullYear(),
    
  };
currentYear: number = new Date().getFullYear();
  degrees: string[] = [
    'HIGH_SCHOOL',
    'ASSOCIATE',
    'BACHELOR',
    'MASTER',
    'MBA',
    'ENGINEERING',
    'PHD',
    'DOCTORATE',
    'PROFESSIONAL_CERTIFICATE',
    'DIPLOMA',
    'OTHER'
  ];

  isEditMode = false;
  itemId?: number;
  errorMessage = '';
  loading = false;

  private userId = 1;

  constructor(
    private educationService: EducationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {

    const url = this.route.snapshot.url.map(s => s.path).join('/');

    if (url.includes('edit')) {

      this.isEditMode = true;
      const id = Number(this.route.snapshot.paramMap.get('id'));
      this.itemId = id;
      this.loading = true;

      this.educationService.getById(id).subscribe({
        next: (data) => {
          this.item = data;
          this.loading = false;
        },
        error: () => {
          this.errorMessage = 'Error loading education';
          this.loading = false;
        }
      });

    } else {

      const userIdParam = this.route.snapshot.paramMap.get('userId');
      if (userIdParam) {
        this.userId = Number(userIdParam);
      }

    }
  }

  onSubmit(): void {

    this.errorMessage = '';

    // ✅ Validation adaptée enum
    if (!this.item.degree) {
      this.errorMessage = 'Degree is required';
      return;
    }

    if (!this.item.fieldOfStudy?.trim()) {
      this.errorMessage = 'Field of study is required';
      return;
    }

    if (!this.item.institution?.trim()) {
      this.errorMessage = 'Institution is required';
      return;
    }

    if (!this.item.year ||
    this.item.year < 1950 ||
    this.item.year > this.currentYear) {
  this.errorMessage = `Graduation year must be between 1950 and ${this.currentYear}`;
  return;
}

    this.loading = true;

    if (this.isEditMode && this.itemId !== undefined) {

      const payload: Education = {
        ...this.item,
        id: this.itemId
      };

      this.educationService.update(this.item.id!, payload).subscribe({
        next: () => this.router.navigate(['/front/education']),
        error: (err: any) => {
          this.errorMessage = err?.error?.message || 'Error while updating';
          this.loading = false;
        }
      });

    } else {

      this.educationService.create(this.item).subscribe({
        next: () => this.router.navigate(['/front/education']),
        error: (err: any) => {
          this.errorMessage =
            err?.error?.message || 'Error while creating education';
          this.loading = false;
        }
      });

    }
  }
}