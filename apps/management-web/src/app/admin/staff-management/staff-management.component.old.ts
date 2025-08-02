import { Staff, Role } from '../../models/staff.interface';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StaffManagementContainerComponent } from '../../shared/staff-management';
import { StaffManagementConfig, StaffManagementEvents } from '../../shared/staff-management/models/staff-management.interface';
import { SupabaseService } from '../../supabase.service';
import { EdgeFunctionService } from '../../edge-function.service';

@Component({
  selector: 'app-staff-management',
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
export class StaffManagementComponent implements OnInit {
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
    onStaffCreate: this.handleCreateStaff.bind(this),
    onStaffEdit: this.handleEditStaff.bind(this),
    onStaffDelete: this.handleDeleteStaff.bind(this),
    onStaffView: this.handleViewStaff.bind(this),
    onExport: this.handleExportData.bind(this),
    onCustomAction: this.handleCustomAction.bind(this)
  };

  constructor(
    private supabaseService: SupabaseService,
    private edgeFunctionService: EdgeFunctionService
  ) { }

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

  // Event handlers
  async handleCreateStaff(staffData: any) {
    try {
      this.isLoading = true;
      const result = await this.supabaseService.createStaff(staffData);
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
      const result = await this.supabaseService.updateStaff(staffData.staff_id, staffData);
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

  async handleDeleteStaff(staffId: string) {
    if (confirm('Are you sure you want to delete this staff member?')) {
      try {
        this.isLoading = true;
        const result = await this.supabaseService.deleteStaff(staffId);
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

  handleExportData() {
    // Implement export functionality
    const dataStr = JSON.stringify(this.staffMembers, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'staff_data.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  async handleCustomAction(action: { actionId: string, staff?: Staff }) {
    if (action.actionId === 'test-edge') {
      try {
        console.log('Testing edge function...');
        const result = await this.edgeFunctionService.testStaffFunction();
        console.log('Edge function result:', result);
        alert('Edge function test completed. Check console for details.');
      } catch (error) {
        console.error('Error testing edge function:', error);
        alert('Edge function test failed. Check console for details.');
      }
    }
  }

  applyFilters(filters: { searchTerm: string; selectedRole: string; selectedStatus: string; selectedAvailability?: string }) {
    this.page = 1;
    this.filteredStaff = this.staffMembers.filter(staff => {
      const matchesSearch = !filters.searchTerm ||
        staff.full_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        staff.working_email.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        staff.role.toLowerCase().includes(filters.searchTerm.toLowerCase());

      const matchesRole = !filters.selectedRole || staff.role === filters.selectedRole;
      const matchesStatus = !filters.selectedStatus || staff.staff_status === filters.selectedStatus;
      const matchesAvailability = !filters.selectedAvailability ||
        staff.is_available.toString() === filters.selectedAvailability;

      return matchesSearch && matchesRole && matchesStatus && matchesAvailability;
    });
  }

  onPageChange(event: { page: number; pageSize: number }) {
    this.page = event.page;
    this.pageSize = event.pageSize;
  }

  onViewStaff(staff: Staff) {
    this.selectedStaff = { ...staff };
    this.showViewModal = true;
  }

  onEditStaff(staff: Staff) {
    this.selectedStaff = { ...staff };
    this.editForm = {
      ...staff,
      created_at: staff.created_at || '',
      updated_at: staff.updated_at || '',
      image_link: staff.image_link || '',
      gender: staff.gender || '',
      languages: staff.languages || []
    };
    this.languagesInput = staff.languages?.join(', ') || '';
    this.showEditModal = true;
  }



  closeViewModal() {
    this.showViewModal = false;
    this.selectedStaff = null;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedStaff = null;
    this.resetEditForm();
  }

  onCreateStaff() {
    this.resetCreateForm();
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.resetCreateForm();
  }

  // Test edge function connectivity
  async testEdgeFunction() {
    console.log('🧪 Testing edge function...');
    const result = await this.edgeFunctionService.testCreateStaffEdgeFunction();
    console.log('🧪 Test result:', result);

    if (result.success) {
      alert('Edge function test successful! Check console for details.');
    } else {
      alert(`Edge function test failed: ${result.error}\nCheck console for details.`);
    }
  }



  async onSubmitEdit() {
    if (!this.selectedStaff) return;

    this.isLoading = true;
    try {
      const updateData: Partial<Staff> = {
        full_name: this.editForm.full_name,
        working_email: this.editForm.working_email,
        is_available: this.editForm.is_available,
        staff_status: this.editForm.staff_status,
        gender: this.editForm.gender,
        image_link: this.editForm.image_link,
        languages: this.languagesInput ? this.languagesInput.split(',').map(lang => lang.trim()).filter(lang => lang) : []
      };

      const result = await this.supabaseService.updateStaffMember(this.editForm.staff_id, updateData);

      if (result.success && result.data) {
        await this.loadStaff();
        this.closeEditModal();
        console.log('Staff member updated successfully');
      } else {
        console.error('Error updating staff:', result.error);
      }
    } catch (error) {
      console.error('Error updating staff:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async onSubmitCreate() {
    this.isSubmitting = true;
    this.clearFormErrors();

    try {
      // Validate form
      if (!this.validateCreateForm()) {
        this.isSubmitting = false;
        return;
      }

      // Ensure hired_at has a value (required by database)
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      const createData = {
        full_name: this.createForm.full_name,
        working_email: this.createForm.working_email,
        role: this.createForm.role as 'doctor' | 'receptionist',
        years_experience: this.createForm.years_experience || 0,
        hired_at: this.createForm.hired_at || currentDate, // Always provide a date
        is_available: this.createForm.is_available,
        staff_status: this.createForm.staff_status,
        gender: this.createForm.gender || undefined,
        languages: this.createLanguagesInput ?
          this.createLanguagesInput.split(',').map((lang: string) => lang.trim()).filter((lang: string) => lang) :
          undefined,
        image_link: this.createForm.image_link || undefined
      };

      const result = await this.edgeFunctionService.createStaffMember(createData);

      if (result.success && result.data) {
        await this.loadStaff();
        this.closeCreateModal();
        this.submitSuccess = 'Staff member created successfully!';
        setTimeout(() => this.submitSuccess = null, 3000);
      } else {
        this.submitError = result.error || 'Failed to create staff member';
      }
    } catch (error) {
      console.error('Error creating staff:', error);
      this.submitError = 'An unexpected error occurred';
    } finally {
      this.isSubmitting = false;
    }
  }



  getRoleName(roleValue: string): string {
    const role = this.roles.find(r => r.value === roleValue);
    return role ? role.label : roleValue;
  }

  formatDate(date: string | undefined): string {
    return date ? new Date(date).toLocaleDateString() : 'N/A';
  }

  formatDateForInput(date: string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  // Enhanced methods for modern UI
  exportStaff() {
    try {
      const dataToExport = this.filteredStaff.map(staff => ({
        'Staff ID': staff.staff_id,
        'Full Name': staff.full_name,
        'Email': staff.working_email,
        'Role': this.getRoleName(staff.role),
        'Experience (Years)': staff.years_experience || 0,
        'Hired Date': this.formatDate(staff.hired_at),
        'Status': staff.staff_status,
        'Availability': staff.is_available ? 'Available' : 'Unavailable',
        'Gender': staff.gender || 'N/A',
        'Languages': staff.languages?.join(', ') || 'N/A'
      }));

      const csvContent = this.convertToCSV(dataToExport);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `staff_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting staff data:', error);
    }
  }

  onDeleteStaff(staff: Staff) {
    if (confirm(`Are you sure you want to delete ${staff.full_name}? This action cannot be undone.`)) {
      this.deleteStaff(staff.staff_id);
    }
  }

  onBulkAction(action: { type: string; staffIds: string[] }) {
    switch (action.type) {
      case 'delete':
        if (confirm(`Are you sure you want to delete ${action.staffIds.length} staff members? This action cannot be undone.`)) {
          this.bulkDeleteStaff(action.staffIds);
        }
        break;
      case 'activate':
        this.bulkUpdateStatus(action.staffIds, 'active');
        break;
      case 'deactivate':
        this.bulkUpdateStatus(action.staffIds, 'inactive');
        break;
      default:
        console.warn('Unknown bulk action:', action.type);
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'on_leave':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  private convertToCSV(data: any[]): string {
    if (!data.length) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  }

  private async deleteStaff(staffId: string) {
    try {
      this.isLoading = true;
      const result = await this.supabaseService.deleteStaffMember(staffId);

      if (result.success) {
        await this.loadStaff();
        console.log('Staff member deleted successfully');
      } else {
        console.error('Error deleting staff member:', result.error);
      }
    } catch (error) {
      console.error('Error deleting staff member:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async bulkDeleteStaff(staffIds: string[]) {
    try {
      this.isLoading = true;
      const deletePromises = staffIds.map(id => this.supabaseService.deleteStaffMember(id));
      const results = await Promise.all(deletePromises);

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        await this.loadStaff();
        console.log(`${successCount} staff members deleted successfully`);
      }

      if (failCount > 0) {
        console.error(`Failed to delete ${failCount} staff members`);
      }
    } catch (error) {
      console.error('Error in bulk delete:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async bulkUpdateStatus(staffIds: string[], status: string) {
    try {
      this.isLoading = true;
      const updatePromises = staffIds.map(id =>
        this.supabaseService.updateStaffMember(id, { staff_status: status })
      );
      const results = await Promise.all(updatePromises);

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        await this.loadStaff();
        console.log(`${successCount} staff members updated successfully`);
      }

      if (failCount > 0) {
        console.error(`Failed to update ${failCount} staff members`);
      }
    } catch (error) {
      console.error('Error in bulk update:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private resetEditForm() {
    this.editForm = {
      staff_id: '',
      full_name: '',
      working_email: '',
      role: '',
      years_experience: 0,
      hired_at: '',
      is_available: false,
      staff_status: '',
      created_at: '',
      updated_at: '',
      image_link: '',
      gender: '',
      languages: []
    };
    this.languagesInput = '';
  }

  private resetCreateForm() {
    this.createForm = {
      full_name: '',
      working_email: '',
      role: '' as 'doctor' | 'receptionist' | '',
      years_experience: 0,
      hired_at: new Date().toISOString().split('T')[0], // Default to today's date
      is_available: true,
      staff_status: 'active' as 'active' | 'inactive' | 'on_leave',
      gender: '' as 'male' | 'female' | 'other' | '',
      languages: [],
      image_link: ''
    };
    this.createLanguagesInput = '';
    this.clearFormErrors();
  }

  private validateCreateForm(): boolean {
    this.formErrors = {};
    let isValid = true;

    // Required field validations
    if (!this.createForm.full_name.trim()) {
      this.formErrors['full_name'] = 'Full name is required';
      isValid = false;
    }

    if (!this.createForm.working_email.trim()) {
      this.formErrors['working_email'] = 'Email is required';
      isValid = false;
    } else if (!this.isValidEmail(this.createForm.working_email)) {
      this.formErrors['working_email'] = 'Please enter a valid email address';
      isValid = false;
    }

    if (!this.createForm.role) {
      this.formErrors['role'] = 'Role is required';
      isValid = false;
    } else if (this.createForm.role !== 'doctor' && this.createForm.role !== 'receptionist') {
      this.formErrors['role'] = 'Role must be either "doctor" or "receptionist"';
      isValid = false;
    }

    // Optional field validations
    if (this.createForm.years_experience < 0) {
      this.formErrors['years_experience'] = 'Years of experience cannot be negative';
      isValid = false;
    }

    // Validate staff_status if provided
    if (this.createForm.staff_status && !['active', 'inactive', 'on_leave'].includes(this.createForm.staff_status)) {
      this.formErrors['staff_status'] = 'Invalid staff status';
      isValid = false;
    }

    // Validate gender if provided
    if (this.createForm.gender && !['male', 'female', 'other'].includes(this.createForm.gender)) {
      this.formErrors['gender'] = 'Invalid gender selection';
      isValid = false;
    }

    return isValid;
  }







  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  clearFormErrors() {
    this.formErrors = {};
    this.submitError = null;
    this.submitSuccess = null;
  }

  hasError(field: string): boolean {
    return !!this.formErrors[field];
  }

  getError(field: string): string {
    return this.formErrors[field] || '';
  }

  // New methods for inline template functionality
  onSearchChange(searchTerm: string) {
    this.searchTerm = searchTerm;
    this.applyInlineFilters();
  }

  onRoleFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedRole = target.value;
    this.applyInlineFilters();
  }

  onStatusFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedStatus = target.value;
    this.applyInlineFilters();
  }



  getPaginatedStaff(): Staff[] {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredStaff.slice(startIndex, endIndex);
  }

  getInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getStartIndex(): number {
    return (this.page - 1) * this.pageSize;
  }

  getEndIndex(): number {
    const endIndex = this.page * this.pageSize;
    return Math.min(endIndex, this.filteredStaff.length);
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredStaff.length / this.pageSize);
  }

  previousPage() {
    if (this.page > 1) {
      this.page--;
    }
  }

  nextPage() {
    if (this.page < this.getTotalPages()) {
      this.page++;
    }
  }

  // Additional methods for enhanced UI
  getActiveStaffCount(): number {
    return this.staffMembers.filter(staff => staff.staff_status === 'active').length;
  }

  onAvailabilityFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedAvailability = target.value;
    this.applyInlineFilters();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedRole = '';
    this.selectedStatus = '';
    this.selectedAvailability = '';
    this.page = 1;
    this.filteredStaff = [...this.staffMembers];
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const currentPage = this.page;
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...' as any);
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...' as any, totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots.filter((page, index, array) => array.indexOf(page) === index && typeof page === 'number') as number[];
  }

  goToPage(pageNumber: number) {
    if (pageNumber >= 1 && pageNumber <= this.getTotalPages()) {
      this.page = pageNumber;
    }
  }

  onPageSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.pageSize = parseInt(target.value);
    this.page = 1; // Reset to first page when changing page size
  }

  private applyInlineFilters() {
    this.page = 1;
    this.filteredStaff = this.staffMembers.filter(staff => {
      const matchesSearch = !this.searchTerm ||
        staff.full_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        staff.working_email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        staff.role.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesRole = !this.selectedRole || staff.role === this.selectedRole;
      const matchesStatus = !this.selectedStatus || staff.staff_status === this.selectedStatus;
      const matchesAvailability = !this.selectedAvailability ||
        staff.is_available.toString() === this.selectedAvailability;

      return matchesSearch && matchesRole && matchesStatus && matchesAvailability;
    });
  }
}
