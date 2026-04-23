import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingSkillListComponent } from './pending-skill-list.component';

describe('PendingSkillListComponent', () => {
  let component: PendingSkillListComponent;
  let fixture: ComponentFixture<PendingSkillListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PendingSkillListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PendingSkillListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
