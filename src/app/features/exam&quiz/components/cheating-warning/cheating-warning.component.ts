import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cheating-warning',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isVisible" class="warning-container" [ngClass]="'severity-' + severity">
      <div class="warning-header">
        <span class="warning-icon">⚠️</span>
        <span class="warning-title">{{ title }}</span>
        <button class="close-btn" (click)="onClose()">×</button>
      </div>
      <div class="warning-message">
        {{ message }}
      </div>
      <div class="warning-actions" *ngIf="showDismiss">
        <button class="dismiss-btn" (click)="onDismiss()">I Understand</button>
      </div>
    </div>
  `,
  styles: [`
    .warning-container {
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      padding: 16px;
      max-width: 400px;
      z-index: 9999;
      animation: slideInRight 0.3s ease-out;
      border-left: 4px solid #ec4899;
    }

    .warning-container.severity-low {
      border-left-color: #fbbf24;
    }

    .warning-container.severity-medium {
      border-left-color: #f97316;
    }

    .warning-container.severity-high {
      border-left-color: #dc2626;
    }

    .warning-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-weight: 600;
      color: #1f2937;
    }

    .warning-icon {
      font-size: 20px;
    }

    .warning-title {
      flex: 1;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #9ca3af;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        color: #6b7280;
      }
    }

    .warning-message {
      color: #4b5563;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 12px;
    }

    .warning-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    .dismiss-btn {
      padding: 6px 12px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;

      &:hover {
        background: #2563eb;
      }
    }

    @keyframes slideInRight {
      from {
        transform: translateX(450px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `]
})
export class CheatingWarningComponent {
  @Input() isVisible = false;
  @Input() title = 'Warning';
  @Input() message = '';
  @Input() severity: 'low' | 'medium' | 'high' = 'medium';
  @Input() showDismiss = true;
  @Input() autoHideDuration = 0; // 0 = don't auto hide

  @Output() closed = new EventEmitter<void>();
  @Output() dismissed = new EventEmitter<void>();

  private autoHideTimer: any;

  ngOnInit(): void {
    if (this.autoHideDuration > 0) {
      this.autoHideTimer = setTimeout(() => this.onClose(), this.autoHideDuration);
    }
  }

  ngOnDestroy(): void {
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
    }
  }

  onClose(): void {
    this.closed.emit();
  }

  onDismiss(): void {
    this.dismissed.emit();
  }
}
