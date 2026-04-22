import { Component, Output, EventEmitter } from '@angular/core';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-challenge-search',
  templateUrl: './challenge-search.component.html',
  styleUrls: ['./challenge-search.component.css','./../../challenges.styles.css']
})
export class ChallengeSearchComponent {
  @Output() searchChanged = new EventEmitter<string>();
  
  searchTerm = '';
  private searchSubject = new Subject<string>();

  constructor() {
    // Debounce search input
    this.searchSubject
      .pipe(debounceTime(300))
      .subscribe(term => this.searchChanged.emit(term));
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;
    this.searchSubject.next(value);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchChanged.emit('');
  }
}
