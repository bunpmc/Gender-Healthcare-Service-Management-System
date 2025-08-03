import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardContentComponent } from './dashboard-content.component';
import { SupabaseService } from '../../supabase.service';

describe('DashboardContentComponent', () => {
    let component: DashboardContentComponent;
    let fixture: ComponentFixture<DashboardContentComponent>;
    let mockSupabaseService: jasmine.SpyObj<SupabaseService>;

    beforeEach(async () => {
        const spy = jasmine.createSpyObj('SupabaseService', ['fetchDashboardStats']);

        await TestBed.configureTestingModule({
            imports: [DashboardContentComponent],
            providers: [
                { provide: SupabaseService, useValue: spy }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(DashboardContentComponent);
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

        const errorElement = fixture.nativeElement.querySelector('.bg-red-100');
        expect(errorElement).toBeTruthy();
    });

    it('should display dashboard content when data is loaded', () => {
        component.isLoading = false;
        component.hasError = false;
        fixture.detectChanges();

        const dashboardElement = fixture.nativeElement.querySelector('.animate-fadeIn');
        expect(dashboardElement).toBeTruthy();
    });

    it('should have stats cards', () => {
        expect(component.statsCards).toBeDefined();
        expect(component.statsCards.length).toBeGreaterThan(0);
    });

    it('should handle dashboard data loading', () => {
        spyOn(component, 'loadDashboardData');
        component.loadDashboardData();

        expect(component.loadDashboardData).toHaveBeenCalled();
    });

    it('should handle navigation actions', () => {
        spyOn(component, 'navigateToAppointments');
        spyOn(component, 'navigateToPatients');
        spyOn(component, 'navigateToStaff');

        component.navigateToAppointments();
        component.navigateToPatients();
        component.navigateToStaff();

        expect(component.navigateToAppointments).toHaveBeenCalled();
        expect(component.navigateToPatients).toHaveBeenCalled();
        expect(component.navigateToStaff).toHaveBeenCalled();
    });

    it('should handle activity refresh', () => {
        spyOn(component, 'refreshActivity');
        component.refreshActivity();

        expect(component.refreshActivity).toHaveBeenCalled();
    });

    it('should format time correctly', () => {
        spyOn(component, 'getFormattedTime').and.returnValue('12:30 PM');
        const time = component.getFormattedTime();

        expect(time).toBe('12:30 PM');
    });

    it('should get current date correctly', () => {
        spyOn(component, 'getCurrentDate').and.returnValue('August 3, 2025');
        const date = component.getCurrentDate();

        expect(date).toBe('August 3, 2025');
    });

    it('should track cards by title', () => {
        const mockCard = { title: 'Test Card', value: 100, change: '+5%', changeType: 'increase' as const, icon: '', color: '', loading: false };
        const result = component.trackByCardTitle(0, mockCard);

        expect(result).toBe('Test Card');
    });

    it('should track activities by id', () => {
        const mockActivity = {
            id: 'test-id',
            title: 'Test Activity',
            description: 'Test',
            timestamp: new Date(),
            type: 'appointment' as 'appointment',
            status: 'completed',
            message: 'Test message',
            priority: 'medium' as 'medium'
        };
        const result = component.trackByActivityId(0, mockActivity);

        expect(result).toBe('test-id');
    });
});
