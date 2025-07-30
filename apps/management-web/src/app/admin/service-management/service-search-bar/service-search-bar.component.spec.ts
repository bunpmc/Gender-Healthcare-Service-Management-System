import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceSearchBarComponent } from './service-search-bar.component';

describe('ServiceSearchBarComponent', () => {
  let component: ServiceSearchBarComponent;
  let fixture: ComponentFixture<ServiceSearchBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceSearchBarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceSearchBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
