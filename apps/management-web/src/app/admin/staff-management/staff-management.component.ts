import { Staff, Role } from '../../models/staff.interface';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StaffManagementContainerComponent } from '../../shared/staff-management';
import { StaffManagementConfig, StaffManagementEvents } from '../../shared/staff-management/models/staff-management.interface';
import { SupabaseService } from '../../supabase.service';
import { EdgeFunctionService } from '../../edge-function.service';
import { ErrorHandlerService } from '../../core/services/error-handler.service';

@Component({
  selector: 'app-admin-staff-management',
  imports: [CommonModule, StaffManagementContainerComponent],
  template: `
    <app-staff-management-container 
      [config]="staffManagementConfig"
      [allStaff]="staffMembers"
      [loading]="isLoading"
      [events]="staffEvents">
    </app-staff-management-container>
  `,
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
        label: 'Test Edge Function',
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
    private edgeFunctionService: EdgeFunctionService,
    private errorHandler: ErrorHandlerService
  ) { }

  async ngOnInit() {
    await this.loadStaff();
  }

  async loadStaff(): Promise<void> {
    this.isLoading = true;
    try {
      const result = await this.supabaseService.getAllStaff();
      if (result.success && result.data) {
        this.staffMembers = result.data;
      } else {
        this.errorHandler.handleApiError(
          result.error, 
          'loadStaff', 
          'Failed to load staff directory'
        );
      }
    } catch (error) {
      this.errorHandler.handleApiError(
        error, 
        'loadStaff', 
        'An unexpected error occurred while loading staff'
      );
    } finally {
      this.isLoading = false;
    }
  }

  // Event handlers
  async handleCreateStaff(staffData: any) {
    try {
      this.isLoading = true;
      const result = await this.edgeFunctionService.createStaffMember(staffData);
      if (result.success) {
        await this.loadStaff(); // Reload data
        console.log('Staff created successfully');
      } else {
        console.error('Error creating staff:', result.error);
      }
    } catch (error) {
      console.error('Error creating staff:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async handleEditStaff(staffData: any) {
    try {
      this.isLoading = true;
      const result = await this.supabaseService.updateStaffMember(staffData.staff_id, staffData);
      if (result.success) {
        await this.loadStaff(); // Reload data
        console.log('Staff updated successfully');
      } else {
        console.error('Error updating staff:', result.error);
      }
    } catch (error) {
      console.error('Error updating staff:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async handleDeleteStaff(staff: Staff) {
    if (confirm('Are you sure you want to delete this staff member?')) {
      try {
        this.isLoading = true;
        const result = await this.supabaseService.deleteStaffMember(staff.staff_id);
        if (result.success) {
          await this.loadStaff(); // Reload data
          console.log('Staff deleted successfully');
        } else {
          console.error('Error deleting staff:', result.error);
        }
      } catch (error) {
        console.error('Error deleting staff:', error);
      } finally {
        this.isLoading = false;
      }
    }
  }

  handleViewStaff(staff: Staff) {
    console.log('Viewing staff:', staff);
    // Additional view logic if needed
  }

  handleExportData(staffList: Staff[]) {
    // Implement export functionality
    const dataStr = JSON.stringify(staffList, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'staff_data.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  async handleTestEdgeFunction() {
    try {
      console.log('Testing edge function...');
      const result = await this.edgeFunctionService.testCreateStaffEdgeFunction();
      console.log('Edge function result:', result);
      alert('Edge function test completed. Check console for details.');
    } catch (error) {
      console.error('Error testing edge function:', error);
      alert('Edge function test failed. Check console for details.');
    }
  }

  async handleCustomAction(actionId: string, staff: Staff) {
    if (actionId === 'test-edge') {
      try {
        console.log('Testing edge function...');
        const result = await this.edgeFunctionService.testCreateStaffEdgeFunction();
        console.log('Edge function result:', result);
        alert('Edge function test completed. Check console for details.');
      } catch (error) {
        console.error('Error testing edge function:', error);
        alert('Edge function test failed. Check console for details.');
      }
    }
  }
}
