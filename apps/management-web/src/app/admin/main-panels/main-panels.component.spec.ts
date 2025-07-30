import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainPanelsComponent } from './main-panels.component';

describe('MainPanelsComponent', () => {
  let component: MainPanelsComponent;
  let fixture: ComponentFixture<MainPanelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainPanelsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainPanelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
