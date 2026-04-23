import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingSkillFormComponent } from './pending-skill-form.component';

describe('PendingSkillFormComponent', () => {
  let component: PendingSkillFormComponent;
  let fixture: ComponentFixture<PendingSkillFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PendingSkillFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PendingSkillFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
