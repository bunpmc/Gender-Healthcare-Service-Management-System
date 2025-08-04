import { Category } from './../../../models/category.interface';
import { Service } from './../../../models/service.interface';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseComponent } from '../../../shared/base.component';

export type SortDirection = 'asc' | 'desc' | null;
export type SortField = 'service_name' | 'category_name' | 'service_cost' | 'duration_minutes' | 'is_active';

@Component({
  selector: 'app-service-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './service-table.component.html',
  styleUrls: ['./service-table.component.css']
})
export class ServiceTableComponent extends BaseComponent {
  @Input() paginatedServices: Service[] = [];
  @Input() totalServices: number = 0;
  @Input() currentPage: number = 1;
  @Input() categories: Category[] = [];

  @Output() viewService = new EventEmitter<Service>();
  @Output() editService = new EventEmitter<Service>();
  @Output() deleteService = new EventEmitter<Service>();
  @Output() toggleStatus = new EventEmitter<{ service: Service; isActive: boolean }>();
  @Output() sortChange = new EventEmitter<{ field: SortField; direction: SortDirection }>();

  // Sorting state
  sortField: SortField | null = null;
  sortDirection: SortDirection = null;

  // Selection state
  selectedServices = new Set<string>();
  selectAll = false;

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c.category_id === categoryId);
    return category ? category.category_name : 'Unknown';
  }

  // Sorting methods
  onSort(field: SortField) {
    if (this.sortField === field) {
      // Cycle through: asc -> desc -> null
      if (this.sortDirection === 'asc') {
        this.sortDirection = 'desc';
      } else if (this.sortDirection === 'desc') {
        this.sortDirection = null;
        this.sortField = null;
      } else {
        this.sortDirection = 'asc';
      }
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.sortChange.emit({
      field: this.sortField!,
      direction: this.sortDirection
    });
  }

  getSortIcon(field: SortField): string {
    if (this.sortField !== field) {
      return 'M7 10l5 5 5-5H7z'; // Default sort icon
    }
    if (this.sortDirection === 'asc') {
      return 'M7 14l5-5 5 5H7z'; // Up arrow
    } else if (this.sortDirection === 'desc') {
      return 'M7 10l5 5 5-5H7z'; // Down arrow
    }
    return 'M7 10l5 5 5-5H7z'; // Default
  }

  // Selection methods
  toggleServiceSelection(serviceId: string) {
    if (this.selectedServices.has(serviceId)) {
      this.selectedServices.delete(serviceId);
    } else {
      this.selectedServices.add(serviceId);
    }
    this.updateSelectAllState();
  }

  toggleSelectAll() {
    if (this.selectAll) {
      this.selectedServices.clear();
    } else {
      this.paginatedServices.forEach(service => {
        this.selectedServices.add(service.service_id);
      });
    }
    this.selectAll = !this.selectAll;
  }

  private updateSelectAllState() {
    const visibleServiceIds = this.paginatedServices.map(s => s.service_id);
    this.selectAll = visibleServiceIds.length > 0 &&
      visibleServiceIds.every(id => this.selectedServices.has(id));
  }

  // Action methods
  onViewService(service: Service) {
    this.viewService.emit(service);
  }

  onEditService(service: Service) {
    this.editService.emit(service);
  }

  onDeleteService(service: Service) {
    this.deleteService.emit(service);
  }

  onToggleStatus(service: Service) {
    this.toggleStatus.emit({
      service,
      isActive: !service.is_active
    });
  }

  // Utility methods
  trackByServiceId(index: number, service: Service): string {
    return service.service_id;
  }

  formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getBooleanStatusBadgeClass(isActive?: boolean | undefined): string {
    return isActive === true
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  }

  formatBooleanStatus(isActive?: boolean | undefined): string {
    return isActive === true ? 'Active' : 'Inactive';
  }

  truncateText(text: string | null | undefined, maxLength: number = 50): string {
    if (!text) return 'N/A';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
}
