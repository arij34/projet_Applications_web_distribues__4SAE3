import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkillDashboardComponent } from './skill-dashboard.component';

describe('SkillDashboardComponent', () => {
  let component: SkillDashboardComponent;
  let fixture: ComponentFixture<SkillDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SkillDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SkillDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
