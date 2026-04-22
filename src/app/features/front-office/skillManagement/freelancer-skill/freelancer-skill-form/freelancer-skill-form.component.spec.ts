import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FreelancerSkillFormComponent } from './freelancer-skill-form.component';

describe('FreelancerSkillFormComponent', () => {
  let component: FreelancerSkillFormComponent;
  let fixture: ComponentFixture<FreelancerSkillFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FreelancerSkillFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FreelancerSkillFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
