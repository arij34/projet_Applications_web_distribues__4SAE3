/// <reference types="jasmine" />

import { FormsModule } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { FreelancerMatchingListComponent, FreelancerMatch } from './freelancer-matching-list.component';
import { MatchingService } from '../../../core/services/skill/matching.service';

class MockMatchingService {
  getMatching(projectId: number) {
    const mockData: FreelancerMatch[] = [
      {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        role: 'Fullstack Dev',
        location: 'Paris',
        rating: 4.5,
        reviewCount: 12,
        availability: 'AVAILABLE',
        skills: ['Angular', 'Spring'],
        activeProjects: 1,
        completedProjects: 5,
        hourlyRate: 50,
        matchScore: 92
      },
      {
        id: 2,
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'Data Scientist',
        location: 'London',
        rating: 4.8,
        reviewCount: 20,
        availability: 'LIMITED',
        skills: ['Python', 'ML'],
        activeProjects: 2,
        completedProjects: 10,
        hourlyRate: 70,
        matchScore: 85
      }
    ];
    return of(mockData);
  }
}

class MockRouter {
  navigate = jasmine.createSpy('navigate');
}

class MockHttpClient {
  post() {
    return of({});
  }
}

describe('FreelancerMatchingListComponent', () => {
  let component: FreelancerMatchingListComponent;
  let fixture: ComponentFixture<FreelancerMatchingListComponent>;
  let router: MockRouter;
  let http: MockHttpClient;

  beforeEach(async () => {
    router = new MockRouter();
    http = new MockHttpClient();

    await TestBed.configureTestingModule({
      declarations: [FreelancerMatchingListComponent],
      imports: [FormsModule],
      providers: [
        { provide: MatchingService, useClass: MockMatchingService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({ projectId: '123' })
          }
        },
        { provide: HttpClient, useValue: http }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FreelancerMatchingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // ngOnInit
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should read projectId from query params and load freelancers', () => {
    expect(component.projectId).toBe(123);
    expect(component.allFreelancers.length).toBe(2);
    expect(component.filteredFreelancers.length).toBe(2);
    expect(component.loading).toBeFalse();
  });

  it('should filter and sort freelancers on search', () => {
    component.searchQuery = 'john';
    component.onSearch();
    expect(component.filteredFreelancers.length).toBe(1);
    expect(component.filteredFreelancers[0].firstName).toBe('John');

    component.searchQuery = '';
    component.filterMinMatch = 90;
    component.onSearch();
    expect(component.filteredFreelancers.length).toBe(1);
    expect(component.filteredFreelancers[0].matchScore).toBeGreaterThanOrEqual(90);
  });

  it('should navigate to freelancer CV on viewCv', () => {
    const freelancer: FreelancerMatch = component.allFreelancers[0];
    component.viewCv(freelancer);
    expect(router.navigate).toHaveBeenCalledWith(['/front/freelancer-cv', freelancer.id]);
  });

  it('should send invitation and mark freelancer as invited', () => {
    const spyPost = spyOn(http, 'post').and.returnValue(of({}));
    const f = component.allFreelancers[0];

    component.sendInvitation(f);

    expect(spyPost).toHaveBeenCalled();
    expect(component.sentInvitations.has(f.id)).toBeTrue();
  });

  it('getInitials should return correct initials', () => {
    const initials = component.getInitials('John', 'Doe');
    expect(initials).toBe('JD');
  });

  it('getMatchClass should return expected classes', () => {
    expect(component.getMatchClass(95)).toBe('high');
    expect(component.getMatchClass(85)).toBe('medium');
    expect(component.getMatchClass(70)).toBe('low');
  });

  it('getStars should return array of stars', () => {
    const stars = component.getStars(4.5);
    expect(stars.length).toBe(5);
    expect(stars.filter(s => s.type === 'full').length).toBe(4);
    expect(stars.filter(s => s.type === 'half').length).toBe(1);
  });
});