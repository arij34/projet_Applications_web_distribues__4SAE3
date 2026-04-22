import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { ChallengeWizardComponent } from './challenge-wizard.component';
import { ChallengeStateService } from '../../services/challenge-state.service';
import { ChallengeFormData, STEPS } from '../../models/challenge.model';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';

const mockFormData: ChallengeFormData = {
  challengeInfo: {
    title: 'Test Challenge',
    description: 'Description',
    category: 'Web Development',
    technologies: ['React'],
    difficulty: 'medium',
    image: null
  },
  githubData: {
    repositoryUrl: 'https://github.com/org/repo',
    checklist: {
      orgCreated: true,
      repoCreated: true,
      readmeAdded: true,
      forkEnabled: false
    }
  },
  tasks: [],
  settings: {
    startDate: '2025-01-01',
    endDate: '2025-02-01',
    maxParticipants: '10',
    points: '100',
    status: 'draft'
  }
};

describe('ChallengeWizardComponent', () => {
  let component: ChallengeWizardComponent;
  let fixture: ComponentFixture<ChallengeWizardComponent>;
  let mockChallengeStateService: jasmine.SpyObj<ChallengeStateService>;

  beforeEach(async () => {
    const formDataSubject = new Subject<ChallengeFormData>();
    mockChallengeStateService = jasmine.createSpyObj('ChallengeStateService', [
      'getFormData',
      'saveDraft',
      'publishChallenge',
      'resetForm'
    ]);

    mockChallengeStateService.getFormData.and.returnValue(mockFormData);
    mockChallengeStateService.formData$ = formDataSubject.asObservable();
    mockChallengeStateService.saveDraft.and.returnValue(of({ message: 'Draft saved' }));
    mockChallengeStateService.publishChallenge.and.returnValue(of({ id: '1', title: 'Test Challenge' }));

    await TestBed.configureTestingModule({
      imports: [CommonModule, NoopAnimationsModule],
      declarations: [ChallengeWizardComponent],
      providers: [
        { provide: ChallengeStateService, useValue: mockChallengeStateService }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ChallengeWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with form data from service', () => {
    expect(mockChallengeStateService.getFormData).toHaveBeenCalled();
    expect(component.formData).toEqual(mockFormData);
  });

  it('should have steps from STEPS constant', () => {
    expect(component.steps).toEqual(STEPS);
  });

  it('should start at step 1', () => {
    expect(component.currentStep).toBe(1);
  });

  it('should advance to next step on handleNext', () => {
    component.handleNext();
    expect(component.currentStep).toBe(2);
    component.handleNext();
    expect(component.currentStep).toBe(3);
  });

  it('should go back on handleBack', () => {
    component.currentStep = 3;
    component.handleBack();
    expect(component.currentStep).toBe(2);
  });

  it('should not go below step 1 on handleBack', () => {
    component.currentStep = 1;
    component.handleBack();
    expect(component.currentStep).toBe(1);
  });

  it('should call saveDraft when handleSaveDraft is invoked', () => {
    spyOn(window, 'alert');
    component.handleSaveDraft();
    expect(mockChallengeStateService.saveDraft).toHaveBeenCalled();
  });

  it('should call publishChallenge and show modal on success', () => {
    component.handlePublish();
    expect(mockChallengeStateService.publishChallenge).toHaveBeenCalled();
    expect(component.showSuccessModal).toBe(true);
  });

  it('should reset form and step on handleCloseSuccess', () => {
    component.showSuccessModal = true;
    component.currentStep = 5;
    component.handleCloseSuccess();
    expect(mockChallengeStateService.resetForm).toHaveBeenCalled();
    expect(component.showSuccessModal).toBe(false);
    expect(component.currentStep).toBe(1);
  });

  it('should validate step 1 when required fields are present', () => {
    component.formData = { ...mockFormData };
    expect(component.isStepValid()).toBe(true);
  });

  it('should invalidate step 1 when title is missing', () => {
    component.formData = {
      ...mockFormData,
      challengeInfo: { ...mockFormData.challengeInfo, title: '' }
    };
    expect(component.isStepValid()).toBe(false);
  });
});
