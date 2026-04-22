import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProctoringService } from '../../services/proctoring.service';
import { ViolationService } from '../../services/violation.service';
import {
  ProctoringViolation,
  ProctoringViolationActionEvent,
  ViolationSeverity,
  ViolationType
} from '../../models/proctoring.model';

@Component({
  selector: 'app-webcam-monitor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './webcam-monitor.component.html',
  styleUrls: ['./webcam-monitor.component.css']
})
export class WebcamMonitorComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) examId!: number;
  @Input({ required: true }) attemptId!: number;
  @Input() userId?: number;
  @Input() detectionIntervalMs = 2000;
  @Input() noFaceTimeoutMs = 5000;
  @Input() requireFullscreen = true;

  @Output() violationDetected = new EventEmitter<ProctoringViolation>();
  @Output() backendAction = new EventEmitter<ProctoringViolationActionEvent>();

  @ViewChild('containerRef', { static: true }) containerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('videoRef', { static: true }) videoRef!: ElementRef<HTMLVideoElement>;

  violationCount = signal(0);
  activeWarning = signal<string | null>(null);
  webcamReady = signal(false);
  errorMessage = signal<string | null>(null);
  panelTop = signal('20px');
  panelLeft = signal('50%');
  panelTransform = signal('translateX(-50%)');
  isDragging = signal(false);

  private stream: MediaStream | null = null;
  private detectionTimer: ReturnType<typeof setInterval> | null = null;
  private warningTimer: ReturnType<typeof setTimeout> | null = null;
  private monitoringStopped = false;
  private detectionInProgress = false;
  private activePointerId: number | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private readonly violationCooldownMs = 8000;
  private readonly lastViolationAt = new Map<ViolationType, number>();

  private lastFaceSeenAt = Date.now();
  private visibilityHandler = () => this.handleTabSwitch();
  private fullscreenHandler = () => this.handleFullscreenExit();
  private pointerMoveHandler = (event: PointerEvent) => this.handleDragMove(event);
  private pointerUpHandler = (event: PointerEvent) => this.stopDragging(event);

  constructor(
    private readonly proctoringService: ProctoringService,
    private readonly violationService: ViolationService
  ) {}

  async ngAfterViewInit(): Promise<void> {
    await this.startMonitoring();
  }

  ngOnDestroy(): void {
    this.unregisterDragEvents();
    this.stopMonitoring();
  }

  startDragging(event: PointerEvent): void {
    if (event.button !== 0 && event.pointerType !== 'touch') {
      return;
    }

    const container = this.containerRef.nativeElement;
    const bounds = container.getBoundingClientRect();

    this.activePointerId = event.pointerId;
    this.dragOffsetX = event.clientX - bounds.left;
    this.dragOffsetY = event.clientY - bounds.top;
    this.isDragging.set(true);
    this.panelLeft.set(`${bounds.left}px`);
    this.panelTop.set(`${bounds.top}px`);
    this.panelTransform.set('none');

    window.addEventListener('pointermove', this.pointerMoveHandler);
    window.addEventListener('pointerup', this.pointerUpHandler);
    window.addEventListener('pointercancel', this.pointerUpHandler);

    event.preventDefault();
  }

  private async startMonitoring(): Promise<void> {
    this.monitoringStopped = false;
    this.webcamReady.set(false);
    this.errorMessage.set(null);

    try {
      await this.startWebcam();
      await this.proctoringService.initializeModels();
      this.registerBrowserEvents();
      this.startDetectionLoop();
    } catch (error) {
      console.error('Webcam monitor initialization failed', error);
      this.errorMessage.set(this.formatStartupError(error));
      this.showWarning('Unable to initialize webcam proctoring.');
    }
  }

  async retryMonitoring(): Promise<void> {
    this.stopMonitoring();
    await this.startMonitoring();
  }

  private async startWebcam(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 960, min: 640 },
        height: { ideal: 540, min: 360 },
        frameRate: { ideal: 24, max: 30 }
      },
      audio: false
    });

    const video = this.videoRef.nativeElement;
    video.srcObject = this.stream;
    await video.play();
    this.webcamReady.set(true);
  }

  private registerBrowserEvents(): void {
    document.addEventListener('visibilitychange', this.visibilityHandler);
    document.addEventListener('fullscreenchange', this.fullscreenHandler);
  }

  private unregisterBrowserEvents(): void {
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    document.removeEventListener('fullscreenchange', this.fullscreenHandler);
  }

  private startDetectionLoop(): void {
    if (this.detectionTimer) {
      clearInterval(this.detectionTimer);
    }

    this.detectionTimer = setInterval(() => {
      void this.runDetectionCycle();
    }, this.detectionIntervalMs);
  }

  private async runDetectionCycle(): Promise<void> {
    if (this.monitoringStopped || this.detectionInProgress) {
      return;
    }

    const video = this.videoRef.nativeElement;
    if (!video || video.readyState < 2) {
      return;
    }

    this.detectionInProgress = true;

    try {
      const [phone, faces, headPose] = await Promise.all([
        this.proctoringService.detectPhone(video),
        this.proctoringService.detectFaces(video),
        this.proctoringService.detectHeadPose(video)
      ]);

      const pendingViolations: Array<{
        type: ViolationType;
        message: string;
        severity: ViolationSeverity;
        metadata?: Record<string, unknown>;
      }> = [];

      if (!faces.noFace && headPose.facePresent) {
        this.lastFaceSeenAt = Date.now();
      }

      if (phone.detected) {
        pendingViolations.push({
          type: 'PHONE_DETECTED',
          message: 'Warning: Phone detected in camera view.',
          severity: 'HIGH',
          metadata: {
            confidence: Number(phone.confidence.toFixed(3))
          }
        });
      }

      if (faces.multiplePeople) {
        pendingViolations.push({
          type: 'MULTIPLE_PEOPLE',
          message: 'Warning: Multiple people detected.',
          severity: 'CRITICAL',
          metadata: {
            faceCount: faces.faceCount
          }
        });
      }

      if (headPose.lookingAway) {
        pendingViolations.push({
          type: 'LOOKING_AWAY',
          message: 'Warning: Please keep your face focused on the screen.',
          severity: 'MEDIUM',
          metadata: {
            yaw: Number(headPose.yaw.toFixed(3)),
            pitch: Number(headPose.pitch.toFixed(3))
          }
        });
      }

      if (headPose.suspiciousMovement) {
        pendingViolations.push({
          type: 'SUSPICIOUS_MOVEMENT',
          message: 'Warning: Suspicious head movement detected.',
          severity: 'MEDIUM',
          metadata: {
            yaw: Number(headPose.yaw.toFixed(3)),
            pitch: Number(headPose.pitch.toFixed(3))
          }
        });
      }

      if (Date.now() - this.lastFaceSeenAt > this.noFaceTimeoutMs) {
        pendingViolations.push({
          type: 'NO_FACE',
          message: 'Warning: No face detected for more than 5 seconds.',
          severity: 'HIGH'
        });
        this.lastFaceSeenAt = Date.now();
      }

      // Emit at most one violation per cycle (highest severity first) to avoid warning storms.
      const severityRank: Record<ViolationSeverity, number> = {
        LOW: 1,
        MEDIUM: 2,
        HIGH: 3,
        CRITICAL: 4
      };
      const candidate = pendingViolations
        .sort((a, b) => severityRank[b.severity] - severityRank[a.severity])[0];

      if (candidate) {
        this.emitViolation(candidate.type, candidate.message, candidate.severity, candidate.metadata);
      }
    } catch (error) {
      console.error('Proctoring detection cycle failed', error);
    } finally {
      this.detectionInProgress = false;
    }
  }

  private handleTabSwitch(): void {
    if (document.hidden) {
      this.emitViolation('TAB_SWITCH', 'Warning: Tab switching is not allowed.', 'HIGH');
    }
  }

  private handleFullscreenExit(): void {
    if (!this.requireFullscreen) {
      return;
    }

    if (!document.fullscreenElement) {
      this.emitViolation('FULLSCREEN_EXIT', 'Warning: Fullscreen mode was exited.', 'HIGH');
    }
  }

  private emitViolation(
    type: ViolationType,
    message: string,
    severity: ViolationSeverity,
    metadata?: Record<string, unknown>
  ): void {
    const now = Date.now();
    const lastSeen = this.lastViolationAt.get(type) ?? 0;
    if (now - lastSeen < this.violationCooldownMs) {
      return;
    }
    this.lastViolationAt.set(type, now);

    const violation: ProctoringViolation = {
      examId: this.examId,
      attemptId: Number.isFinite(this.attemptId) && this.attemptId > 0 ? this.attemptId : null,
      userId: this.userId,
      type,
      severity,
      message,
      metadata,
      timestamp: new Date().toISOString()
    };

    this.violationCount.update((count) => count + 1);
    this.showWarning(message);
    this.violationDetected.emit(violation);

    // Keep reporting even if attempt context is missing so admin monitoring still receives live events.
    if (!this.userId || !this.examId) {
      return;
    }

    this.violationService.reportViolation(violation).subscribe({
      next: (response) => {
        if (response.action === 'AUTO_SUBMIT' || response.action === 'TERMINATE_EXAM') {
          this.backendAction.emit({ violation, response });
        }
      },
      error: (error) => console.error('Violation report failed', error)
    });
  }

  private showWarning(message: string): void {
    this.activeWarning.set(message);
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
    }

    this.warningTimer = setTimeout(() => {
      this.activeWarning.set(null);
      this.warningTimer = null;
    }, 3500);
  }

  private handleDragMove(event: PointerEvent): void {
    if (this.activePointerId !== event.pointerId) {
      return;
    }

    const container = this.containerRef.nativeElement;
    const maxLeft = Math.max(window.innerWidth - container.offsetWidth - 8, 8);
    const maxTop = Math.max(window.innerHeight - container.offsetHeight - 8, 8);
    const nextLeft = this.clamp(event.clientX - this.dragOffsetX, 8, maxLeft);
    const nextTop = this.clamp(event.clientY - this.dragOffsetY, 8, maxTop);

    this.panelLeft.set(`${nextLeft}px`);
    this.panelTop.set(`${nextTop}px`);
  }

  private stopDragging(event: PointerEvent): void {
    if (this.activePointerId !== event.pointerId) {
      return;
    }

    this.activePointerId = null;
    this.isDragging.set(false);
    this.unregisterDragEvents();
  }

  private unregisterDragEvents(): void {
    window.removeEventListener('pointermove', this.pointerMoveHandler);
    window.removeEventListener('pointerup', this.pointerUpHandler);
    window.removeEventListener('pointercancel', this.pointerUpHandler);
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private formatStartupError(error: unknown): string {
    const detail = this.classifyCameraStartupError(error);

    if (detail) {
      return detail;
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return 'Unable to start the camera. Check browser permission settings and try again.';
  }

  private classifyCameraStartupError(error: unknown): string | null {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (
        message.includes('tinyfacedetector') ||
        message.includes('face-api') ||
        message.includes('weights_manifest') ||
        message.includes('404') ||
        message.includes('not found')
      ) {
        return 'Face detection model files could not be loaded. Add TinyFaceDetector files under /src/assets/models/face-api or allow network access to the fallback model host, then retry.';
      }
    }

    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        const rawMessage = error.message.toLowerCase();
        const looksSystemBlocked =
          rawMessage.includes('system') ||
          rawMessage.includes('permission denied by system') ||
          rawMessage.includes('could not start video source');

        if (looksSystemBlocked) {
          return 'Camera access is blocked by Windows or browser privacy settings. Enable camera access for Chrome in system settings, reload the page, then try again.';
        }

        return 'Camera access is blocked for this site. Reset the camera permission in Chrome, allow it again, then retry.';
      }

      if (error.name === 'NotFoundError') {
        return 'No camera was found on this device.';
      }

      if (error.name === 'NotReadableError') {
        return 'The camera is already being used by another application such as Teams, Zoom, Discord, or OBS.';
      }

      if (error.name === 'OverconstrainedError') {
        return 'The requested camera settings are not supported on this device.';
      }
    }

    return null;
  }

  stopMonitoring(): void {
    this.monitoringStopped = true;

    if (this.detectionTimer) {
      clearInterval(this.detectionTimer);
      this.detectionTimer = null;
    }

    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }

    this.unregisterBrowserEvents();

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    this.webcamReady.set(false);
    void this.proctoringService.destroy();
  }
}
