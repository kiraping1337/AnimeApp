import { TestBed } from '@angular/core/testing';

import { AnimeMetaCache } from './anime-meta-cache';

describe('AnimeMetaChache', () => {
  let service: AnimeMetaCache;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnimeMetaCache);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
