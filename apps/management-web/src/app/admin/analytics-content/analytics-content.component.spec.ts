import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AnalyticsContentComponent } from './analytics-content.component';
import { CssChartsComponent } from './css-charts.component';
import { SupabaseService } from '../../supabase.service';

describe('AnalyticsContentComponent', () => {
  let component: AnalyticsContentComponent;
  let fixture: ComponentFixture<AnalyticsContentComponent>;
  let mockSupabaseService: jasmine.SpyObj<SupabaseService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('SupabaseService', ['fetchAnalyticsData']);
    
    await TestBed.configureTestingModule({
      imports: [
        AnalyticsContentComponent,
        FormsModule,
        CssChartsComponent
      ],
      providers: [
        { provide: SupabaseService, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AnalyticsContentComponent);
    component = fixture.componentInstance;
    mockSupabaseService = TestBed.inject(SupabaseService) as jasmine.SpyObj<SupabaseService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with loading state', () => {
    expect(component.isLoading).toBe(true);
    expect(component.hasError).toBe(false);
  });

  it('should display loading spinner when isLoading is true', () => {
    component.isLoading = true;
    fixture.detectChanges();
    
    const loadingElement = fixture.nativeElement.querySelector('.animate-spin');
    expect(loadingElement).toBeTruthy();
  });

  it('should display error state when hasError is true', () => {
    component.isLoading = false;
    component.hasError = true;
    fixture.detectChanges();
    
    const errorElement = fixture.nativeElement.querySelector('[class*="text-red-500"]');
    expect(errorElement).toBeTruthy();
  });

  it('should display analytics dashboard when data is loaded', () => {
    component.isLoading = false;
    component.hasError = false;
    fixture.detectChanges();
    
    const dashboardElement = fixture.nativeElement.querySelector('.animate-fadeIn');
    expect(dashboardElement).toBeTruthy();
  });

  it('should handle period change', () => {
    spyOn(component, 'onPeriodChange');
    component.selectedPeriod = '30d';
    component.onPeriodChange();
    
    expect(component.onPeriodChange).toHaveBeenCalled();
  });

  it('should handle refresh data', () => {
    spyOn(component, 'refreshData');
    component.refreshData();
    
    expect(component.refreshData).toHaveBeenCalled();
  });

  it('should handle export report', () => {
    spyOn(component, 'exportReport');
    component.exportReport();
    
    expect(component.exportReport).toHaveBeenCalled();
  });
});
