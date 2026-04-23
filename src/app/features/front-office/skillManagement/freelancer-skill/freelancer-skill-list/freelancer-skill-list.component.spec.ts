import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FreelancerSkillListComponent } from './freelancer-skill-list.component';

describe('FreelancerSkillListComponent', () => {
  let component: FreelancerSkillListComponent;
  let fixture: ComponentFixture<FreelancerSkillListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FreelancerSkillListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FreelancerSkillListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
