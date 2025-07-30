import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalyticManagementComponent } from './analytic-management.component';

describe('AnalyticManagementComponent', () => {
  let component: AnalyticManagementComponent;
  let fixture: ComponentFixture<AnalyticManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalyticManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnalyticManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
