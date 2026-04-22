import {
  Component, Input, Output, EventEmitter, OnChanges
} from '@angular/core';
import { FilterConfig } from '../../../core/services/skill/search.service';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.css']
})
export class SearchBarComponent implements OnChanges {

  @Input() placeholder  = 'Search...';
  @Input() filters: FilterConfig[] = [];
  @Input() totalCount?: number;
  @Input() resultCount?: number;
  @Input() currentQuery = '';

  @Output() queryChange  = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<{ field: string; value: string }>();
  @Output() reset        = new EventEmitter<void>();

  hasActiveFilter = false;

  ngOnChanges(): void {
    this.hasActiveFilter = !!this.currentQuery;
  }

  onQueryChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.currentQuery = val;
    this.queryChange.emit(val);
  }

  onFilterChange(field: string, event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.hasActiveFilter = !!val || !!this.currentQuery;
    this.filterChange.emit({ field, value: val });
  }

  onReset(): void {
    this.currentQuery   = '';
    this.hasActiveFilter = false;
    this.reset.emit();
  }
}