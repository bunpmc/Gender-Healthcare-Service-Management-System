import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StaffManagementContainerComponent } from '../../shared/staff-management';
import { StaffManagementConfig, StaffManagementEvents } from '../../shared/staff-management/models/staff-management.interface';
import { SupabaseService } from '../../supabase.service';
import { EdgeFunctionService, CreateStaffRequest } from '../../Services/edge-function.service';
import { DatabaseService } from '../../Services/database.service';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { LoggerService } from '../../core/services/logger.service';
import {
    StaffMember,
    StaffRole,
    StaffStatus,
    GenderEnum
} from '../../models/database.interface';

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
        private databaseService: DatabaseService,
        private errorHandler: ErrorHandlerService,
        private logger: LoggerService
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

    // Handle create staff using edge function
    async handleCreateStaff(staffData: any): Promise<void> {
        try {
            this.logger.info('Creating staff using edge function:', staffData);

            const createRequest: CreateStaffRequest = {
                full_name: staffData.full_name,
                working_email: staffData.working_email,
                role: staffData.role as StaffRole,
                years_experience: staffData.years_experience,
                hired_at: staffData.hired_at,
                is_available: staffData.is_available ?? true,
                staff_status: staffData.staff_status as StaffStatus ?? 'active',
                gender: staffData.gender as GenderEnum,
                languages: staffData.languages,
                image_link: staffData.image_link
            };

            this.edgeFunctionService.createStaffMember(createRequest).subscribe({
                next: (result) => {
                    if (result.success) {
                        this.logger.info('Staff created successfully via edge function:', result.data);
                        this.loadStaff(); // Reload staff list
                    } else {
                        this.logger.error('Error creating staff:', result.error);
                        this.errorHandler.handleApiError(result.error, 'createStaff', 'Failed to create staff member');
                    }
                },
                error: (error) => {
                    this.logger.error('Edge function error:', error);
                    this.errorHandler.handleApiError(error, 'createStaff', 'Failed to create staff member');
                }
            });

        } catch (error) {
            this.logger.error('Error in handleCreateStaff:', error);
            this.errorHandler.handleApiError(error, 'createStaff', 'An unexpected error occurred');
        }
    }

    // Handle edit staff
    async handleEditStaff(staffData: any): Promise<void> {
        try {
            this.logger.info('Updating staff:', staffData);
            // Use regular Supabase service for updates
            const result = await this.supabaseService.updateStaffMember(staffData.staff_id, staffData);
            if (result.success) {
                this.logger.info('Staff updated successfully');
                await this.loadStaff();
            } else {
                this.errorHandler.handleApiError(result.error, 'updateStaff', 'Failed to update staff');
            }
        } catch (error) {
            this.errorHandler.handleApiError(error, 'updateStaff', 'Failed to update staff');
        }
    }

    // Handle delete staff
    async handleDeleteStaff(staff: Staff): Promise<void> {
        try {
            this.logger.info('Deleting staff:', staff);
            const result = await this.supabaseService.deleteStaffMember(staff.staff_id);
            if (result.success) {
                this.logger.info('Staff deleted successfully');
                await this.loadStaff();
            } else {
                this.errorHandler.handleApiError(result.error, 'deleteStaff', 'Failed to delete staff');
            }
        } catch (error) {
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

    // Handle test edge function
    async handleTestEdgeFunction(): Promise<void> {
        try {
            this.logger.info('Testing edge function...');

            const testStaffData: CreateStaffRequest = {
                full_name: 'Test Staff Member',
                working_email: `test.staff.${Date.now()}@example.com`,
                role: 'receptionist',
                years_experience: 2,
                hired_at: new Date().toISOString().split('T')[0],
                is_available: true,
                staff_status: 'active',
                gender: 'other'
            };

            this.edgeFunctionService.createStaffMember(testStaffData).subscribe({
                next: (result) => {
                    if (result.success) {
                        this.logger.info('✅ Edge function test successful!', result.data);
                        alert('Edge function test successful! Check console for details.');
                        this.loadStaff(); // Reload to show new test data
                    } else {
                        this.logger.error('❌ Edge function test failed:', result.error);
                        alert(`Edge function test failed: ${result.error}`);
                    }
                },
                error: (error) => {
                    this.logger.error('💥 Edge function test error:', error);
                    alert(`Edge function test error: ${error}`);
                }
            });

        } catch (error) {
            this.logger.error('Error in handleTestEdgeFunction:', error);
            this.errorHandler.handleApiError(error, 'testEdgeFunction', 'Failed to test edge function');
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
