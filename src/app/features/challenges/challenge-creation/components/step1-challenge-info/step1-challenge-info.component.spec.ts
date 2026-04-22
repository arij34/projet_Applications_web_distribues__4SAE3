import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Step1ChallengeInfoComponent } from './step1-challenge-info.component';

describe('Step1ChallengeInfoComponent', () => {
  let component: Step1ChallengeInfoComponent;
  let fixture: ComponentFixture<Step1ChallengeInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Step1ChallengeInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Step1ChallengeInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
