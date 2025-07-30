import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceSearchBarComponent } from './service-search-bar/service-search-bar.component';
import { ServiceTableComponent } from './service-table/service-table.component';
import { Service } from '../../models/service.interface';
import { CategoryService } from '../../Services/category.service';
import { ServiceManagementService } from '../../Services/service-management.service';
import { Category } from '../../models/category.interface';

@Component({
  selector: 'app-service-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ServiceSearchBarComponent, ServiceTableComponent],
  templateUrl: './service-management.component.html',
  styleUrls: ['./service-management.component.css']
})
export class ServiceManagementComponent implements OnInit {
  // Data properties
  services: Service[] = [];
  categories: Category[] = [];
  filteredServices: Service[] = [];
  isLoading = false;

  // Pagination
  currentPage: number = 1;
  readonly pageSize: number = 10;

  // Modal states
  showAddModal = false;
  showEditModal = false;
  showViewModal = false;
  showCategoryModal = false;

  // Service form data
  descriptionKeys: DescriptionKey[] = ['what', 'why', 'who', 'how'];
  newService: Service = {
    service_id: '',
    category_id: '',
    service_name: '',
    service_description: null,
    service_cost: null,
    duration_minutes: null,
    is_active: true,
    image_link: null,
    excerpt: null
  };
  selectedService: Service = { ...this.newService };
  newServiceDescription: { [key in DescriptionKey]: string } = {
    what: '',
    why: '',
    who: '',
    how: ''
  };
  selectedServiceDescription: { [key in DescriptionKey]: string } = {
    what: '',
    why: '',
    who: '',
    how: ''
  };

  // Category form data
  newCategory: Category = {
    category_id: '',
    category_name: '',
    description: ''
  };
  selectedCategory: Category = { ...this.newCategory };

  // Validation errors
  errors: {
    service_name: boolean;
    category_id: boolean;
    service_cost: boolean;
    duration_minutes: boolean;
  } = {
    service_name: false,
    category_id: false,
    service_cost: false,
    duration_minutes: false
  };

  categoryErrors: {
    category_name: boolean;
  } = {
    category_name: false
  };

  // Filtering and sorting
  currentFilters: {
    searchTerm: string;
    selectedCategory: string;
    selectedStatus: string;
  } = {
    searchTerm: '',
    selectedCategory: '',
    selectedStatus: ''
  };

  // Notification state
  showNotification = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' | 'warning' = 'success';

  // Utility
  Math = Math;

  constructor(
    private serviceManagementService: ServiceManagementService,
    private categoryService: CategoryService
  ) {}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    try {
      const [services, categories] = await Promise.all([
        this.serviceManagementService.getMedicalServices(),
        this.categoryService.getServiceCategories()
      ]);
      this.services = services;
      this.categories = categories;
      this.filteredServices = [...this.services];
      console.log('✅ Services and categories loaded successfully');
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      // You can implement a toast notification here
    } finally {
      this.isLoading = false;
    }
  }

  get paginatedServices(): Service[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredServices.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredServices.length / this.pageSize);
  }

  goToFirstPage() {
    this.currentPage = 1;
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  goToLastPage() {
    this.currentPage = this.totalPages;
  }

  applyFilters(filters: { searchTerm: string; selectedCategory: string; selectedStatus: string }) {
    this.currentFilters = filters;
    this.filteredServices = this.services.filter(service => {
      const matchesSearch = !filters.searchTerm ||
        service.service_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        service.excerpt?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (service as any).category_name?.toLowerCase().includes(filters.searchTerm.toLowerCase());

      const matchesCategory = !filters.selectedCategory || service.category_id === filters.selectedCategory;

      const matchesStatus = !filters.selectedStatus || service.is_active.toString() === filters.selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
    this.currentPage = 1; // Reset to first page on filter change
  }

  // Export functionality
  exportServices() {
    try {
      const csvContent = this.generateCSV();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `services_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('✅ Services exported successfully');
    } catch (error) {
      console.error('❌ Error exporting services:', error);
    }
  }

  private generateCSV(): string {
    const headers = ['Service ID', 'Service Name', 'Category', 'Cost', 'Duration (min)', 'Status', 'Excerpt'];
    const rows = this.filteredServices.map(service => [
      service.service_id,
      service.service_name,
      (service as any).category_name || 'Unknown',
      service.service_cost?.toString() || '',
      service.duration_minutes?.toString() || '',
      service.is_active ? 'Active' : 'Inactive',
      service.excerpt || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  // Sorting functionality
  onSortChange(sortEvent: { field: string; direction: 'asc' | 'desc' | null }) {
    if (!sortEvent.direction) {
      this.filteredServices = [...this.services];
      this.applyFilters(this.currentFilters);
      return;
    }

    this.filteredServices.sort((a, b) => {
      let aValue: any = a[sortEvent.field as keyof Service];
      let bValue: any = b[sortEvent.field as keyof Service];

      // Handle special cases
      if (sortEvent.field === 'category_name') {
        aValue = (a as any).category_name || '';
        bValue = (b as any).category_name || '';
      }

      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortEvent.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }

  // Service actions
  async onDeleteService(service: Service) {
    const action = service.is_active ? 'deactivate' : 'permanently delete';
    const confirmMessage = service.is_active
      ? `Are you sure you want to deactivate the service "${service.service_name}"? You can reactivate it later.`
      : `Are you sure you want to permanently delete the service "${service.service_name}"? This action cannot be undone.`;

    if (confirm(confirmMessage)) {
      try {
        this.isLoading = true;

        if (service.is_active) {
          // Soft delete - just deactivate the service
          await this.serviceManagementService.toggleMedicalServiceStatus(service.service_id, false);
          this.showSuccessNotification('Service deactivated successfully!');
        } else {
          // Hard delete - permanently remove the service
          await this.serviceManagementService.deleteMedicalService(service.service_id);
          this.showSuccessNotification('Service permanently deleted!');
        }

        await this.loadData();
      } catch (error) {
        console.error('❌ Error deleting service:', error);
        this.showErrorNotification(`Failed to ${action} service. Please try again.`);
      } finally {
        this.isLoading = false;
      }
    }
  }

  async onToggleServiceStatus(event: { service: Service; isActive: boolean }) {
    try {
      this.isLoading = true;
      await this.serviceManagementService.toggleMedicalServiceStatus(event.service.service_id, event.isActive);
      await this.loadData();
      this.showSuccessNotification(`Service ${event.isActive ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('❌ Error toggling service status:', error);
      this.showErrorNotification('Failed to update service status. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  hasErrors(): boolean {
    return Object.values(this.errors).some(error => error) ||
      !this.newService.service_name ||
      !this.newService.category_id ||
      (this.newService.service_cost != null && this.newService.service_cost < 0) ||
      (this.newService.duration_minutes != null && (this.newService.duration_minutes <= 0 || this.newService.duration_minutes > 60));
  }

  openAddServiceModal() {
    this.newService = {
      service_id: '',
      category_id: '',
      service_name: '',
      service_description: null,
      service_cost: null,
      duration_minutes: null,
      is_active: true,
      image_link: null,
      excerpt: null
    };
    this.newServiceDescription = {
      what: '',
      why: '',
      who: '',
      how: ''
    };
    this.errors = {
      service_name: false,
      category_id: false,
      service_cost: false,
      duration_minutes: false
    };
    this.showAddModal = true;
  }

  closeAddServiceModal() {
    this.showAddModal = false;
    this.errors = {
      service_name: false,
      category_id: false,
      service_cost: false,
      duration_minutes: false
    };
  }

  async addService() {
    this.errors = {
      service_name: !this.newService.service_name,
      category_id: !this.newService.category_id,
      service_cost: this.newService.service_cost != null && this.newService.service_cost < 0,
      duration_minutes: this.newService.duration_minutes != null && (this.newService.duration_minutes <= 0 || this.newService.duration_minutes > 60)
    };

    if (this.hasErrors()) {
      return;
    }

    try {
      this.isLoading = true;
      const serviceToAdd = {
        ...this.newService,
        service_description: this.descriptionKeys.reduce((acc, key) => {
          acc[key] = this.newServiceDescription[key] || null;
          return acc;
        }, {} as { [key in DescriptionKey]: string | null })
      };

      // Remove service_id for creation
      const { service_id, ...serviceData } = serviceToAdd;

      await this.serviceManagementService.addMedicalService(serviceData);
      await this.loadData();
      this.closeAddServiceModal();
      this.showSuccessNotification('Service added successfully!');
    } catch (error) {
      console.error('❌ Error adding service:', error);
      this.showErrorNotification('Failed to add service. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  openEditServiceModal(service: Service) {
    this.selectedService = { ...service };
    this.selectedServiceDescription = {
      what: service.service_description?.what || '',
      why: service.service_description?.why || '',
      who: service.service_description?.who || '',
      how: service.service_description?.how || ''
    };
    this.errors = {
      service_name: false,
      category_id: false,
      service_cost: false,
      duration_minutes: false
    };
    this.showEditModal = true;
  }

  closeEditServiceModal() {
    this.showEditModal = false;
    this.errors = {
      service_name: false,
      category_id: false,
      service_cost: false,
      duration_minutes: false
    };
  }

  async updateService() {
    this.errors = {
      service_name: !this.selectedService.service_name,
      category_id: !this.selectedService.category_id,
      service_cost: this.selectedService.service_cost != null && this.selectedService.service_cost < 0,
      duration_minutes: this.selectedService.duration_minutes != null && (this.selectedService.duration_minutes <= 0 || this.selectedService.duration_minutes > 60)
    };

    if (this.hasErrors()) {
      return;
    }

    try {
      this.isLoading = true;
      const serviceToUpdate: Service = {
        ...this.selectedService,
        service_description: this.descriptionKeys.reduce((acc, key) => {
          acc[key] = this.selectedServiceDescription[key] || null;
          return acc;
        }, {} as { [key in DescriptionKey]: string | null })
      };
      await this.serviceManagementService.updateMedicalService(serviceToUpdate);
      await this.loadData();
      this.closeEditServiceModal();
      this.showSuccessNotification('Service updated successfully!');
    } catch (error) {
      console.error('❌ Error updating service:', error);
      this.showErrorNotification('Failed to update service. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  openViewServiceModal(service: Service) {
    this.selectedService = { ...service };
    this.showViewModal = true;
  }

  closeViewServiceModal() {
    this.showViewModal = false;
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c.category_id === categoryId);
    return category ? category.category_name : 'Unknown';
  }

  // Category Management Methods
  openAddCategoryModal() {
    this.newCategory = {
      category_id: '',
      category_name: '',
      description: ''
    };
    this.categoryErrors = {
      category_name: false
    };
    this.showCategoryModal = true;
  }

  closeAddCategoryModal() {
    this.showCategoryModal = false;
    this.categoryErrors = {
      category_name: false
    };
  }

  async addCategory() {
    this.categoryErrors = {
      category_name: !this.newCategory.category_name
    };

    if (this.categoryErrors.category_name) {
      return;
    }

    try {
      this.isLoading = true;
      const { category_id, ...categoryData } = this.newCategory;
      await this.categoryService.createServiceCategory(categoryData);
      await this.loadData();
      this.closeAddCategoryModal();
      this.showSuccessNotification('Category added successfully!');
    } catch (error) {
      console.error('❌ Error adding category:', error);
      this.showErrorNotification('Failed to add category. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  // Notification methods
  showSuccessNotification(message: string) {
    this.notificationMessage = message;
    this.notificationType = 'success';
    this.showNotification = true;
    setTimeout(() => {
      this.showNotification = false;
    }, 5000);
  }

  showErrorNotification(message: string) {
    this.notificationMessage = message;
    this.notificationType = 'error';
    this.showNotification = true;
    setTimeout(() => {
      this.showNotification = false;
    }, 7000);
  }

  showWarningNotification(message: string) {
    this.notificationMessage = message;
    this.notificationType = 'warning';
    this.showNotification = true;
    setTimeout(() => {
      this.showNotification = false;
    }, 6000);
  }

  closeNotification() {
    this.showNotification = false;
  }
}

type DescriptionKey = 'what' | 'why' | 'who' | 'how';
