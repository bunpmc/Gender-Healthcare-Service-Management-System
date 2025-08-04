import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceSearchBarComponent } from './service-search-bar/service-search-bar.component';
import { ServiceTableComponent } from './service-table/service-table.component';
import { Service } from '../../models/service.interface';
import { CategoryService } from '../../Services/category.service';
import { ServiceManagementService } from '../../Services/service-management.service';
import { MedicalServicesDataService } from '../../Services/medical-services-data.service';
import { Category } from '../../models/category.interface';
import { MedicalService } from '../../models/database.interface';

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

  // Image upload properties
  selectedImageFile: File | null = null;
  imagePreviewUrl: string | null = null;
  isUploadingImage = false;

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
    private categoryService: CategoryService,
    private medicalServicesDataService: MedicalServicesDataService
  ) { }

  async ngOnInit() {
    await this.loadData();
    // Check if default image exists
    await this.medicalServicesDataService.ensureDefaultImageExists();
  }

  async loadData() {
    this.isLoading = true;
    try {
      // Use new MedicalServicesDataService to fetch services with proper image URLs
      const [servicesResult, categoriesResult] = await Promise.all([
        this.medicalServicesDataService.fetchServices({ includeInactive: true }),
        this.medicalServicesDataService.fetchCategories()
      ]);

      if (servicesResult.success && servicesResult.data) {
        this.services = servicesResult.data;
        console.log('✅ Services loaded successfully:', this.services.length, 'services');
        // Debug log for image URLs
        this.services.forEach(service => {
          if (service.imageUrl) {
            console.log(`Service "${service.service_name}" has image URL:`, service.imageUrl);
          }
        });
      } else {
        console.error('❌ Error loading services:', servicesResult.error);
        this.showErrorNotification('Failed to load services');
      }

      if (categoriesResult.success && categoriesResult.data) {
        this.categories = categoriesResult.data.map((cat: any) => ({
          category_id: cat.category_id,
          category_name: cat.category_name,
          description: cat.category_description
        }));
        console.log('✅ Categories loaded successfully:', this.categories.length, 'categories');
      } else {
        console.error('❌ Error loading categories:', categoriesResult.error);
        this.showErrorNotification('Failed to load categories');
      }

      this.filteredServices = [...this.services];

    } catch (error) {
      console.error('❌ Error fetching data:', error);
      this.showErrorNotification('Failed to load data');
    } finally {
      this.isLoading = false;
    }
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;

    if (endPage > this.totalPages) {
      endPage = this.totalPages;
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      // No need to call updatePaginatedServices; paginatedServices getter handles pagination.
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

      const matchesStatus = !filters.selectedStatus || (service.is_active ?? false).toString() === filters.selectedStatus;

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
          // Soft delete - just deactivate the service by updating is_active to false
          const result = await this.medicalServicesDataService.updateService(service.service_id, { is_active: false });
          if (result.success) {
            this.showSuccessNotification('Service deactivated successfully!');
          } else {
            throw new Error(result.error || 'Failed to deactivate service');
          }
        } else {
          // Hard delete - permanently remove the service
          const result = await this.medicalServicesDataService.deleteService(service.service_id);
          if (result.success) {
            this.showSuccessNotification('Service permanently deleted!');
          } else {
            throw new Error(result.error || 'Failed to delete service');
          }
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

      // Use new MedicalServicesDataService to update the status
      const result = await this.medicalServicesDataService.updateService(event.service.service_id, {
        is_active: event.isActive
      });

      if (result.success) {
        await this.loadData();
        this.showSuccessNotification(`Service ${event.isActive ? 'activated' : 'deactivated'} successfully!`);
      } else {
        throw new Error(result.error || 'Failed to update service status');
      }
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
    this.clearImageSelection();
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

      // Upload image first if a file is selected
      let uploadedImagePath = null;
      if (this.selectedImageFile) {
        uploadedImagePath = await this.uploadImageIfSelected();
        if (!uploadedImagePath) {
          // Upload failed, method already shows error message
          return;
        }
      }

      const serviceToAdd = {
        ...this.newService,
        service_description: this.descriptionKeys.reduce((acc, key) => {
          acc[key] = this.newServiceDescription[key] || null;
          return acc;
        }, {} as { [key in DescriptionKey]: string | null })
      };

      // Remove service_id for creation and convert null to undefined
      const { service_id, ...serviceData } = serviceToAdd;

      // Convert null values to undefined for compatibility and set image_link if uploaded
      const processedServiceData = {
        ...serviceData,
        service_cost: serviceData.service_cost === null ? undefined : serviceData.service_cost,
        duration_minutes: serviceData.duration_minutes === null ? undefined : serviceData.duration_minutes,
        image_link: uploadedImagePath || undefined, // Let service handle default image if no upload
        excerpt: serviceData.excerpt === null ? undefined : serviceData.excerpt
      };

      // Use new MedicalServicesDataService
      const result = await this.medicalServicesDataService.createService(processedServiceData);

      if (result.success) {
        await this.loadData();
        this.closeAddServiceModal();
        this.showSuccessNotification('Service added successfully!');
      } else {
        throw new Error(result.error || 'Failed to create service');
      }
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
    this.clearImageSelection();
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

      // Upload new image if a file is selected
      let uploadedImagePath = null;
      if (this.selectedImageFile) {
        uploadedImagePath = await this.uploadImageIfSelected();
        if (!uploadedImagePath) {
          // Upload failed, method already shows error message
          return;
        }
      }

      const serviceToUpdate: Service = {
        ...this.selectedService,
        service_description: this.descriptionKeys.reduce((acc, key) => {
          acc[key] = this.selectedServiceDescription[key] || null;
          return acc;
        }, {} as { [key in DescriptionKey]: string | null })
      };

      // Convert null values to undefined for compatibility and set image_link if uploaded
      const processedServiceData = {
        ...serviceToUpdate,
        service_cost: serviceToUpdate.service_cost === null ? undefined : serviceToUpdate.service_cost,
        duration_minutes: serviceToUpdate.duration_minutes === null ? undefined : serviceToUpdate.duration_minutes,
        image_link: uploadedImagePath || (serviceToUpdate.image_link === null ? undefined : serviceToUpdate.image_link),
        excerpt: serviceToUpdate.excerpt === null ? undefined : serviceToUpdate.excerpt
      };

      // Use new MedicalServicesDataService
      const result = await this.medicalServicesDataService.updateService(this.selectedService.service_id, processedServiceData);

      if (result.success) {
        await this.loadData();
        this.closeEditServiceModal();
        this.showSuccessNotification('Service updated successfully!');
      } else {
        throw new Error(result.error || 'Failed to update service');
      }
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

      // Use new MedicalServicesDataService to create category
      const result = await this.medicalServicesDataService.createCategory(categoryData);

      if (result.success) {
        await this.loadData();
        this.closeAddCategoryModal();
        this.showSuccessNotification('Category added successfully!');
      } else {
        throw new Error(result.error || 'Failed to create category');
      }
    } catch (error) {
      console.error('❌ Error adding category:', error);
      this.showErrorNotification('Failed to add category. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  // Image upload methods
  onImageFileSelected(event: any, context: 'new' | 'edit') {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.showErrorNotification('Please select a valid image file.');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.showErrorNotification('Image file size must be less than 5MB.');
        return;
      }

      this.selectedImageFile = file;

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  clearImageSelection() {
    this.selectedImageFile = null;
    this.imagePreviewUrl = null;
  }

  async uploadImageIfSelected(): Promise<string | null> {
    if (!this.selectedImageFile) return null;

    try {
      this.isUploadingImage = true;
      const result = await this.medicalServicesDataService.uploadServiceImage(this.selectedImageFile);

      if (result.success && result.data) {
        console.log('✅ Image uploaded successfully:', result.data);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      this.showErrorNotification('Failed to upload image. Please try again.');
      return null;
    } finally {
      this.isUploadingImage = false;
    }
  }

  // Notification methods
  private notificationTimeout: any;

  showSuccessNotification(message: string) {
    this.clearNotificationTimeout();
    this.notificationMessage = message;
    this.notificationType = 'success';
    this.showNotification = true;
    this.notificationTimeout = setTimeout(() => {
      this.hideNotification();
    }, 5000);
  }

  showErrorNotification(message: string) {
    this.clearNotificationTimeout();
    this.notificationMessage = message;
    this.notificationType = 'error';
    this.showNotification = true;
    this.notificationTimeout = setTimeout(() => {
      this.hideNotification();
    }, 7000);
  }

  showWarningNotification(message: string) {
    this.clearNotificationTimeout();
    this.notificationMessage = message;
    this.notificationType = 'warning';
    this.showNotification = true;
    this.notificationTimeout = setTimeout(() => {
      this.hideNotification();
    }, 6000);
  }

  hideNotification() {
    // Add slide-out animation
    const notificationElement = document.querySelector('.notification-toast');
    if (notificationElement) {
      notificationElement.classList.add('animate-slide-out-right');
      setTimeout(() => {
        this.showNotification = false;
        if (notificationElement) {
          notificationElement.classList.remove('animate-slide-out-right');
        }
      }, 300); // Wait for animation to complete
    } else {
      this.showNotification = false;
    }
  }

  closeNotification() {
    this.clearNotificationTimeout();
    this.hideNotification();
  }

  private clearNotificationTimeout() {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
      this.notificationTimeout = null;
    }
  }
}


type DescriptionKey = 'what' | 'why' | 'who' | 'how';
