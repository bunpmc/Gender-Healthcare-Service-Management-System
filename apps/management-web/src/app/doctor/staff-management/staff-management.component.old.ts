import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../supabase.service';
import { Staff, CreateStaffRequest, CreateStaffResponse, Role } from '../../models/staff.interface';

@Component({
  selector: 'app-doctor-staff-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './staff-management.component.html',
  styleUrls: ['./staff-management.component.css']
})
export class StaffManagementComponent implements OnInit {
  // Data properties
  staffMembers: Staff[] = [];
  filteredStaff: Staff[] = [];
  isLoading = false;

  // Pagination
  currentPage: number = 1;
  readonly pageSize: number = 10;

  // Filtering and search
  searchQuery: string = '';
  selectedRole: string = '';
  selectedStatus: string = '';

  // Modal states
  showAddModal = false;
  showEditModal = false;
  showViewModal = false;
  selectedStaff: Staff | null = null;

  // Form data for adding new staff
  newStaff: CreateStaffRequest = {
    full_name: '',
    working_email: '',
    role: '',
    years_experience: 0,
    hired_at: '',
    is_available: true,
    staff_status: 'active',
    gender: '',
    languages: [],
    phone: ''
  };

  // Available options
  roles: Role[] = [];
  statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'on_leave', label: 'On Leave' }
  ];

  genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ];

  // Languages management
  availableLanguages = ['English', 'Vietnamese', 'French', 'Spanish', 'Chinese', 'Japanese', 'Korean'];
  newLanguage: string = '';

  // Image upload
  selectedImageFile: File | null = null;
  imagePreview: string | null = null;

  // Error handling
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private supabaseService: SupabaseService) {}

  async ngOnInit() {
    await this.loadStaff();
    await this.loadRoles();
  }

  async loadStaff() {
    this.isLoading = true;
    try {
      const result = await this.supabaseService.getAllStaff();
      if (result.success && result.data) {
        this.staffMembers = result.data;
        this.filteredStaff = [...this.staffMembers];
        this.applyFilters();
      } else {
        this.showError('Error loading staff: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error loading staff:', error);
      this.showError('Failed to load staff members');
    } finally {
      this.isLoading = false;
    }
  }

  async loadRoles() {
    try {
      this.roles = await this.supabaseService.getStaffRoles();
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  }

  // Pagination methods
  get paginatedStaff(): Staff[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredStaff.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredStaff.length / this.pageSize);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // Filtering methods
  applyFilters() {
    this.filteredStaff = this.staffMembers.filter(staff => {
      const matchesSearch = !this.searchQuery ||
        staff.full_name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        staff.working_email.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesRole = !this.selectedRole || staff.role === this.selectedRole;
      const matchesStatus = !this.selectedStatus || staff.staff_status === this.selectedStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });

    this.currentPage = 1;
  }

  onSearchChange() {
    this.applyFilters();
  }

  onRoleFilterChange() {
    this.applyFilters();
  }

  onStatusFilterChange() {
    this.applyFilters();
  }

  // Modal methods
  openAddModal() {
    this.resetForm();
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
    this.resetForm();
  }

  openEditModal(staff: Staff) {
    this.selectedStaff = { ...staff };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedStaff = null;
  }

  openViewModal(staff: Staff) {
    this.selectedStaff = staff;
    this.showViewModal = true;
  }

  closeViewModal() {
    this.showViewModal = false;
    this.selectedStaff = null;
  }

  resetForm() {
    this.newStaff = {
      full_name: '',
      working_email: '',
      role: '',
      years_experience: 0,
      hired_at: '',
      is_available: true,
      staff_status: 'active',
      gender: '',
      languages: [],
      phone: ''
    };
    this.selectedImageFile = null;
    this.imagePreview = null;
    this.newLanguage = '';
    this.clearMessages();
  }

  // Language management
  addLanguage() {
    if (this.newLanguage.trim() && !this.newStaff.languages?.includes(this.newLanguage.trim())) {
      if (!this.newStaff.languages) {
        this.newStaff.languages = [];
      }
      this.newStaff.languages.push(this.newLanguage.trim());
      this.newLanguage = '';
    }
  }

  removeLanguage(index: number) {
    if (this.newStaff.languages) {
      this.newStaff.languages.splice(index, 1);
    }
  }

  // Image handling
  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImageFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedImageFile = null;
    this.imagePreview = null;
  }

  // CRUD operations
  async addStaff() {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    try {
      // First, try the Edge Function approach
      try {
        const staffData: CreateStaffRequest = {
          ...this.newStaff,
          imageFile: this.selectedImageFile || undefined
        };

        const result: CreateStaffResponse = await this.supabaseService.createStaffWithEdgeFunction(staffData);

        if (result.success) {
          this.showSuccess('Staff member created successfully with authentication!');
          await this.loadStaff();
          this.closeAddModal();
          return;
        } else {
          console.warn('Edge Function failed, falling back to direct method:', result.error?.message);
          if (result.error?.code === 'EDGE_FUNCTION_NOT_DEPLOYED') {
            this.showError('Edge Function not deployed. Using fallback method...');
          }
        }
      } catch (edgeError: any) {
        console.warn('Edge Function not available, using direct method:', edgeError);
        if (edgeError.message?.includes('Failed to send a request')) {
          console.log('💡 Tip: Deploy the Edge Function with: supabase functions deploy create-staff');
        }
      }

      // Fallback: Use direct Supabase method
      const staffData = {
        full_name: this.newStaff.full_name,
        working_email: this.newStaff.working_email,
        role: this.newStaff.role,
        years_experience: this.newStaff.years_experience,
        hired_at: this.newStaff.hired_at,
        is_available: this.newStaff.is_available,
        staff_status: this.newStaff.staff_status,
        gender: this.newStaff.gender,
        languages: this.newStaff.languages,
        phone: this.newStaff.phone
      };

      // Generate avatar URL if no image
      let imageUrl = null;
      if (this.selectedImageFile) {
        // For now, we'll use a placeholder or generate an avatar
        const initials = this.extractInitials(staffData.full_name);
        imageUrl = this.generateAvatarUrl(initials);
      } else {
        const initials = this.extractInitials(staffData.full_name);
        imageUrl = this.generateAvatarUrl(initials);
      }

      const result = await this.supabaseService.createStaffWithAuth({
        ...staffData,
        image_link: imageUrl
      });

      if (result.success) {
        this.showSuccess('Staff member created successfully!');
        await this.loadStaff();
        this.closeAddModal();
      } else {
        this.showError(result.error || 'Failed to create staff member');
      }
    } catch (error) {
      console.error('Error creating staff:', error);
      this.showError('An unexpected error occurred while creating staff member');
    } finally {
      this.isLoading = false;
    }
  }

  async updateStaff() {
    if (!this.selectedStaff) return;

    this.isLoading = true;
    this.clearMessages();

    try {
      const result = await this.supabaseService.updateStaffMember(this.selectedStaff.staff_id, this.selectedStaff);

      if (result.success) {
        this.showSuccess('Staff member updated successfully!');
        await this.loadStaff();
        this.closeEditModal();
      } else {
        this.showError(result.error || 'Failed to update staff member');
      }
    } catch (error) {
      console.error('Error updating staff:', error);
      this.showError('An unexpected error occurred while updating staff member');
    } finally {
      this.isLoading = false;
    }
  }

  async deleteStaff(staff: Staff) {
    if (!confirm(`Are you sure you want to delete ${staff.full_name}? This action cannot be undone.`)) {
      return;
    }

    this.isLoading = true;
    try {
      const result = await this.supabaseService.deleteStaffMember(staff.staff_id);

      if (result.success) {
        this.showSuccess('Staff member deleted successfully!');
        await this.loadStaff();
      } else {
        this.showError(result.error || 'Failed to delete staff member');
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      this.showError('An unexpected error occurred while deleting staff member');
    } finally {
      this.isLoading = false;
    }
  }

  // Utility methods
  validateForm(): boolean {
    if (!this.newStaff.full_name.trim()) {
      this.showError('Full name is required');
      return false;
    }
    if (!this.newStaff.working_email.trim()) {
      this.showError('Email is required');
      return false;
    }
    if (!this.newStaff.role) {
      this.showError('Role is required');
      return false;
    }
    if (!this.newStaff.hired_at) {
      this.showError('Hire date is required');
      return false;
    }
    return true;
  }

  showError(message: string) {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => this.clearMessages(), 5000);
  }

  showSuccess(message: string) {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => this.clearMessages(), 5000);
  }

  clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
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

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'doctor':
        return 'bg-blue-100 text-blue-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'receptionist':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatLanguages(languages: string[] | undefined): string {
    return languages && languages.length > 0 ? languages.join(', ') : 'N/A';
  }

  // Helper methods for avatar generation
  extractInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  generateAvatarUrl(initials: string): string {
    const base = "https://ui-avatars.com/api/";
    const encoded = encodeURIComponent(initials);
    return `${base}?name=${encoded}&background=random&size=256`;
  }
}
