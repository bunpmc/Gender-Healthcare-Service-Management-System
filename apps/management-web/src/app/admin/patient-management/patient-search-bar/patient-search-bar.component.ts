import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface PatientFilters {
  query: string;
  gender: string | undefined;
  status: string;
  ageRange: string;
  dateRange: string;
}

@Component({
  selector: 'app-patient-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-search-bar.component.html',
  styleUrls: ['./patient-search-bar.component.css']
})
export class PatientSearchBarComponent {
  @Output() filterChange = new EventEmitter<PatientFilters>();
  @Output() exportData = new EventEmitter<void>();
  @Input() totalResults?: number;

  // Search and filter properties
  searchQuery: string = '';
  genderFilter: string = '';
  statusFilter: string = '';
  ageRangeFilter: string = '';
  dateRangeFilter: string = '';

  // Filter options
  genderOptions = ['male', 'female', 'other', 'prefer_not_to_say'];
  statusOptions = ['active', 'inactive', 'suspended'];

  /**
   * Apply all current filters and emit the filter change event
   */
  applyFilters() {
    const filters: PatientFilters = {
      query: this.searchQuery.trim(),
      gender: this.genderFilter,
      status: this.statusFilter,
      ageRange: this.ageRangeFilter,
      dateRange: this.dateRangeFilter
    };

    this.filterChange.emit(filters);
  }

  /**
   * Clear the search query
   */
  clearSearch() {
    this.searchQuery = '';
    this.applyFilters();
  }

  /**
   * Clear all active filters
   */
  clearAllFilters() {
    this.searchQuery = '';
    this.genderFilter = '';
    this.statusFilter = '';
    this.ageRangeFilter = '';
    this.dateRangeFilter = '';
    this.applyFilters();
  }

  /**
   * Check if any filters are currently active
   */
  hasActiveFilters(): boolean {
    return !!(
      this.searchQuery ||
      this.genderFilter ||
      this.statusFilter ||
      this.ageRangeFilter ||
      this.dateRangeFilter
    );
  }



  /**
   * Emit export data event
   */
  exportPatients() {
    this.exportData.emit();
  }
}
