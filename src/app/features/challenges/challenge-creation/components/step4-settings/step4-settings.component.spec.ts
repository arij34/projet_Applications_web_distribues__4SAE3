import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Step4SettingsComponent } from './step4-settings.component';

describe('Step4SettingsComponent', () => {
  let component: Step4SettingsComponent;
  let fixture: ComponentFixture<Step4SettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Step4SettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Step4SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
