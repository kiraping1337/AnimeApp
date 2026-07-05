import { TestBed } from '@angular/core/testing';

import { Tierlist } from './tierlist';

describe('Tierlist', () => {
  let service: Tierlist;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Tierlist);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
