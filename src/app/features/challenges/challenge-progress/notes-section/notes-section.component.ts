import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-notes-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notes-section.component.html',
  styleUrls: ['./notes-section.component.css']
})
export class NotesSectionComponent implements OnDestroy {
  @Input() initialNotes: string = '';
  @Output() save = new EventEmitter<string>();

  notes: string = '';
  isSaving: boolean = false;
  lastSaved: Date | null = null;
  maxCharacters: number = 1000;

  private notesSubject = new Subject<string>();

  ngOnInit(): void {
    this.notes = this.initialNotes;

    // Auto-save after 1 second of inactivity
    this.notesSubject
      .pipe(
        debounceTime(1000),
        distinctUntilChanged()
      )
      .subscribe(notes => {
        if (notes !== this.initialNotes) {
          this.isSaving = true;
          setTimeout(() => {
            this.save.emit(notes);
            this.lastSaved = new Date();
            this.isSaving = false;
          }, 500);
        }
      });
  }

  ngOnDestroy(): void {
    this.notesSubject.complete();
  }

  onNotesChange(value: string): void {
    this.notes = value;
    this.notesSubject.next(value);
  }

  get characterCount(): number {
    return this.notes.length;
  }
}
