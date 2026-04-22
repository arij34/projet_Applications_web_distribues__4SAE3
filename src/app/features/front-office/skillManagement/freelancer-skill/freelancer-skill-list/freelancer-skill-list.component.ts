import { Component, OnInit } from '@angular/core';
import { FreelancerSkill } from '../../../../../core/models/skill/freelancer-skill.model';
import { FreelancerSkillService } from '../../../../../core/services/skill/freelancer-skill.service';
import { SkillService } from '../../../../../core/services/skill/skill.service';
import { SearchService } from '../../../../../core/services/skill/search.service';

@Component({
  selector: 'app-freelancer-skill-list',
  templateUrl: './freelancer-skill-list.component.html',
  styleUrl: './freelancer-skill-list.component.css'
})
export class FreelancerSkillListComponent implements OnInit {

  allItems:      FreelancerSkill[] = [];
  filteredItems: FreelancerSkill[] = [];
  currentQuery = '';
  loading = false;
  errorMessage = '';
  successMessage = '';
  currentUserId = 1;
  search: any;  // ✅ déclaré ici, initialisé dans le constructeur

  levelMap: { [key: string]: { label: string; class: string } } = {
    'BEGINNER':     { label: 'BEGINNER',     class: 'bg-secondary' },
    'ELEMENTARY':   { label: 'ELEMENTARY',   class: 'bg-info' },
    'INTERMEDIATE': { label: 'INTERMEDIATE', class: 'bg-primary' },
    'ADVANCED':     { label: 'ADVANCED',     class: 'bg-warning' },
    'EXPERT':       { label: 'EXPERT',       class: 'bg-success' }
  };

  constructor(
    private freelancerSkillService: FreelancerSkillService,
    private skillService: SkillService,
    private searchService: SearchService
  ) {
    // ✅ FIX TS2729 : initialisation dans le constructeur (après injection)
    this.search = this.searchService.createSearch<FreelancerSkill>({
      fields: ['skill.name', 'customSkillName', 'level'],
      filters: [
        {
          field: 'level',
          label: 'Level',
          options: ['BEGINNER','ELEMENTARY','INTERMEDIATE','ADVANCED','EXPERT']
        }
      ]
    });
  }

  ngOnInit(): void {
    this.search.results$.subscribe((data: FreelancerSkill[]) => this.filteredItems = data);
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.freelancerSkillService.getAll().subscribe({
      next: (data: FreelancerSkill[]) => {
        this.allItems = data;
        this.search.setData(data);
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  onSearch(query: string): void { this.currentQuery = query; this.search.setQuery(query); }
  onFilter(e: { field: string; value: string }): void { this.search.setFilter(e.field, e.value); }
  onReset(): void { this.currentQuery = ''; this.search.reset(); }

  getLevelInfo(level: any): { label: string; class: string } {
    return this.levelMap[level] || { label: level, class: 'bg-secondary' };
  }

  deleteItem(id: number): void {
    if (confirm('Delete this skill?')) {
      this.freelancerSkillService.delete(id).subscribe(() => {
        this.successMessage = 'Skill deleted.';
        this.loadAll();
        setTimeout(() => this.successMessage = '', 3000);
      });
    }
  }

  getProgressWidth(level: any): number {
    const map: { [key: string]: number } = {
      'BEGINNER': 20, 'ELEMENTARY': 40,
      'INTERMEDIATE': 60, 'ADVANCED': 80, 'EXPERT': 100
    };
    return map[level] || 20;
  }
}