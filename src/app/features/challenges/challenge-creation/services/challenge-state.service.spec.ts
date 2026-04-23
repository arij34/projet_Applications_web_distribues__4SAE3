import { TestBed } from '@angular/core/testing';

import { ChallengeStateService } from './challenge-state.service';

describe('ChallengeStateService', () => {
  let service: ChallengeStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChallengeStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
