import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Step5ReviewComponent } from './step5-review.component';

describe('Step5ReviewComponent', () => {
  let component: Step5ReviewComponent;
  let fixture: ComponentFixture<Step5ReviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Step5ReviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Step5ReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
