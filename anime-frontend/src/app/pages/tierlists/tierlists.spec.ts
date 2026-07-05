import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tierlists } from './tierlists';

describe('Tierlists', () => {
  let component: Tierlists;
  let fixture: ComponentFixture<Tierlists>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tierlists],
    }).compileComponents();

    fixture = TestBed.createComponent(Tierlists);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
