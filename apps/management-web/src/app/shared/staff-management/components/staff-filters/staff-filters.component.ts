import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StaffFilters, StaffManagementConfig } from '../../models/staff-management.interface';

@Component({
  selector: 'app-staff-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
      <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <!-- Search -->
        <div class="flex-1 min-w-0">
          <div class="relative">
            <input
              type="text"
              [(ngModel)]="filters.search"
              (ngModelChange)="onFiltersChange()"
              placeholder="Search staff by name, email, or ID..."
              class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <!-- Filters Row -->
        <div class="flex flex-wrap items-center gap-3">
          <!-- Role Filter -->
          <div class="min-w-[140px]">
            <select
              [(ngModel)]="filters.role"
              (ngModelChange)="onFiltersChange()"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">All Roles</option>
              <option *ngFor="let role of availableRoles" [value]="role.value">{{ role.label }}</option>
            </select>
          </div>

          <!-- Status Filter -->
          <div class="min-w-[140px]">
            <select
              [(ngModel)]="filters.status"
              (ngModelChange)="onFiltersChange()"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>

          <!-- Availability Filter -->
          <div class="min-w-[140px]">
            <select
              [(ngModel)]="filters.availability"
              (ngModelChange)="onFiltersChange()"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">All Availability</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>

          <!-- Clear Filters Button -->
          <button
            *ngIf="hasActiveFilters()"
            (click)="clearFilters()"
            class="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            Clear
          </button>
        </div>
      </div>

      <!-- Active Filters Display -->
      <div *ngIf="hasActiveFilters()" class="mt-4 flex flex-wrap gap-2">
        <span class="text-sm text-gray-600 font-medium">Active filters:</span>
        
        <span *ngIf="filters.search" 
              class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
          Search: "{{ filters.search }}"
          <button (click)="clearSearchTerm()" class="ml-1 text-indigo-600 hover:text-indigo-800">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </span>

        <span *ngIf="filters.role" 
              class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          Role: {{ getRoleLabel(filters.role) }}
          <button (click)="clearRole()" class="ml-1 text-purple-600 hover:text-purple-800">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </span>

        <span *ngIf="filters.status" 
              class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Status: {{ filters.status | titlecase }}
          <button (click)="clearStatus()" class="ml-1 text-green-600 hover:text-green-800">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </span>

        <span *ngIf="filters.availability" 
              class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Availability: {{ filters.availability | titlecase }}
          <button (click)="clearAvailability()" class="ml-1 text-blue-600 hover:text-blue-800">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </span>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class StaffFiltersComponent implements OnInit {
  @Input() filters: StaffFilters = {
    search: '',
    role: '',
    status: '',
    availability: '',
    sortBy: 'full_name',
    sortDirection: 'asc'
  };

  @Input() config: StaffManagementConfig = {
    portal: 'admin',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canExport: true,
    canTestEdgeFunction: true
  };

  @Output() filtersChange = new EventEmitter<StaffFilters>();

  availableRoles = [
    { value: 'administrator', label: 'Administrator' },
    { value: 'admin', label: 'Admin' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'receptionist', label: 'Receptionist' },
    { value: 'nurse', label: 'Nurse' },
    { value: 'manager', label: 'Manager' }
  ];

  ngOnInit() {
    // Filter roles based on configuration
    if (this.config.allowedRoles && this.config.allowedRoles.length > 0) {
      this.availableRoles = this.availableRoles.filter(role => 
        this.config.allowedRoles!.includes(role.value)
      );
    }
  }

  onFiltersChange() {
    this.filtersChange.emit({ ...this.filters });
  }

  hasActiveFilters(): boolean {
    return !!(
      this.filters.search ||
      this.filters.role ||
      this.filters.status ||
      this.filters.availability
    );
  }

  clearFilters() {
    this.filters = {
      search: '',
      role: '',
      status: '',
      availability: '',
      sortBy: 'full_name',
      sortDirection: 'asc'
    };
    this.onFiltersChange();
  }

  clearSearchTerm() {
    this.filters.search = '';
    this.onFiltersChange();
  }

  clearRole() {
    this.filters.role = '';
    this.onFiltersChange();
  }

  clearStatus() {
    this.filters.status = '';
    this.onFiltersChange();
  }

  clearAvailability() {
    this.filters.availability = '';
    this.onFiltersChange();
  }

  getRoleLabel(roleValue: string): string {
    const role = this.availableRoles.find(r => r.value === roleValue);
    return role ? role.label : roleValue;
  }
}
