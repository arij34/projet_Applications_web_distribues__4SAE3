import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { Challenge } from '@core/models/challenge.model';

const DEFAULT_IMAGE = 'assets/img/default-challenge.png';

@Component({
  selector: 'app-challenge-card',
  templateUrl: './challenge-card.component.html',
  styleUrls: ['./challenge-card.component.css', './../../../features/challenges/challenges.styles.css']
})
export class ChallengeCardComponent {
  @Input() challenge!: Challenge;
  @Output() joinClicked = new EventEmitter<string>();

  constructor(private sanitizer: DomSanitizer) {}

  getBackgroundImageStyle(): SafeStyle {
    const img = this.challenge?.image?.trim() || DEFAULT_IMAGE;
    const escaped = img.replace(/"/g, '%22');
    return this.sanitizer.bypassSecurityTrustStyle('url("' + escaped + '")');
  }

  get hasImage(): boolean {
    return !!(this.challenge?.image?.trim());
  }

  onJoinChallenge(): void {
    this.joinClicked.emit(this.challenge.id);
  }
}
