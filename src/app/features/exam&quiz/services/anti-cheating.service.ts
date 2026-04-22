import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpBackend, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, interval, Observable, of, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

export interface CheatingEvent {
  attemptId: number;
  eventType: string;
  details: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: number;
}

export interface DeviceFingerprint {
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  userAgent: string;
  plugins: string;
}

export interface ExamSessionConfig {
  attemptId: number;
  sessionToken: string;
  examId: number;
  userId: number;
  durationMinutes: number;
  startTime: number;
  expectedEndTime: number;
}

@Injectable({
  providedIn: 'root'
})
export class AntiCheatingService {
  private readonly apiUrl = 'http://localhost:8150/api';
  
  // Configuration
  private cheatingThreshold = 5.0; 
  private tabSwitchDebounce = 500; // ms
  private ipCheckInterval = 30000; // ms (every 30 seconds)
  private deviceCheckInterval = 60000; // ms (every 60 seconds)
  
  // Session data
  private currentSessionToken$ = new BehaviorSubject<string | null>(null);
  private currentAttemptId$ = new BehaviorSubject<number | null>(null);
  private currentIpAddress$ = new BehaviorSubject<string | null>(null);
  private currentDeviceFingerprint$ = new BehaviorSubject<DeviceFingerprint | null>(null);
  
  // Cheating events tracking
  private cheatingEvents: CheatingEvent[] = [];
  private cheatingEventsSubject$ = new BehaviorSubject<CheatingEvent[]>([]);
  
  // Suspicious activity score
  private suspiciousScore = signal(0);
  
  // Current fullscreen status
  private isFullscreen = false;
  private fullscreenCheckInterval: any;
  private ipValidationInterval: any;
  private deviceValidationInterval: any;

  // Session start time — used for the termination grace period
  private sessionStartTime = 0;

  // Tab switch tracking
  private lastActiveTab = true;
  
  // Page visibility tracking
  private documentHiddenListener: any;

  // Tracked anonymous listeners so they can be properly removed
  private blurListener: any;
  private copyListener: any;
  private pasteListener: any;
  private cutListener: any;
  private beforeUnloadListener: any;
  private fsChangeListener: any;
  private fsChangeListenerWebkit: any;

  // Keyboard shortcut tracking
  private keydownListener: any;

  // Separate HttpClient that bypasses all interceptors (including Keycloak).
  // Used exclusively for external IP-lookup so CORS preflight is not triggered.
  private readonly httpNoAuth: HttpClient;

  constructor(private http: HttpClient, handler: HttpBackend) {
    this.httpNoAuth = new HttpClient(handler);
    this.initializeDeviceFingerprint();
  }

  /**
   * Generate device fingerprint
   */
  private initializeDeviceFingerprint(): void {
    const fingerprint: DeviceFingerprint = {
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      plugins: Array.from(navigator.plugins).map(p => p.name).join(',')
    };
    
    this.currentDeviceFingerprint$.next(fingerprint);
  }

  /**
   * Get device fingerprint as string
   */
  getDeviceFingerprintString(): string {
    const fp = this.currentDeviceFingerprint$.value;
    if (!fp) return '';
    return btoa(JSON.stringify(fp));
  }

  /**
   * Fetch current user's IP address
   */
  async getUserIpAddress(): Promise<string> {
    try {
      // Using popular IP detection API
      // Use httpNoAuth (bypasses Keycloak interceptor) to avoid CORS preflight failure.
      const response = await this.httpNoAuth.get<{ip: string}>('https://api.ipify.org?format=json')
        .pipe(
          map(r => r.ip),
          catchError(() => of('127.0.0.1'))
        ).toPromise();
      
      return response || '127.0.0.1';
    } catch {
      return '127.0.0.1';
    }
  }

  /**
   * Start exam session - initialize anti-cheating monitoring
   */
  startExamSession(config: ExamSessionConfig): void {
    // Stop any previous session cleanly before starting a new one.
    this.stopExamMonitoring();

    this.currentSessionToken$.next(config.sessionToken);
    this.currentAttemptId$.next(config.attemptId);
    this.suspiciousScore.set(0);
    this.sessionStartTime = Date.now();

    // Start all monitoring
    this.startFullscreenMonitoring();
    this.startTabSwitchMonitoring();
    this.startCopyPasteBlocking();
    this.startRightClickBlocking();
    this.startKeyboardShortcutBlocking();
    this.startPageRefreshDetection();
    this.startPeriodicIpValidation();
    this.startPeriodicDeviceValidation();
  }

  /**
   * Force fullscreen mode
   */
  async enterFullscreen(): Promise<void> {
    try {
      const elem = document.documentElement;
      
      // Use the appropriate fullscreen API
      const requestFullscreen = elem.requestFullscreen || 
        (elem as any).webkitRequestFullscreen || 
        (elem as any).mozRequestFullScreen || 
        (elem as any).msRequestFullscreen;
      
      if (requestFullscreen) {
        await requestFullscreen.call(elem);
        this.isFullscreen = true;
      }
    } catch (error) {
      console.error('Unable to enter fullscreen:', error);
    }
  }

  /**
   * Start monitoring fullscreen status
   */
  private startFullscreenMonitoring(): void {
    // Check for fullscreen exit event
    this.fsChangeListener = () => {
      if (!document.fullscreenElement && this.isFullscreen) {
        this.isFullscreen = false;
        this.recordCheatingEvent({
          attemptId: this.currentAttemptId$.value || 0,
          eventType: 'FULLSCREEN_EXIT',
          details: 'User exited fullscreen mode',
          severity: 'HIGH',
          timestamp: Date.now()
        });
      }
    };
    document.addEventListener('fullscreenchange', this.fsChangeListener);

    // Polyfill for other browsers
    this.fsChangeListenerWebkit = () => {
      if (!(document as any).webkitFullscreenElement && this.isFullscreen) {
        this.isFullscreen = false;
        this.recordCheatingEvent({
          attemptId: this.currentAttemptId$.value || 0,
          eventType: 'FULLSCREEN_EXIT',
          details: 'User exited fullscreen mode (webkit)',
          severity: 'HIGH',
          timestamp: Date.now()
        });
      }
    };
    document.addEventListener('webkitfullscreenchange', this.fsChangeListenerWebkit);

    // Periodic check
    this.fullscreenCheckInterval = setInterval(() => {
      if (!document.fullscreenElement && !( document as any).webkitFullscreenElement && this.isFullscreen) {
        this.isFullscreen = false;
        this.recordCheatingEvent({
          attemptId: this.currentAttemptId$.value || 0,
          eventType: 'FULLSCREEN_EXIT',
          details: 'Fullscreen mode was exited',
          severity: 'HIGH',
          timestamp: Date.now()
        });
      }
    }, 1000);
  }

  /**
   * Start monitoring tab switches
   */
  private startTabSwitchMonitoring(): void {
    this.documentHiddenListener = () => {
      if (document.hidden) {
        // Tab is hidden/switched away
        this.lastActiveTab = false;
        this.recordCheatingEvent({
          attemptId: this.currentAttemptId$.value || 0,
          eventType: 'TAB_SWITCH',
          details: 'User switched to another tab',
          severity: 'HIGH',
          timestamp: Date.now()
        });
      } else if (!this.lastActiveTab) {
        // Tab became visible again
        this.lastActiveTab = true;
      }
    };

    document.addEventListener('visibilitychange', this.documentHiddenListener);

    // Also monitor window blur/focus
    this.blurListener = () => {
      this.recordCheatingEvent({
        attemptId: this.currentAttemptId$.value || 0,
        eventType: 'WINDOW_BLUR',
        details: 'Browser window lost focus',
        severity: 'MEDIUM',
        timestamp: Date.now()
      });
    };
    window.addEventListener('blur', this.blurListener);
  }

  /**
   * Block copy functionality
   */
  private startCopyPasteBlocking(): void {
    this.copyListener = (e: Event) => {
      e.preventDefault();
      this.recordCheatingEvent({
        attemptId: this.currentAttemptId$.value || 0,
        eventType: 'COPY_PASTE',
        details: 'User attempted to copy text',
        severity: 'HIGH',
        timestamp: Date.now()
      });
    };
    document.addEventListener('copy', this.copyListener);

    this.pasteListener = (e: Event) => {
      e.preventDefault();
      this.recordCheatingEvent({
        attemptId: this.currentAttemptId$.value || 0,
        eventType: 'COPY_PASTE',
        details: 'User attempted to paste text',
        severity: 'HIGH',
        timestamp: Date.now()
      });
    };
    document.addEventListener('paste', this.pasteListener);

    this.cutListener = (e: Event) => {
      e.preventDefault();
      this.recordCheatingEvent({
        attemptId: this.currentAttemptId$.value || 0,
        eventType: 'COPY_PASTE',
        details: 'User attempted to cut text',
        severity: 'HIGH',
        timestamp: Date.now()
      });
    };
    document.addEventListener('cut', this.cutListener);
  }

  /**
   * Block right-click context menu
   */
  private startRightClickBlocking(): void {
    // DEV MODE: right-click temporarily allowed for debugging.
    // document.addEventListener('contextmenu', (e) => {
    //   e.preventDefault();
    //   this.recordCheatingEvent({
    //     attemptId: this.currentAttemptId$.value || 0,
    //     eventType: 'RIGHT_CLICK',
    //     details: 'User attempted right-click',
    //     severity: 'LOW',
    //     timestamp: Date.now()
    //   });
    //   return false;
    // });
  }

  /**
   * Block dangerous keyboard shortcuts
   */
  private startKeyboardShortcutBlocking(): void {
    this.keydownListener = (e: KeyboardEvent) => {
      // Detect common cheating shortcuts
      // DEV MODE: F12 / Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C allowed for debugging.
      if (
        (e.ctrlKey || e.metaKey) && e.key === 'c' || // Ctrl+C
        (e.ctrlKey || e.metaKey) && e.key === 'v' || // Ctrl+V
        (e.ctrlKey || e.metaKey) && e.key === 'x' || // Ctrl+X
        (e.ctrlKey || e.metaKey) && e.key === 'a' || // Ctrl+A
        // e.key === 'F12' || // DEV: temporarily allowed
        e.altKey && e.key === 'Tab' // Alt+Tab
        // e.ctrlKey && e.shiftKey && e.key === 'I' || // DEV: temporarily allowed
        // e.ctrlKey && e.shiftKey && e.key === 'J' || // DEV: temporarily allowed
        // e.ctrlKey && e.shiftKey && e.key === 'C'    // DEV: temporarily allowed
      ) {
        e.preventDefault();
        
        let shortcutName = 'Unknown shortcut';
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') shortcutName = 'Ctrl+C';
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') shortcutName = 'Ctrl+V';
        if (e.altKey && e.key === 'Tab') shortcutName = 'Alt+Tab';

        this.recordCheatingEvent({
          attemptId: this.currentAttemptId$.value || 0,
          eventType: 'KEYBOARD_SHORTCUT',
          details: `User attempted ${shortcutName}`,
          severity: 'HIGH',
          timestamp: Date.now()
        });

        return false;
      }

      return true;
    };

    document.addEventListener('keydown', this.keydownListener);
  }

  /**
   * Detect page refresh attempts
   */
  private startPageRefreshDetection(): void {
    this.beforeUnloadListener = (e: BeforeUnloadEvent) => {
      this.recordCheatingEvent({
        attemptId: this.currentAttemptId$.value || 0,
        eventType: 'PAGE_REFRESH',
        details: 'User attempted to refresh page',
        severity: 'MEDIUM',
        timestamp: Date.now()
      });

      // Prevent navigation
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', this.beforeUnloadListener);
  }

  /**
   * Periodically validate IP address
   */
  private startPeriodicIpValidation(): void {
    this.ipValidationInterval = setInterval(async () => {
      if (!this.currentSessionToken$.value || !this.currentAttemptId$.value) return;

      try {
        const currentIp = await this.getUserIpAddress();
        if (this.currentIpAddress$.value && currentIp !== this.currentIpAddress$.value) {
          this.recordCheatingEvent({
            attemptId: this.currentAttemptId$.value || 0,
            eventType: 'IP_CHANGED',
            details: `IP changed from ${this.currentIpAddress$.value} to ${currentIp}`,
            severity: 'HIGH',
            timestamp: Date.now()
          });
        }
        this.currentIpAddress$.next(currentIp);
      } catch (error) {
        console.error('Error checking IP address:', error);
      }
    }, this.ipCheckInterval);
  }

  /**
   * Periodically validate device fingerprint
   */
  private startPeriodicDeviceValidation(): void {
    this.deviceValidationInterval = setInterval(() => {
      if (!this.currentSessionToken$.value || !this.currentAttemptId$.value) return;

      const currentFingerprint = this.getDeviceFingerprintString();
      const storedFingerprint = this.currentDeviceFingerprint$.value
        ? btoa(JSON.stringify(this.currentDeviceFingerprint$.value))
        : null;

      if (storedFingerprint && currentFingerprint !== storedFingerprint) {
        this.recordCheatingEvent({
          attemptId: this.currentAttemptId$.value || 0,
          eventType: 'DEVICE_CHANGED',
          details: 'Device fingerprint changed during exam',
          severity: 'HIGH',
          timestamp: Date.now()
        });
      }
    }, this.deviceCheckInterval);
  }

  /**
   * Record a cheating event to backend
   */
  recordCheatingEvent(event: CheatingEvent): void {
    // Add to local log
    this.cheatingEvents.push(event);
    this.cheatingEventsSubject$.next([...this.cheatingEvents]);

    // Update suspicious score
    const currentScore = this.suspiciousScore();
    let scoreIncrease = 1;

    switch (event.severity) {
      case 'LOW':
        scoreIncrease = 0.5;
        break;
      case 'MEDIUM':
        scoreIncrease = 1.5;
        break;
      case 'HIGH':
        scoreIncrease = 3;
        break;
    }

    // Special event type multipliers
    if (event.eventType === 'COPY_PASTE' || event.eventType === 'IP_CHANGED' || event.eventType === 'DEVICE_CHANGED') {
      scoreIncrease *= 1.5;
    }

    this.suspiciousScore.set(currentScore + scoreIncrease);

    // Send to backend asynchronously (don't block UI)
    this.sendCheatingEventToBackend(event).subscribe();
  }

  /**
   * Send cheating event to backend
   */
  private sendCheatingEventToBackend(event: CheatingEvent): Observable<any> {
    const sessionToken = this.currentSessionToken$.value;
    if (!sessionToken || !event.attemptId || event.attemptId <= 0) {
      return of(null);
    }

    const ipAddress = this.currentIpAddress$.value || 'unknown';
    const deviceFingerprint = this.getDeviceFingerprintString();

    const payload = {
      attemptId: event.attemptId,
      eventType: event.eventType,
      details: event.details,
      severity: event.severity,
      sessionToken,
      ipAddress,
      deviceFingerprint
    };

    return this.http.post(`${this.apiUrl}/exam-sessions/report-event`, payload).pipe(
      catchError(() => {
        // Backend unavailable or session not registered — silently ignore.
        return of(null);
      })
    );
  }

  /**
   * Save answer with auto-save capability
   */
  saveAnswer(attemptId: number, questionId: number, answerText: string, timeTakenSeconds: number): Observable<any> {
    const sessionToken = this.currentSessionToken$.value;
    if (!sessionToken || !attemptId || attemptId <= 0) {
      return of(null);
    }

    const ipAddress = this.currentIpAddress$.value || 'unknown';
    const deviceFingerprint = this.getDeviceFingerprintString();

    const payload = {
      attemptId,
      questionId,
      answerText,
      timeTakenSeconds,
      sessionToken,
      ipAddress,
      deviceFingerprint
    };

    return this.http.post(`${this.apiUrl}/exam-sessions/save-answer`, payload).pipe(
      catchError(error => {
        console.error('Error saving answer:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get current suspicious score
   */
  getSuspiciousScore(): number {
    return this.suspiciousScore();
  }

  /**
   * Get all recorded cheating events
   */
  getCheatingEvents(): CheatingEvent[] {
    return [...this.cheatingEvents];
  }

  /**
   * Stop all monitoring (when exam ends)
   */
  stopExamMonitoring(): void {
    // Remove all tracked event listeners
    if (this.documentHiddenListener) {
      document.removeEventListener('visibilitychange', this.documentHiddenListener);
      this.documentHiddenListener = null;
    }
    if (this.keydownListener) {
      document.removeEventListener('keydown', this.keydownListener);
      this.keydownListener = null;
    }
    if (this.blurListener) {
      window.removeEventListener('blur', this.blurListener);
      this.blurListener = null;
    }
    if (this.copyListener) {
      document.removeEventListener('copy', this.copyListener);
      this.copyListener = null;
    }
    if (this.pasteListener) {
      document.removeEventListener('paste', this.pasteListener);
      this.pasteListener = null;
    }
    if (this.cutListener) {
      document.removeEventListener('cut', this.cutListener);
      this.cutListener = null;
    }
    if (this.beforeUnloadListener) {
      window.removeEventListener('beforeunload', this.beforeUnloadListener);
      this.beforeUnloadListener = null;
    }
    if (this.fsChangeListener) {
      document.removeEventListener('fullscreenchange', this.fsChangeListener);
      this.fsChangeListener = null;
    }
    if (this.fsChangeListenerWebkit) {
      document.removeEventListener('webkitfullscreenchange', this.fsChangeListenerWebkit);
      this.fsChangeListenerWebkit = null;
    }

    // Clear all intervals
    if (this.fullscreenCheckInterval) {
      clearInterval(this.fullscreenCheckInterval);
      this.fullscreenCheckInterval = null;
    }
    if (this.ipValidationInterval) {
      clearInterval(this.ipValidationInterval);
      this.ipValidationInterval = null;
    }
    if (this.deviceValidationInterval) {
      clearInterval(this.deviceValidationInterval);
      this.deviceValidationInterval = null;
    }

    // Reset score and session data
    this.suspiciousScore.set(0);
    this.currentSessionToken$.next(null);
    this.currentAttemptId$.next(null);
    this.cheatingEvents = [];
  }

  /**
   * Exit fullscreen mode
   */
  exitFullscreen(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }

  /**
   * Get session token
   */
  getSessionToken(): string | null {
    return this.currentSessionToken$.value;
  }

  /**
   * Check if user IP is accessible (for debugging/admin)
   */
  getCurrentIpAddress(): string | null {
    return this.currentIpAddress$.value;
  }
}
