import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StaffManagementContainerComponent } from '../../shared/staff-management';
import { StaffManagementConfig, StaffManagementEvents } from '../../shared/staff-management/models/staff-management.interface';
import { SupabaseService } from '../../supabase.service';
import { DatabaseService } from '../../Services/database.service';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { LoggerService } from '../../core/services/logger.service';
import { StaffDataService } from '../../Services/staff-data.service'; // Import new service

// Legacy compatibility
import { Staff, Role } from '../../models/staff.interface';

@Component({
  selector: 'app-admin-staff-management',
  imports: [CommonModule, StaffManagementContainerComponent],
  templateUrl: './staff-management.component.html',
  styleUrls: ['./staff-management.component.css'],
  standalone: true
})
export class AdminStaffManagementComponent implements OnInit {
  staffMembers: Staff[] = [];
  isLoading = false;

  // Configuration for admin portal
  staffManagementConfig: StaffManagementConfig = {
    portal: 'admin',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canExport: true,
    canTestEdgeFunction: true,
    allowedRoles: ['doctor', 'receptionist'],
    customActions: [
      {
        id: 'test-edge',
        label: 'Test Staff Service',
        icon: 'code',
        color: 'bg-blue-500'
      }
    ]
  };

  // Events configuration
  staffEvents: StaffManagementEvents = {
    onCreate: this.handleCreateStaff.bind(this),
    onUpdate: this.handleEditStaff.bind(this),
    onDelete: this.handleDeleteStaff.bind(this),
    onExport: this.handleExportData.bind(this),
    onTestEdgeFunction: this.handleTestEdgeFunction.bind(this),
    onCustomAction: this.handleCustomAction.bind(this)
  };

  constructor(
    private supabaseService: SupabaseService,
    private databaseService: DatabaseService,
    private errorHandler: ErrorHandlerService,
    private logger: LoggerService,
    private staffDataService: StaffDataService // Inject new service
  ) { }

  async ngOnInit() {
    await this.loadStaff();
  }

  async loadStaff(): Promise<void> {
    this.isLoading = true;
    try {
      // Use new StaffDataService to fetch all staff with proper avatar URLs
      const result = await this.staffDataService.fetchAllStaff(true, true); // Include unavailable and inactive

      if (result.success && result.data) {
        this.staffMembers = result.data;
        this.logger.info(`Loaded ${result.data.length} staff members successfully`);
      } else {
        this.logger.error('Failed to load staff:', result.error);
        this.errorHandler.handleApiError(
          new Error(result.error || 'Unknown error'),
          'loadStaff',
          'Failed to load staff directory'
        );
      }

    } catch (error) {
      this.logger.error('Error in loadStaff:', error);
      this.errorHandler.handleApiError(
        error,
        'loadStaff',
        'An unexpected error occurred while loading staff'
      );
    } finally {
      this.isLoading = false;
    }
  }

  // Handle create staff using Supabase service (no edge function)
  async handleCreateStaff(staffData: any): Promise<void> {
    try {
      this.logger.info('Creating staff using Supabase service:', staffData);

      // Prepare staff data for creation
      const newStaffData = {
        full_name: staffData.full_name,
        working_email: staffData.working_email,
        role: staffData.role as 'doctor' | 'receptionist',
        years_experience: staffData.years_experience || 0,
        hired_at: staffData.hired_at || new Date().toISOString().split('T')[0],
        is_available: staffData.is_available ?? true,
        staff_status: (staffData.staff_status as 'active' | 'inactive' | 'on_leave') ?? 'active',
        gender: staffData.gender as 'male' | 'female' | 'other',
        languages: staffData.languages || [],
        image_link: staffData.image_link
      };

      // Use Supabase service to create staff
      const result = await this.supabaseService.createStaffMember(newStaffData);

      if (result.success) {
        this.logger.info('Staff created successfully:', result.data);

        // Show success message
        const staffName = newStaffData.full_name;
        const message = `Staff member "${staffName}" created successfully!`;
        alert(message);

        // Reload staff list to show new member
        await this.loadStaff();
      } else {
        this.logger.error('Error creating staff:', result.error);
        this.errorHandler.handleApiError(
          new Error(result.error || 'Unknown error'),
          'createStaff',
          'Failed to create staff member'
        );
      }

    } catch (error) {
      this.logger.error('Error in handleCreateStaff:', error);
      this.errorHandler.handleApiError(error, 'createStaff', 'An unexpected error occurred');
    }
  }

  // Handle edit staff
  async handleEditStaff(staffData: any): Promise<void> {
    try {
      this.logger.info('Updating staff:', staffData);

      // Use StaffDataService to update staff (excludes image_link for security)
      const result = await this.staffDataService.updateStaff(staffData.staff_id, staffData);

      if (result.success) {
        this.logger.info('Staff updated successfully:', result.data);
        alert(`Staff member "${staffData.full_name}" updated successfully!`);
        await this.loadStaff(); // Reload to show updated data
      } else {
        this.logger.error('Error updating staff:', result.error);
        this.errorHandler.handleApiError(
          new Error(result.error || 'Unknown error'),
          'updateStaff',
          'Failed to update staff member'
        );
      }
    } catch (error) {
      this.logger.error('Error in handleEditStaff:', error);
      this.errorHandler.handleApiError(error, 'updateStaff', 'Failed to update staff');
    }
  }

  // Handle delete staff
  async handleDeleteStaff(staff: Staff): Promise<void> {
    try {
      this.logger.info('Deleting staff:', staff.staff_id);

      // Confirm deletion
      const confirmDelete = confirm(`Are you sure you want to delete staff member "${staff.full_name}"? This action cannot be undone.`);

      if (!confirmDelete) {
        this.logger.info('Staff deletion cancelled by user');
        return;
      }

      // Use Supabase service to delete staff
      const result = await this.supabaseService.deleteStaffMember(staff.staff_id);

      if (result.success) {
        this.logger.info('Staff deleted successfully');
        alert(`Staff member "${staff.full_name}" deleted successfully!`);
        await this.loadStaff(); // Reload to show updated data
      } else {
        this.logger.error('Error deleting staff:', result.error);
        this.errorHandler.handleApiError(
          new Error(result.error || 'Unknown error'),
          'deleteStaff',
          'Failed to delete staff member'
        );
      }
    } catch (error) {
      this.logger.error('Error in handleDeleteStaff:', error);
      this.errorHandler.handleApiError(error, 'deleteStaff', 'Failed to delete staff');
    }
  }

  // Handle export data
  async handleExportData(): Promise<void> {
    try {
      this.logger.info('Exporting staff data...');
      const csvData = this.convertToCSV(this.staffMembers);
      this.downloadCSV(csvData, 'staff-export.csv');
    } catch (error) {
      this.errorHandler.handleApiError(error, 'exportData', 'Failed to export data');
    }
  }

  // Handle test staff data service
  async handleTestEdgeFunction(): Promise<void> {
    try {
      this.logger.info('Testing StaffDataService...');

      // Test fetching all staff
      const allStaffResult = await this.staffDataService.fetchAllStaff(true, true);

      if (allStaffResult.success && allStaffResult.data) {
        const allCount = allStaffResult.data.length;

        // Test fetching doctors only
        const doctorsResult = await this.staffDataService.fetchDoctors(true, true);
        const doctorCount = doctorsResult.success && doctorsResult.data ? doctorsResult.data.length : 0;

        // Test fetching receptionists only
        const receptionistsResult = await this.staffDataService.fetchReceptionists(true, true);
        const receptionistCount = receptionistsResult.success && receptionistsResult.data ? receptionistsResult.data.length : 0;

        // Check avatars
        const withAvatars = allStaffResult.data.filter(s => s.avatar_url).length;
        const available = allStaffResult.data.filter(s => s.is_available).length;

        const testResults = `StaffDataService Test Results:
        
✅ Total Staff: ${allCount}
👨‍⚕️ Doctors: ${doctorCount}
👨‍💼 Receptionists: ${receptionistCount}
📸 With Avatars: ${withAvatars}/${allCount}
✅ Available: ${available}/${allCount}

Service is working correctly!`;

        this.logger.info('✅ StaffDataService test successful!', {
          allCount,
          doctorCount,
          receptionistCount,
          withAvatars,
          available
        });

        alert(testResults);
      } else {
        this.logger.error('❌ StaffDataService test failed:', allStaffResult.error);
        alert(`StaffDataService test failed: ${allStaffResult.error}`);
      }

    } catch (error) {
      this.logger.error('Error in handleTestEdgeFunction:', error);
      this.errorHandler.handleApiError(error, 'testStaffDataService', 'Failed to test StaffDataService');
    }
  }

  // Handle custom actions
  async handleCustomAction(actionId: string, data?: any): Promise<void> {
    switch (actionId) {
      case 'test-edge':
        await this.handleTestEdgeFunction();
        break;
      default:
        this.logger.warn('Unknown custom action:', actionId);
    }
  }

  // Utility methods
  private convertToCSV(data: Staff[]): string {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header as keyof Staff] || ''}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  private downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Stats methods for template
  getDoctorCount(): number {
    return this.staffMembers.filter(staff => staff.role === 'doctor').length;
  }

  getReceptionistCount(): number {
    return this.staffMembers.filter(staff => staff.role === 'receptionist').length;
  }

  getActiveStaffCount(): number {
    return this.staffMembers.filter(staff => staff.staff_status === 'active' && staff.is_available).length;
  }
}
