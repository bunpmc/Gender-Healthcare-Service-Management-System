import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface AppointmentFilters {
  query: string;
  status: string;
  visitType: string;
  doctor: string;
  dateRange: string;
  appointmentType: string; // 'patient', 'guest', or '' for all
}

export interface Doctor {
  staff_id: string;
  full_name: string;
}

@Component({
  selector: 'app-appointment-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appointment-search-bar.component.html',
  styleUrls: ['./appointment-search-bar.component.css']
})
export class AppointmentSearchBarComponent implements OnInit {
  @Input() totalResults: number = 0;
  @Input() doctors: Doctor[] = [];

  @Output() filterChange = new EventEmitter<AppointmentFilters>();
  @Output() exportData = new EventEmitter<void>();


  // Filter properties
  searchQuery: string = '';
  statusFilter: string = '';
  visitTypeFilter: string = '';
  doctorFilter: string = '';
  dateRangeFilter: string = '';
  appointmentTypeFilter: string = '';

  ngOnInit() {
    // Initialize component
  }

  /**
   * Apply all current filters and emit the filter change event
   */
  applyFilters() {
    const filters: AppointmentFilters = {
      query: this.searchQuery.trim(),
      status: this.statusFilter,
      visitType: this.visitTypeFilter,
      doctor: this.doctorFilter,
      dateRange: this.dateRangeFilter,
      appointmentType: this.appointmentTypeFilter
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
    this.statusFilter = '';
    this.visitTypeFilter = '';
    this.doctorFilter = '';
    this.dateRangeFilter = '';
    this.appointmentTypeFilter = '';
    this.applyFilters();
  }

  /**
   * Check if any filters are currently active
   */
  hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.statusFilter || this.visitTypeFilter ||
              this.doctorFilter || this.dateRangeFilter || this.appointmentTypeFilter);
  }

  /**
   * Get doctor name by ID
   */
  getDoctorName(doctorId: string): string {
    const doctor = this.doctors.find(d => d.staff_id === doctorId);
    return doctor ? doctor.full_name : 'Unknown';
  }

  /**
   * Export appointments data
   */
  exportAppointments() {
    this.exportData.emit();
  }


}
