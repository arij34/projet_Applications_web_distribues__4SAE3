import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Step3TasksComponent } from './step3-tasks.component';

describe('Step3TasksComponent', () => {
  let component: Step3TasksComponent;
  let fixture: ComponentFixture<Step3TasksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Step3TasksComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Step3TasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
