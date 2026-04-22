import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { of, throwError } from 'rxjs';
import { ActivatedRoute, convertToParamMap } from '@angular/router';

import { ClientProjectInvitationsComponent } from './client-project-invitations.component';
import { ProjectInvitationService } from '../../../core/services/skill/project-invitation.service';
import { ClientInvitation } from '../../../core/models/skill/client-invitation.model';

class MockProjectInvitationService {
  getInvitationsForProject(projectId: number) {
    const mockInvitations: ClientInvitation[] = [
      {
        id: 1,
        projectId,
        projectTitle: 'Test Project',
        freelancerName: 'John Doe',
        status: 'PENDING',
        invitedAt: '2026-04-14T10:00:00',
        respondedAt: null
      }
    ];
    return of(mockInvitations);
  }
}

describe('ClientProjectInvitationsComponent', () => {
  let component: ClientProjectInvitationsComponent;
  let fixture: ComponentFixture<ClientProjectInvitationsComponent>;
  let invitationService: ProjectInvitationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientProjectInvitationsComponent],
      imports: [CommonModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: '123' }))
          }
        },
        { provide: ProjectInvitationService, useClass: MockProjectInvitationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ClientProjectInvitationsComponent);
    component = fixture.componentInstance;
    invitationService = TestBed.inject(ProjectInvitationService);
    fixture.detectChanges(); // ngOnInit
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should read projectId from route params', () => {
    expect(component.projectId).toBe(123);
  });

  it('should load invitations on init', () => {
    expect(component.invitations.length).toBe(1);
    expect(component.invitations[0].freelancerName).toBe('John Doe');
    expect(component.projectTitle).toBe('Test Project');
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe('');
  });

  it('should display one table row in template', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const rows = compiled.querySelectorAll('tbody tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('John Doe');
  });

  it('should handle service error', () => {
    spyOn(console, 'error');
    spyOn(invitationService, 'getInvitationsForProject').and.returnValue(
      throwError(() => new Error('Backend error'))
    );

    component.loadInvitations();
    fixture.detectChanges();

    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe('Erreur lors du chargement des invitations.');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Erreur lors du chargement des invitations.');
  });
});