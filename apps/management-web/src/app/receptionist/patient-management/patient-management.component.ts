import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../supabase.service';
import { Patient } from '../../models/patient.interface';

@Component({
  selector: 'app-receptionist-patient-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-management.component.html',
  styleUrls: ['./patient-management.component.css'],
})
export class PatientManagementComponent implements OnInit {
  // Data properties
  patients: Patient[] = [];
  filteredPatients: Patient[] = [];
  isLoading = false;

  // Pagination
  currentPage: number = 1;
  readonly pageSize: number = 10;

  // Filtering
  searchQuery: string = '';
  selectedGender: string = '';
  selectedStatus: string = '';

  // Modal states
  showCreateModal = false;
  showEditModal = false;
  showViewModal = false;
  selectedPatient: Patient | null = null;

  // New patient form
  newPatient: Partial<Patient> = {
    full_name: '',
    email: '',
    phone: '',
    phone_number: '',
    date_of_birth: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    allergies: [],
    chronic_conditions: [],
    past_surgeries: [],
    patient_status: 'active',
  };

  // Form arrays
  newAllergy: string = '';
  newCondition: string = '';
  newSurgery: string = '';

  // Options
  genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];

  statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  // Statistics
  stats = {
    totalPatients: 0,
    activePatients: 0,
    newThisMonth: 0,
    femalePatients: 0,
  };

  // Error handling
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private supabaseService: SupabaseService) {}

  async ngOnInit() {
    await this.loadPatients();
    await this.calculateStats();
  }

  async loadPatients() {
    this.isLoading = true;
    try {
      const result = await this.supabaseService.getAllPatients();
      if (result.success && result.data) {
        this.patients = result.data;
        this.filteredPatients = [...this.patients];
        this.applyFilters();
      } else {
        this.showError(
          'Error loading patients: ' + (result.error || 'Unknown error')
        );
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      this.showError('Failed to load patients');
    } finally {
      this.isLoading = false;
    }
  }

  async calculateStats() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    this.stats = {
      totalPatients: this.patients.length,
      activePatients: this.patients.filter((p) => p.patient_status === 'active')
        .length,
      newThisMonth: this.patients.filter((p) => {
        const createdDate = new Date(p.created_at || '');
        return (
          createdDate.getMonth() === currentMonth &&
          createdDate.getFullYear() === currentYear
        );
      }).length,
      femalePatients: this.patients.filter((p) => p.gender === 'female').length,
    };
  }

  // Pagination methods
  get paginatedPatients(): Patient[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredPatients.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredPatients.length / this.pageSize);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // Filtering methods
  applyFilters() {
    this.filteredPatients = this.patients.filter((patient) => {
      const matchesSearch =
        !this.searchQuery ||
        patient.full_name
          .toLowerCase()
          .includes(this.searchQuery.toLowerCase()) ||
        (patient.email &&
          patient.email
            .toLowerCase()
            .includes(this.searchQuery.toLowerCase())) ||
        (patient.phone_number &&
          patient.phone_number.includes(this.searchQuery)) ||
        (patient.phone && patient.phone.includes(this.searchQuery));

      const matchesGender =
        !this.selectedGender || patient.gender === this.selectedGender;
      const matchesStatus =
        !this.selectedStatus || patient.patient_status === this.selectedStatus;

      return matchesSearch && matchesGender && matchesStatus;
    });

    this.currentPage = 1;
  }

  onSearchChange() {
    this.applyFilters();
  }

  onGenderFilterChange() {
    this.applyFilters();
  }

  onStatusFilterChange() {
    this.applyFilters();
  }

  // Modal methods
  openCreateModal() {
    this.resetNewPatientForm();
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.resetNewPatientForm();
  }

  openEditModal(patient: Patient) {
    this.selectedPatient = { ...patient };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedPatient = null;
  }

  openViewModal(patient: Patient) {
    this.selectedPatient = patient;
    this.showViewModal = true;
  }

  closeViewModal() {
    this.showViewModal = false;
    this.selectedPatient = null;
  }

  resetNewPatientForm() {
    this.newPatient = {
      full_name: '',
      email: '',
      phone: '',
      phone_number: '',
      date_of_birth: '',
      gender: '' as 'male' | 'female' | 'other' | '',
      address: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      allergies: [],
      chronic_conditions: [],
      past_surgeries: [],
      patient_status: 'active',
    };
    this.newAllergy = '';
    this.newCondition = '';
    this.newSurgery = '';
    this.clearMessages();
  }

  // Array management methods
  addAllergy() {
    if (
      this.newAllergy.trim() &&
      !this.newPatient.allergies?.includes(this.newAllergy.trim())
    ) {
      if (!this.newPatient.allergies) {
        this.newPatient.allergies = [];
      }
      this.newPatient.allergies.push(this.newAllergy.trim());
      this.newAllergy = '';
    }
  }

  removeAllergy(index: number) {
    if (this.newPatient.allergies) {
      this.newPatient.allergies.splice(index, 1);
    }
  }

  addCondition() {
    if (
      this.newCondition.trim() &&
      !this.newPatient.chronic_conditions?.includes(this.newCondition.trim())
    ) {
      if (!this.newPatient.chronic_conditions) {
        this.newPatient.chronic_conditions = [];
      }
      this.newPatient.chronic_conditions.push(this.newCondition.trim());
      this.newCondition = '';
    }
  }

  removeCondition(index: number) {
    if (this.newPatient.chronic_conditions) {
      this.newPatient.chronic_conditions.splice(index, 1);
    }
  }

  addSurgery() {
    if (
      this.newSurgery.trim() &&
      !this.newPatient.past_surgeries?.includes(this.newSurgery.trim())
    ) {
      if (!this.newPatient.past_surgeries) {
        this.newPatient.past_surgeries = [];
      }
      this.newPatient.past_surgeries.push(this.newSurgery.trim());
      this.newSurgery = '';
    }
  }

  removeSurgery(index: number) {
    if (this.newPatient.past_surgeries) {
      this.newPatient.past_surgeries.splice(index, 1);
    }
  }

  // CRUD operations (CRU only, no Delete)
  async createPatient() {
    if (!this.validatePatientForm()) {
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    try {
      const result = await this.supabaseService.addPatient(
        this.newPatient as Patient
      );

      if (result.success) {
        this.showSuccess('Patient created successfully!');
        await this.loadPatients();
        await this.calculateStats();
        this.closeCreateModal();
      } else {
        this.showError(result.error || 'Failed to create patient');
      }
    } catch (error) {
      console.error('Error creating patient:', error);
      this.showError('An unexpected error occurred while creating patient');
    } finally {
      this.isLoading = false;
    }
  }

  async updatePatient() {
    if (!this.selectedPatient) return;

    this.isLoading = true;
    this.clearMessages();

    try {
      const result = await this.supabaseService.updatePatient(
        this.selectedPatient.id,
        this.selectedPatient
      );

      if (result.success) {
        this.showSuccess('Patient updated successfully!');
        await this.loadPatients();
        await this.calculateStats();
        this.closeEditModal();
      } else {
        this.showError(result.error || 'Failed to update patient');
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      this.showError('An unexpected error occurred while updating patient');
    } finally {
      this.isLoading = false;
    }
  }

  // Utility methods
  validatePatientForm(): boolean {
    if (!this.newPatient.full_name?.trim()) {
      this.showError('Full name is required');
      return false;
    }
    if (
      !this.newPatient.phone?.trim() &&
      !this.newPatient.phone_number?.trim()
    ) {
      this.showError('Phone number is required');
      return false;
    }
    if (!this.newPatient.date_of_birth) {
      this.showError('Date of birth is required');
      return false;
    }
    if (!this.newPatient.gender) {
      this.showError('Gender is required');
      return false;
    }
    return true;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getGenderBadgeClass(gender: string): string {
    switch (gender) {
      case 'male':
        return 'bg-blue-100 text-blue-800';
      case 'female':
        return 'bg-pink-100 text-pink-800';
      case 'other':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('vi-VN');
  }

  calculateAge(dateOfBirth: string | null): number {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  formatArrayField(array: string[] | undefined): string {
    return array && array.length > 0 ? array.join(', ') : 'None';
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
}
