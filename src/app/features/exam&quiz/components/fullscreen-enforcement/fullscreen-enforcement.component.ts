import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AntiCheatingService } from '../../services/anti-cheating.service';

@Component({
  selector: 'app-fullscreen-enforcement',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fullscreen-modal" *ngIf="!hasEnteredFullscreen">
      <div class="modal-content">
        <div class="modal-icon">🖥️</div>
        <h2>Exam Requirements</h2>
        <p>For security reasons, you must take this exam in fullscreen mode. Your exam will:</p>
        <ul class="requirements-list">
          <li>Run in fullscreen mode only</li>
          <li>Monitor for tab switches</li>
          <li>Block keyboard shortcuts</li>
          <li>Prevent copying and pasting</li>
          <li>Block right-click context menu</li>
          <li>Monitor device for cheating attempts</li>
          <li>Require camera access before the session starts</li>
        </ul>

        <div class="camera-check" [class.camera-check-error]="cameraStatus === 'blocked' || cameraStatus === 'unsupported'">
          <div class="camera-check-header">
            <span class="camera-check-title">Camera access</span>
            <span class="camera-badge"
              [class.ready]="cameraStatus === 'ready'"
              [class.pending]="cameraStatus === 'pending' || cameraStatus === 'checking'"
              [class.error]="cameraStatus === 'blocked' || cameraStatus === 'unsupported'">
              {{
                cameraStatus === 'ready' ? 'Ready' :
                cameraStatus === 'blocked' ? 'Blocked' :
                cameraStatus === 'unsupported' ? 'Unsupported' :
                'Needs approval'
              }}
            </span>
          </div>
          <p class="camera-check-text">
            {{
              cameraStatus === 'ready' ? 'Camera permission is available. You can continue into the exam.' :
              cameraStatus === 'blocked' ? 'Camera access is currently blocked for this site. Update browser site permissions, then try again.' :
              cameraStatus === 'unsupported' ? 'This browser cannot provide camera access required for proctoring.' :
              'When you continue, the browser may ask for camera permission before the exam starts.'
            }}
          </p>
        </div>
        
        <div class="warning-box">
          <strong>⚠️ Important:</strong> Any attempt to exit fullscreen or use prohibited actions will be logged and may result in exam termination.
        </div>

        <div class="modal-actions">
          <button class="decline-btn" (click)="onDecline()" [disabled]="isLoading">Decline & Exit</button>
          <button class="accept-btn" (click)="onAccept()" [disabled]="isLoading || cameraStatus === 'unsupported'">
            Check Camera & Continue
          </button>
        </div>

        <p class="info-text" *ngIf="isLoading">
          Checking camera permission and preparing exam environment...
        </p>
        <p class="error-text" *ngIf="error">
          {{ error }}
        </p>
      </div>
    </div>
  `,
  styles: [`
    .fullscreen-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      padding: 40px;
      max-width: 500px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .modal-icon {
      font-size: 48px;
      margin-bottom: 20px;
    }

    h2 {
      color: #1f2937;
      margin-bottom: 16px;
      font-size: 24px;
    }

    p {
      color: #4b5563;
      margin-bottom: 16px;
      line-height: 1.6;
    }

    .requirements-list {
      text-align: left;
      background: #f3f4f6;
      padding: 16px 20px;
      border-radius: 8px;
      margin: 20px 0;
      list-style-position: inside;
      color: #374151;
    }

    .requirements-list li {
      margin-bottom: 8px;
      line-height: 1.5;
    }

    .warning-box {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 12px;
      margin: 20px 0;
      color: #991b1b;
      font-size: 14px;
      line-height: 1.5;
    }

    .camera-check {
      text-align: left;
      border: 1px solid #dbe4ef;
      border-radius: 10px;
      background: #f8fbff;
      padding: 14px 16px;
      margin: 20px 0;
    }

    .camera-check-error {
      border-color: #f3b7b7;
      background: #fff6f6;
    }

    .camera-check-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
    }

    .camera-check-title {
      color: #1f2937;
      font-size: 14px;
      font-weight: 700;
    }

    .camera-badge {
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: #eef2f7;
      color: #526173;
    }

    .camera-badge.ready {
      background: #e7f6ee;
      color: #17633d;
    }

    .camera-badge.pending {
      background: #edf4ff;
      color: #27588f;
    }

    .camera-badge.error {
      background: #fdecec;
      color: #a12828;
    }

    .camera-check-text {
      margin: 0;
      color: #475467;
      font-size: 13px;
      line-height: 1.5;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    .decline-btn,
    .accept-btn {
      flex: 1;
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }

    .decline-btn {
      background: #e5e7eb;
      color: #1f2937;

      &:hover {
        background: #d1d5db;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .accept-btn {
      background: #059669;
      color: white;

      &:hover {
        background: #047857;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .info-text {
      color: #3b82f6;
      font-size: 13px;
      margin-top: 12px;
      font-style: italic;
    }

    .error-text {
      color: #dc2626;
      font-size: 13px;
      margin-top: 12px;
    }
  `]
})
export class FullscreenEnforcementComponent implements OnInit {
  @Output() confirmed = new EventEmitter<void>();
  @Output() declined = new EventEmitter<void>();

  hasEnteredFullscreen = false;
  isLoading = false;
  error: string | null = null;
  cameraStatus: 'checking' | 'ready' | 'pending' | 'blocked' | 'unsupported' = 'checking';

  constructor(private antiCheatingService: AntiCheatingService) { }

  ngOnInit(): void {
    void this.inspectCameraPermission();
  }

  async onAccept(): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      await this.ensureCameraAccess();
      await this.antiCheatingService.enterFullscreen();
      this.hasEnteredFullscreen = true;
      this.isLoading = false;
      setTimeout(() => this.confirmed.emit(), 100);
    } catch (err) {
      this.isLoading = false;
      this.error = this.formatSetupError(err);
      console.error('Pre-exam setup error:', err);
    }
  }

  onDecline(): void {
    this.declined.emit();
  }

  private async inspectCameraPermission(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.cameraStatus = 'unsupported';
      this.error = 'This browser does not support camera access required for proctoring.';
      return;
    }

    if (!('permissions' in navigator) || typeof navigator.permissions.query !== 'function') {
      this.cameraStatus = 'pending';
      return;
    }

    try {
      const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
      this.cameraStatus =
        status.state === 'granted' ? 'ready' :
        status.state === 'denied' ? 'blocked' :
        'pending';

      status.onchange = () => {
        this.cameraStatus =
          status.state === 'granted' ? 'ready' :
          status.state === 'denied' ? 'blocked' :
          'pending';
      };
    } catch {
      this.cameraStatus = 'pending';
    }
  }

  private async ensureCameraAccess(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.cameraStatus = 'unsupported';
      throw new Error('This browser does not support camera access required for proctoring.');
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });

    stream.getTracks().forEach((track) => track.stop());
    this.cameraStatus = 'ready';
  }

  private formatSetupError(error: unknown): string {
    const detail = this.classifyCameraAccessError(error);

    if (detail) {
      if (detail.kind === 'site-blocked') {
        this.cameraStatus = 'blocked';
      }

      return detail.message;
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return 'Unable to prepare camera and fullscreen access. Check browser permissions and try again.';
  }

  private classifyCameraAccessError(error: unknown): { kind: 'site-blocked' | 'system-blocked' | 'busy' | 'missing'; message: string } | null {
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        const rawMessage = error.message.toLowerCase();
        const looksSystemBlocked =
          rawMessage.includes('system') ||
          rawMessage.includes('device in use') ||
          rawMessage.includes('permission denied by system') ||
          rawMessage.includes('could not start video source');

        if (looksSystemBlocked || this.cameraStatus !== 'blocked') {
          return {
            kind: 'system-blocked',
            message: 'Camera access is being blocked by Windows or browser privacy settings. Enable camera access for Chrome in system settings, then reload the page.'
          };
        }

        return {
          kind: 'site-blocked',
          message: 'Camera access is blocked for this site. Reset the camera permission in Chrome site settings, allow it again, then reload the page.'
        };
      }

      if (error.name === 'NotFoundError') {
        return {
          kind: 'missing',
          message: 'No camera was found on this device.'
        };
      }

      if (error.name === 'NotReadableError') {
        return {
          kind: 'busy',
          message: 'Your camera is busy in another application. Close Teams, Zoom, Discord, OBS, or any other app using the webcam and try again.'
        };
      }
    }

    return null;
  }
}
