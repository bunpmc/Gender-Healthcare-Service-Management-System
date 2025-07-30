import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Patient } from '../../models/patient.interface';
import { Service } from '../../models/service.interface';
import { SupabaseService } from '../../supabase.service';
import { CurrencyUtil } from '../../utils/currency.util';

interface PaymentRecord {
  payment_id: string;
  patient_id: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  services: ServiceUsage[];
  total_amount: number;
  paid_amount: number;
  payment_status: 'pending' | 'paid' | 'partial' | 'overdue';
  payment_date?: string;
  due_date: string;
  created_at: string;
  updated_at: string;
  payment_method?: string;
  notes?: string;
}

interface ServiceUsage {
  service_id: string;
  service_name: string;
  service_price: number;
  quantity: number;
  usage_date: string;
  appointment_id?: string;
}

interface MockPatient {
  id: string;
  full_name: string;
  email: string;
  phone: string;
}

interface MockService {
  id: string;
  name: string;
  price: number;
  category: string;
}

@Component({
  selector: 'app-payment-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [SupabaseService],
  templateUrl: './payment-management.component.html',
  styleUrls: ['./payment-management.component.css'],
})
export class PaymentManagementComponent implements OnInit {
  // Data properties
  paymentRecords: PaymentRecord[] = [];
  filteredRecords: PaymentRecord[] = [];
  patients: Patient[] = [];
  services: Service[] = [];
  isLoading = false;

  // Pagination
  currentPage: number = 1;
  readonly pageSize: number = 10;

  // Filtering
  searchQuery: string = '';
  selectedStatus: string = '';
  selectedDateRange: string = '';

  // Modal states
  showPaymentModal = false;
  showServiceModal = false;
  selectedRecord: PaymentRecord | null = null;

  // New payment form
  newPayment = {
    patient_id: '',
    services: [] as ServiceUsage[],
    payment_status: 'pending' as 'pending' | 'paid' | 'partial' | 'overdue',
  };

  // Service selection
  selectedService: Service | null = null;
  serviceQuantity: number = 1;

  // Statistics
  stats = {
    totalRevenue: 0,
    pendingPayments: 0,
    paidToday: 0,
    overduePayments: 0,
  };

  // Status options
  statusOptions = [
    {
      value: 'pending',
      label: 'Pending',
      color: 'bg-yellow-100 text-yellow-800',
    },
    { value: 'paid', label: 'Paid', color: 'bg-green-100 text-green-800' },
    { value: 'partial', label: 'Partial', color: 'bg-blue-100 text-blue-800' },
    { value: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-800' },
  ];

  // Error handling
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private supabaseService: SupabaseService) { }

  async ngOnInit() {
    await this.loadInitialData();
    await this.calculateStats();
  }

  async loadInitialData() {
    this.isLoading = true;
    try {
      await Promise.all([
        this.loadPaymentRecords(),
        this.loadPatients(),
        this.loadServices(),
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.showError('Failed to load data');
    } finally {
      this.isLoading = false;
    }
  }

  async loadPaymentRecords() {
    try {
      // This would be a custom query to get payment records with patient info
      // For now, we'll simulate the data structure
      const result = await this.supabaseService.getAllPatients();
      if (result.success && result.data) {
        // Transform patient data into payment records
        this.paymentRecords = this.generatePaymentRecords(result.data);
        this.filteredRecords = [...this.paymentRecords];
        this.applyFilters();
      }
    } catch (error) {
      console.error('Error loading payment records:', error);
      this.showError('Failed to load payment records');
    }
  }

  async loadPatients() {
    try {
      const result = await this.supabaseService.getAllPatients();
      if (result.success && result.data) {
        this.patients = result.data;
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  }

  async loadServices() {
    try {
      const result = await this.supabaseService.getAllServices();
      if (result.success && result.data) {
        this.services = result.data;
      }
    } catch (error) {
      console.error('Error loading services:', error);
    }
  }

  generatePaymentRecords(patients: Patient[]): PaymentRecord[] {
    // Simulate payment records based on patients
    return patients.map((patient, index) => {
      const totalAmount = Math.floor(Math.random() * 500) + 100;
      const paidAmount =
        Math.random() > 0.3
          ? totalAmount
          : Math.floor(totalAmount * Math.random());

      return {
        payment_id: `PAY-${Date.now()}-${index}`,
        patient_id: patient.id,
        patient_name: patient.full_name,
        patient_email: patient.email || '',
        patient_phone: patient.phone || patient.phone_number || '',
        services: this.generateRandomServices(),
        total_amount: totalAmount,
        paid_amount: paidAmount,
        payment_status: this.getRandomStatus(),
        payment_date:
          Math.random() > 0.5 ? new Date().toISOString() : undefined,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        created_at: patient.created_at || new Date().toISOString(),
        updated_at: patient.updated_at || new Date().toISOString(),
      };
    });
  }

  generateRandomServices(): ServiceUsage[] {
    const serviceCount = Math.floor(Math.random() * 3) + 1;
    const randomServices: ServiceUsage[] = [];

    for (let i = 0; i < serviceCount; i++) {
      randomServices.push({
        service_id: `SRV-${i}`,
        service_name: ['Consultation', 'Blood Test', 'X-Ray', 'Ultrasound'][
          Math.floor(Math.random() * 4)
        ],
        service_price: Math.floor(Math.random() * 200) + 50,
        quantity: Math.floor(Math.random() * 2) + 1,
        usage_date: new Date().toISOString(),
        appointment_id: `APT-${Date.now()}-${i}`,
      });
    }

    return randomServices;
  }

  getRandomStatus(): 'pending' | 'paid' | 'partial' | 'overdue' {
    const statuses: ('pending' | 'paid' | 'partial' | 'overdue')[] = [
      'pending',
      'paid',
      'partial',
      'overdue',
    ];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  async calculateStats() {
    this.stats = {
      totalRevenue: this.paymentRecords
        .filter((r) => r.payment_status === 'paid')
        .reduce((sum, r) => sum + r.total_amount, 0),
      pendingPayments: this.paymentRecords.filter(
        (r) => r.payment_status === 'pending'
      ).length,
      paidToday: this.paymentRecords.filter(
        (r) => r.payment_status === 'paid' && this.isToday(r.payment_date)
      ).length,
      overduePayments: this.paymentRecords.filter(
        (r) => r.payment_status === 'overdue'
      ).length,
    };
  }

  isToday(dateString?: string): boolean {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  // Pagination methods
  get paginatedRecords(): PaymentRecord[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredRecords.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredRecords.length / this.pageSize);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // Filtering methods
  applyFilters() {
    this.filteredRecords = this.paymentRecords.filter((record) => {
      const matchesSearch =
        !this.searchQuery ||
        record.patient_name
          .toLowerCase()
          .includes(this.searchQuery.toLowerCase()) ||
        record.patient_email
          .toLowerCase()
          .includes(this.searchQuery.toLowerCase()) ||
        record.payment_id
          .toLowerCase()
          .includes(this.searchQuery.toLowerCase());

      const matchesStatus =
        !this.selectedStatus || record.payment_status === this.selectedStatus;

      const matchesDateRange =
        !this.selectedDateRange ||
        this.isInDateRange(record.created_at, this.selectedDateRange);

      return matchesSearch && matchesStatus && matchesDateRange;
    });

    this.currentPage = 1;
  }

  isInDateRange(dateString: string, range: string): boolean {
    const date = new Date(dateString);
    const now = new Date();

    switch (range) {
      case 'today':
        return date.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
      case 'month':
        const monthAgo = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          now.getDate()
        );
        return date >= monthAgo;
      default:
        return true;
    }
  }

  onSearchChange() {
    this.applyFilters();
  }

  onStatusFilterChange() {
    this.applyFilters();
  }

  onDateRangeChange() {
    this.applyFilters();
  }

  // Modal methods
  openPaymentModal(record?: PaymentRecord) {
    if (record) {
      this.selectedRecord = record;
    } else {
      this.resetNewPaymentForm();
    }
    this.showPaymentModal = true;
  }

  closePaymentModal() {
    this.showPaymentModal = false;
    this.selectedRecord = null;
    this.resetNewPaymentForm();
  }

  openServiceModal() {
    this.showServiceModal = true;
  }

  closeServiceModal() {
    this.showServiceModal = false;
    this.selectedService = null;
    this.serviceQuantity = 1;
  }

  resetNewPaymentForm() {
    this.newPayment = {
      patient_id: '',
      services: [],
      payment_status: 'pending' as 'pending' | 'paid' | 'partial' | 'overdue',
    };
  }

  // Service management
  addServiceToPayment() {
    if (this.selectedService) {
      const serviceUsage: ServiceUsage = {
        service_id: this.selectedService.service_id,
        service_name: this.selectedService.service_name,
        service_price: this.selectedService.service_cost || 0,
        quantity: this.serviceQuantity,
        usage_date: new Date().toISOString(),
      };

      this.newPayment.services.push(serviceUsage);
      this.closeServiceModal();
    }
  }

  removeServiceFromPayment(index: number) {
    this.newPayment.services.splice(index, 1);
  }

  getTotalAmount(): number {
    return this.newPayment.services.reduce(
      (total, service) => total + service.service_price * service.quantity,
      0
    );
  }

  // Payment operations
  async updatePaymentStatus(record: PaymentRecord, event: any) {
    const newStatus = event.target.value;
    if (!newStatus) return;
    try {
      this.isLoading = true;

      // Update the record
      const updatedRecord = { ...record, payment_status: newStatus as any };
      if (newStatus === 'paid') {
        updatedRecord.payment_date = new Date().toISOString();
      }

      // Update in the array
      const index = this.paymentRecords.findIndex(
        (r) => r.payment_id === record.payment_id
      );
      if (index !== -1) {
        this.paymentRecords[index] = updatedRecord;
        this.applyFilters();
        await this.calculateStats();
        this.showSuccess('Payment status updated successfully');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      this.showError('Failed to update payment status');
    } finally {
      this.isLoading = false;
    }
  }

  async createPayment() {
    if (!this.newPayment.patient_id || this.newPayment.services.length === 0) {
      this.showError('Please select a patient and add at least one service');
      return;
    }

    try {
      this.isLoading = true;

      const patient = this.patients.find(
        (p) => p.id === this.newPayment.patient_id
      );
      if (!patient) {
        this.showError('Selected patient not found');
        return;
      }

      const totalAmount = this.getTotalAmount();
      const newRecord: PaymentRecord = {
        payment_id: `PAY-${Date.now()}`,
        patient_id: this.newPayment.patient_id,
        patient_name: patient.full_name,
        patient_email: patient.email || '',
        patient_phone: patient.phone || patient.phone_number || '',
        services: [...this.newPayment.services],
        total_amount: totalAmount,
        paid_amount:
          this.newPayment.payment_status === 'paid' ? totalAmount : 0,
        payment_status: this.newPayment.payment_status,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      this.paymentRecords.unshift(newRecord);
      this.applyFilters();
      await this.calculateStats();
      this.closePaymentModal();
      this.showSuccess('Payment record created successfully');
    } catch (error) {
      console.error('Error creating payment:', error);
      this.showError('Failed to create payment record');
    } finally {
      this.isLoading = false;
    }
  }

  // Utility methods
  getStatusBadgeClass(status: string): string {
    const statusOption = this.statusOptions.find((s) => s.value === status);
    return statusOption ? statusOption.color : 'bg-gray-100 text-gray-800';
  }

  formatCurrency(amount: number): string {
    return CurrencyUtil.formatVND(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('vi-VN');
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
