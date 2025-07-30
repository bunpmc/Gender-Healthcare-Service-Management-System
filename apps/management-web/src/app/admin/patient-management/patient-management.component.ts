import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../supabase.service';
import { PatientSearchBarComponent, PatientFilters } from './patient-search-bar/patient-search-bar.component';
import { PatientTableComponent, SortDirection, SortField } from './patient-table/patient-table.component';
import { Patient } from '../../models/patient.interface';

@Component({
  selector: 'app-patient-management',
  standalone: true,
  imports: [CommonModule, FormsModule, PatientSearchBarComponent, PatientTableComponent],
  templateUrl: './patient-management.component.html',
  styleUrls: ['./patient-management.component.css']
})
export class PatientManagementComponent implements OnInit {
  // Data properties
  patients: Patient[] = [];
  filteredPatients: Patient[] = [];
  isLoading = false;

  // Pagination
  currentPage: number = 1;
  readonly pageSize: number = 10;

  // Filtering and sorting
  currentFilters: PatientFilters = {
    query: '',
    gender: undefined,
    status: '',
    ageRange: '',
    dateRange: ''
  };
  sortField: SortField | null = null;
  sortDirection: SortDirection = null;

  // Modal states
  showViewModal = false;
  showEditModal = false;
  selectedPatient: Patient | null = null;

  // Enhanced medical information fields
  allergiesList: string[] = [];
  chronicConditionsList: string[] = [];
  pastSurgeriesList: string[] = [];

  // Input fields for adding new items
  newAllergy: string = '';
  newChronicCondition: string = '';
  newPastSurgery: string = '';

  constructor(private supabaseService: SupabaseService) { }

  async ngOnInit() {
    await this.loadPatients();
  }

  async loadPatients() {
    this.isLoading = true;
    try {
      const result = await this.supabaseService.getAllPatients();
      if (result.success && result.data) {
        this.patients = result.data;
        this.filteredPatients = [...this.patients];
      } else {
        console.error('Error loading patients:', result.error);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      this.isLoading = false;
    }
  }

  get paginatedPatients(): Patient[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredPatients.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredPatients.length / this.pageSize);
  }

  goToFirstPage() {
    this.currentPage = 1;
  }

  goToPreviousPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  goToLastPage() {
    this.currentPage = this.totalPages;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  /**
   * Get visible page numbers for pagination
   */
  getVisiblePages(): number[] {
    const totalPages = this.totalPages;
    const currentPage = this.currentPage;
    const visiblePages: number[] = [];

    if (totalPages <= 7) {
      // Show all pages if total is 7 or less
      for (let i = 1; i <= totalPages; i++) {
        visiblePages.push(i);
      }
    } else {
      // Show smart pagination
      if (currentPage <= 4) {
        // Show first 5 pages + ... + last page
        for (let i = 1; i <= 5; i++) {
          visiblePages.push(i);
        }
        if (totalPages > 6) {
          visiblePages.push(-1); // Ellipsis placeholder
          visiblePages.push(totalPages);
        }
      } else if (currentPage >= totalPages - 3) {
        // Show first page + ... + last 5 pages
        visiblePages.push(1);
        if (totalPages > 6) {
          visiblePages.push(-1); // Ellipsis placeholder
        }
        for (let i = totalPages - 4; i <= totalPages; i++) {
          visiblePages.push(i);
        }
      } else {
        // Show first page + ... + current-1, current, current+1 + ... + last page
        visiblePages.push(1);
        visiblePages.push(-1); // Ellipsis placeholder
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          visiblePages.push(i);
        }
        visiblePages.push(-1); // Ellipsis placeholder
        visiblePages.push(totalPages);
      }
    }

    return visiblePages.filter(page => page > 0); // Remove ellipsis placeholders for now
  }

  /**
   * Expose Math object to template
   */
  get Math() {
    return Math;
  }

  /**
   * Apply filters to the patient list
   */
  applyFilters(filters: PatientFilters) {
    this.currentFilters = filters;

    this.filteredPatients = this.patients.filter(patient => {
      // Text search across multiple fields
      if (filters.query) {
        const query = filters.query.toLowerCase();
        const searchableText = [
          patient.full_name,
          patient.email,
          patient.phone,
          patient.id
        ].join(' ').toLowerCase();

        if (!searchableText.includes(query)) {
          return false;
        }
      }

      // Gender filter
      if (filters.gender && patient.gender !== filters.gender) {
        return false;
      }

      // Status filter
      if (filters.status && patient.patient_status !== filters.status) {
        return false;
      }

      // Age range filter
      if (filters.ageRange && patient.date_of_birth) {
        const age = this.calculateAge(patient.date_of_birth);
        if (!this.isAgeInRange(age, filters.ageRange)) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange && patient.created_at) {
        if (!this.isDateInRange(patient.created_at, filters.dateRange)) {
          return false;
        }
      }

      return true;
    });

    // Apply sorting if active
    if (this.sortField && this.sortDirection) {
      this.applySorting();
    }

    this.currentPage = 1;
  }

  /**
   * Check if age falls within the specified range
   */
  private isAgeInRange(age: number, range: string): boolean {
    switch (range) {
      case '0-18': return age >= 0 && age <= 18;
      case '19-35': return age >= 19 && age <= 35;
      case '36-50': return age >= 36 && age <= 50;
      case '51-65': return age >= 51 && age <= 65;
      case '65+': return age > 65;
      default: return true;
    }
  }

  /**
   * Check if date falls within the specified range
   */
  private isDateInRange(dateString: string, range: string): boolean {
    const date = new Date(dateString);
    const now = new Date();

    switch (range) {
      case 'today':
        return date.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return date >= monthAgo;
      case 'quarter':
        const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        return date >= quarterAgo;
      case 'year':
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        return date >= yearAgo;
      default:
        return true;
    }
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Apply sorting to the filtered patients
   */
  private applySorting(): void {
    if (!this.sortField || !this.sortDirection) return;

    this.filteredPatients.sort((a, b) => {
      const aValue = a[this.sortField!];
      const bValue = b[this.sortField!];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return this.sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return this.sortDirection === 'asc' ? -1 : 1;

      // Compare values
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Handle sorting change from table
   */
  onSortChange(event: { field: SortField; direction: SortDirection }): void {
    this.sortField = event.field;
    this.sortDirection = event.direction;
    this.applySorting();
  }



  /**
   * Handle bulk actions from table
   */
  async onBulkAction(event: { action: string; patientIds: string[] }): Promise<void> {
    switch (event.action) {
      case 'export':
        this.exportPatients(event.patientIds);
        break;

      case 'deactivate':
        await this.bulkDeactivatePatients(event.patientIds);
        break;
      case 'delete':
        this.bulkDelete(event.patientIds);
        break;
    }
  }

  /**
   * Export patients data
   */
  exportPatients(patientIds?: string[]): void {
    const patientsToExport = patientIds
      ? this.patients.filter(p => patientIds.includes(p.id))
      : this.filteredPatients;

    // Create CSV content
    const headers = ['ID', 'Full Name', 'Email', 'Phone', 'Gender', 'Status', 'Date of Birth', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...patientsToExport.map(patient => [
        patient.id,
        `"${patient.full_name}"`,
        patient.email || '',
        patient.phone || '',
        patient.gender || '',
        patient.patient_status || '',
        patient.date_of_birth || '',
        patient.created_at || ''
      ].join(','))
    ].join('\n');

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `patients_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }



  /**
   * Bulk deactivate patients (soft delete)
   */
  async bulkDeactivatePatients(patientIds: string[]): Promise<void> {
    if (confirm(`Are you sure you want to deactivate ${patientIds.length} patient(s)? This will change their status to inactive but preserve their data.`)) {
      try {
        this.isLoading = true;
        const promises = patientIds.map(id => this.supabaseService.softDeletePatient(id));
        const results = await Promise.all(promises);

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.length - successCount;

        if (successCount > 0) {
          // Update local data
          this.patients.forEach(patient => {
            if (patientIds.includes(patient.id)) {
              patient.patient_status = 'deleted';
            }
          });
          this.applyFilters(this.currentFilters);
        }

        if (failureCount > 0) {
          alert(`${successCount} patient(s) deactivated successfully. ${failureCount} failed.`);
        } else {
          console.log(`${successCount} patient(s) deactivated successfully.`);
        }
      } catch (error) {
        console.error('Error in bulk deactivate:', error);
        alert('An error occurred during bulk deactivation.');
      } finally {
        this.isLoading = false;
      }
    }
  }

  /**
   * Handle bulk delete
   */
  bulkDelete(patientIds: string[]): void {
    // TODO: Implement bulk delete confirmation modal
    console.log('Bulk delete for patients:', patientIds);
  }

  /**
   * Handle patient deactivation (soft delete)
   */
  async onDeactivatePatient(patient: Patient): Promise<void> {
    if (confirm(`Are you sure you want to deactivate ${patient.full_name}? This will change their status to inactive but preserve their data.`)) {
      try {
        this.isLoading = true;
        const result = await this.supabaseService.softDeletePatient(patient.id);

        if (result.success) {
          // Update the patient status in the local array
          const patientIndex = this.patients.findIndex(p => p.id === patient.id);
          if (patientIndex !== -1) {
            this.patients[patientIndex].patient_status = 'deleted';
          }

          // Reapply filters to update the view
          this.applyFilters(this.currentFilters);

          console.log('Patient deactivated successfully');
        } else {
          console.error('Failed to deactivate patient:', result.error);
          alert('Failed to deactivate patient. Please try again.');
        }
      } catch (error) {
        console.error('Error deactivating patient:', error);
        alert('An error occurred while deactivating the patient.');
      } finally {
        this.isLoading = false;
      }
    }
  }



  openViewPatientModal(patient: Patient) {
    this.selectedPatient = { ...patient };
    this.showViewModal = true;
  }

  closeViewModal() {
    this.showViewModal = false;
    this.selectedPatient = null;
  }

  openEditPatientModal(patient: Patient) {
    this.selectedPatient = { ...patient };

    // Convert medical information to arrays for tag-based editing
    this.allergiesList = this.convertToStringArray(patient.allergies);
    this.chronicConditionsList = this.convertToStringArray(patient.chronic_conditions);
    this.pastSurgeriesList = this.convertToStringArray(patient.past_surgeries);

    // Clear input fields
    this.newAllergy = '';
    this.newChronicCondition = '';
    this.newPastSurgery = '';

    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedPatient = null;

    // Clear medical information arrays and input fields
    this.allergiesList = [];
    this.chronicConditionsList = [];
    this.pastSurgeriesList = [];
    this.newAllergy = '';
    this.newChronicCondition = '';
    this.newPastSurgery = '';
  }

  async updatePatient() {
    if (!this.selectedPatient) return;
    try {
      await this.supabaseService.updatePatient(this.selectedPatient.id, this.selectedPatient);
      const result = await this.supabaseService.getPatients(1, 1000);
      this.patients = result.patients || [];
      this.filteredPatients = [...this.patients];
      this.closeEditModal();
    } catch (error) {
      console.error('Error updating patient:', error);
    }
  }

  isObject(value: any): value is Record<string, string> {
    return value && typeof value === 'object' && !Array.isArray(value);
  }

  objectKeys(obj: Record<string, string>): string[] {
    return obj ? Object.keys(obj) : [];
  }

  formatJsonField(value: Record<string, string> | string[] | string | null): string {
    if (!value) return 'N/A';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.join(', ');
    return JSON.stringify(value);
  }



  // ============= ENHANCED MEDICAL INFORMATION METHODS ============= //

  /**
   * Convert medical information to string array for tag-based editing
   */
  convertToStringArray(value: Record<string, string> | string[] | string | null): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(item => item && item.trim());
    if (typeof value === 'string') {
      // Handle comma-separated or semicolon-separated values
      return value.split(/[,;]/).map(item => item.trim()).filter(item => item);
    }
    if (typeof value === 'object') {
      // Convert object to array of "key: value" strings
      return Object.entries(value).map(([key, val]) => `${key}: ${val}`).filter(item => item);
    }
    return [];
  }

  /**
   * Add new allergy
   */
  addAllergy(): void {
    if (this.newAllergy.trim()) {
      this.allergiesList.push(this.newAllergy.trim());
      this.newAllergy = '';
      this.updatePatientMedicalField('allergies', this.allergiesList);
    }
  }

  /**
   * Remove allergy
   */
  removeAllergy(index: number): void {
    this.allergiesList.splice(index, 1);
    this.updatePatientMedicalField('allergies', this.allergiesList);
  }

  /**
   * Add new chronic condition
   */
  addChronicCondition(): void {
    if (this.newChronicCondition.trim()) {
      this.chronicConditionsList.push(this.newChronicCondition.trim());
      this.newChronicCondition = '';
      this.updatePatientMedicalField('chronic_conditions', this.chronicConditionsList);
    }
  }

  /**
   * Remove chronic condition
   */
  removeChronicCondition(index: number): void {
    this.chronicConditionsList.splice(index, 1);
    this.updatePatientMedicalField('chronic_conditions', this.chronicConditionsList);
  }

  /**
   * Add new past surgery
   */
  addPastSurgery(): void {
    if (this.newPastSurgery.trim()) {
      this.pastSurgeriesList.push(this.newPastSurgery.trim());
      this.newPastSurgery = '';
      this.updatePatientMedicalField('past_surgeries', this.pastSurgeriesList);
    }
  }

  /**
   * Remove past surgery
   */
  removePastSurgery(index: number): void {
    this.pastSurgeriesList.splice(index, 1);
    this.updatePatientMedicalField('past_surgeries', this.pastSurgeriesList);
  }

  /**
   * Update patient medical field with array data
   */
  private updatePatientMedicalField(field: 'allergies' | 'chronic_conditions' | 'past_surgeries', data: string[]): void {
    if (!this.selectedPatient) return;

    // Store as array for easier handling
    (this.selectedPatient as any)[field] = data.length > 0 ? data : null;
  }

  /**
   * Handle Enter key press for adding items
   */
  onEnterKey(event: KeyboardEvent, type: 'allergy' | 'chronic' | 'surgery'): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      switch (type) {
        case 'allergy':
          this.addAllergy();
          break;
        case 'chronic':
          this.addChronicCondition();
          break;
        case 'surgery':
          this.addPastSurgery();
          break;
      }
    }
  }


}
