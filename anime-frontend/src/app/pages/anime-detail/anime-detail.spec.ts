import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnimeDetail } from './anime-detail';

describe('AnimeDetail', () => {
  let component: AnimeDetail;
  let fixture: ComponentFixture<AnimeDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnimeDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(AnimeDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
