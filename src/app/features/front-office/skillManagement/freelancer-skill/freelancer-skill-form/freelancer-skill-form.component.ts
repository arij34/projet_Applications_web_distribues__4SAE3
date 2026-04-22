import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { FreelancerSkill } from '../../../../../core/models/skill/freelancer-skill.model';
import { FreelancerSkillService } from '../../../../../core/services/skill/freelancer-skill.service';
import { SkillService, SkillMatchResult } from '../../../../../core/services/skill/skill.service';

@Component({
  selector: 'app-freelancer-skill-form',
  templateUrl: './freelancer-skill-form.component.html',
  styleUrls: ['./freelancer-skill-form.component.css']
})
export class FreelancerSkillFormComponent implements OnInit {

  item: FreelancerSkill = {
    skillId: 0,
    level: 1,
    yearsExperience: 0
  };

  isEditMode = false;
  itemId?: number;
  userId?: number;

  loading = false;
  errorMessage = '';

  skillInput = '';
  levelLabel = 'BEGINNER';

  // DID YOU MEAN
  suggestedSkill: any = null;
  showSuggestion = false;
  confidenceScore = 0;

  private skillInputChanged = new Subject<string>();

  constructor(
    private freelancerSkillService: FreelancerSkillService,
    private skillService: SkillService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.itemId = Number(idParam);
      this.loadItem();
    }

    const userIdParam = this.route.snapshot.paramMap.get('userId');
    if (userIdParam) {
      this.userId = Number(userIdParam);
    }

    // Listen input typing
    this.skillInputChanged.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(value => {

      if (!value || value.length < 3) {
        this.resetSuggestion();
        return;
      }

      this.skillService.matchSkill(value).subscribe({
        next: (res: SkillMatchResult) => {
          console.log('FULL RESPONSE:', res);

          // Afficher une suggestion uniquement si :
          // - ce n'est pas un match exact
          // - le backend indique que c'est une vraie suggestion
          // - un skill avec un name est présent
          if (
            res &&
            !res.exactMatch &&
            res.suggestion &&
            res.skill &&
            res.skill.name
          ) {
            this.suggestedSkill = res.skill;

            const confidence = typeof res.confidence === 'number' ? res.confidence : 0;
            this.confidenceScore = Math.round(confidence * 100);

            // Afficher seulement si confiance suffisante
            this.showSuggestion = confidence >= 0.5;
          } else {
            this.resetSuggestion();
          }
        },
        error: () => this.resetSuggestion()
      });

    });
  }

  onSkillTyping() {
    this.skillInputChanged.next(this.skillInput);
  }

  applySuggestion() {
    if (!this.suggestedSkill) return;

    this.skillInput = this.suggestedSkill.name;
    this.resetSuggestion();
  }

  resetSuggestion() {
    this.suggestedSkill = null;
    this.showSuggestion = false;
    this.confidenceScore = 0;
  }

  loadItem(): void {
    if (!this.itemId) return;

    this.loading = true;

    this.freelancerSkillService.getById(this.itemId).subscribe({
      next: (data: any) => {
        this.item = data;
        this.levelLabel = data.level || 'BEGINNER';
        if (data.skill?.name) {
          this.skillInput = data.skill.name;
        }
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Error loading skill';
        this.loading = false;
      }
    });
  }

  onYearsChange(): void {
    this.freelancerSkillService
      .getLevelByYears(this.item.yearsExperience)
      .subscribe(res => {
        this.item.level = res.level;
        this.levelLabel = res.label;
      });
  }

  onSubmit(): void {
  this.errorMessage = '';
  this.loading = true;

  if (!this.skillInput.trim()) {
    this.errorMessage = 'Skill required';
    this.loading = false;
    return;
  }

  const payload: any = {
    yearsExperience: Number(this.item.yearsExperience),
    extractedByAI: false
  };

  // ✅ createWithSkillInput au lieu de createWithSkillInputCV
  this.freelancerSkillService.createWithSkillInput(this.skillInput, payload)
    .subscribe({
      next: () => this.router.navigate(['/front/freelancer-skills']),
      error: () => {
        this.errorMessage = 'Error creating skill';
        this.loading = false;
      }
    });
}
}