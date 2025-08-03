import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StaffManagementContainerComponent } from '../../shared/staff-management';
import { StaffManagementConfig, StaffManagementEvents } from '../../shared/staff-management/models/staff-management.interface';
import { SupabaseService } from '../../supabase.service';
import { Staff, Role } from '../../models/staff.interface';

@Component({
  selector: 'app-receptionist-staff-management',
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
export class ReceptionistStaffManagementComponent implements OnInit {
  staffMembers: Staff[] = [];
  isLoading = false;

  // Configuration for receptionist portal - view-only mostly
  staffManagementConfig: StaffManagementConfig = {
    portal: 'receptionist',
    canCreate: false, // Receptionists typically can't create staff
    canEdit: false,   // Receptionists typically can't edit staff
    canDelete: false, // Receptionists typically can't delete staff
    canExport: true,  // Receptionists can export for reference
    canTestEdgeFunction: false, // No edge function access
    allowedRoles: ['doctor', 'receptionist'], // Can view all roles
    customActions: [
      {
        id: 'contact',
        label: 'Contact',
        icon: 'phone',
        color: 'bg-green-500'
      }
    ]
  };

  // Events configuration for receptionist portal
  staffEvents: StaffManagementEvents = {
    onExport: this.handleExportData.bind(this),
    onCustomAction: this.handleCustomAction.bind(this)
  };

  constructor(private supabaseService: SupabaseService) { }

  async ngOnInit() {
    await this.loadStaff();
  }

  async loadStaff() {
    this.isLoading = true;
    try {
      const result = await this.supabaseService.getAllStaff();
      if (result.success && result.data) {
        this.staffMembers = result.data;
      } else {
        console.error('Error fetching staff:', result.error);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      this.isLoading = false;
    }
  }

  handleExportData(staffList: Staff[]) {
    // Implement export functionality for receptionist portal
    const dataStr = JSON.stringify(staffList, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `receptionist_staff_contacts_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  handleCustomAction(actionId: string, staff: Staff) {
    if (actionId === 'contact') {
      // Show contact information or initiate contact
      alert(`Contact ${staff.full_name} at ${staff.working_email}`);
      // Could integrate with email client or phone system
    }
  }
}
