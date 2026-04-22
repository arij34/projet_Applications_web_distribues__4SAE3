import { Component, OnInit } from '@angular/core';
import { Education } from '../../../../../core/models/skill/education.model';
import { EducationService } from '../../../../../core/services/skill/education.service';
import { SearchService } from '../../../../../core/services/skill/search.service';

@Component({
  selector: 'app-education-list',
  templateUrl: './education-list.component.html',
  styleUrl: './education-list.component.css'
})
export class EducationListComponent implements OnInit {

  allItems:      Education[] = [];
  filteredItems: Education[] = [];
  currentQuery = '';
  // ✅ SUPPRIMÉ : currentUserId = 1  (inutile, le token JWT gère l'identité)
  loading = false;
  errorMessage = '';
  successMessage = '';
  search: any;

  constructor(
    private educationService: EducationService,
    private searchService: SearchService
  ) {
    this.search = this.searchService.createSearch<Education>({
      fields: ['degree', 'institution', 'fieldOfStudy'],
      filters: [
        {
          field: 'degree',
          label: 'Degree',
          options: ['BACHELOR', 'MASTER', 'PHD', 'ENGINEER', 'MBA', 'DIPLOMA', 'OTHER']
        }
      ]
    });
  }

  ngOnInit(): void {
    this.search.results$.subscribe((data: Education[]) => this.filteredItems = data);
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.educationService.getAll().subscribe({
      next: (data: Education[]) => {
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
    if (confirm('Supprimer cette formation ?')) {
      this.educationService.delete(id).subscribe(() => {
        this.successMessage = 'Formation supprimée.';
        this.loadAll();
        setTimeout(() => this.successMessage = '', 3000);
      });
    }
  }
}