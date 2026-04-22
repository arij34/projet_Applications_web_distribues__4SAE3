import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-quick-action-cards',
  templateUrl: './quick-action-cards.component.html',
  styleUrls: ['./quick-action-cards.component.css']
})
export class QuickActionCardsComponent {
  @Output() createChallenge = new EventEmitter<void>();
  @Output() aiGenerate = new EventEmitter<void>();

  onCreateChallenge(): void {
    this.createChallenge.emit();
  }

  onAIGenerate(): void {
    this.aiGenerate.emit();
  }
}
