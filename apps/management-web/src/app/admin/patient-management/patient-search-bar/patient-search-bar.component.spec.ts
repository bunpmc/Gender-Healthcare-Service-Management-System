import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientSearchBarComponent } from './patient-search-bar.component';

describe('PatientSearchBarComponent', () => {
  let component: PatientSearchBarComponent;
  let fixture: ComponentFixture<PatientSearchBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientSearchBarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientSearchBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
