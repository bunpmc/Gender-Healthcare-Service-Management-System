import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StaffManagementContainerComponent } from '../../shared/staff-management';
import { StaffManagementConfig, StaffManagementEvents } from '../../shared/staff-management/models/staff-management.interface';
import { SupabaseService } from '../../supabase.service';
import { Staff, Role } from '../../models/staff.interface';
import { ErrorHandlerService } from '../../core/services/error-handler.service';

@Component({
  selector: 'app-doctor-staff-management',
  standalone: true,
  imports: [CommonModule, StaffManagementContainerComponent],
  template: `
    <app-staff-management-container 
      [config]="staffManagementConfig"
      [allStaff]="staffMembers"
      [loading]="isLoading"
      [events]="staffEvents">
    </app-staff-management-container>
  `
})
export class DoctorStaffManagementComponent implements OnInit {
  staffMembers: Staff[] = [];
  isLoading = false;

  // Configuration for doctor portal - more restricted than admin
  staffManagementConfig: StaffManagementConfig = {
    portal: 'doctor',
    canCreate: false, // Doctors typically can't create staff
    canEdit: false,   // Doctors typically can't edit staff
    canDelete: false, // Doctors typically can't delete staff
    canExport: true,  // Doctors can export for reporting
    canTestEdgeFunction: false, // No edge function access
    allowedRoles: ['doctor', 'receptionist'], // Can view all roles
    customActions: [] // No custom actions for doctor portal
  };

  // Events configuration - minimal for doctor portal
  staffEvents: StaffManagementEvents = {
    onExport: this.handleExportData.bind(this)
  };

  constructor(
    private supabaseService: SupabaseService,
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

  handleExportData(staffList: Staff[]): void {
    try {
      // Implement export functionality for doctor portal
      const dataStr = JSON.stringify(staffList, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `doctor_staff_view_${new Date().toISOString().split('T')[0]}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      this.errorHandler.showSuccess('Staff directory exported successfully');
    } catch (error) {
      this.errorHandler.handleApiError(
        error, 
        'exportStaff', 
        'Failed to export staff directory'
      );
    }
  }
}
