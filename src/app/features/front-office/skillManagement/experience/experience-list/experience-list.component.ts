import { Component, OnInit } from '@angular/core';
import { Experience } from '../../../../../core/models/skill/experience.model';
import { ExperienceService } from '../../../../../core/services/skill/experience.service';
import { SearchService } from '../../../../../core/services/skill/search.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-experience-list',
  templateUrl: './experience-list.component.html',
  styleUrl: './experience-list.component.css'
})
export class ExperienceListComponent implements OnInit {

  allItems:      Experience[] = [];
  filteredItems: Experience[] = [];
  currentQuery = '';
  loading = false;
  errorMessage = '';
  successMessage = '';
  search: any;

  constructor(
    private experienceService: ExperienceService,
    private searchService: SearchService,
    private location: Location
  ) {
    this.search = this.searchService.createSearch<Experience>({
      fields: ['title', 'company', 'description'],
    });
  }

  ngOnInit(): void {
    this.search.results$.subscribe((data: Experience[]) => this.filteredItems = data);
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.experienceService.getAll().subscribe({
      next: (data: Experience[]) => {
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

  deleteItem(id: number): void {
    if (confirm('Supprimer cette expérience ?')) {
      this.experienceService.delete(id).subscribe(() => {
        this.successMessage = 'Expérience supprimée.';
        this.loadAll();
        setTimeout(() => this.successMessage = '', 3000);
      });
    }
  }

  goBack(): void { this.location.back(); }
}
