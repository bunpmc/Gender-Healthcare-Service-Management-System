import { Patient } from './../../../models/patient.interface';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseComponent } from '../../../shared/base.component';

export type SortDirection = 'asc' | 'desc' | null;
export type SortField = keyof Patient;

@Component({
  selector: 'app-patient-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-table.component.html',
  styleUrls: ['./patient-table.component.css']
})
export class PatientTableComponent extends BaseComponent {
  @Input() paginatedPatients: Patient[] = [];
  @Input() totalPatients: number = 0;
  @Input() currentPage: number = 1;

  @Output() viewPatient = new EventEmitter<Patient>();
  @Output() editPatient = new EventEmitter<Patient>();
  @Output() deactivatePatient = new EventEmitter<Patient>();
  @Output() sortChange = new EventEmitter<{ field: SortField; direction: SortDirection }>();
  @Output() bulkAction = new EventEmitter<{ action: string; patientIds: string[] }>();

  // Selection state
  selectedPatients = new Set<string>();

  // Sorting state
  sortField: SortField | null = null;
  sortDirection: SortDirection = null;

  /**
   * Track by function for ngFor performance optimization
   */
  trackByPatientId(index: number, patient: Patient): string {
    return patient.id;
  }

  /**
   * Toggle selection of a single patient
   */
  togglePatientSelection(patientId: string): void {
    if (this.selectedPatients.has(patientId)) {
      this.selectedPatients.delete(patientId);
    } else {
      this.selectedPatients.add(patientId);
    }
  }

  /**
   * Toggle selection of all patients
   */
  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedPatients.clear();
    } else {
      this.paginatedPatients.forEach(patient => {
        this.selectedPatients.add(patient.id);
      });
    }
  }

  /**
   * Check if all patients are selected
   */
  isAllSelected(): boolean {
    return this.paginatedPatients.length > 0 &&
      this.paginatedPatients.every(patient => this.selectedPatients.has(patient.id));
  }

  /**
   * Check if some but not all patients are selected
   */
  isPartiallySelected(): boolean {
    const selectedCount = this.paginatedPatients.filter(patient =>
      this.selectedPatients.has(patient.id)
    ).length;
    return selectedCount > 0 && selectedCount < this.paginatedPatients.length;
  }

  /**
   * Clear all selections
   */
  clearSelection(): void {
    this.selectedPatients.clear();
  }

  /**
   * Handle column sorting
   */
  sort(field: SortField): void {
    if (this.sortField === field) {
      // Toggle direction
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New field
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.sortChange.emit({ field: this.sortField, direction: this.sortDirection });
  }

  /**
   * Get sort icon class for a field
   */
  getSortIcon(field: SortField): string {
    if (this.sortField !== field) {
      return 'text-gray-400';
    }
    return this.sortDirection === 'asc' ? 'text-purple-600 transform rotate-180' : 'text-purple-600';
  }

  /**
   * Get initials from full name
   */
  getInitials(fullName: string): string {
    if (!fullName) return '?';
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  /**
   * Handle bulk export
   */
  bulkExport(): void {
    const selectedIds = Array.from(this.selectedPatients);
    this.bulkAction.emit({ action: 'export', patientIds: selectedIds });
  }

  /**
   * Handle bulk deactivate
   */
  bulkDeactivate(): void {
    const selectedIds = Array.from(this.selectedPatients);
    this.bulkAction.emit({ action: 'deactivate', patientIds: selectedIds });
  }
}
