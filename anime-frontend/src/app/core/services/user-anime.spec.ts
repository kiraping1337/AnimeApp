import { TestBed } from '@angular/core/testing';

import { UserAnime } from './user-anime';

describe('UserAnime', () => {
  let service: UserAnime;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserAnime);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
