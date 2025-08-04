import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SupabaseService } from '../../supabase.service';
import { DoctorSlotWithDetails, CalendarDay, SlotFilter, SlotStatistics, SlotStatus, SlotAppointment } from '../../models/slot.interface';

@Component({
  selector: 'app-consultant-meetings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './consultant-meetings.component.html',
  styleUrls: ['./consultant-meetings.component.css']
})
export class ConsultantMeetingsComponent implements OnInit {
  // View state
  currentView: 'list' | 'calendar' = 'list';
  loading = false;
  error: string | null = null;

  // Data
  slots: DoctorSlotWithDetails[] = [];
  filteredSlots: DoctorSlotWithDetails[] = [];
  statistics: SlotStatistics | null = null;

  // Calendar data
  currentDate = new Date();
  calendarDays: CalendarDay[] = [];
  selectedDate: Date | null = null;

  // Forms and filters
  filterForm: FormGroup;
  searchTerm = '';

  // Doctor info
  doctorId: string | null = null;

  constructor(
    private supabaseService: SupabaseService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      dateFrom: [''],
      dateTo: [''],
      status: ['all'],
      searchTerm: ['']
    });
  }

  async ngOnInit() {
    await this.initializeComponent();
  }

  private async initializeComponent() {
    try {
      this.loading = true;
      this.error = null;

      console.log('🚀 Initializing Consultant Meetings component...');

      // Check if user is logged in as doctor
      const role = localStorage.getItem('role');
      if (role !== 'doctor') {
        console.log('❌ User not logged in as doctor');
        this.error = 'Access denied. Please log in as a doctor to view consultant meetings.';
        return;
      }

      // Get doctor ID from authentication
      this.doctorId = await this.getDoctorId();
      console.log('🔍 Doctor ID retrieved:', this.doctorId);

      // If no doctor ID but user is logged in as doctor, still proceed with empty data
      if (!this.doctorId) {
        console.log('⚠️ No doctor ID found, but user is logged in as doctor - showing empty state');
        this.slots = [];
        this.filteredSlots = [];
        this.statistics = {
          totalSlots: 0,
          activeSlots: 0,
          fullSlots: 0,
          totalAppointments: 0,
          totalCapacity: 0,
          utilizationRate: 0
        };
        this.generateCalendar();
        this.setupFormSubscriptions();
        return;
      }

      console.log('📊 Loading slots and statistics...');

      // Ensure doctor has sample data
      await this.supabaseService.ensureDoctorHasData(this.doctorId);

      // Load initial data
      await this.loadSlots();
      await this.loadStatistics();
      this.generateCalendar();

      // Setup form subscriptions
      this.setupFormSubscriptions();

      console.log('✅ Consultant Meetings component initialized successfully');

    } catch (error) {
      console.error('❌ Error initializing consultant meetings:', error);
      this.error = 'Failed to load consultant meetings data: ' + (error as Error).message;
    } finally {
      this.loading = false;
    }
  }

  private async getDoctorId(): Promise<string | null> {
    try {
      // Check if user is logged in as doctor
      const role = localStorage.getItem('role');
      if (role !== 'doctor') {
        console.log('❌ User is not logged in as doctor. Role:', role);
        return null;
      }

      // Get staff_id directly from localStorage (set by doctor login)
      const staffId = localStorage.getItem('staff_id') || localStorage.getItem('doctor_id');
      if (staffId) {
        console.log('✅ Found staff_id in localStorage:', staffId);
        return staffId;
      }

      // Fallback: try to get by email if staff_id not found
      const email = localStorage.getItem('user_email');
      if (!email) {
        console.log('❌ No email found in localStorage');
        return null;
      }

      console.log('🔍 Looking up staff by email:', email);
      const staff = await this.supabaseService.getStaffByEmail(email);

      if (staff?.staff_id) {
        console.log('✅ Found staff_id from email lookup:', staff.staff_id);
        // Store it for future use
        localStorage.setItem('staff_id', staff.staff_id);
        return staff.staff_id;
      }

      console.log('❌ No staff found for email:', email);
      return null;
    } catch (error) {
      console.error('❌ Error getting doctor ID:', error);
      return null;
    }
  }

  private async loadSlots() {
    if (!this.doctorId) {
      console.log('⚠️ No doctor ID available - setting empty slots');
      this.slots = [];
      this.applyFilters();
      return;
    }

    try {
      console.log('📅 Loading slots for doctor:', this.doctorId);
      const filters = this.filterForm.value;
      console.log('🔍 Using filters:', filters);

      this.slots = await this.supabaseService.getDoctorSlots(
        this.doctorId,
        filters.dateFrom || undefined,
        filters.dateTo || undefined
      );

      console.log('✅ Loaded slots:', this.slots.length, 'slots found');
      this.applyFilters();
    } catch (error) {
      console.error('❌ Error loading slots:', error);
      // Don't show error for empty data, just log it
      console.log('Setting empty slots due to error');
      this.slots = [];
      this.applyFilters();
    }
  }

  private async loadStatistics() {
    if (!this.doctorId) {
      console.log('⚠️ No doctor ID available - setting empty statistics');
      this.statistics = {
        totalSlots: 0,
        activeSlots: 0,
        fullSlots: 0,
        totalAppointments: 0,
        totalCapacity: 0,
        utilizationRate: 0
      };
      return;
    }

    try {
      const filters = this.filterForm.value;
      this.statistics = await this.supabaseService.getDoctorSlotStatistics(
        this.doctorId,
        filters.dateFrom || undefined,
        filters.dateTo || undefined
      );
    } catch (error) {
      console.error('Error loading statistics:', error);
      // Set empty statistics instead of showing error
      this.statistics = {
        totalSlots: 0,
        activeSlots: 0,
        fullSlots: 0,
        totalAppointments: 0,
        totalCapacity: 0,
        utilizationRate: 0
      };
    }
  }

  private setupFormSubscriptions() {
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
      this.loadSlots();
      this.loadStatistics();
    });
  }

  private applyFilters() {
    const filters = this.filterForm.value;
    let filtered = [...this.slots];

    // Only show slots that have appointments (exclude 0/0 slots)
    filtered = filtered.filter(slot =>
      slot.appointments_count > 0
    );

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(slot => {
        switch (filters.status) {
          case 'active':
            return slot.slot_details.is_active;
          case 'inactive':
            return !slot.slot_details.is_active;
          case 'full':
            return slot.is_full;
          case 'available':
            return !slot.is_full && slot.slot_details.is_active;
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(slot =>
        slot.slot_details.slot_date.toLowerCase().includes(searchLower) ||
        slot.slot_details.slot_time.toLowerCase().includes(searchLower)
      );
    }

    this.filteredSlots = filtered;
  }

  // View toggle methods
  switchToListView() {
    this.currentView = 'list';
  }

  switchToCalendarView() {
    this.currentView = 'calendar';
    this.generateCalendar();
  }

  // Calendar methods
  private generateCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    // Get first day of month and calculate calendar grid
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: CalendarDay[] = [];
    const today = new Date();

    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      // Only include slots that have appointments assigned
      const daySlots = this.slots.filter(slot =>
        slot.slot_details.slot_date === this.formatDate(date) &&
        slot.appointments_count > 0
      );

      days.push({
        date: new Date(date),
        isCurrentMonth: date.getMonth() === month,
        isToday: this.isSameDay(date, today),
        hasSlots: daySlots.length > 0,
        slots: daySlots,
        totalSlots: daySlots.length,
        totalAppointments: daySlots.reduce((sum, slot) => sum + slot.appointments_count, 0),
        maxAppointments: daySlots.reduce((sum, slot) => sum + slot.max_appointments, 0)
      });
    }

    this.calendarDays = days;
  }

  navigateMonth(direction: number) {
    this.currentDate.setMonth(this.currentDate.getMonth() + direction);
    this.generateCalendar();
  }

  selectDate(day: CalendarDay) {
    this.selectedDate = day.date;
  }

  // Utility methods
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }

  getSlotStatusClass(slot: DoctorSlotWithDetails): string {
    if (!slot.slot_details.is_active) return 'status-inactive';
    if (slot.is_full) return 'status-full';
    return 'status-available';
  }

  getSlotStatusText(slot: DoctorSlotWithDetails): string {
    if (!slot.slot_details.is_active) return 'Inactive';
    if (slot.is_full) return 'Full';
    return 'Available';
  }

  getAppointmentStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatTime(time: string): string {
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  }

  formatDate2(date: string): string {
    try {
      return new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return date;
    }
  }

  getMonthYearDisplay(): string {
    return this.currentDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  }

  // Get slots for selected date
  getSelectedDateSlots(): DoctorSlotWithDetails[] {
    if (!this.selectedDate) return [];

    const selectedDay = this.calendarDays.find(d =>
      d.date.toDateString() === this.selectedDate?.toDateString()
    );

    return selectedDay?.slots || [];
  }

  // Refresh data
  async refreshData() {
    await this.loadSlots();
    await this.loadStatistics();
    if (this.currentView === 'calendar') {
      this.generateCalendar();
    }
  }

  // Debug function to check database state
  async debugDatabaseState() {
    if (!this.doctorId) {
      console.log('⚠️ No doctor ID available for debug');
      return;
    }

    try {
      console.log('🔍 === DEBUGGING DATABASE STATE ===');
      console.log('Doctor ID:', this.doctorId);

      // Check appointments directly
      const appointmentStats = await this.supabaseService.getDoctorDashboardStats(this.doctorId);
      console.log('📊 Appointment Stats:', appointmentStats);

      // Check slots directly  
      const slotStats = await this.supabaseService.getDoctorSlotStatistics(this.doctorId);
      console.log('📅 Slot Stats:', slotStats);

      // Check raw slots
      const slots = await this.supabaseService.getDoctorSlots(this.doctorId);
      console.log('🗂️ Raw Slots:', slots);

      console.log('🔍 === END DEBUG ===');

      // Force refresh UI
      await this.refreshData();
    } catch (error: any) {
      console.error('❌ Debug error:', error);
    }
  }

  // Setup demo data for testing
  async setupDemoData() {
    if (!this.doctorId) {
      console.log('⚠️ No doctor ID available for demo setup');
      return;
    }

    try {
      this.loading = true;
      console.log('🎯 Setting up demo data...');

      const result = await this.supabaseService.setupDoctorPortalDemo(this.doctorId);

      if (result.success) {
        console.log('✅ Demo data setup completed:', result.data);
        // Reload data to reflect changes
        await this.refreshData();
      } else {
        console.error('❌ Demo data setup failed:', result.message);
        this.error = result.message;
      }
    } catch (error: any) {
      console.error('❌ Error setting up demo data:', error);
      this.error = 'Failed to setup demo data: ' + error.message;
    } finally {
      this.loading = false;
    }
  }

  // Reset demo data
  async resetDemoData() {
    if (!this.doctorId) {
      console.log('⚠️ No doctor ID available for demo reset');
      return;
    }

    try {
      this.loading = true;
      console.log('🔄 Resetting demo data...');

      const result = await this.supabaseService.resetDoctorDemoData(this.doctorId);

      if (result.success) {
        console.log('✅ Demo data reset completed');
        // Reload data to reflect changes
        await this.refreshData();
      } else {
        console.error('❌ Demo data reset failed:', result.message);
        this.error = result.message;
      }
    } catch (error: any) {
      console.error('❌ Error resetting demo data:', error);
      this.error = 'Failed to reset demo data: ' + error.message;
    } finally {
      this.loading = false;
    }
  }
}
