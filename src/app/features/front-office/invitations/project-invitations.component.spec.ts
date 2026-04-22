/// <reference types="jasmine" />

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { ProjectInvitationsComponent } from './project-invitations.component';
import { InvitationService } from '../../../core/services/skill/invitation.service';
import { AuthService } from '../../../core/auth/auth.service';

class MockAuthService {
  isLoggedIn() {
    return Promise.resolve(true);
  }
  getUserId() {
    return 42;
  }
}

class MockInvitationService {
  getMyInvitations(freelancerId: number) {
    const data: any[] = [
      {
        id: 1,
        projectTitle: 'Test Project',
        projectDescription: 'Desc',
        clientName: 'Client A',
        clientEmail: 'a@test.com',
        matchScore: 88,
        deadline: '2026-05-01',
        budgetRecommended: 1000,
        budgetMax: 1500,
        durationEstimatedWeeks: 4,
        requiredSkills: ['Angular'],
        invitedAt: '2026-04-14T10:00:00',
        status: 'PENDING'
      },
      {
        id: 2,
        projectTitle: 'Old Project',
        projectDescription: 'Old',
        clientName: 'Client B',
        clientEmail: 'b@test.com',
        matchScore: 70,
        deadline: '2026-06-01',
        budgetRecommended: 2000,
        budgetMax: 2500,
        durationEstimatedWeeks: 6,
        requiredSkills: ['Java'],
        invitedAt: '2026-04-10T10:00:00',
        status: 'ACCEPTED'
      }
    ];
    return of(data);
  }

  getTrash(freelancerId: number) {
    return of([]);
  }
}

class MockHttpClient {
  get<T>() {
    return of([] as unknown as T);
  }
  put() {
    return of({});
  }
  post<T>() {
    return of({} as T);
  }
  delete() {
    return of({});
  }
}

describe('ProjectInvitationsComponent', () => {
  let component: ProjectInvitationsComponent;
  let fixture: ComponentFixture<ProjectInvitationsComponent>;
  let http: MockHttpClient;

  beforeEach(async () => {
    http = new MockHttpClient();

    await TestBed.configureTestingModule({
      declarations: [ProjectInvitationsComponent],
      providers: [
        { provide: AuthService, useClass: MockAuthService },
        { provide: InvitationService, useClass: MockInvitationService },
        { provide: HttpClient, useValue: http }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectInvitationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();           // ngOnInit (async)
    await fixture.whenStable();        // wait isLoggedIn + loadInvitations
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load invitations for logged freelancer', () => {
    expect(component.invitations.length).toBe(2);
    expect(component.pendingCount).toBe(1);
    expect(component.acceptedCount).toBe(1);
  });

  it('should filter invitations by tab', () => {
    component.setTab('pending');
    expect(component.filteredInvitations.length).toBe(1);
    expect(component.filteredInvitations[0].status).toBe('PENDING');

    component.setTab('accepted');
    expect(component.filteredInvitations.length).toBe(1);
    expect(component.filteredInvitations[0].status).toBe('ACCEPTED');

    component.setTab('all');
    expect(component.filteredInvitations.length).toBe(2);
  });

  it('formatDate should handle empty and valid dates', () => {
    expect(component.formatDate('')).toBe('-');
    const result = component.formatDate('2026-04-14T10:00:00');
    expect(result).toContain('2026');
  });

  it('getStatusLabel should map statuses', () => {
    expect(component.getStatusLabel('PENDING')).toBe('Pending');
    expect(component.getStatusLabel('ACCEPTED')).toBe('Accepted');
    expect(component.getStatusLabel('DECLINED')).toBe('Declined');
    expect(component.getStatusLabel('TRASH')).toBe('Trash');
  });

  it('toggleDetails should expand and collapse invitation', () => {
    const inv = component.invitations[0];
    component.toggleDetails(inv);
    expect(component.expandedInvitationId).toBe(inv.id);

    component.toggleDetails(inv);
    expect(component.expandedInvitationId).toBeNull();
  });
});