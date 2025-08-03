import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminStaffManagementComponent } from './staff-management.component';
import { SupabaseService } from '../../supabase.service';
import { EdgeFunctionService } from '../../edge-function.service';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { LoggerService } from '../../core/services/logger.service';

describe('AdminStaffManagementComponent', () => {
  let component: AdminStaffManagementComponent;
  let fixture: ComponentFixture<AdminStaffManagementComponent>;
  let mockSupabaseService: jasmine.SpyObj<SupabaseService>;
  let mockEdgeFunctionService: jasmine.SpyObj<EdgeFunctionService>;
  let mockErrorHandler: jasmine.SpyObj<ErrorHandlerService>;
  let mockLogger: jasmine.SpyObj<LoggerService>;

  beforeEach(async () => {
    const supabaseSpy = jasmine.createSpyObj('SupabaseService', ['getAllStaff', 'updateStaffMember', 'deleteStaffMember']);
    const edgeFunctionSpy = jasmine.createSpyObj('EdgeFunctionService', ['createStaffMember', 'testCreateStaffEdgeFunction']);
    const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', ['handleApiError']);
    const loggerSpy = jasmine.createSpyObj('LoggerService', ['info', 'error', 'debug']);

    await TestBed.configureTestingModule({
      imports: [AdminStaffManagementComponent],
      providers: [
        { provide: SupabaseService, useValue: supabaseSpy },
        { provide: EdgeFunctionService, useValue: edgeFunctionSpy },
        { provide: ErrorHandlerService, useValue: errorHandlerSpy },
        { provide: LoggerService, useValue: loggerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminStaffManagementComponent);
    component = fixture.componentInstance;
    mockSupabaseService = TestBed.inject(SupabaseService) as jasmine.SpyObj<SupabaseService>;
    mockEdgeFunctionService = TestBed.inject(EdgeFunctionService) as jasmine.SpyObj<EdgeFunctionService>;
    mockErrorHandler = TestBed.inject(ErrorHandlerService) as jasmine.SpyObj<ErrorHandlerService>;
    mockLogger = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct configuration', () => {
    expect(component.staffManagementConfig).toBeDefined();
    expect(component.staffManagementConfig.portal).toBe('admin');
    expect(component.staffManagementConfig.canCreate).toBe(true);
    expect(component.staffManagementConfig.canEdit).toBe(true);
    expect(component.staffManagementConfig.canDelete).toBe(true);
  });

  it('should have staff events configured', () => {
    expect(component.staffEvents).toBeDefined();
    expect(component.staffEvents.onCreate).toBeDefined();
    expect(component.staffEvents.onUpdate).toBeDefined();
    expect(component.staffEvents.onDelete).toBeDefined();
  });

  it('should load staff on initialization', async () => {
    mockSupabaseService.getAllStaff.and.returnValue(Promise.resolve({
      success: true,
      data: [
        {
          staff_id: '1',
          full_name: 'Dr. John Doe',
          working_email: 'john@test.com',
          role: 'doctor',
          hired_at: '2023-01-01',
          is_available: true,
          staff_status: 'active'
        },
        {
          staff_id: '2',
          full_name: 'Jane Smith',
          working_email: 'jane@test.com',
          role: 'receptionist',
          hired_at: '2023-02-01',
          is_available: true,
          staff_status: 'active'
        }
      ]
    }));

    await component.ngOnInit();

    expect(mockSupabaseService.getAllStaff).toHaveBeenCalled();
    expect(component.staffMembers.length).toBe(2);
  });

  it('should count doctors correctly', () => {
    component.staffMembers = [
      {
        staff_id: '1',
        full_name: 'Dr. John Doe',
        working_email: 'john@test.com',
        role: 'doctor',
        hired_at: '2023-01-01',
        is_available: true,
        staff_status: 'active'
      },
      {
        staff_id: '2',
        full_name: 'Dr. Jane Smith',
        working_email: 'jane@test.com',
        role: 'doctor',
        hired_at: '2023-02-01',
        is_available: true,
        staff_status: 'active'
      },
      {
        staff_id: '3',
        full_name: 'Alice Johnson',
        working_email: 'alice@test.com',
        role: 'receptionist',
        hired_at: '2023-03-01',
        is_available: true,
        staff_status: 'active'
      }
    ];

    expect(component.getDoctorCount()).toBe(2);
  });

  it('should count receptionists correctly', () => {
    component.staffMembers = [
      {
        staff_id: '1',
        full_name: 'Dr. John Doe',
        working_email: 'john@test.com',
        role: 'doctor',
        hired_at: '2023-01-01',
        is_available: true,
        staff_status: 'active'
      },
      {
        staff_id: '2',
        full_name: 'Alice Johnson',
        working_email: 'alice@test.com',
        role: 'receptionist',
        hired_at: '2023-02-01',
        is_available: true,
        staff_status: 'active'
      },
      {
        staff_id: '3',
        full_name: 'Bob Wilson',
        working_email: 'bob@test.com',
        role: 'receptionist',
        hired_at: '2023-03-01',
        is_available: true,
        staff_status: 'active'
      }
    ];

    expect(component.getReceptionistCount()).toBe(2);
  });

  it('should count active staff correctly', () => {
    component.staffMembers = [
      {
        staff_id: '1',
        full_name: 'Dr. John Doe',
        working_email: 'john@test.com',
        role: 'doctor',
        hired_at: '2023-01-01',
        is_available: true,
        staff_status: 'active'
      },
      {
        staff_id: '2',
        full_name: 'Alice Johnson',
        working_email: 'alice@test.com',
        role: 'receptionist',
        hired_at: '2023-02-01',
        is_available: true,
        staff_status: 'active'
      }
    ];

    expect(component.getActiveStaffCount()).toBe(2);
  });

  it('should handle staff creation', async () => {
    const staffData = {
      full_name: 'New Doctor',
      working_email: 'new@test.com',
      role: 'doctor' as 'doctor' | 'receptionist'
    };
    mockEdgeFunctionService.createStaffMember.and.returnValue(Promise.resolve({ success: true }));
    mockSupabaseService.getAllStaff.and.returnValue(Promise.resolve({ success: true, data: [] }));

    await component.handleCreateStaff(staffData);

    expect(mockEdgeFunctionService.createStaffMember).toHaveBeenCalledWith(staffData);
    expect(mockLogger.info).toHaveBeenCalledWith('Staff created successfully');
  });

  it('should handle staff deletion with confirmation', async () => {
    const staff = {
      staff_id: '1',
      full_name: 'Dr. John Doe',
      working_email: 'john@test.com',
      role: 'doctor',
      hired_at: '2023-01-01',
      is_available: true,
      staff_status: 'active'
    };
    spyOn(window, 'confirm').and.returnValue(true);
    mockSupabaseService.deleteStaffMember.and.returnValue(Promise.resolve({ success: true }));
    mockSupabaseService.getAllStaff.and.returnValue(Promise.resolve({ success: true, data: [] }));

    await component.handleDeleteStaff(staff);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockSupabaseService.deleteStaffMember).toHaveBeenCalledWith('1');
    expect(mockLogger.info).toHaveBeenCalledWith('Staff deleted successfully');
  });

  it('should handle export functionality', () => {
    const staffList = [
      {
        staff_id: '1',
        full_name: 'Dr. John Doe',
        working_email: 'john@test.com',
        role: 'doctor',
        hired_at: '2023-01-01',
        is_available: true,
        staff_status: 'active'
      }
    ];

    // Mock DOM methods
    const mockLink = { setAttribute: jasmine.createSpy(), click: jasmine.createSpy() };
    spyOn(document, 'createElement').and.returnValue(mockLink as any);

    component.handleExportData(staffList);

    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(mockLink.click).toHaveBeenCalled();
  }); it('should test edge function', async () => {
    mockEdgeFunctionService.testCreateStaffEdgeFunction.and.returnValue(Promise.resolve({ success: true }));
    spyOn(window, 'alert');

    await component.handleTestEdgeFunction();

    expect(mockEdgeFunctionService.testCreateStaffEdgeFunction).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Edge function test completed. Check console for details.');
  });

  it('should handle loading state correctly', () => {
    expect(component.isLoading).toBe(false);

    // Test that loading state is managed during operations
    component.isLoading = true;
    fixture.detectChanges();

    const loadingElement = fixture.nativeElement.querySelector('.loading-container');
    expect(loadingElement).toBeTruthy();
  });
});
