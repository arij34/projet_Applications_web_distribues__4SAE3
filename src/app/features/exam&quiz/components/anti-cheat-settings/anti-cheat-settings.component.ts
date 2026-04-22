import { Component, Input, Output, EventEmitter, signal, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AntiCheatConfig } from '../exam.model';

type ToggleSettingKey =
  | 'requireFullscreen'
  | 'preventCopyPaste'
  | 'preventTabSwitch'
  | 'autoSubmitOnTabSwitch'
  | 'requireWebcam'
  | 'ipRestriction'
  | 'oneAttemptPerUser'
  | 'deviceFingerprintRequired'
  | 'enableSecureSessionToken'
  | 'enableDeviceFingerprinting'
  | 'autoSubmitOnHighScore'
  | 'detectScreenRecording'
  | 'detectVpnProxy';

interface SettingRow {
  key: ToggleSettingKey;
  label: string;
  description: string;
  icon: string;
}

const DEFAULT_ANTI_CHEAT_CONFIG: AntiCheatConfig = {
  requireFullscreen: false,
  preventCopyPaste: false,
  preventTabSwitch: false,
  autoSubmitOnTabSwitch: false,
  requireWebcam: false,
  ipRestriction: false,
  oneAttemptPerUser: false,
  deviceFingerprintRequired: false,
  enableSecureSessionToken: true,
  enableDeviceFingerprinting: true,
  suspiciousScoreThreshold: 12,
  autoSubmitOnHighScore: true,
  strictnessLevel: 'MEDIUM',
  detectScreenRecording: false,
  detectVpnProxy: false,
  minutesBetweenAttempts: 0,
};

@Component({
  selector: 'app-anti-cheat-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './anti-cheat-settings.component.html',
  styleUrls: ['./anti-cheat-settings.component.scss'],
})
export class AntiCheatSettingsComponent implements OnChanges {
  @Input({ required: true }) config!: AntiCheatConfig;
  @Output() configSaved = new EventEmitter<AntiCheatConfig>();

  local = signal<AntiCheatConfig>({ ...DEFAULT_ANTI_CHEAT_CONFIG });

  rows: SettingRow[] = [
    { key: 'requireFullscreen', label: 'Require fullscreen mode', description: 'Forces browser into fullscreen during the exam', icon: 'M2 3a1 1 0 011-1h4M21 3h-4M2 21h4M21 21h-4M2 9v6M22 9v6M9 2v0M15 2v0M9 22v0M15 22v0' },
    { key: 'preventCopyPaste', label: 'Prevent copy / paste', description: 'Disables clipboard access during the session', icon: 'M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2' },
    { key: 'preventTabSwitch', label: 'Prevent tab switching', description: 'Detects and flags focus-loss events', icon: 'M3 3h18v18H3zM3 9h18M9 21V9' },
    { key: 'autoSubmitOnTabSwitch', label: 'Auto-submit on tab switch', description: 'Submits exam automatically when focus is lost', icon: 'M5 12h14M13 6l6 6-6 6' },
    { key: 'requireWebcam', label: 'Require webcam monitoring', description: 'Records video feed throughout the exam', icon: 'M15 10l4.553-2.069A1 1 0 0121 8.847v6.306a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z' },
    { key: 'ipRestriction', label: 'Enable IP address restriction', description: 'Limits access to approved networks only', icon: 'M12 2a10 10 0 100 20A10 10 0 0012 2zM2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20' },
    { key: 'oneAttemptPerUser', label: 'Allow only one attempt per user', description: 'Prevents re-taking regardless of max attempts', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
    { key: 'deviceFingerprintRequired', label: 'Require device fingerprint verification', description: 'Blocks exam start if fingerprint cannot be validated', icon: 'M12 1a11 11 0 1011 11A11 11 0 0012 1zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0z' },
    { key: 'enableSecureSessionToken', label: 'Enable secure session token', description: 'Validates token on each security event', icon: 'M12 2l7 4v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-4z' },
    { key: 'enableDeviceFingerprinting', label: 'Enable device fingerprinting checks', description: 'Tracks fingerprint consistency while taking the exam', icon: 'M4 4h16v16H4zM8 8h8v8H8z' },
    { key: 'autoSubmitOnHighScore', label: 'Auto-submit on high suspicious score', description: 'Submits automatically when suspicious score exceeds threshold', icon: 'M12 2v20M2 12h20' },
    { key: 'detectScreenRecording', label: 'Detect possible screen recording', description: 'Raises security events when recording patterns are detected', icon: 'M3 7h12v10H3zM15 10l6-3v10l-6-3' },
    { key: 'detectVpnProxy', label: 'Detect VPN / Proxy usage', description: 'Flags traffic from anonymized or relay networks', icon: 'M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2c3 3 3 15 0 20M12 2c-3 3-3 15 0 20' },
  ];

  ngOnChanges(): void {
    this.local.set({ ...DEFAULT_ANTI_CHEAT_CONFIG, ...this.config });
  }

  toggle(key: ToggleSettingKey): void {
    this.local.update(c => ({ ...c, [key]: !c[key] }));
  }

  onThresholdChanged(value: string): void {
    this.local.update(c => ({ ...c, suspiciousScoreThreshold: Number(value || 0) }));
  }

  onMinutesChanged(value: string): void {
    this.local.update(c => ({ ...c, minutesBetweenAttempts: Number(value || 0) }));
  }

  onStrictnessChanged(value: string): void {
    const normalized = (value === 'LOW' || value === 'HIGH') ? value : 'MEDIUM';
    this.local.update(c => ({ ...c, strictnessLevel: normalized }));
  }

  onSave(): void { this.configSaved.emit(this.local()); }
}
