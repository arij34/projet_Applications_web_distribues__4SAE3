import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Skill } from '../../../../../core/models/skill/skill.model';
import { SkillService } from '../../../../../core/services/skill/skill.service';

@Component({
  selector: 'app-skill-form',
  templateUrl: './skill-form.component.html',
  styleUrls: ['./skill-form.component.css']  // ✅ IMPORTANT
})
export class SkillFormComponent implements OnInit {

  skillForm!: FormGroup;
  isEditMode = false;
  skillId?: number;
  errorMessage = '';
  loading = false;

  categories = [
    'PROGRAMMING',
    'DATABASE',
    'DEVOPS',
    'DESIGN',
    'MANAGEMENT',
    'OTHER'
  ];

  constructor(
    private fb: FormBuilder,
    private skillService: SkillService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {

    // ✅ Initialisation du form
    this.skillForm = this.fb.group({
      name: ['', Validators.required],
      normalizedName: ['', Validators.required],
      category: ['', Validators.required]
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : undefined;

    if (id) {
      this.isEditMode = true;
      this.skillId = id;
      this.loading = true;

      this.skillService.getById(id).subscribe({
        next: (data) => {
          this.skillForm.patchValue(data); // ✅ Remplir le form
          this.loading = false;
        },
        error: () => {
          this.errorMessage = 'Erreur de chargement';
          this.loading = false;
        }
      });
    }

    // ✅ Auto génération normalizedName
    this.skillForm.get('name')?.valueChanges.subscribe(value => {
      if (value) {
        this.skillForm.get('normalizedName')
          ?.setValue(value.toLowerCase().trim(), { emitEvent: false });
      }
    });
  }

  onSubmit(): void {

    if (this.skillForm.invalid) {
      this.errorMessage =
        'Name, Normalized Name and Category are required';
      return;
    }

    this.loading = true;

    const skillPayload: Skill = {
      idS: this.skillId,
      ...this.skillForm.value
    };

    if (this.isEditMode) {

      this.skillService.update(this.skillId!, skillPayload)
        .subscribe({
          next: () =>
            this.router.navigate(['/back-office/skills']),
          error: () => {
            this.errorMessage = 'Error updating skill';
            this.loading = false;
          }
        });

    } else {

      this.skillService.create(skillPayload)
        .subscribe({
          next: () =>
            this.router.navigate(['/back-office/skills']),
          error: () => {
            this.errorMessage = 'Error creating skill';
            this.loading = false;
          }
        });
    }
  }
}