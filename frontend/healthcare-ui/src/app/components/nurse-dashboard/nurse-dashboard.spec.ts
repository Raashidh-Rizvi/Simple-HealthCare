import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NurseDashboard } from './nurse-dashboard';

describe('NurseDashboard', () => {
  let component: NurseDashboard;
  let fixture: ComponentFixture<NurseDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NurseDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NurseDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
