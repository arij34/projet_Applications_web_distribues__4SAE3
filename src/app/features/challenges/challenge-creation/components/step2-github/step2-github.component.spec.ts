import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Step2GithubComponent } from './step2-github.component';

describe('Step2GithubComponent', () => {
  let component: Step2GithubComponent;
  let fixture: ComponentFixture<Step2GithubComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Step2GithubComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Step2GithubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
