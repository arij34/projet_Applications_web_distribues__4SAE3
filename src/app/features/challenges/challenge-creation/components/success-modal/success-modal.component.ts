import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-success-modal',
  templateUrl: './success-modal.component.html',
  styleUrl: './success-modal.component.css'
})
export class SuccessModalComponent {
  @Input() isOpen = false;
  @Input() challengeTitle = '';
  @Input() challengeId = '';
  @Output() close = new EventEmitter<void>();
  @Output() viewPage = new EventEmitter<void>();

  copied = false;

  get participationLink(): string {
    if (this.challengeId) {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://platform.example.com';
      return `${origin}/challenges/${this.challengeId}`;
    }
    const slug = (this.challengeTitle || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'challenge';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://platform.example.com';
    return `${origin}/challenges/${slug}`;
  }

  copyLink(): void {
    navigator.clipboard.writeText(this.participationLink).then(() => {
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 2000);
    });
  }

  viewChallenge(): void {
    this.viewPage.emit();
  }

  onClose(): void {
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}
