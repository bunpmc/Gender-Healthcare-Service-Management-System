import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Patient } from '../../models/patient.interface';
import { Service } from '../../models/service.interface';
import { Transaction, TransactionStatus } from '../../models/transaction.interface';
import { SupabaseService } from '../../supabase.service';
import { CurrencyUtil } from '../../utils/currency.util';

interface TransactionService {
  service_id: string;
  service_name: string;
  service_price: number;
  quantity: number;
  category?: string;
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
  paymentRecords: Transaction[] = [];
  filteredRecords: Transaction[] = [];
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
  selectedRecord: Transaction | null = null;

  // New payment form
  newPayment = {
    patient_id: '',
    services: [] as TransactionService[],
    status: 'pending' as string,
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

  // Status options for transactions
  statusOptions = [
    {
      value: 'pending',
      label: 'Pending',
      color: 'bg-yellow-100 text-yellow-800',
    },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'failed', label: 'Failed', color: 'bg-red-100 text-red-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
    { value: 'refunded', label: 'Refunded', color: 'bg-blue-100 text-blue-800' },
  ];

  // Error handling
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private supabaseService: SupabaseService) { }

  async ngOnInit() {
    await this.loadInitialData();
    await this.calculateStats();

    // Temporary: Create sample data if no transactions exist
    if (this.paymentRecords.length === 0) {
      await this.createSampleDataInDatabase();
    }
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
      this.isLoading = true;
      console.log('🔄 Loading payment records from database...');

      // Load transactions data from database ONLY
      const result = await this.supabaseService.getAllTransactions();
      console.log('📊 Transaction result:', result);

      if (result.success && result.data && result.data.length > 0) {
        console.log('✅ Raw transactions data:', result.data);
        this.paymentRecords = result.data.map((transaction: any) => ({
          id: transaction.id,
          order_id: transaction.order_id,
          patient_id: transaction.patient_id,
          patient_name: transaction.patient_name || 'Guest',
          patient_email: transaction.patient_email || '',
          patient_phone: transaction.patient_phone || '',
          services: transaction.services_list || [],
          amount: transaction.amount,
          status: transaction.status,
          created_at: transaction.created_at,
          updated_at: transaction.updated_at,
          vnpay_response: transaction.vnpay_response,
          order_info: transaction.order_info,
          payment_method: transaction.payment_method
        }));

        console.log('✅ Mapped payment records:', this.paymentRecords.length, 'records');
        this.filteredRecords = [...this.paymentRecords];
        this.applyFilters();
      } else {
        console.log('📭 No transactions found in database');
        this.paymentRecords = [];
        this.filteredRecords = [];
        if (result.error) {
          this.showError(`Database error: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('❌ Error loading payment records:', error);
      this.showError('Failed to load payment records from database');
      this.paymentRecords = [];
      this.filteredRecords = [];
    } finally {
      this.isLoading = false;
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

  async calculateStats() {
    try {
      console.log('📊 Calculating stats from database...');

      // Get stats from database
      const result = await this.supabaseService.getTransactionStats();

      if (result.success && result.data) {
        this.stats = {
          totalRevenue: result.data.total_amount || 0,
          pendingPayments: result.data.pending_transactions || 0,
          paidToday: result.data.today_transactions || 0,
          overduePayments: result.data.failed_transactions || 0,
        };
        console.log('✅ Stats loaded from database:', this.stats);
      } else {
        // Fallback to local calculation if database stats fail
        this.stats = {
          totalRevenue: this.paymentRecords
            .filter((r) => r.status === 'completed')
            .reduce((sum, r) => sum + r.amount, 0),
          pendingPayments: this.paymentRecords.filter(
            (r) => r.status === 'pending'
          ).length,
          paidToday: this.paymentRecords.filter(
            (r) => r.status === 'completed' && this.isToday(r.created_at)
          ).length,
          overduePayments: this.paymentRecords.filter(
            (r) => r.status === 'failed'
          ).length,
        };
        console.log('⚠️ Using local stats calculation:', this.stats);
      }
    } catch (error) {
      console.error('❌ Error calculating stats:', error);
      // Reset stats on error
      this.stats = {
        totalRevenue: 0,
        pendingPayments: 0,
        paidToday: 0,
        overduePayments: 0,
      };
    }
  }

  isToday(dateString?: string): boolean {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  // Pagination methods
  get paginatedRecords(): Transaction[] {
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
        (record.patient_name || '')
          .toLowerCase()
          .includes(this.searchQuery.toLowerCase()) ||
        (record.patient_email || '')
          .toLowerCase()
          .includes(this.searchQuery.toLowerCase()) ||
        record.id
          .toLowerCase()
          .includes(this.searchQuery.toLowerCase()) ||
        record.order_id
          .toLowerCase()
          .includes(this.searchQuery.toLowerCase());

      const matchesStatus =
        !this.selectedStatus || record.status === this.selectedStatus;

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
  openPaymentModal(record?: Transaction) {
    if (record) {
      this.selectedRecord = record;
    } else {
      this.resetNewPaymentForm();
    }
    this.showPaymentModal = true;
  }

  viewPaymentDetails(record: Transaction) {
    this.selectedRecord = record;
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
      status: 'pending',
    };
  }

  // Service management
  addServiceToPayment() {
    if (this.selectedService) {
      const serviceUsage: TransactionService = {
        service_id: this.selectedService.service_id,
        service_name: this.selectedService.service_name,
        service_price: this.selectedService.service_cost || 0,
        quantity: this.serviceQuantity,
        category: this.selectedService.category_name
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
  async updatePaymentStatus(record: Transaction, event: any) {
    const newStatus = event.target.value;
    if (!newStatus) return;
    try {
      this.isLoading = true;

      // Update transaction status in database
      await this.supabaseService.updateTransactionStatus(record.id, newStatus);

      // Reload payment records to reflect changes
      await this.loadPaymentRecords();

      this.showSuccess('Payment status updated successfully');
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

      // Create transaction data for database
      const transactionData = {
        patient_id: this.newPayment.patient_id,
        amount: totalAmount,
        status: this.newPayment.status === 'pending' ? TransactionStatus.PENDING :
          this.newPayment.status === 'completed' ? TransactionStatus.COMPLETED : TransactionStatus.FAILED,
        services: this.newPayment.services,
        order_id: `ORDER-${Date.now()}`,
        order_info: `Payment for ${patient.full_name}`,
        vnpay_response: {} // Empty for manual payments
      };

      console.log('💳 Creating transaction in database:', transactionData);

      // Insert into database via Supabase
      const result = await this.supabaseService.createTransaction(transactionData);

      if (result.success) {
        console.log('✅ Transaction created successfully:', result.data);

        // Reload payment records from database to get fresh data
        await this.loadPaymentRecords();
        await this.calculateStats();

        this.closePaymentModal();
        this.showSuccess('Payment record created successfully');
      } else {
        console.error('❌ Failed to create transaction:', result.error);
        this.showError(`Failed to create payment record: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error creating payment:', error);
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
    return CurrencyUtil.formatVNDWithCommas(amount);
  }

  formatCurrencyThousands(amount: number): string {
    return CurrencyUtil.formatVNDWithCommas(amount);
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

  /**
   * Debug method to test database connection and data
   */
  async debugDatabase() {
    try {
      console.log('🔍 Starting database debug...');
      this.showSuccess('Starting database debug - check console');

      // Test 1: Check Supabase service
      console.log('📋 SupabaseService instance:', this.supabaseService);

      // Test 2: Get all transactions
      console.log('📊 Testing getAllTransactions...');
      const transactionsResult = await this.supabaseService.getAllTransactions();
      console.log('📊 Transactions result:', transactionsResult);

      // Test 3: Get transaction stats
      console.log('📈 Testing getTransactionStats...');
      const statsResult = await this.supabaseService.getTransactionStats();
      console.log('📈 Stats result:', statsResult);

      // Test 4: Get patients
      console.log('👥 Testing getAllPatients...');
      const patientsResult = await this.supabaseService.getAllPatients();
      console.log('👥 Patients result:', patientsResult);

      // Test 5: Get services
      console.log('🔧 Testing getAllServices...');
      const servicesResult = await this.supabaseService.getAllServices();
      console.log('🔧 Services result:', servicesResult);

      // Display results
      const summary = {
        transactions: transactionsResult?.data?.length || 0,
        patients: patientsResult?.data?.length || 0,
        services: servicesResult?.data?.length || 0,
        current_records: this.paymentRecords.length
      };

      console.log('📋 Database Summary:', summary);
      this.showSuccess(`DB Debug: ${summary.transactions} transactions, ${summary.patients} patients, ${summary.services} services`);

    } catch (error) {
      console.error('❌ Database debug error:', error);
      this.showError(`Database debug failed: ${error}`);
    }
  }

  /**
   * Temporary method to create sample data in database for testing
   */
  async createSampleDataInDatabase() {
    try {
      console.log('🎲 Creating sample transactions in database...');

      // Sample transaction data
      const sampleTransactions = [
        {
          patient_id: 'patient-1',
          amount: 250000,
          status: TransactionStatus.COMPLETED,
          services: [
            {
              service_id: 'service-1',
              service_name: 'Khám tổng quát',
              service_price: 150000,
              quantity: 1,
              category: 'Khám bệnh'
            },
            {
              service_id: 'service-2',
              service_name: 'Xét nghiệm máu',
              service_price: 100000,
              quantity: 1,
              category: 'Xét nghiệm'
            }
          ],
          order_id: `ORDER-${Date.now()}-1`,
          order_info: 'Khám sức khỏe tổng quát',
          vnpay_response: { vnp_ResponseCode: '00', vnp_TransactionStatus: '00' }
        },
        {
          patient_id: 'patient-2',
          amount: 180000,
          status: TransactionStatus.PENDING,
          services: [
            {
              service_id: 'service-3',
              service_name: 'Khám chuyên khoa',
              service_price: 180000,
              quantity: 1,
              category: 'Khám bệnh'
            }
          ],
          order_id: `ORDER-${Date.now()}-2`,
          order_info: 'Khám chuyên khoa sản phụ',
          vnpay_response: {}
        },
        {
          patient_id: 'patient-3',
          amount: 350000,
          status: TransactionStatus.COMPLETED,
          services: [
            {
              service_id: 'service-4',
              service_name: 'Siêu âm thai',
              service_price: 200000,
              quantity: 1,
              category: 'Chẩn đoán hình ảnh'
            },
            {
              service_id: 'service-5',
              service_name: 'Tư vấn dinh dưỡng',
              service_price: 150000,
              quantity: 1,
              category: 'Tư vấn'
            }
          ],
          order_id: `ORDER-${Date.now()}-3`,
          order_info: 'Khám thai và tư vấn',
          vnpay_response: { vnp_ResponseCode: '00', vnp_TransactionStatus: '00' }
        }
      ];

      // Insert each transaction
      console.log('🔄 Starting to insert transactions...');
      this.isLoading = true;

      for (let i = 0; i < sampleTransactions.length; i++) {
        const transaction = sampleTransactions[i];
        console.log(`📝 Inserting transaction ${i + 1}:`, transaction);

        const result = await this.supabaseService.createTransaction(transaction);
        console.log(`📝 Transaction ${i + 1} result:`, result);

        if (result.success) {
          console.log(`✅ Sample transaction ${i + 1} created:`, result.data?.id);
        } else {
          console.error(`❌ Failed to create sample transaction ${i + 1}:`, result.error);
          this.showError(`Failed to create transaction ${i + 1}: ${result.error}`);
        }
      }

      // Reload data after creating samples
      console.log('🔄 Reloading payment records...');
      await this.loadPaymentRecords();
      await this.calculateStats();

      this.showSuccess(`Đã tạo ${sampleTransactions.length} giao dịch mẫu trong database`);
    } catch (error) {
      console.error('❌ Error creating sample data:', error);
      this.showError(`Failed to create sample data: ${error}`);
    } finally {
      this.isLoading = false;
    }
  }
}
