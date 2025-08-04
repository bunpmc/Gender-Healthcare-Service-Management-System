import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { Staff } from '../../models/staff.interface';
import {
  StaffManagementConfig,
  StaffFilters,
  PaginationConfig,
  ModalConfig,
  StaffManagementEvents
} from './models/staff-management.interface';

import { StaffManagementUtilsService } from './services/staff-management-utils.service';
import { StaffFiltersComponent } from './components/staff-filters/staff-filters.component';
import { StaffTableComponent } from './components/staff-table/staff-table.component';
import { StaffModalComponent } from './components/staff-modal/staff-modal.component';

@Component({
  selector: 'app-staff-management-container',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StaffFiltersComponent,
    StaffTableComponent,
    StaffModalComponent
  ],
  template: `
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        <!-- Header -->
        <div class="mb-8">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Staff Management</h1>
              <p class="mt-1 text-sm text-gray-600">Manage your {{ config.portal }} staff members</p>
            </div>
            
            <!-- Action Buttons -->
            <div class="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
              <button 
                *ngIf="config.canExport"
                (click)="onExportData()"
                [disabled]="filteredStaff.length === 0"
                class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Export ({{ filteredStaff.length }})
              </button>

              <button 
                *ngIf="config.canTestEdgeFunction"
                (click)="onTestEdgeFunction()"
                class="inline-flex items-center px-4 py-2 border border-indigo-300 rounded-lg text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
                Test Edge Function
              </button>
              
              <button 
                *ngIf="config.canCreate"
                (click)="onCreateStaff()"
                class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 border border-transparent rounded-lg text-sm font-medium text-white hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Add Staff
              </button>
            </div>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Total Staff</p>
                <p class="text-2xl font-bold text-gray-900">{{ allStaff.length }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Active</p>
                <p class="text-2xl font-bold text-gray-900">{{ getActiveStaffCount() }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Available</p>
                <p class="text-2xl font-bold text-gray-900">{{ getAvailableStaffCount() }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Filtered Results</p>
                <p class="text-2xl font-bold text-gray-900">{{ filteredStaff.length }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Filters Section -->
        <div class="bg-white rounded-lg shadow mb-6">
          <app-staff-filters
            [filters]="currentFilters"
            [config]="config"
            (filtersChange)="onFiltersChange($event)">
          </app-staff-filters>
        </div>

        <!-- Main Content -->
        <div class="bg-white rounded-lg shadow">
          <!-- Table Header -->
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 class="text-lg font-medium text-gray-900">
                  Staff Members
                  <span class="ml-2 text-sm text-gray-500">({{ paginatedStaff.length }} of {{ filteredStaff.length }})</span>
                </h3>
              </div>
              
              <!-- Pagination Info -->
              <div class="mt-3 sm:mt-0 flex items-center space-x-4">
                <div class="flex items-center space-x-2">
                  <label class="text-sm text-gray-700">Show:</label>
                  <select 
                    [(ngModel)]="pagination.pageSize"
                    (ngModelChange)="onPageSizeChange($event)"
                    class="text-sm border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500">
                    <option [value]="10">10</option>
                    <option [value]="25">25</option>
                    <option [value]="50">50</option>
                    <option [value]="100">100</option>
                  </select>
                </div>
                
                <div class="text-sm text-gray-700">
                  Page {{ pagination.currentPage }} of {{ totalPages }}
                </div>
              </div>
            </div>
          </div>

          <!-- Staff Table -->
          <app-staff-table
            [staff]="paginatedStaff"
            [loading]="loading"
            [config]="config"
            (viewStaff)="onViewStaff($event)"
            (editStaff)="onEditStaff($event)"
            (deleteStaff)="onDeleteStaff($event)"
            (createStaff)="onCreateStaff()"
            (customAction)="onCustomAction($event)">
          </app-staff-table>

          <!-- Pagination -->
          <div *ngIf="totalPages > 1" class="px-6 py-4 border-t border-gray-200">
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-700">
                Showing {{ getStartIndex() + 1 }} to {{ getEndIndex() }} of {{ filteredStaff.length }} results
              </div>
              
              <div class="flex items-center space-x-2">
                <button 
                  (click)="onPreviousPage()"
                  [disabled]="pagination.currentPage === 1"
                  class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  Previous
                </button>
                
                <div class="flex items-center space-x-1">
                  <button 
                    *ngFor="let page of getPageNumbers()"
                    (click)="onPageChange(page)"
                    [class]="page === pagination.currentPage ? 
                      'px-3 py-2 text-sm font-medium text-white bg-indigo-600 border border-indigo-600 rounded-md' :
                      'px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50'">
                    {{ page }}
                  </button>
                </div>
                
                <button 
                  (click)="onNextPage()"
                  [disabled]="pagination.currentPage === totalPages"
                  class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Staff Modal -->
    <app-staff-modal
      [isOpen]="modalState.isOpen"
      [staff]="modalState.staff"
      [config]="modalState.config"
      (close)="onModalClose()"
      (edit)="onModalEdit()"
      (save)="onModalSave($event)">
    </app-staff-modal>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class StaffManagementContainerComponent implements OnInit, OnDestroy {
  @Input() allStaff: Staff[] = [];
  @Input() loading: boolean = false;
  @Input() config: StaffManagementConfig = {
    portal: 'admin',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canExport: true,
    canTestEdgeFunction: true
  };
  @Input() events?: StaffManagementEvents;

  // Component state
  private destroy$ = new Subject<void>();
  filteredStaff: Staff[] = [];
  paginatedStaff: Staff[] = [];

  currentFilters: StaffFilters = {
    search: '',
    role: '',
    status: '',
    availability: '',
    sortBy: 'full_name',
    sortDirection: 'asc'
  };

  pagination: PaginationConfig = {
    currentPage: 1,
    pageSize: 25,
    total: 0
  };

  modalState = {
    isOpen: false,
    staff: null as Staff | null,
    config: { mode: 'view', allowEdit: true } as ModalConfig
  };

  constructor(public utils: StaffManagementUtilsService) { }

  ngOnInit() {
    this.initializeData();
    this.setupFilterSubscriptions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeData() {
    this.applyFiltersAndPagination();
  }

  private setupFilterSubscriptions() {
    // Add any reactive filter subscriptions here if needed
  }

  private applyFiltersAndPagination() {
    // Apply filters
    this.filteredStaff = this.utils.applyFilters(this.allStaff, this.currentFilters);

    // Update pagination total
    this.pagination.total = this.filteredStaff.length;

    // Reset to page 1 if current page is beyond available pages
    const maxPage = Math.ceil(this.filteredStaff.length / this.pagination.pageSize) || 1;
    if (this.pagination.currentPage > maxPage) {
      this.pagination.currentPage = 1;
    }

    // Apply pagination
    this.paginatedStaff = this.utils.getPaginatedData(this.filteredStaff, this.pagination);
  }

  // Event Handlers
  onFiltersChange(filters: StaffFilters) {
    this.currentFilters = { ...filters };
    this.pagination.currentPage = 1; // Reset to first page
    this.applyFiltersAndPagination();
  }

  onPageSizeChange(pageSize: number) {
    this.pagination.pageSize = pageSize;
    this.pagination.currentPage = 1;
    this.applyFiltersAndPagination();
  }

  onPageChange(page: number) {
    this.pagination.currentPage = page;
    this.applyFiltersAndPagination();
  }

  onPreviousPage() {
    if (this.pagination.currentPage > 1) {
      this.pagination.currentPage--;
      this.applyFiltersAndPagination();
    }
  }

  onNextPage() {
    if (this.pagination.currentPage < this.totalPages) {
      this.pagination.currentPage++;
      this.applyFiltersAndPagination();
    }
  }

  // Modal handlers
  onViewStaff(staff: Staff) {
    console.log('Viewing staff member:', staff); // Debug log
    this.modalState = {
      isOpen: true,
      staff,
      config: { mode: 'view', allowEdit: this.config.canEdit }
    };
  }

  onEditStaff(staff: Staff) {
    this.modalState = {
      isOpen: true,
      staff,
      config: { mode: 'edit', allowEdit: false }
    };
  }

  onCreateStaff() {
    this.modalState = {
      isOpen: true,
      staff: null,
      config: { mode: 'create', allowEdit: false }
    };
  }

  onDeleteStaff(staff: Staff) {
    if (this.events?.onDelete) {
      this.events.onDelete(staff);
    }
  }

  onModalClose() {
    this.modalState.isOpen = false;
    this.modalState.staff = null;
  }

  onModalEdit() {
    if (this.modalState.staff) {
      this.modalState.config = { mode: 'edit', allowEdit: false };
    }
  }

  onModalSave(staffData: Partial<Staff>) {
    if (this.modalState.config.mode === 'create' && this.events?.onCreate) {
      this.events.onCreate(staffData);
    } else if (this.modalState.config.mode === 'edit' && this.events?.onUpdate) {
      this.events.onUpdate(staffData);
    }
    this.onModalClose();
  }

  onCustomAction(event: { action: string; staff: Staff }) {
    if (this.events?.onCustomAction) {
      this.events.onCustomAction(event.action, event.staff);
    }
  }

  onExportData() {
    if (this.events?.onExport) {
      this.events.onExport(this.filteredStaff);
    } else {
      // Default export functionality
      this.utils.exportToCSV(this.filteredStaff, `staff-export-${new Date().toISOString().split('T')[0]}`);
    }
  }

  onTestEdgeFunction() {
    if (this.events?.onTestEdgeFunction) {
      this.events.onTestEdgeFunction();
    }
  }

  // Computed properties
  get totalPages(): number {
    return Math.ceil(this.filteredStaff.length / this.pagination.pageSize) || 1;
  }

  getActiveStaffCount(): number {
    return this.allStaff.filter(staff => staff.staff_status === 'active').length;
  }

  getAvailableStaffCount(): number {
    return this.allStaff.filter(staff => staff.is_available).length;
  }

  getStartIndex(): number {
    return (this.pagination.currentPage - 1) * this.pagination.pageSize;
  }

  getEndIndex(): number {
    return Math.min(this.getStartIndex() + this.pagination.pageSize, this.filteredStaff.length);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.pagination.currentPage - 2);
    const end = Math.min(this.totalPages, this.pagination.currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }
}
