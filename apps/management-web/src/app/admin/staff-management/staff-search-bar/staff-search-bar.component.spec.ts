import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffSearchBarComponent } from '../../../staff-management/staff-search-bar/staff-search-bar.component';

describe('StaffSearchBarComponent', () => {
  let component: StaffSearchBarComponent;
  let fixture: ComponentFixture<StaffSearchBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffSearchBarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaffSearchBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
