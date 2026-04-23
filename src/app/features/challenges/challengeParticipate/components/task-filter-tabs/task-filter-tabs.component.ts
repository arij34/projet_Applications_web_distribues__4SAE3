import { Component, Input, Output, EventEmitter } from '@angular/core';

export type FilterType = 'all' | 'remaining' | 'completed';

interface FilterCounts {
  all: number;
  remaining: number;
  completed: number;
}

@Component({
  selector: 'app-task-filter-tabs',
  templateUrl: './task-filter-tabs.component.html',
  styleUrls: ['./task-filter-tabs.component.css']
})
export class TaskFilterTabsComponent {
  @Input() activeFilter: FilterType = 'all';
  @Input() counts: FilterCounts = { all: 0, remaining: 0, completed: 0 };
  @Output() filterChange = new EventEmitter<FilterType>();

  tabs = [
    { key: 'all' as FilterType, label: 'All Tasks' },
    { key: 'remaining' as FilterType, label: 'Remaining' },
    { key: 'completed' as FilterType, label: 'Completed' }
  ];

  onFilterChange(filter: FilterType): void {
    this.filterChange.emit(filter);
  }

  getCount(key: FilterType): number {
    return this.counts[key];
  }
}
