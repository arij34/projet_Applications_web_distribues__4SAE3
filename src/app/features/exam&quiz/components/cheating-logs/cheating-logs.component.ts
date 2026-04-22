import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Subscription, catchError, finalize, map, of } from 'rxjs';
import {
  AdminUserSummary,
  ExamMonitoringSnapshot,
  MonitoringCandidateSnapshot,
  MonitoringEvent
} from '../../models/admin-monitoring.model';
import { Exam } from '../../models/exam.model';
import { AdminMonitoringService } from '../../services/admin-monitoring.service';
import { ExamService } from '../../services/exam.service';
import { ExamSessionService } from '../../services/exam-session.service';
import { UserDirectoryService } from '../../services/user-directory.service';
import { environment } from '../../../../../environments/environment';

interface ExamParticipationDirectoryItem {
  userId: number;
  userFirstName?: string | null;
  userLastName?: string | null;
  userEmail?: string | null;
}

interface NormalizedParticipantDirectoryItem {
  userId: number;
  userFirstName?: string | null;
  userLastName?: string | null;
  userEmail?: string | null;
}

@Component({
  selector: 'app-cheating-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cheating-logs.component.html',
  styleUrls: ['./cheating-logs.component.css']
})
export class CheatingLogsComponent implements OnInit, OnDestroy {
  exams: Exam[] = [];
  selectedExamId: number | null = null;

  snapshot: ExamMonitoringSnapshot | null = null;
  candidateRows: MonitoringCandidateSnapshot[] = [];
  events: MonitoringEvent[] = [];
  filteredCandidateRows: MonitoringCandidateSnapshot[] = [];
  filteredEvents: MonitoringEvent[] = [];

  searchTerm = '';
  sourceFilter = 'all';
  severityFilter = 'all';
  sinceMinutes = 30;
  eventLimit = 25;

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  streamStatus: 'connecting' | 'live' | 'polling' | 'offline' = 'offline';
  generatedAt = '';

  totalCandidates = 0;
  autoSubmittedCount = 0;
  highRiskCount = 0;
  warningCount = 0;

  blockConfirmOpen = false;
  blockConfirmCandidate: MonitoringCandidateSnapshot | null = null;

  private readonly submittingAttempts = new Set<number>();

  private readonly subs = new Subscription();
  private eventSource: EventSource | null = null;
  private snapshotPollId: number | null = null;
  private eventsPollId: number | null = null;
  private reconnectId: number | null = null;

  private readonly userCache = new Map<number, AdminUserSummary | null>();
  private readonly userFetchInFlight = new Set<number>();
  private readonly participantDirectory = new Map<number, ExamParticipationDirectoryItem>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly http: HttpClient,
    private readonly examService: ExamService,
    private readonly monitoringService: AdminMonitoringService,
    private readonly examSessionService: ExamSessionService,
    private readonly userDirectoryService: UserDirectoryService
  ) {}

  ngOnInit(): void {
    this.loadExams();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.stopRealtime();
  }

  loadExams(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.subs.add(this.examService.getExams().subscribe({
      next: (exams) => {
        this.exams = exams;
        const examIdFromQuery = Number(this.route.snapshot.queryParamMap.get('examId') ?? 0);

        const preferredId = examIdFromQuery > 0
          ? examIdFromQuery
          : Number(this.exams[0]?.id ?? 0);

        if (preferredId > 0) {
          this.selectExam(preferredId);
        } else {
          this.isLoading = false;
        }
      },
      error: (error: Error) => {
        this.errorMessage = error.message || 'Failed to load exams';
        this.isLoading = false;
      }
    }));
  }

  selectExam(examId: number): void {
    if (!examId || this.selectedExamId === examId) return;

    this.selectedExamId = examId;
    this.snapshot = null;
    this.events = [];
    this.candidateRows = [];
    this.filteredCandidateRows = [];
    this.filteredEvents = [];
    this.participantDirectory.clear();
    this.errorMessage = '';
    this.successMessage = '';
    this.blockConfirmOpen = false;
    this.blockConfirmCandidate = null;
    this.generatedAt = '';

    this.stopRealtime();
    this.loadParticipantDirectory(examId);
    this.loadActiveCandidates();
    this.loadEvents();
    this.loadSnapshot();
    this.connectStream();
  }

  refreshNow(): void {
    // Manual refresh keeps snapshot fetch available as an explicit fallback path.
    this.loadActiveCandidates();
    this.loadSnapshot();
    this.loadEvents();
  }

  loadActiveCandidates(): void {
    if (!this.selectedExamId) return;

    this.subs.add(this.monitoringService.getActiveCandidates(this.selectedExamId).pipe(
      catchError(() =>
        this.monitoringService.getSnapshot(this.selectedExamId as number).pipe(
          map((snapshot) => snapshot.candidates ?? []),
          catchError(() => of([] as MonitoringCandidateSnapshot[]))
        )
      )
    ).subscribe((candidates) => {
      this.candidateRows = candidates;
      this.computeKpis();
      this.applyFilters();
      this.resolveUsers(candidates.map((candidate) => candidate.userId));
    }));
  }

  loadSnapshot(): void {
    if (!this.selectedExamId) return;

    this.isLoading = true;
    this.subs.add(this.monitoringService.getSnapshot(this.selectedExamId).pipe(
      catchError((error) => {
        this.errorMessage = this.readError(error, 'Failed to load monitoring snapshot');
        this.isLoading = false;
        return of(null);
      })
    ).subscribe((snapshot) => {
      if (!snapshot) return;
      this.consumeSnapshot(snapshot);
      this.isLoading = false;
    }));
  }

  loadEvents(): void {
    if (!this.selectedExamId) return;

    this.subs.add(this.monitoringService
      .getRecentEvents(this.selectedExamId, this.sinceMinutes, this.eventLimit)
      .pipe(catchError(() => of([] as MonitoringEvent[])))
      .subscribe((events) => {
        this.mergeEvents(events);
      }));
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  isAttemptSubmitting(attemptId: number): boolean {
    return this.submittingAttempts.has(attemptId);
  }

  isForceSubmitDisabled(candidate: MonitoringCandidateSnapshot): boolean {
    const status = (candidate.attemptStatus ?? '').toUpperCase();
    return this.isAttemptSubmitting(candidate.attemptId)
      || !!candidate.autoSubmitted
      || status.includes('SUBMIT')
      || status.includes('FINISH');
  }

  blockCandidate(candidate: MonitoringCandidateSnapshot): void {
    if (this.isForceSubmitDisabled(candidate)) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.blockConfirmCandidate = candidate;
    this.blockConfirmOpen = true;
  }

  cancelBlockConfirm(): void {
    this.blockConfirmOpen = false;
    this.blockConfirmCandidate = null;
  }

  confirmBlockCandidate(): void {
    const candidate = this.blockConfirmCandidate;
    if (!candidate || this.isForceSubmitDisabled(candidate)) {
      this.cancelBlockConfirm();
      return;
    }

    this.cancelBlockConfirm();
    this.executeBlockCandidateAutoSubmit(candidate);
  }

  private executeBlockCandidateAutoSubmit(candidate: MonitoringCandidateSnapshot): void {
    if (this.isForceSubmitDisabled(candidate)) {
      return;
    }

    const userLabel = this.getUserLabel(candidate.userId);

    this.errorMessage = '';
    this.successMessage = '';
    this.submittingAttempts.add(candidate.attemptId);

    this.subs.add(
      this.examSessionService.autoSubmit(candidate.attemptId).pipe(
        finalize(() => this.submittingAttempts.delete(candidate.attemptId))
      ).subscribe({
        next: () => {
          this.successMessage = `Candidate blocked and exam submitted for ${userLabel}.`;
          this.refreshNow();
        },
        error: (error: unknown) => {
          this.errorMessage = this.readError(error, `Failed to submit exam for ${userLabel}`);
        }
      })
    );
  }

  getUserLabel(userId: number): string {
    const participation = this.participantDirectory.get(userId);
    if (participation) {
      const fullName = `${participation.userFirstName ?? ''} ${participation.userLastName ?? ''}`.trim();
      if (fullName) {
        return fullName;
      }
      if (participation.userEmail) {
        return participation.userEmail;
      }
    }

    const user = this.userCache.get(userId);
    if (!user) return `User #${userId}`;

    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    if (fullName) return fullName;
    if (user.email) return user.email;

    return `User #${userId}`;
  }

  getUserEmail(userId: number): string | null {
    return this.participantDirectory.get(userId)?.userEmail ?? this.userCache.get(userId)?.email ?? null;
  }

  severityClass(severity?: string | null): string {
    const value = (severity ?? '').toUpperCase();
    if (value === 'CRITICAL' || value === 'HIGH') return 'sev-high';
    if (value === 'MEDIUM') return 'sev-medium';
    return 'sev-low';
  }

  sourceClass(source: string): string {
    return source === 'VIOLATION' ? 'source-violation' : 'source-log';
  }

  formatDateTime(value?: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString();
  }

  formatRelative(value?: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
    if (diffSec < 60) return `${diffSec}s ago`;

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;

    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;

    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  }

  candidateStatusClass(status?: string | null): string {
    const value = (status ?? '').toUpperCase();
    if (value.includes('SUBMIT') || value.includes('FINISH')) return 'status-finished';
    if (value.includes('IN_PROGRESS') || value.includes('ACTIVE')) return 'status-active';
    return 'status-idle';
  }

  riskClass(score?: number | null): string {
    const value = Number(score ?? 0);
    if (value >= 8) return 'risk-high';
    if (value >= 4) return 'risk-medium';
    return 'risk-low';
  }

  private consumeSnapshot(snapshot: ExamMonitoringSnapshot): void {
    this.snapshot = snapshot;
    this.generatedAt = snapshot.generatedAt ?? new Date().toISOString();
    this.candidateRows = snapshot.candidates ?? [];
    this.computeKpis();
    this.applyFilters();

    const eventSeed = [
      ...(snapshot.recentEvents ?? []),
      ...this.candidateRows.flatMap((candidate) => candidate.recentEvents ?? [])
    ];
    this.mergeEvents(eventSeed);
    this.resolveUsers(this.candidateRows.map((candidate) => candidate.userId));
  }

  private computeKpis(): void {
    this.totalCandidates = this.candidateRows.length;
    this.autoSubmittedCount = this.candidateRows.filter((candidate) => !!candidate.autoSubmitted).length;
    this.highRiskCount = this.candidateRows.filter((candidate) => Number(candidate.suspiciousScore ?? 0) >= 8).length;
    this.warningCount = this.candidateRows.filter((candidate) => !!candidate.lastWarningType).length;
  }

  private applyFilters(): void {
    const q = this.searchTerm.trim().toLowerCase();

    this.filteredCandidateRows = this.candidateRows.filter((candidate) => {
      if (!q) return true;
      const label = this.getUserLabel(candidate.userId).toLowerCase();
      return (
        label.includes(q)
        || String(candidate.userId).includes(q)
        || String(candidate.attemptId).includes(q)
        || String(candidate.attemptStatus ?? '').toLowerCase().includes(q)
      );
    });

    this.filteredEvents = this.events.filter((event) => {
      const sourceOk = this.sourceFilter === 'all' || event.source === this.sourceFilter;
      const sev = (event.severity ?? 'UNKNOWN').toUpperCase();
      const severityOk = this.severityFilter === 'all' || sev === this.severityFilter;
      const searchOk = !q
        || this.getUserLabel(event.userId).toLowerCase().includes(q)
        || String(event.userId).includes(q)
        || String(event.attemptId).includes(q)
        || String(event.type ?? '').toLowerCase().includes(q)
        || String(event.details ?? '').toLowerCase().includes(q);

      return sourceOk && severityOk && searchOk;
    });
  }

  private mergeEvents(incoming: MonitoringEvent[]): void {
    if (!incoming.length) {
      this.applyFilters();
      return;
    }

    const key = (event: MonitoringEvent) => [
      event.source,
      event.examId,
      event.attemptId,
      event.userId,
      event.type,
      event.timestamp
    ].join('|');

    const merged = new Map<string, MonitoringEvent>();
    for (const event of this.events) merged.set(key(event), event);
    for (const event of incoming) merged.set(key(event), event);

    this.events = Array.from(merged.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, Math.max(50, this.eventLimit * 3));

    this.resolveUsers(this.events.map((event) => event.userId));
    this.applyFilters();
  }

  private loadParticipantDirectory(examId: number): void {
    const endpoint = `${environment.apiBaseUrl}/api/exam-participations/exam/${examId}`;
    this.subs.add(
      this.http.get<unknown>(endpoint).pipe(
        map((payload) => this.normalizeParticipantDirectoryRows(payload)),
        catchError(() => of([] as NormalizedParticipantDirectoryItem[]))
      ).subscribe((rows) => {
        this.participantDirectory.clear();
        for (const row of rows) {
          const userId = Number(row.userId ?? 0);
          if (!Number.isFinite(userId) || userId <= 0) {
            continue;
          }
          this.participantDirectory.set(userId, row);
        }
        this.applyFilters();
      })
    );
  }

  private normalizeParticipantDirectoryRows(payload: unknown): NormalizedParticipantDirectoryItem[] {
    let rows: unknown[] = [];
    if (Array.isArray(payload)) {
      rows = payload;
    } else if (payload && typeof payload === 'object') {
      const record = payload as Record<string, unknown>;
      if (Array.isArray(record['content'])) {
        rows = record['content'] as unknown[];
      } else if (Array.isArray(record['data'])) {
        rows = record['data'] as unknown[];
      } else if (Array.isArray(record['items'])) {
        rows = record['items'] as unknown[];
      }
    }

    if (!rows.length) {
      return [];
    }

    const normalized: NormalizedParticipantDirectoryItem[] = [];
    for (const row of rows) {
      const item = this.normalizeParticipantRow(row);
      if (item) {
        normalized.push(item);
      }
    }

    return normalized;
  }

  private normalizeParticipantRow(row: unknown): NormalizedParticipantDirectoryItem | null {
    if (!row || typeof row !== 'object') {
      return null;
    }

    const dto = row as Record<string, unknown>;
    const nestedUser = (dto['user'] && typeof dto['user'] === 'object')
      ? (dto['user'] as Record<string, unknown>)
      : null;

    const userId = this.readNumeric(dto, ['userId', 'id', 'participantId', 'candidateId'])
      ?? this.readNumeric(nestedUser, ['id', 'userId']);

    if (!userId || userId <= 0) {
      return null;
    }

    const userFirstName = this.readText(dto, ['userFirstName', 'firstName', 'firstname', 'givenName'])
      ?? this.readText(nestedUser, ['firstName', 'firstname', 'givenName', 'name']);

    const userLastName = this.readText(dto, ['userLastName', 'lastName', 'lastname', 'familyName'])
      ?? this.readText(nestedUser, ['lastName', 'lastname', 'familyName']);

    const userEmail = this.readText(dto, ['userEmail', 'email', 'mail', 'username'])
      ?? this.readText(nestedUser, ['email', 'mail', 'username']);

    return {
      userId,
      userFirstName,
      userLastName,
      userEmail
    };
  }

  private readText(source: Record<string, unknown> | null, keys: string[]): string | null {
    if (!source) {
      return null;
    }

    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }

    return null;
  }

  private readNumeric(source: Record<string, unknown> | null, keys: string[]): number | null {
    if (!source) {
      return null;
    }

    for (const key of keys) {
      const value = Number(source[key]);
      if (Number.isFinite(value) && value > 0) {
        return value;
      }
    }

    return null;
  }

  private resolveUsers(userIds: number[]): void {
    const uniqueIds = Array.from(new Set(userIds.filter((id) => !!id)));
    for (const userId of uniqueIds) {
      if (this.userCache.has(userId) || this.userFetchInFlight.has(userId)) continue;

      this.userFetchInFlight.add(userId);
      this.subs.add(this.userDirectoryService.getUserById(userId).subscribe((user) => {
        this.userCache.set(userId, user);
        this.userFetchInFlight.delete(userId);
        this.applyFilters();
      }));
    }
  }

  private connectStream(): void {
    if (!this.selectedExamId) return;

    this.streamStatus = 'connecting';
    // Keep credentials disabled for SSE so wildcard CORS backends can stream.
    this.eventSource = new EventSource(this.monitoringService.getStreamUrl(this.selectedExamId));

    this.eventSource.addEventListener('snapshot', (rawEvent: Event) => {
      const message = rawEvent as MessageEvent<string>;
      this.onStreamSnapshot(message.data);
    });

    this.eventSource.onmessage = (message: MessageEvent<string>) => {
      this.onStreamSnapshot(message.data);
    };

    this.eventSource.onopen = () => {
      this.streamStatus = 'live';
      this.stopPolling();
      if (this.reconnectId !== null) {
        window.clearTimeout(this.reconnectId);
        this.reconnectId = null;
      }
    };

    this.eventSource.onerror = () => {
      this.streamStatus = 'polling';
      this.stopStreamOnly();
      this.startPolling();

      if (this.reconnectId === null) {
        this.reconnectId = window.setTimeout(() => {
          this.reconnectId = null;
          if (this.selectedExamId) this.connectStream();
        }, 10000);
      }
    };
  }

  private onStreamSnapshot(data: string): void {
    try {
      const snapshot = JSON.parse(data) as ExamMonitoringSnapshot;
      this.consumeSnapshot(snapshot);
      this.streamStatus = 'live';
      this.stopPolling();
      this.errorMessage = '';
    } catch {
      this.streamStatus = 'polling';
      this.startPolling();
    }
  }

  private startPolling(): void {
    if (this.snapshotPollId !== null || this.eventsPollId !== null) return;

    this.snapshotPollId = window.setInterval(() => {
      this.loadSnapshot();
    }, 5000);

    this.eventsPollId = window.setInterval(() => {
      this.loadEvents();
    }, 8000);
  }

  private stopPolling(): void {
    if (this.snapshotPollId !== null) {
      window.clearInterval(this.snapshotPollId);
      this.snapshotPollId = null;
    }

    if (this.eventsPollId !== null) {
      window.clearInterval(this.eventsPollId);
      this.eventsPollId = null;
    }
  }

  private stopStreamOnly(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  private stopRealtime(): void {
    this.stopStreamOnly();
    this.stopPolling();
    if (this.reconnectId !== null) {
      window.clearTimeout(this.reconnectId);
      this.reconnectId = null;
    }
    this.streamStatus = 'offline';
  }

  private readError(error: unknown, fallback: string): string {
    const maybe = error as { error?: { message?: string }; message?: string };
    return maybe?.error?.message || maybe?.message || fallback;
  }
}
