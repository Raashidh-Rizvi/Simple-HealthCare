import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceptionDashboard } from './reception-dashboard';

describe('ReceptionDashboard', () => {
  let component: ReceptionDashboard;
  let fixture: ComponentFixture<ReceptionDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceptionDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReceptionDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
