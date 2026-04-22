import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { MatchingAdminViewComponent } from './MatchingAdminViewComponent';
import { AdminMatchingService } from '../../../../../../core/services/skill/admin-matching.service';
import { AdminMatchingRow } from '../../../../../../core/models/skill/admin-matching.model';
import { AdminInvitation } from '../../../../../../core/models/skill/admin-invitation.model';
import { AdminMatchingStats } from '../../../../../../core/models/skill/admin-matching-stats.model';

class MockAdminMatchingService {
  getAllMatchings() {
    const rows: AdminMatchingRow[] = [
      {
        id: 1,
        projectId: 10,
        freelancerId: 100,
        scoreSkills: 90,
        scoreExperience: 80,
        scoreEducation: 70,
        scoreAvailability: 60,
        scoreFinal: 85,
        status: 'CALCULATED'
      }
    ];
    return of(rows);
  }

  getAllInvitations() {
    const invs: AdminInvitation[] = [
      {
        id: 1,
        projectId: 10,
        freelancerId: 100,
        status: 'PENDING',
        createdAt: '2026-04-15T10:00:00',
        trashedAt: undefined
      }
    ];
    return of(invs);
  }

  getGlobalStats() {
    const stats: AdminMatchingStats = {
      totalInvitations: 5,
      pendingInvitations: 2,
      acceptedInvitations: 2,
      declinedInvitations: 1,
      trashInvitations: 0,
      totalMatchings: 3,
      avgFinalScore: 80,
      maxFinalScore: 95,
      minFinalScore: 60
    };
    return of(stats);
  }
}

describe('MatchingAdminViewComponent', () => {
  let component: MatchingAdminViewComponent;
  let fixture: ComponentFixture<MatchingAdminViewComponent>;
  let service: AdminMatchingService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MatchingAdminViewComponent],
      providers: [
        { provide: AdminMatchingService, useClass: MockAdminMatchingService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MatchingAdminViewComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(AdminMatchingService);
    fixture.detectChanges(); // ngOnInit -> loadStats + loadMatchings
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load stats and matchings on init', () => {
    expect(component.stats).toBeTruthy();
    expect(component.stats?.totalInvitations).toBe(5);

    expect(component.matchings.length).toBe(1);
    expect(component.matchings[0].projectId).toBe(10);
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe('');
  });

  it('should switch subtabs and load invitations when needed', () => {
    // au début: matching tab
    expect(component.activeSubTab).toBe('matching');
    expect(component.matchings.length).toBe(1);
    expect(component.invitations.length).toBe(0);

    component.switchSubTab('invitations');
    expect(component.activeSubTab).toBe('invitations');
    expect(component.invitations.length).toBe(1);

    component.switchSubTab('matching');
    expect(component.activeSubTab).toBe('matching');
  });

  it('should handle error in loadMatchings', () => {
    const spy = spyOn(service, 'getAllMatchings').and.returnValue(
      throwError(() => new Error('Backend error'))
    );

    component.loadMatchings();

    expect(spy).toHaveBeenCalled();
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe('Erreur lors du chargement du tableau Matching.');
  });

  it('should handle error in loadInvitations', () => {
    const spy = spyOn(service, 'getAllInvitations').and.returnValue(
      throwError(() => new Error('Backend error'))
    );

    component.loadInvitations();

    expect(spy).toHaveBeenCalled();
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe('Erreur lors du chargement du tableau Invitations.');
  });

  it('formatDate should return "-" for empty and a formatted string otherwise', () => {
    expect(component.formatDate(undefined)).toBe('-');
    const formatted = component.formatDate('2026-04-15T10:00:00');
    expect(formatted).toContain('2026');
  });
});