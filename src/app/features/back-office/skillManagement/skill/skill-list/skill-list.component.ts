import { Component, OnInit } from '@angular/core';
import { Skill } from '../../../../../core/models/skill/skill.model';
import { SkillService } from '../../../../../core/services/skill/skill.service';
import { SearchService } from '../../../../../core/services/skill/search.service';

@Component({
  selector: 'app-skill-list',
  templateUrl: './skill-list.component.html',
  styleUrls: ['./skill-list.component.css']
})
export class SkillListComponent implements OnInit {

  allSkills:      Skill[] = [];
  filteredSkills: Skill[] = [];
  currentQuery = '';
  loading = false;
  errorMessage = '';
  successMessage = '';
  search: any;

  constructor(
    private skillService: SkillService,
    private searchService: SearchService
  ) {
    this.search = this.searchService.createSearch<Skill>({
      fields: ['name', 'category', 'normalizedName'],
      filters: [
        {
          field: 'category',
          label: 'Category',
          options: ['PROGRAMMING','DESIGN','DEVOPS','DATABASE','MANAGEMENT','OTHER']
        }
      ]
    });
  }

  ngOnInit(): void {
    this.search.results$.subscribe((data: Skill[]) => this.filteredSkills = data);
    this.loadSkills();
  }

  loadSkills(): void {
    this.loading = true;
    this.skillService.getAll().subscribe({
      next: (data: Skill[]) => {
        this.allSkills = data;
        this.search.setData(data);
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  onSearch(query: string): void { this.currentQuery = query; this.search.setQuery(query); }
  onFilter(e: { field: string; value: string }): void { this.search.setFilter(e.field, e.value); }
  onReset(): void { this.currentQuery = ''; this.search.reset(); }

  deleteSkill(id: number): void {
    if (confirm('Delete this skill?')) {
      this.skillService.delete(id).subscribe(() => {
        this.successMessage = 'Skill deleted.';
        this.loadSkills();
        setTimeout(() => this.successMessage = '', 3000);
      });
    }
  }
}