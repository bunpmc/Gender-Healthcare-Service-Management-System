import { Patient } from './models/patient.interface';
import { Injectable } from '@angular/core';
import { supabase } from './supabase-client';
import { from, Observable } from 'rxjs';
import { LoggerService } from './core/services/logger.service';
import {
  Staff,
  DoctorDetails,
  Doctor,
  Role,
} from './models/staff.interface';
import { Service } from './models/service.interface';
import { Category } from './models/category.interface';
import {
  Appointment,
  Guest,
  GuestAppointment,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  VisitType,
  ProcessStatus,
  ScheduleEnum,
} from './models/appointment.interface';
import {
  BlogPost,
  CreateBlogPostRequest,
  UpdateBlogPostRequest,
} from './models/blog.interface';
import { Notification } from './models/notification.interface';
import {
  PatientReport,
  UpdatePatientReportRequest,
  CreatePatientReportRequest,
} from './models/patient-report.interface';
import { Receipt } from './models/receipt.interface';
import {
  Slot,
  DoctorSlotAssignment,
  DoctorSlotWithDetails,
} from './models/slot.interface';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  constructor(private logger: LoggerService) {}

  // Đếm số bệnh nhân theo tháng
  getPatientCountByMonth(year: number, month: number): Observable<number> {
    return from(
      supabase
        .rpc('count_patients_by_month', {
          target_year: year,
          target_month: month,
        })
        .then(({ data, error }) => {
          if (error) throw error;
          return data || 0;
        })
    );
  }

  // Tính doanh thu theo ngày
  getAppointmentCountByDay(targetDate: string): Observable<number> {
    return from(
      supabase
        .rpc('count_appointments_by_day', { target_date: targetDate })
        .then(({ data, error }) => {
          if (error) throw error;
          return data || 0;
        })
    );
  }

  // Tính doanh thu theo ngày
  getDailyRevenue(targetDate: string): Observable<number> {
    return from(
      supabase
        .rpc('calculate_daily_revenue', { target_date: targetDate })
        .then(({ data, error }) => {
          if (error) throw error;
          return data || 0;
        })
    );
  }

  // Hàm helper để format ngày tháng
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Lấy ngày hôm nay
  getTodayDate(): string {
    return this.formatDate(new Date());
  }

  // Lấy ngày hôm qua
  getYesterdayDate(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this.formatDate(yesterday);
  }

  async searchPatientsGeneral(query: string) {
    const { data, error } = await supabase.rpc('search_patients_by_fields', {
      full_name: query,
      phone: query,
      email: query,
    });

    if (error) {
      this.logger.error('Lỗi tìm kiếm bệnh nhân: ', error.message);
      throw error;
    }

    return data || [];
  }
  //#region DASHBOARD

  // Thêm method này vào SupabaseService class

  /**
   * Lấy số lượng appointments có status pending
   */
  async getPendingAppointmentsCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('appointment_status', 'pending');

      if (error) {
        console.error('Error fetching pending appointments count:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getPendingAppointmentsCount:', error);
      throw error;
    }
  }

  /**
   * Lấy số lượng appointments pending cho ngày hôm nay
   */
  async getTodayPendingAppointmentsCount(): Promise<number> {
    try {
      const today = this.getTodayDate();

      const { count, error } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('appointment_status', 'pending')
        .eq('appointment_date', today);

      if (error) {
        console.error(
          'Error fetching today pending appointments count:',
          error
        );
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getTodayPendingAppointmentsCount:', error);
      throw error;
    }
  }

  /**
   * Lấy số lượng appointments pending cho ngày mai (upcoming)
   */
  async getUpcomingPendingAppointmentsCount(): Promise<number> {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const { count, error } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('appointment_status', 'pending')
        .gte('appointment_date', tomorrowStr);

      if (error) {
        console.error(
          'Error fetching upcoming pending appointments count:',
          error
        );
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getUpcomingPendingAppointmentsCount:', error);
      throw error;
    }
  }

  /*
   * Lấy notifications
   */
  async getRecentNotifications(limit: number = 5): Promise<any[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select(
        `
      notification_id,
      notification_type,
      sent_at,
      appointment:appointments(
        appointment_id,
        created_at,
        patient:patients(full_name)
      )
    `
      )
      .eq('notification_type', 'new_appointment')
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }

    return data || [];
  }

  async getTodayAppointments(today: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select(
        `
      appointment_id,
      created_at,
      appointment_status,
      patient:patients(full_name)
    `
      )
      .gte('created_at', `${today}T00:00:00+00:00`)
      .lte('created_at', `${today}T23:59:59+00:00`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching today's appointments:", error);
      throw error;
    }

    return data || [];
  }

  //#endregion

  //#region ANALYTIC

  // 🟦 KPI: Appointments Count
  async getAppointmentsCount(start: string, end: string): Promise<number> {
    const { count, error } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', start)
      .lte('created_at', end);

    if (error) {
      console.error('Error fetching appointments count:', error);
      throw error;
    }

    return count || 0;
  }

  // 🟦 KPI: New Patients Count
  async getNewPatientsCount(start: string, end: string): Promise<number> {
    const { count, error } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', start)
      .lte('created_at', end);

    if (error) {
      console.error('Error fetching new patients count:', error);
      throw error;
    }

    return count || 0;
  }

  // 🟦 KPI: Revenue Sum
  async getRevenueSum(start: string, end: string) {
    const { data } = await supabase
      .from('receipts')
      .select('amount')
      .gte('created_at', start)
      .lte('created_at', end);
    return data?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
  }

  // 🟦 KPI: Task Completion Ratio
  async getTaskCompletionRatio(start: string, end: string) {
    const { data } = await supabase
      .from('appointments')
      .select('appointment_status')
      .gte('created_at', start)
      .lte('created_at', end);

    const completed =
      data?.filter((d) => d.appointment_status === 'completed').length || 0;
    const pending =
      data?.filter((d) => d.appointment_status === 'pending').length || 0;
    return completed + pending > 0
      ? Math.round((completed / (completed + pending)) * 100)
      : 0;
  }

  // 🟩 CHART: Age Distribution
  async getAgeDistribution() {
    const { data } = await supabase.from('patients').select('date_of_birth');
    const today = new Date();
    const buckets = { '0–18': 0, '19–35': 0, '36–50': 0, '51+': 0 };

    data?.forEach((p) => {
      const dob = new Date(p.date_of_birth);
      const age = today.getFullYear() - dob.getFullYear();
      if (age <= 18) buckets['0–18']++;
      else if (age <= 35) buckets['19–35']++;
      else if (age <= 50) buckets['36–50']++;
      else buckets['51+']++;
    });

    return buckets;
  }

  // 🟩 CHART: Gender Distribution
  async getGenderDistribution() {
    const { data } = await supabase.from('patients').select('gender');
    const genderMap: { [key: string]: number } = {};
    data?.forEach((p) => {
      genderMap[p.gender] = (genderMap[p.gender] || 0) + 1;
    });
    return genderMap;
  }

  // 🟩 CHART: Cancelled Rate
  async getCancelledRate(start: string, end: string) {
    const { data } = await supabase
      .from('appointments')
      .select('appointment_status')
      .gte('created_at', start)
      .lte('created_at', end);

    const cancelled =
      data?.filter((d) => d.appointment_status === 'cancelled').length || 0;
    return (cancelled / (data?.length || 1)) * 100;
  }

  // 🟩 CHART: Avg Appointment Duration (Mock)
  async getAvgAppointmentDuration() {
    return 25; // you can replace this with real logic once you track actual duration
  }

  // 🟩 CHART: Staff Workload Balance
  async getStaffWorkloadBalance() {
    const { data: doctors } = await supabase
      .from('staff_members')
      .select('staff_id')
      .eq('role', 'doctor');
    const { data: appts } = await supabase
      .from('appointments')
      .select('doctor_id');

    const docCount = doctors?.length || 1;
    const totalAppts = appts?.length || 0;
    const perDoctor = Math.round(totalAppts / docCount);

    return { doctorCount: docCount, totalAppointments: totalAppts, perDoctor };
  }

  // 🟩 CHART: Monthly Patient Growth
  async getMonthlyPatientGrowth(months: number = 6): Promise<any[]> {
    try {
      console.log(
        `🔄 Fetching monthly patient growth for last ${months} months...`
      );
      const monthsData = [];
      const currentDate = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - i,
          1
        );
        const startOfMonth = new Date(
          date.getFullYear(),
          date.getMonth(),
          1
        ).toISOString();
        const endOfMonth = new Date(
          date.getFullYear(),
          date.getMonth() + 1,
          0,
          23,
          59,
          59
        ).toISOString();

        const { count, error } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfMonth)
          .lte('created_at', endOfMonth);

        if (error) {
          console.error(
            `❌ Error fetching patient count for ${date.toLocaleDateString()}:`,
            error
          );
          throw new Error(
            `Failed to fetch patient data for ${date.toLocaleDateString(
              'en-US',
              { month: 'long', year: 'numeric' }
            )}: ${error.message}`
          );
        }

        monthsData.push({
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          value: count || 0,
        });
      }

      console.log(
        '✅ Successfully fetched monthly patient growth:',
        monthsData
      );
      return monthsData;
    } catch (error: any) {
      console.error('❌ Error fetching monthly patient growth:', error);
      throw new Error(
        `Database error: ${error.message || 'Unable to fetch patient growth data'
        }`
      );
    }
  }

  // 🟩 CHART: Monthly Revenue Data
  async getMonthlyRevenue(months: number = 6): Promise<any[]> {
    try {
      console.log(`🔄 Fetching monthly revenue for last ${months} months...`);
      const monthsData = [];
      const currentDate = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - i,
          1
        );
        const startOfMonth = new Date(
          date.getFullYear(),
          date.getMonth(),
          1
        ).toISOString();
        const endOfMonth = new Date(
          date.getFullYear(),
          date.getMonth() + 1,
          0,
          23,
          59,
          59
        ).toISOString();

        const { data, error } = await supabase
          .from('receipts')
          .select('amount')
          .gte('created_at', startOfMonth)
          .lte('created_at', endOfMonth);

        if (error) {
          console.error(
            `❌ Error fetching revenue for ${date.toLocaleDateString()}:`,
            error
          );
          throw new Error(
            `Failed to fetch revenue data for ${date.toLocaleDateString(
              'en-US',
              { month: 'long', year: 'numeric' }
            )}: ${error.message}`
          );
        }

        const totalRevenue =
          data?.reduce((sum, receipt) => sum + (receipt.amount || 0), 0) || 0;

        monthsData.push({
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          value: totalRevenue,
        });
      }

      console.log('✅ Successfully fetched monthly revenue:', monthsData);
      return monthsData;
    } catch (error: any) {
      console.error('❌ Error fetching monthly revenue:', error);
      throw new Error(
        `Database error: ${error.message || 'Unable to fetch revenue data'}`
      );
    }
  }

  // 🟩 CHART: Appointment Status Distribution
  async getAppointmentStatusDistribution(): Promise<any[]> {
    try {
      console.log('🔄 Fetching appointment status distribution...');
      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_status');

      if (error) {
        console.error('❌ Error fetching appointment status:', error);
        throw new Error(
          `Failed to fetch appointment status data: ${error.message}`
        );
      }

      const statusCounts: { [key: string]: number } = {};
      data?.forEach((appointment) => {
        const status = appointment.appointment_status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      const result = Object.entries(statusCounts).map(([status, count]) => ({
        name: this.formatAppointmentStatus(status),
        value: count,
      }));

      console.log(
        '✅ Successfully fetched appointment status distribution:',
        result
      );
      return result;
    } catch (error: any) {
      console.error(
        '❌ Error fetching appointment status distribution:',
        error
      );
      throw new Error(
        `Database error: ${error.message || 'Unable to fetch appointment status data'
        }`
      );
    }
  }

  // Helper method to format appointment status
  private formatAppointmentStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      unknown: 'Unknown',
    };
    return statusMap[status] || status;
  }

  //#endregion

  // Admin Dashboard Statistics
  async getAdminDashboardStats() {
    const today = new Date().toISOString().split('T')[0];

    try {
      // Get today's appointments count
      const { data: todayAppointments, error: todayError } = await supabase
        .from('appointments')
        .select('appointment_id')
        .eq('appointment_date', today);

      if (todayError) throw todayError;

      // Get total pending appointments count
      const { data: pendingAppointments, error: pendingError } = await supabase
        .from('appointments')
        .select('appointment_id')
        .eq('appointment_status', 'pending');

      if (pendingError) throw pendingError;

      // Get total patients count
      const { count: totalPatients, error: patientsError } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      if (patientsError) throw patientsError;

      // Get total staff count
      const { count: totalStaff, error: staffError } = await supabase
        .from('staff_members')
        .select('*', { count: 'exact', head: true });

      if (staffError) throw staffError;

      // Get today's revenue
      const todayRevenue = await this.getDailyRevenue(today)
        .toPromise()
        .catch(() => 0);

      return {
        todayAppointments: todayAppointments?.length || 0,
        pendingAppointments: pendingAppointments?.length || 0,
        totalPatients: totalPatients || 0,
        totalStaff: totalStaff || 0,
        todayRevenue: todayRevenue || 0,
      };
    } catch (error) {
      console.error('Error fetching admin dashboard stats:', error);
      throw error;
    }
  }

  // Get recent activities for admin dashboard
  async getRecentActivities(): Promise<any[]> {
    try {
      // Get recent appointments (last 5)
      const { data: recentAppointments, error: appointmentsError } =
        await supabase
          .from('appointments')
          .select(
            `
          appointment_id,
          created_at,
          appointment_status,
          patient:patients(full_name)
        `
          )
          .order('created_at', { ascending: false })
          .limit(5);

      if (appointmentsError) throw appointmentsError;

      // Get recent patients (last 3)
      const { data: recentPatients, error: patientsError } = await supabase
        .from('patients')
        .select('id, full_name, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      if (patientsError) throw patientsError;

      // Combine and format activities
      const activities: any[] = [];

      // Add appointment activities
      recentAppointments?.forEach((appointment: any) => {
        activities.push({
          type: 'appointment',
          description: `Appointment with ${appointment.patient?.full_name || 'Unknown Patient'
            }`,
          timestamp: appointment.created_at,
          status: appointment.appointment_status,
        });
      });

      // Add patient activities
      recentPatients?.forEach((patient: any) => {
        activities.push({
          type: 'patient',
          description: `New patient: ${patient.full_name}`,
          timestamp: patient.created_at,
        });
      });

      // Sort by timestamp (most recent first)
      activities.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return activities.slice(0, 8); // Return top 8 activities
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw error;
    }
  }

  //#endregion

  //#region // ============= PATIENT FUNCTIONS ============= //

  async getPatients(
    page: number,
    itemsPerPage: number
  ): Promise<{ patients: Patient[]; total: number }> {
    const start = (page - 1) * itemsPerPage;
    const { data, count } = await supabase
      .from('patients')
      .select('*', { count: 'exact' })
      .range(start, start + itemsPerPage - 1);

    // Process patient data to add full image URLs
    const processedData = this.processImageUrls(
      data ?? [],
      'patient-uploads'
    ) as Patient[];

    return { patients: processedData, total: count ?? 0 };
  }

  async getAllPatients(): Promise<{
    success: boolean;
    data?: Patient[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching patients:', error);
        return { success: false, error: error.message };
      }

      // Process patient data to add full image URLs
      const processedData = this.processImageUrls(
        data || [],
        'patient-uploads'
      ) as Patient[];

      return { success: true, data: processedData };
    } catch (error) {
      console.error('Unexpected error fetching patients:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async createPatient(
    patientData: Partial<Patient>
  ): Promise<{ success: boolean; data?: Patient; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .insert([patientData])
        .select()
        .single();

      if (error) {
        console.error('Error creating patient:', error);
        return { success: false, error: error.message };
      }

      // Process the returned data to add full image URL
      const processedData = this.processImageUrls(
        data,
        'patient-uploads'
      ) as Patient;

      return { success: true, data: processedData };
    } catch (error) {
      console.error('Unexpected error creating patient:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Alias method for backward compatibility
  async addPatient(
    patientData: Partial<Patient>
  ): Promise<{ success: boolean; data?: Patient; error?: string }> {
    return this.createPatient(patientData);
  }

  async updatePatient(
    patientId: string,
    patientData: Partial<Patient>
  ): Promise<{ success: boolean; data?: Patient; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .update(patientData)
        .eq('id', patientId)
        .select()
        .single();

      if (error) {
        console.error('Error updating patient:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error('Unexpected error updating patient:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async softDeletePatient(
    patientId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('patients')
        .update({
          patient_status: 'deleted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', patientId);

      if (error) {
        console.error('Error soft deleting patient:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error soft deleting patient:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async restorePatient(
    patientId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('patients')
        .update({
          patient_status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', patientId);

      if (error) {
        console.error('Error restoring patient:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error restoring patient:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async getPatientsAppointment() {
    const { data, error } = await supabase
      .from('patients')
      .select('id, full_name')
      .order('full_name', { ascending: true }); // Sắp xếp theo tên để dễ chọn
    if (error) throw error;
    return data || [];
  }

  async searchPatients(
    fullName: string,
    phone: string,
    email: string,
    page: number,
    itemsPerPage: number
  ): Promise<{ patients: Patient[]; total: number }> {
    const start = (page - 1) * itemsPerPage;
    const query = supabase
      .from('patients')
      .select('*', { count: 'exact' })
      .or(
        `full_name.ilike.%${fullName}%,phone.ilike.%${phone}%,email.ilike.%${email}%`
      )
      .range(start, start + itemsPerPage - 1);
    const { data, count } = await query;
    return { patients: data ?? [], total: count ?? 0 };
  }

  //#endregion

  //#region // ============= APPOINTMENT FUNCTIONS ============= //

  // Get all appointments with comprehensive JOIN queries (unified patient and guest appointments)
  async getAllAppointments(): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      // Fetch patient appointments
      const { data: patientAppointments, error: patientError } = await supabase
        .from('appointments')
        .select(
          `
          appointment_id,
          patient_id,
          doctor_id,
          slot_id,
          category_id,
          phone,
          email,
          visit_type,
          appointment_status,
          created_at,
          updated_at,
          schedule,
          message,
          appointment_date,
          appointment_time,
          preferred_date,
          preferred_time,
          patient:patients(id, full_name, phone, email, gender),
          doctor:doctor_details(doctor_id, staff:staff_members(staff_id, full_name, working_email)),
          category:service_categories(category_id, category_name),
          slot:doctor_slot_assignments(
            doctor_slot_id,
            slot:slots(slot_id, slot_date, slot_time)
          )
        `
        )
        .order('created_at', { ascending: false });

      if (patientError) {
        console.error('Error fetching patient appointments:', patientError);
        return { success: false, error: patientError.message };
      }

      // Fetch guest appointments
      const { data: guestAppointments, error: guestError } = await supabase
        .from('guest_appointments')
        .select(
          `
          guest_appointment_id,
          guest_id,
          doctor_id,
          slot_id,
          category_id,
          phone,
          email,
          visit_type,
          appointment_status,
          created_at,
          updated_at,
          schedule,
          message,
          appointment_date,
          appointment_time,
          preferred_date,
          preferred_time,
          guest:guests(guest_id, full_name, phone, email, gender),
          doctor:doctor_details(doctor_id, staff:staff_members(staff_id, full_name, working_email)),
          category:service_categories(category_id, category_name),
          slot:doctor_slot_assignments(
            doctor_slot_id,
            slot:slots(slot_id, slot_date, slot_time)
          )
        `
        )
        .order('created_at', { ascending: false });

      if (guestError) {
        console.error('Error fetching guest appointments:', guestError);
        return { success: false, error: guestError.message };
      }

      // Transform patient appointments
      const transformedPatientAppointments = (patientAppointments || []).map(
        (appointment: any) => {
          const patient = Array.isArray(appointment.patient)
            ? appointment.patient[0]
            : appointment.patient;
          const doctorDetails = Array.isArray(appointment.doctor)
            ? appointment.doctor[0]
            : appointment.doctor;
          const doctorStaff = doctorDetails?.staff
            ? Array.isArray(doctorDetails.staff)
              ? doctorDetails.staff[0]
              : doctorDetails.staff
            : null;
          const category = Array.isArray(appointment.category)
            ? appointment.category[0]
            : appointment.category;
          const slotInfo = Array.isArray(appointment.slot)
            ? appointment.slot[0]
            : appointment.slot;
          const slot = slotInfo?.slot
            ? Array.isArray(slotInfo.slot)
              ? slotInfo.slot[0]
              : slotInfo.slot
            : null;

          return {
            ...appointment,
            appointment_type: 'patient' as const,
            original_table: 'appointments' as const,
            original_id: appointment.appointment_id,
            patient_name: patient?.full_name || 'N/A',
            display_name: patient?.full_name || `Phone: ${appointment.phone}`,
            patient_phone: patient?.phone || appointment.phone,
            patient_email: patient?.email || appointment.email,
            doctor_name: doctorStaff?.full_name || 'Unassigned',
            category_name: category?.category_name || 'N/A',
            slot_date: slot?.slot_date || appointment.appointment_date,
            slot_time: slot?.slot_time || appointment.appointment_time,
          };
        }
      );

      // Transform guest appointments
      const transformedGuestAppointments = (guestAppointments || []).map(
        (appointment: any) => {
          const guest = Array.isArray(appointment.guest)
            ? appointment.guest[0]
            : appointment.guest;
          const doctorDetails = Array.isArray(appointment.doctor)
            ? appointment.doctor[0]
            : appointment.doctor;
          const doctorStaff = doctorDetails?.staff
            ? Array.isArray(doctorDetails.staff)
              ? doctorDetails.staff[0]
              : doctorDetails.staff
            : null;
          const category = Array.isArray(appointment.category)
            ? appointment.category[0]
            : appointment.category;
          const slotInfo = Array.isArray(appointment.slot)
            ? appointment.slot[0]
            : appointment.slot;
          const slot = slotInfo?.slot
            ? Array.isArray(slotInfo.slot)
              ? slotInfo.slot[0]
              : slotInfo.slot
            : null;

          return {
            ...appointment,
            appointment_id: appointment.guest_appointment_id, // Normalize ID field
            appointment_type: 'guest' as const,
            original_table: 'guest_appointments' as const,
            original_id: appointment.guest_appointment_id,
            guest_name: guest?.full_name || 'N/A',
            display_name: guest?.full_name || `Phone: ${appointment.phone}`,
            patient_phone: guest?.phone || appointment.phone,
            patient_email: guest?.email || appointment.email,
            doctor_name: doctorStaff?.full_name || 'Unassigned',
            category_name: category?.category_name || 'N/A',
            slot_date: slot?.slot_date || appointment.appointment_date,
            slot_time: slot?.slot_time || appointment.appointment_time,
          };
        }
      );

      // Doctor information is now included in the JOIN queries above

      // Combine and sort all appointments by created_at
      const allAppointments = [
        ...transformedPatientAppointments,
        ...transformedGuestAppointments,
      ].sort(
        (a, b) =>
          new Date(b.created_at || '').getTime() -
          new Date(a.created_at || '').getTime()
      );

      return { success: true, data: allAppointments };
    } catch (error) {
      console.error('Unexpected error fetching appointments:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Get appointments with pagination and filtering (unified patient and guest appointments)
  async getAppointments(
    page: number,
    itemsPerPage: number,
    filters?: any
  ): Promise<{ appointments: any[]; total: number }> {
    try {
      // For pagination with filtering, we'll use the getAllAppointments method and apply client-side pagination
      // This ensures consistent filtering across both appointment types
      const result = await this.getAllAppointments();

      if (!result.success || !result.data) {
        return { appointments: [], total: 0 };
      }

      let filteredAppointments = result.data;

      // Apply filters if provided
      if (filters) {
        filteredAppointments = result.data.filter((appointment: any) => {
          // Status filter
          if (
            filters.status &&
            appointment.appointment_status !== filters.status
          ) {
            return false;
          }

          // Visit type filter
          if (
            filters.visit_type &&
            appointment.visit_type !== filters.visit_type
          ) {
            return false;
          }

          // Doctor filter
          if (
            filters.doctor_id &&
            appointment.doctor_id !== filters.doctor_id
          ) {
            return false;
          }

          // Date range filters
          if (filters.date_from) {
            const appointmentDate =
              appointment.appointment_date || appointment.slot_date;
            if (!appointmentDate || appointmentDate < filters.date_from) {
              return false;
            }
          }

          if (filters.date_to) {
            const appointmentDate =
              appointment.appointment_date || appointment.slot_date;
            if (!appointmentDate || appointmentDate > filters.date_to) {
              return false;
            }
          }

          // Appointment type filter (if provided)
          if (
            filters.appointment_type &&
            appointment.appointment_type !== filters.appointment_type
          ) {
            return false;
          }

          return true;
        });
      }

      // Apply pagination
      const start = (page - 1) * itemsPerPage;
      const paginatedAppointments = filteredAppointments.slice(
        start,
        start + itemsPerPage
      );

      return {
        appointments: paginatedAppointments,
        total: filteredAppointments.length,
      };
    } catch (error) {
      console.error('Error in getAppointments:', error);
      return { appointments: [], total: 0 };
    }
  }

  async getGuestAppointments(): Promise<GuestAppointment[]> {
    const { data, error } = await supabase
      .from('guest_appointments')
      .select('*');
    if (error) throw error;
    return data ?? [];
  }

  async getPatientAppointment(): Promise<Patient[]> {
    const { data, error } = await supabase.from('patients').select('*');
    if (error) throw error;
    return data ?? [];
  }

  async getGuests(): Promise<Guest[]> {
    const { data, error } = await supabase
      .from('guests')
      .select(
        'guest_id, full_name, phone, email, date_of_birth, gender, created_at'
      );
    if (error) throw error;
    return data ?? [];
  }

  // Get patients and guests for a specific doctor
  async getDoctorPatientsAndGuests(doctor_id: string): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      // Get patients who have appointments with this doctor
      const { data: patientAppointments, error: patientError } = await supabase
        .from('appointments')
        .select(
          `
          patient:patients(
            id,
            full_name,
            phone,
            email,
            date_of_birth,
            gender,
            created_at,
            image_link
          )
        `
        )
        .eq('doctor_id', doctor_id)
        .not('patient_id', 'is', null);

      if (patientError) {
        console.error('Error fetching doctor patients:', patientError);
        return { success: false, error: patientError.message };
      }

      // Get guests who have appointments with this doctor
      const { data: guestAppointments, error: guestError } = await supabase
        .from('guest_appointments')
        .select(
          `
          guest:guests(
            guest_id,
            full_name,
            phone,
            email,
            date_of_birth,
            gender,
            created_at
          )
        `
        )
        .eq('doctor_id', doctor_id)
        .not('guest_id', 'is', null);

      if (guestError) {
        console.error('Error fetching doctor guests:', guestError);
        return { success: false, error: guestError.message };
      }

      // Extract unique patients
      const uniquePatients = new Map();
      (patientAppointments || []).forEach((appt: any) => {
        if (appt.patient) {
          uniquePatients.set(appt.patient.id, {
            ...appt.patient,
            patient_type: 'patient'
          });
        }
      });

      // Extract unique guests
      const uniqueGuests = new Map();
      (guestAppointments || []).forEach((appt: any) => {
        if (appt.guest) {
          uniqueGuests.set(appt.guest.guest_id, {
            ...appt.guest,
            id: appt.guest.guest_id, // Normalize ID field
            patient_type: 'guest'
          });
        }
      });

      // Combine patients and guests
      const allPatientsAndGuests = [
        ...Array.from(uniquePatients.values()),
        ...Array.from(uniqueGuests.values())
      ];

      // Process image URLs for patients
      const processedData = this.processImageUrls(
        allPatientsAndGuests,
        'patient-uploads'
      ) as any[];

      return { success: true, data: processedData };
    } catch (error) {
      console.error('Unexpected error fetching doctor patients and guests:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
  //#endregion

  //#region // ============= STAFF FUNCTIONS ============= //

  async getStaffRoles(): Promise<Role[]> {
    // Adjust this based on how staff_role_enum is stored (e.g., a table or hardcoded enum)
    // Example: Fetch from a roles table or return static enum values
    return [
      { value: 'doctor', label: 'Doctor' },
      { value: 'receptionist', label: 'Receptionist' },
      { value: 'admin', label: 'Admin' },
      // Add other roles as per staff_role_enum
    ];
  }

  async getStaffMembers(): Promise<Staff[]> {
    // Check if current user is admin for enhanced permissions
    const currentRole = localStorage.getItem('role');
    const isAdmin = currentRole === 'administrator';

    console.log('📋 Getting staff members:', {
      userRole: currentRole,
      isAdmin,
      timestamp: new Date().toISOString()
    });

    const { data, error } = await supabase
      .from('staff_members')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('❌ Error fetching staff members:', error);
      throw error;
    }

    // Process staff data to add full image URLs
    const processedData = this.processImageUrls(
      data || [],
      'staff-uploads'
    ) as Staff[];

    return processedData;
  }

  // Updated getAllStaff method to return consistent format
  async getAllStaff(): Promise<{
    success: boolean;
    data?: Staff[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('staff_members')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Error fetching staff:', error);
        return { success: false, error: error.message };
      }

      // Process staff data to add full image URLs
      const processedData = this.processImageUrls(
        data || [],
        'staff-uploads'
      ) as Staff[];

      return { success: true, data: processedData };
    } catch (error) {
      console.error('Unexpected error fetching staff:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Enhanced staff management methods with consistent response format
  async updateStaffMember(
    staffId: string,
    staffData: Partial<Staff>
  ): Promise<{ success: boolean; data?: Staff; error?: string }> {
    try {
      // Check if current user is admin
      const currentRole = localStorage.getItem('role');
      const isAdmin = currentRole === 'administrator';

      console.log('✏️ Updating staff member:', {
        staffId,
        userRole: currentRole,
        isAdmin,
        updateFields: Object.keys(staffData),
        timestamp: new Date().toISOString()
      });

      const updateData = {
        ...staffData,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('staff_members')
        .update(updateData)
        .eq('staff_id', staffId)
        .select()
        .single();

      if (error) {
        console.error('Error updating staff member:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data as Staff };
    } catch (error) {
      console.error('Unexpected error updating staff member:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Create staff using edge function with HTTP POST and FormData (No Authentication)
  async createStaffMember(
    staffData: {
      full_name: string;
      working_email: string;
      role: 'doctor' | 'receptionist';
      years_experience?: number;
      hired_at?: string;
      is_available?: boolean;
      staff_status?: 'active' | 'inactive' | 'on_leave';
      gender?: 'male' | 'female' | 'other';
      languages?: string[];
      image_link?: string;
    }
  ): Promise<{ success: boolean; data?: Staff; error?: string }> {
    try {
      console.log('🚀 Creating staff member with edge function using POST (No Auth)...');
      console.log('📝 Input data:', staffData);

      // Prepare FormData
      const formData = new FormData();
      formData.append('full_name', staffData.full_name);
      formData.append('working_email', staffData.working_email);
      formData.append('role', staffData.role);

      // Add optional fields if provided
      if (staffData.years_experience !== undefined) {
        formData.append('years_experience', staffData.years_experience.toString());
      }

      if (staffData.hired_at) {
        formData.append('hired_at', staffData.hired_at);
      }

      if (staffData.is_available !== undefined) {
        formData.append('is_available', staffData.is_available.toString());
      }

      if (staffData.staff_status) {
        formData.append('staff_status', staffData.staff_status);
      }

      if (staffData.gender) {
        formData.append('gender', staffData.gender);
      }

      if (staffData.languages && staffData.languages.length > 0) {
        formData.append('languages', JSON.stringify(staffData.languages));
      }

      if (staffData.image_link) {
        formData.append('image_link', staffData.image_link);
      }

      console.log('📤 FormData prepared with fields:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value}`);
      }

      const edgeFunctionUrl = 'https://xzxxodxplyetecrsbxmc.supabase.co/functions/v1/create-staff';
      console.log('🔗 Edge function URL:', edgeFunctionUrl);

      // Make HTTP POST request with FormData (No Authorization header)
      console.log('📡 Making POST request to edge function (No Auth)...');
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        // No headers needed - let browser set Content-Type with boundary for FormData
        body: formData
      });

      console.log('📥 Response status:', response.status, response.statusText);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('💥 HTTP Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}${errorText ? ' - ' + errorText : ''}`
        };
      }

      const responseData = await response.json();
      console.log('📥 Edge function response data:', responseData);

      if (responseData?.error) {
        console.error('🚫 Edge function returned error:', responseData.error);
        return { success: false, error: responseData.error };
      }

      console.log('✅ Staff member created successfully:', responseData);
      return { success: true, data: responseData as Staff };
    } catch (error: any) {
      console.error('💥 Unexpected error creating staff member:', error);
      console.error('💥 Error stack:', error.stack);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  }

  // Test edge function connectivity using HTTP POST (No Authentication)
  async testCreateStaffEdgeFunction(): Promise<{ success: boolean; error?: string; details?: any }> {
    try {
      console.log('🧪 Testing create-staff edge function connectivity with POST (No Auth)...');

      // Test with minimal required data using FormData
      const formData = new FormData();
      formData.append('full_name', 'Test Staff Member');
      formData.append('working_email', 'test@example.com');
      formData.append('role', 'receptionist');

      console.log('📤 Test FormData prepared with fields:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value}`);
      }

      const edgeFunctionUrl = 'https://xzxxodxplyetecrsbxmc.supabase.co/functions/v1/create-staff';
      console.log('🔗 Test URL:', edgeFunctionUrl);

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        // No headers needed - let browser set Content-Type with boundary for FormData
        body: formData
      });

      console.log('📥 Test response status:', response.status, response.statusText);
      console.log('📥 Test response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('💥 Test HTTP Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          details: {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          }
        };
      }

      const responseData = await response.json();
      console.log('📥 Test response data:', responseData);

      return {
        success: true,
        details: responseData
      };
    } catch (error: any) {
      console.error('💥 Test edge function error:', error);
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
  }

  // Legacy method - kept for backward compatibility
  async addStaffMember(
    staffData: Omit<Staff, 'staff_id' | 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; data?: Staff; error?: string }> {
    try {
      const newStaffData = {
        ...staffData,
        staff_id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('staff_members')
        .insert([newStaffData])
        .select()
        .single();

      if (error) {
        console.error('Error adding staff member:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data as Staff };
    } catch (error) {
      console.error('Unexpected error adding staff member:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }









  async deleteStaffMember(
    staffId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // First check if staff member exists
      const { data: existingStaff, error: checkError } = await supabase
        .from('staff_members')
        .select('staff_id, full_name')
        .eq('staff_id', staffId)
        .single();

      if (checkError) {
        if (checkError.code === 'PGRST116') {
          return { success: false, error: 'Staff member not found' };
        }
        console.error('Error checking staff member:', checkError);
        return { success: false, error: checkError.message };
      }

      // Perform soft delete by updating status instead of hard delete
      const { error: updateError } = await supabase
        .from('staff_members')
        .update({
          staff_status: 'inactive',
          is_available: false,
          updated_at: new Date().toISOString(),
        })
        .eq('staff_id', staffId);

      if (updateError) {
        console.error('Error soft deleting staff member:', updateError);
        return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error deleting staff member:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Doctor Profile Methods
  async getDoctorProfile(staffId: string): Promise<any> {
    const { data, error } = await supabase
      .from('staff_members')
      .select(
        `
        *,
        doctor_details (*)
      `
      )
      .eq('staff_id', staffId)
      .eq('role', 'doctor')
      .single();

    if (error) throw error;

    // Debug logging
    console.log('🔍 Raw Supabase response:', data);
    console.log('🔍 Doctor details from response:', data?.doctor_details);
    console.log(
      '🔍 Is doctor_details array?',
      Array.isArray(data?.doctor_details)
    );

    // Process the image URL for staff-uploads bucket
    if (data) {
      const processedData = this.processImageUrls(data, 'staff-uploads');
      console.log('🔍 Processed doctor profile with image URL:', processedData);
      return processedData;
    }

    return data;
  }

  // Check if doctor_details record exists
  async checkDoctorDetailsExists(doctorId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('doctor_details')
      .select('doctor_id')
      .eq('doctor_id', doctorId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  }

  //#endregion

  // ============= MEDICAL SERVICES FUNCTIONS ============= //

  async getMedicalServices(): Promise<{
    success: boolean;
    data?: Service[];
    error?: string;
  }> {
    try {
      // Fetch services and categories separately
      const [servicesResult, categoriesResult] = await Promise.all([
        supabase
          .from('medical_services')
          .select('*')
          .order('service_name', { ascending: true }),
        supabase
          .from('service_categories')
          .select('category_id, category_name'),
      ]);

      if (servicesResult.error) {
        console.error(
          '❌ Error fetching medical services:',
          servicesResult.error
        );
        return { success: false, error: servicesResult.error.message };
      }

      if (categoriesResult.error) {
        console.error(
          '❌ Error fetching service categories:',
          categoriesResult.error
        );
        return { success: false, error: categoriesResult.error.message };
      }

      // Create a map of categories for quick lookup
      const categoryMap = new Map();
      (categoriesResult.data || []).forEach((cat: any) => {
        categoryMap.set(cat.category_id, cat.category_name);
      });

      // Transform data to include category information
      const services = (servicesResult.data || []).map((service: any) => ({
        service_id: service.service_id,
        category_id: service.category_id,
        service_name: service.service_name,
        service_description: service.service_description,
        service_cost: service.service_cost,
        duration_minutes: service.duration_minutes,
        is_active: service.is_active,
        image_link: service.image_link,
        excerpt: service.excerpt,
        category_name: categoryMap.get(service.category_id) || 'Unknown',
      }));

      // Process services data to add full image URLs
      const processedServices = this.processImageUrls(
        services,
        'service-uploads'
      ) as Service[];

      return { success: true, data: processedServices };
    } catch (error: any) {
      console.error('❌ Error in getMedicalServices:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch medical services',
      };
    }
  }

  // Alias method for backward compatibility
  async getAllServices(): Promise<{
    success: boolean;
    data?: Service[];
    error?: string;
  }> {
    return this.getMedicalServices();
  }

  async getMedicalServiceById(
    serviceId: string
  ): Promise<{ success: boolean; data?: Service; error?: string }> {
    try {
      // Fetch service and category separately
      const { data: serviceData, error: serviceError } = await supabase
        .from('medical_services')
        .select('*')
        .eq('service_id', serviceId)
        .single();

      if (serviceError) {
        console.error('❌ Error fetching medical service:', serviceError);
        return { success: false, error: serviceError.message };
      }

      if (!serviceData) {
        return { success: false, error: 'Service not found' };
      }

      // Fetch category name
      const { data: categoryData } = await supabase
        .from('service_categories')
        .select('category_name')
        .eq('category_id', serviceData.category_id)
        .single();

      const service = {
        service_id: serviceData.service_id,
        category_id: serviceData.category_id,
        service_name: serviceData.service_name,
        service_description: serviceData.service_description,
        service_cost: serviceData.service_cost,
        duration_minutes: serviceData.duration_minutes,
        is_active: serviceData.is_active,
        image_link: serviceData.image_link,
        excerpt: serviceData.excerpt,
        category_name: categoryData?.category_name || 'Unknown',
      };

      return { success: true, data: service };
    } catch (error: any) {
      console.error('❌ Error in getMedicalServiceById:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch medical service',
      };
    }
  }

  async createMedicalService(
    service: Omit<Service, 'service_id'>
  ): Promise<{ success: boolean; data?: Service; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('medical_services')
        .insert([
          {
            category_id: service.category_id,
            service_name: service.service_name,
            service_description: service.service_description,
            service_cost: service.service_cost,
            duration_minutes: service.duration_minutes,
            is_active: service.is_active,
            image_link: service.image_link,
            excerpt: service.excerpt,
          },
        ])
        .select('*')
        .single();

      if (error) {
        console.error('❌ Error creating medical service:', error);
        return { success: false, error: error.message };
      }

      // Fetch category name
      const { data: categoryData } = await supabase
        .from('service_categories')
        .select('category_name')
        .eq('category_id', data.category_id)
        .single();

      const createdService = {
        service_id: data.service_id,
        category_id: data.category_id,
        service_name: data.service_name,
        service_description: data.service_description,
        service_cost: data.service_cost,
        duration_minutes: data.duration_minutes,
        is_active: data.is_active,
        image_link: data.image_link,
        excerpt: data.excerpt,
        category_name: categoryData?.category_name || 'Unknown',
      };

      return { success: true, data: createdService };
    } catch (error: any) {
      console.error('❌ Error in createMedicalService:', error);
      return {
        success: false,
        error: error.message || 'Failed to create medical service',
      };
    }
  }

  async updateMedicalService(
    service: Service
  ): Promise<{ success: boolean; data?: Service; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('medical_services')
        .update({
          category_id: service.category_id,
          service_name: service.service_name,
          service_description: service.service_description,
          service_cost: service.service_cost,
          duration_minutes: service.duration_minutes,
          is_active: service.is_active,
          image_link: service.image_link,
          excerpt: service.excerpt,
        })
        .eq('service_id', service.service_id)
        .select('*')
        .single();

      if (error) {
        console.error('❌ Error updating medical service:', error);
        return { success: false, error: error.message };
      }

      // Fetch category name
      const { data: categoryData } = await supabase
        .from('service_categories')
        .select('category_name')
        .eq('category_id', data.category_id)
        .single();

      const updatedService = {
        service_id: data.service_id,
        category_id: data.category_id,
        service_name: data.service_name,
        service_description: data.service_description,
        service_cost: data.service_cost,
        duration_minutes: data.duration_minutes,
        is_active: data.is_active,
        image_link: data.image_link,
        excerpt: data.excerpt,
        category_name: categoryData?.category_name || 'Unknown',
      };

      return { success: true, data: updatedService };
    } catch (error: any) {
      console.error('❌ Error in updateMedicalService:', error);
      return {
        success: false,
        error: error.message || 'Failed to update medical service',
      };
    }
  }

  async deleteMedicalService(
    serviceId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('medical_services')
        .delete()
        .eq('service_id', serviceId);

      if (error) {
        console.error('❌ Error deleting medical service:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ Error in deleteMedicalService:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete medical service',
      };
    }
  }

  async toggleMedicalServiceStatus(
    serviceId: string,
    isActive: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('medical_services')
        .update({ is_active: isActive })
        .eq('service_id', serviceId);

      if (error) {
        console.error('❌ Error toggling medical service status:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ Error in toggleMedicalServiceStatus:', error);
      return {
        success: false,
        error: error.message || 'Failed to toggle service status',
      };
    }
  }

  // ============= SERVICE CATEGORIES FUNCTIONS ============= //

  async getServiceCategories(): Promise<{
    success: boolean;
    data?: Category[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('category_name', { ascending: true });

      if (error) {
        console.error('❌ Error fetching service categories:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('❌ Error in getServiceCategories:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch service categories',
      };
    }
  }

  async getServiceCategoryById(
    categoryId: string
  ): Promise<{ success: boolean; data?: Category; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .eq('category_id', categoryId)
        .single();

      if (error) {
        console.error('❌ Error fetching service category:', error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: 'Category not found' };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error in getServiceCategoryById:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch service category',
      };
    }
  }

  async createServiceCategory(
    category: Omit<Category, 'category_id'>
  ): Promise<{ success: boolean; data?: Category; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .insert([
          {
            category_name: category.category_name,
            category_description: category.description,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating service category:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error in createServiceCategory:', error);
      return {
        success: false,
        error: error.message || 'Failed to create service category',
      };
    }
  }

  async updateServiceCategory(
    category: Category
  ): Promise<{ success: boolean; data?: Category; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .update({
          category_name: category.category_name,
          category_description: category.description,
        })
        .eq('category_id', category.category_id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating service category:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error in updateServiceCategory:', error);
      return {
        success: false,
        error: error.message || 'Failed to update service category',
      };
    }
  }

  async deleteServiceCategory(
    categoryId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // First check if there are any services using this category
      const { count, error: countError } = await supabase
        .from('medical_services')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId);

      if (countError) {
        console.error('❌ Error checking category usage:', countError);
        return { success: false, error: countError.message };
      }

      if (count && count > 0) {
        return {
          success: false,
          error: `Cannot delete category. It is being used by ${count} service(s).`,
        };
      }

      const { error } = await supabase
        .from('service_categories')
        .delete()
        .eq('category_id', categoryId);

      if (error) {
        console.error('❌ Error deleting service category:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ Error in deleteServiceCategory:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete service category',
      };
    }
  }

  //#endregion

  // Get slot assignments for a doctor
  async getDoctorSlotAssignments(doctor_id: string) {
    const { data, error } = await supabase
      .from('doctor_slot_assignments')
      .select('*')
      .eq('doctor_id', doctor_id);
    if (error) throw error;
    return data || [];
  }

  // Get blog posts for a doctor
  async getDoctorBlogPosts(doctor_id: string) {
    console.log('🔍 Fetching blog posts for doctor_id:', doctor_id);

    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('doctor_id', doctor_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error in getDoctorBlogPosts:', error);
      console.error('❌ Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      throw error;
    }

    // Process the blog posts to add full image URLs
    const processedData = this.processImageUrls(
      data || [],
      'blog-uploads'
    ) as BlogPost[];

    console.log(
      '✅ Successfully fetched blog posts:',
      processedData?.length || 0,
      'posts'
    );
    return processedData;
  }

  // Get all blog posts (for admin purposes)
  async getAllBlogPosts(): Promise<{
    success: boolean;
    data?: BlogPost[];
    error?: string;
  }> {
    try {
      console.log('🔍 Fetching all blog posts');

      const { data, error } = await supabase
        .from('blog_posts')
        .select(
          `
          *,
          staff_members!blog_posts_doctor_id_fkey(full_name)
        `
        )
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase error in getAllBlogPosts:', error);
        return { success: false, error: error.message };
      }

      // Process the blog posts to add full image URLs and doctor names
      const processedData = (
        this.processImageUrls(data || [], 'blog-uploads') as BlogPost[]
      ).map((post) => ({
        ...post,
        doctor_name: post.staff_members?.full_name || 'Unknown Doctor',
      }));

      console.log(
        '✅ Successfully fetched all blog posts:',
        processedData?.length || 0,
        'posts'
      );
      return { success: true, data: processedData };
    } catch (error: any) {
      console.error('❌ Unexpected error in getAllBlogPosts:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Get published blog posts (for public viewing)
  async getPublishedBlogPosts(limit?: number): Promise<{
    success: boolean;
    data?: BlogPost[];
    error?: string;
  }> {
    try {
      console.log(
        '🔍 Fetching published blog posts',
        limit ? `(limit: ${limit})` : ''
      );

      let query = supabase
        .from('blog_posts')
        .select(
          `
          *,
          staff_members!blog_posts_doctor_id_fkey(full_name)
        `
        )
        .eq('blog_status', 'published')
        .order('published_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Supabase error in getPublishedBlogPosts:', error);
        return { success: false, error: error.message };
      }

      // Process the blog posts to add full image URLs and doctor names
      const processedData = (
        this.processImageUrls(data || [], 'blog-uploads') as BlogPost[]
      ).map((post) => ({
        ...post,
        doctor_name: post.staff_members?.full_name || 'Unknown Doctor',
      }));

      console.log(
        '✅ Successfully fetched published blog posts:',
        processedData?.length || 0,
        'posts'
      );
      return { success: true, data: processedData };
    } catch (error: any) {
      console.error('❌ Unexpected error in getPublishedBlogPosts:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Get a single blog post by ID and increment view count
  async getBlogPostById(
    blogId: string,
    incrementView: boolean = false
  ): Promise<{
    success: boolean;
    data?: BlogPost;
    error?: string;
  }> {
    try {
      console.log('🔍 Fetching blog post by ID:', blogId);

      // First, get the blog post
      const { data, error } = await supabase
        .from('blog_posts')
        .select(
          `
          *,
          staff_members!blog_posts_doctor_id_fkey(full_name)
        `
        )
        .eq('blog_id', blogId)
        .single();

      if (error) {
        console.error('❌ Supabase error in getBlogPostById:', error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: 'Blog post not found' };
      }

      // Increment view count if requested
      if (incrementView) {
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq('blog_id', blogId);

        if (updateError) {
          console.warn('⚠️ Failed to increment view count:', updateError);
          // Don't fail the entire request if view count update fails
        } else {
          data.view_count = (data.view_count || 0) + 1;
        }
      }

      // Process the blog post to add full image URL and doctor name
      const processedData = {
        ...(this.processImageUrls(data, 'blog-uploads') as BlogPost),
        doctor_name: data.staff_members?.full_name || 'Unknown Doctor',
      };

      console.log(
        '✅ Successfully fetched blog post:',
        processedData.blog_title
      );
      return { success: true, data: processedData };
    } catch (error: any) {
      console.error('❌ Unexpected error in getBlogPostById:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Helper method to get full image URL from Supabase storage
  private getFullImageUrl(
    imagePath: string | null,
    bucket: string = 'blog-uploads'
  ): string | null {
    if (!imagePath) return null;

    // If the path already contains the full URL, return as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    // Remove leading slash if present
    const cleanPath = imagePath.startsWith('/')
      ? imagePath.substring(1)
      : imagePath;

    // Construct the full Supabase storage URL
    const supabaseUrl = 'https://xzxxodxplyetecrsbxmc.supabase.co';
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
  }

  // Helper method to process image URLs for different entity types
  private processImageUrls<T extends Record<string, any>>(
    data: T | T[],
    bucket: string = 'blog-uploads'
  ): T | T[] {
    if (Array.isArray(data)) {
      return data.map((item) => this.processImageUrls(item, bucket)) as T[];
    }

    if (data && typeof data === 'object') {
      const processed = { ...data } as any;
      if (processed['image_link']) {
        processed['image_link'] = this.getFullImageUrl(
          processed['image_link'],
          bucket
        );
      }
      return processed as T;
    }

    return data;
  }



  // Get doctor details with staff information
  async getDoctorDetails(doctor_id: string): Promise<Doctor | null> {
    const { data, error } = await supabase
      .from('staff_members')
      .select(
        `
        *,
        doctor_details (*)
      `
      )
      .eq('staff_id', doctor_id)
      .eq('role', 'doctor')
      .single();

    if (error) throw error;
    return data
      ? {
        ...data,
        doctor_details: data.doctor_details,
      }
      : null;
  }

  // Update doctor profile with upsert logic
  async updateDoctorProfile(
    doctor_id: string,
    staffData: Partial<Staff>,
    doctorData?: Partial<DoctorDetails>
  ): Promise<void> {
    // Update staff_members table
    if (staffData && Object.keys(staffData).length > 0) {
      const { error: staffError } = await supabase
        .from('staff_members')
        .update(staffData)
        .eq('staff_id', doctor_id);
      if (staffError) throw staffError;
    }

    // Handle doctor_details table with upsert logic
    if (doctorData && Object.keys(doctorData).length > 0) {
      // First, check if doctor_details record exists
      const { data: existingRecord, error: checkError } = await supabase
        .from('doctor_details')
        .select('doctor_id')
        .eq('doctor_id', doctor_id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected if no record exists
        throw checkError;
      }

      if (existingRecord) {
        // Record exists, update it
        const { error: updateError } = await supabase
          .from('doctor_details')
          .update(doctorData)
          .eq('doctor_id', doctor_id);
        if (updateError) throw updateError;
      } else {
        // Record doesn't exist, create it
        const newDoctorData = {
          doctor_id: doctor_id,
          ...doctorData,
        };
        const { error: insertError } = await supabase
          .from('doctor_details')
          .insert(newDoctorData);
        if (insertError) throw insertError;
      }
    }
  }

  // Get doctor's patients (patients who have appointments with this doctor)
  async getDoctorPatients(doctor_id: string): Promise<Patient[]> {
    const { data, error } = await supabase
      .from('patients')
      .select(
        `
        *,
        appointments!inner(doctor_id)
      `
      )
      .eq('appointments.doctor_id', doctor_id);

    if (error) throw error;
    return data || [];
  }

  // Get doctor notifications
  async getDoctorNotifications(doctor_id: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select(
        `
        *,
        appointment:appointments(appointment_date, patient:patients(full_name))
      `
      )
      .eq('staff_id', doctor_id)
      .order('sent_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((notif: any) => ({
      ...notif,
      title: this.getNotificationTitle(notif.notification_type),
      message: this.getNotificationMessage(
        notif.notification_type,
        notif.appointment
      ),
    }));
  }

  private getNotificationTitle(type: string): string {
    switch (type) {
      case 'appointment_created':
        return 'New Appointment';
      case 'appointment_updated':
        return 'Appointment Updated';
      case 'appointment_cancelled':
        return 'Appointment Cancelled';
      case 'appointment_reminder':
        return 'Appointment Reminder';
      default:
        return 'Notification';
    }
  }

  private getNotificationMessage(type: string, appointment: any): string {
    const patientName = appointment?.patient?.full_name || 'Unknown Patient';
    const appointmentDate = appointment?.appointment_date || 'Unknown Date';

    switch (type) {
      case 'appointment_created':
        return `New appointment with ${patientName} on ${appointmentDate}`;
      case 'appointment_updated':
        return `Appointment with ${patientName} has been updated`;
      case 'appointment_cancelled':
        return `Appointment with ${patientName} has been cancelled`;
      case 'appointment_reminder':
        return `Reminder: Appointment with ${patientName} on ${appointmentDate}`;
      default:
        return 'You have a new notification';
    }
  }

  // Blog Posts Management
  async createBlogPost(
    doctor_id: string,
    blogData: CreateBlogPostRequest
  ): Promise<BlogPost> {
    console.log('📝 Creating blog post for doctor_id:', doctor_id);
    console.log('📝 Blog data:', blogData);

    const insertData = {
      doctor_id,
      ...blogData,
      published_at:
        blogData.blog_status === 'published' ? new Date().toISOString() : null,
    };

    console.log('📝 Insert data:', insertData);

    const { data, error } = await supabase
      .from('blog_posts')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error in createBlogPost:', error);
      console.error('❌ Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      throw error;
    }

    // Process the returned data to add full image URL
    const processedData = this.processImageUrls(
      data,
      'blog-uploads'
    ) as BlogPost;

    console.log('✅ Successfully created blog post:', processedData);
    return processedData;
  }

  async updateBlogPost(blogData: UpdateBlogPostRequest): Promise<void> {
    const updateData: any = { ...blogData };
    delete updateData.blog_id;

    if (blogData.blog_status === 'published' && !updateData.published_at) {
      updateData.published_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('blog_id', blogData.blog_id);

    if (error) throw error;
  }

  async deleteBlogPost(blog_id: string): Promise<void> {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('blog_id', blog_id);

    if (error) throw error;
  }

  // Receipts Management
  async getDoctorReceipts(doctor_id: string): Promise<Receipt[]> {
    // First get patient IDs for this doctor
    const { data: appointmentData, error: appointmentError } = await supabase
      .from('appointments')
      .select('patient_id')
      .eq('doctor_id', doctor_id);

    if (appointmentError) throw appointmentError;

    const patientIds =
      appointmentData?.map((a) => a.patient_id).filter(Boolean) || [];

    if (patientIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('receipts')
      .select(
        `
        *,
        patient:patients(full_name)
      `
      )
      .in('patient_id', patientIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((receipt: any) => ({
      ...receipt,
      patient_name: receipt.patient?.full_name || 'Unknown Patient',
    }));
  }

  async updateReceiptStatus(receipt_id: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('receipts')
      .update({ status })
      .eq('receipt_id', receipt_id);

    if (error) throw error;
  }

  // Patient Reports Management
  async getDoctorPatientReports(doctor_id: string): Promise<PatientReport[]> {
    const { data, error } = await supabase
      .from('patient_reports')
      .select(
        `
        *,
        patient:patients(full_name)
      `
      )
      .eq('staff_id', doctor_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((report: any) => ({
      ...report,
      patient_name: report.patient?.full_name || 'Unknown Patient',
    }));
  }

  async createPatientReport(
    doctor_id: string,
    reportData: CreatePatientReportRequest
  ): Promise<PatientReport> {
    console.log('🔍 Creating patient report with data:', {
      doctor_id,
      reportData,
      insertData: {
        staff_id: doctor_id,
        ...reportData,
      }
    });

    // First, check if this is a guest by checking the guests table
    const { data: guestCheck, error: guestError } = await supabase
      .from('guests')
      .select('guest_id, full_name')
      .eq('guest_id', reportData.patient_id)
      .single();

    if (guestCheck && !guestError) {
      console.warn('⚠️ Attempted to create report for guest:', guestCheck);
      throw new Error(`Reports cannot be created for guests. "${(guestCheck as any).full_name}" is a guest user. Only registered patients can have medical reports.`);
    }

    // Then, verify the patient exists in patients table
    const { data: patientCheck, error: patientError } = await supabase
      .from('patients')
      .select('id, full_name')
      .eq('id', reportData.patient_id)
      .single();

    console.log('🔍 Patient existence check:', {
      patient_id: reportData.patient_id,
      patientFound: !!patientCheck,
      patientData: patientCheck,
      error: patientError
    });

    if (patientError || !patientCheck) {
      // Check if the error is because it's a guest
      if (guestCheck) {
        throw new Error(`Reports cannot be created for guests. "${(guestCheck as any).full_name}" is a guest user. Only registered patients can have medical reports.`);
      }
      throw new Error(`Patient with ID ${reportData.patient_id} does not exist in the patients table. Error: ${patientError?.message}`);
    }

    const { data, error } = await supabase
      .from('patient_reports')
      .insert([
        {
          staff_id: doctor_id,
          ...reportData,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('🔍 Insert error details:', {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log('✅ Patient report created successfully:', data);
    return data;
  }

  async updatePatientReport(
    reportData: UpdatePatientReportRequest
  ): Promise<void> {
    const updateData: any = { ...reportData };
    delete updateData.report_id;

    const { error } = await supabase
      .from('patient_reports')
      .update(updateData)
      .eq('report_id', reportData.report_id);

    if (error) throw error;
  }

  // Period tracking functionality removed

  // ============= APPOINTMENT MANAGEMENT FOR RECEPTIONIST & DOCTOR ============= //

  // Get all appointments with patient/guest details for receptionist
  async getAllAppointmentsForReceptionist(): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      console.log('🏥 Loading all appointments for receptionist...');

      // Fetch patient appointments
      const { data: patientAppointments, error: patientError } = await supabase
        .from('appointments')
        .select(`
          appointment_id,
          patient_id,
          doctor_id,
          slot_id,
          category_id,
          phone,
          email,
          visit_type,
          appointment_status,
          created_at,
          updated_at,
          schedule,
          message,
          appointment_date,
          appointment_time,
          preferred_date,
          preferred_time,
          patient:patients(id, full_name, phone, email, gender),
          doctor:doctor_details(doctor_id, staff:staff_members(staff_id, full_name, working_email)),
          category:service_categories(category_id, category_name),
          slot:doctor_slot_assignments(
            doctor_slot_id,
            appointments_count,
            max_appointments,
            slot:slots(slot_id, slot_date, slot_time)
          )
        `)
        .order('created_at', { ascending: false });

      if (patientError) {
        console.error('❌ Error fetching patient appointments:', patientError);
        return { success: false, error: patientError.message };
      }

      // Fetch guest appointments
      const { data: guestAppointments, error: guestError } = await supabase
        .from('guest_appointments')
        .select(`
          guest_appointment_id,
          guest_id,
          doctor_id,
          slot_id,
          category_id,
          phone,
          email,
          visit_type,
          appointment_status,
          created_at,
          updated_at,
          schedule,
          message,
          appointment_date,
          appointment_time,
          preferred_date,
          preferred_time,
          guest:guests(guest_id, full_name, phone, email, gender),
          doctor:doctor_details(doctor_id, staff:staff_members(staff_id, full_name, working_email)),
          category:service_categories(category_id, category_name),
          slot:doctor_slot_assignments(
            doctor_slot_id,
            appointments_count,
            max_appointments,
            slot:slots(slot_id, slot_date, slot_time)
          )
        `)
        .order('created_at', { ascending: false });

      if (guestError) {
        console.error('❌ Error fetching guest appointments:', guestError);
        return { success: false, error: guestError.message };
      }

      // Transform and combine appointments
      const transformedPatientAppointments = (patientAppointments || []).map((apt: any) => ({
        appointment_id: apt.appointment_id,
        appointment_type: 'patient',
        original_id: apt.appointment_id,
        patient_id: apt.patient_id,
        guest_id: null,
        doctor_id: apt.doctor_id,
        slot_id: apt.slot_id,
        category_id: apt.category_id,
        phone: apt.phone,
        email: apt.email,
        visit_type: apt.visit_type,
        appointment_status: apt.appointment_status,
        created_at: apt.created_at,
        updated_at: apt.updated_at,
        schedule: apt.schedule,
        message: apt.message,
        appointment_date: apt.appointment_date,
        appointment_time: apt.appointment_time,
        preferred_date: apt.preferred_date,
        preferred_time: apt.preferred_time,
        patient_name: apt.patient?.full_name || 'Unknown Patient',
        patient_phone: apt.patient?.phone || apt.phone,
        patient_email: apt.patient?.email || apt.email,
        doctor_name: apt.doctor?.staff?.full_name || 'Unknown Doctor',
        category_name: apt.category?.category_name || 'General',
        slot_date: apt.slot?.slot?.slot_date,
        slot_time: apt.slot?.slot?.slot_time,
        slot_capacity: apt.slot?.max_appointments || 2,
        slot_current_count: apt.slot?.appointments_count || 0
      }));

      const transformedGuestAppointments = (guestAppointments || []).map((apt: any) => ({
        appointment_id: apt.guest_appointment_id,
        appointment_type: 'guest',
        original_id: apt.guest_appointment_id,
        patient_id: null,
        guest_id: apt.guest_id,
        doctor_id: apt.doctor_id,
        slot_id: apt.slot_id,
        category_id: apt.category_id,
        phone: apt.phone,
        email: apt.email,
        visit_type: apt.visit_type,
        appointment_status: apt.appointment_status,
        created_at: apt.created_at,
        updated_at: apt.updated_at,
        schedule: apt.schedule,
        message: apt.message,
        appointment_date: apt.appointment_date,
        appointment_time: apt.appointment_time,
        preferred_date: apt.preferred_date,
        preferred_time: apt.preferred_time,
        patient_name: apt.guest?.full_name || 'Guest User',
        patient_phone: apt.guest?.phone || apt.phone,
        patient_email: apt.guest?.email || apt.email,
        doctor_name: apt.doctor?.staff?.full_name || 'Unknown Doctor',
        category_name: apt.category?.category_name || 'General',
        slot_date: apt.slot?.slot?.slot_date,
        slot_time: apt.slot?.slot?.slot_time,
        slot_capacity: apt.slot?.max_appointments || 2,
        slot_current_count: apt.slot?.appointments_count || 0
      }));

      // Combine and sort by created_at
      const allAppointments = [...transformedPatientAppointments, ...transformedGuestAppointments]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      console.log('✅ Loaded appointments:', {
        patient_appointments: transformedPatientAppointments.length,
        guest_appointments: transformedGuestAppointments.length,
        total: allAppointments.length
      });

      return { success: true, data: allAppointments };
    } catch (error: any) {
      console.error('❌ Error in getAllAppointmentsForReceptionist:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch appointments'
      };
    }
  }

  // Approve appointment (receptionist workflow)
  async approveAppointment(
    appointmentId: string,
    appointmentType: 'patient' | 'guest',
    slotId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('✅ Approving appointment:', { appointmentId, appointmentType, slotId });

      const tableName = appointmentType === 'patient' ? 'appointments' : 'guest_appointments';
      const idField = appointmentType === 'patient' ? 'appointment_id' : 'guest_appointment_id';

      // Update appointment status to approved (in_progress)
      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          appointment_status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq(idField, appointmentId);

      if (updateError) {
        console.error('❌ Error updating appointment status:', updateError);
        return { success: false, error: updateError.message };
      }

      // Update slot count if slot_id is provided
      if (slotId) {
        await this.incrementSlotCount(slotId);
      }

      console.log('✅ Appointment approved successfully');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error in approveAppointment:', error);
      return { success: false, error: error.message || 'Failed to approve appointment' };
    }
  }

  // Reject appointment (receptionist workflow)
  async rejectAppointment(
    appointmentId: string,
    appointmentType: 'patient' | 'guest',
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('❌ Rejecting appointment:', { appointmentId, appointmentType, reason });

      const tableName = appointmentType === 'patient' ? 'appointments' : 'guest_appointments';
      const idField = appointmentType === 'patient' ? 'appointment_id' : 'guest_appointment_id';

      const updateData: any = {
        appointment_status: 'cancelled',
        updated_at: new Date().toISOString()
      };

      if (reason) {
        updateData.message = reason;
      }

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq(idField, appointmentId);

      if (error) {
        console.error('❌ Error rejecting appointment:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Appointment rejected successfully');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error in rejectAppointment:', error);
      return { success: false, error: error.message || 'Failed to reject appointment' };
    }
  }

  // Update appointment status (general method)
  async updateAppointmentStatus(
    appointmentId: string,
    appointmentType: 'patient' | 'guest',
    status: ProcessStatus,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Updating appointment status:', { appointmentId, appointmentType, status, notes });

      const tableName = appointmentType === 'patient' ? 'appointments' : 'guest_appointments';
      const idField = appointmentType === 'patient' ? 'appointment_id' : 'guest_appointment_id';

      const updateData: any = {
        appointment_status: status,
        updated_at: new Date().toISOString()
      };

      if (notes) {
        updateData.message = notes;
      }

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq(idField, appointmentId);

      if (error) {
        console.error('❌ Error updating appointment status:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Appointment status updated successfully');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error in updateAppointmentStatus:', error);
      return { success: false, error: error.message || 'Failed to update appointment status' };
    }
  }

  // Get appointments for a specific doctor (for doctor dashboard)
  async getAppointmentsByDoctor(doctorId: string): Promise<any[]> {
    try {
      console.log('👨‍⚕️ Loading appointments for doctor:', doctorId);

      // Get patient appointments for this doctor
      const { data: patientAppointments, error: patientError } = await supabase
        .from('appointments')
        .select(`
          appointment_id,
          patient_id,
          doctor_id,
          slot_id,
          category_id,
          phone,
          email,
          visit_type,
          appointment_status,
          created_at,
          updated_at,
          schedule,
          message,
          appointment_date,
          appointment_time,
          preferred_date,
          preferred_time,
          patient:patients(id, full_name, phone, email, gender, date_of_birth),
          category:service_categories(category_id, category_name),
          slot:doctor_slot_assignments(
            doctor_slot_id,
            slot:slots(slot_id, slot_date, slot_time)
          )
        `)
        .eq('doctor_id', doctorId)
        .in('appointment_status', ['in_progress', 'completed'])
        .order('appointment_date', { ascending: true });

      if (patientError) {
        console.error('❌ Error fetching patient appointments:', patientError);
        throw patientError;
      }

      // Get guest appointments for this doctor
      const { data: guestAppointments, error: guestError } = await supabase
        .from('guest_appointments')
        .select(`
          guest_appointment_id,
          guest_id,
          doctor_id,
          slot_id,
          category_id,
          phone,
          email,
          visit_type,
          appointment_status,
          created_at,
          updated_at,
          schedule,
          message,
          appointment_date,
          appointment_time,
          preferred_date,
          preferred_time,
          guest:guests(guest_id, full_name, phone, email, gender, date_of_birth),
          category:service_categories(category_id, category_name),
          slot:doctor_slot_assignments(
            doctor_slot_id,
            slot:slots(slot_id, slot_date, slot_time)
          )
        `)
        .eq('doctor_id', doctorId)
        .in('appointment_status', ['in_progress', 'completed'])
        .order('appointment_date', { ascending: true });

      if (guestError) {
        console.error('❌ Error fetching guest appointments:', guestError);
        throw guestError;
      }

      // Transform patient appointments
      const transformedPatientAppointments = (patientAppointments || []).map((apt: any) => ({
        appointment_id: apt.appointment_id,
        appointment_type: 'patient',
        patient_id: apt.patient_id,
        guest_id: null,
        doctor_id: apt.doctor_id,
        slot_id: apt.slot_id,
        category_id: apt.category_id,
        phone: apt.phone,
        email: apt.email,
        visit_type: apt.visit_type,
        appointment_status: apt.appointment_status,
        created_at: apt.created_at,
        updated_at: apt.updated_at,
        schedule: apt.schedule,
        message: apt.message,
        appointment_date: apt.appointment_date,
        appointment_time: apt.appointment_time,
        preferred_date: apt.preferred_date,
        preferred_time: apt.preferred_time,
        patient_name: apt.patient?.full_name || 'Unknown Patient',
        patient_phone: apt.patient?.phone || apt.phone,
        patient_email: apt.patient?.email || apt.email,
        patient_gender: apt.patient?.gender,
        patient_age: apt.patient?.date_of_birth ? this.calculateAge(apt.patient.date_of_birth) : null,
        category_name: apt.category?.category_name || 'General',
        slot_date: apt.slot?.slot?.slot_date,
        slot_time: apt.slot?.slot?.slot_time
      }));

      // Transform guest appointments
      const transformedGuestAppointments = (guestAppointments || []).map((apt: any) => ({
        appointment_id: apt.guest_appointment_id,
        appointment_type: 'guest',
        patient_id: null,
        guest_id: apt.guest_id,
        doctor_id: apt.doctor_id,
        slot_id: apt.slot_id,
        category_id: apt.category_id,
        phone: apt.phone,
        email: apt.email,
        visit_type: apt.visit_type,
        appointment_status: apt.appointment_status,
        created_at: apt.created_at,
        updated_at: apt.updated_at,
        schedule: apt.schedule,
        message: apt.message,
        appointment_date: apt.appointment_date,
        appointment_time: apt.appointment_time,
        preferred_date: apt.preferred_date,
        preferred_time: apt.preferred_time,
        patient_name: apt.guest?.full_name || 'Guest User',
        patient_phone: apt.guest?.phone || apt.phone,
        patient_email: apt.guest?.email || apt.email,
        patient_gender: apt.guest?.gender,
        patient_age: apt.guest?.date_of_birth ? this.calculateAge(apt.guest.date_of_birth) : null,
        category_name: apt.category?.category_name || 'General',
        slot_date: apt.slot?.slot?.slot_date,
        slot_time: apt.slot?.slot?.slot_time
      }));

      // Combine and sort by appointment date/time
      const allAppointments = [...transformedPatientAppointments, ...transformedGuestAppointments]
        .sort((a, b) => {
          const dateA = new Date(`${a.appointment_date} ${a.appointment_time}`);
          const dateB = new Date(`${b.appointment_date} ${b.appointment_time}`);
          return dateA.getTime() - dateB.getTime();
        });

      console.log('✅ Loaded doctor appointments:', {
        patient_appointments: transformedPatientAppointments.length,
        guest_appointments: transformedGuestAppointments.length,
        total: allAppointments.length
      });

      return allAppointments;
    } catch (error: any) {
      console.error('❌ Error in getAppointmentsByDoctor:', error);
      throw error;
    }
  }

  // Helper method to calculate age
  private calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  // ============= CREATE APPOINTMENT METHODS FOR RECEPTIONIST ============= //

  // Create appointment for existing patient (receptionist workflow)
  async createPatientAppointment(
    receptionistId: string,
    appointmentData: {
      patient_id: string;
      doctor_id: string;
      category_id?: string;
      slot_id?: string;
      phone: string;
      email: string;
      visit_type: VisitType;
      appointment_date: string;
      appointment_time: string;
      message?: string;
    }
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('🏥 Creating patient appointment by receptionist:', {
        receptionistId,
        appointmentData
      });

      // Verify patient exists
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id, full_name, phone, email')
        .eq('id', appointmentData.patient_id)
        .single();

      if (patientError || !patient) {
        return {
          success: false,
          error: `Patient not found: ${patientError?.message || 'Invalid patient ID'}`
        };
      }

      // Verify doctor exists
      const { data: doctor, error: doctorError } = await supabase
        .from('doctor_details')
        .select('doctor_id, staff:staff_members(staff_id, full_name)')
        .eq('doctor_id', appointmentData.doctor_id)
        .single();

      if (doctorError || !doctor) {
        return {
          success: false,
          error: `Doctor not found: ${doctorError?.message || 'Invalid doctor ID'}`
        };
      }

      // Create appointment with confirmed status (receptionist creates confirmed appointments)
      const insertData = {
        patient_id: appointmentData.patient_id,
        doctor_id: appointmentData.doctor_id,
        category_id: appointmentData.category_id,
        slot_id: appointmentData.slot_id,
        phone: appointmentData.phone,
        email: appointmentData.email,
        visit_type: appointmentData.visit_type,
        appointment_status: 'in_progress', // Receptionist creates in_progress appointments
        schedule: 'scheduled' as ScheduleEnum,
        appointment_date: appointmentData.appointment_date,
        appointment_time: appointmentData.appointment_time,
        message: appointmentData.message,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newAppointment, error: insertError } = await supabase
        .from('appointments')
        .insert([insertData])
        .select(`
          appointment_id,
          patient_id,
          doctor_id,
          slot_id,
          category_id,
          phone,
          email,
          visit_type,
          appointment_status,
          created_at,
          updated_at,
          schedule,
          message,
          appointment_date,
          appointment_time,
          patient:patients(id, full_name, phone, email),
          doctor:doctor_details(doctor_id, staff:staff_members(staff_id, full_name)),
          category:service_categories(category_id, category_name)
        `)
        .single();

      if (insertError) {
        console.error('❌ Error creating appointment:', insertError);
        return {
          success: false,
          error: insertError.message
        };
      }

      // Update slot count if slot_id is provided
      if (appointmentData.slot_id) {
        await this.incrementSlotCount(appointmentData.slot_id);
      }

      console.log('✅ Patient appointment created successfully:', newAppointment);
      return {
        success: true,
        data: newAppointment
      };
    } catch (error: any) {
      console.error('❌ Error in createPatientAppointment:', error);
      return {
        success: false,
        error: error.message || 'Failed to create appointment'
      };
    }
  }

  // Create appointment for walk-in guest (receptionist workflow)
  async createGuestAppointment(
    receptionistId: string,
    appointmentData: {
      guest_name: string;
      phone: string;
      email: string;
      gender?: string;
      date_of_birth?: string;
      doctor_id: string;
      category_id?: string;
      slot_id?: string;
      visit_type: VisitType;
      appointment_date: string;
      appointment_time: string;
      message?: string;
    }
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('🏥 Creating guest appointment by receptionist:', {
        receptionistId,
        appointmentData
      });

      // First, create or find guest record
      let guestId: string;

      // Check if guest already exists by phone or email
      const { data: existingGuest, error: guestCheckError } = await supabase
        .from('guests')
        .select('guest_id, full_name, phone, email')
        .or(`phone.eq.${appointmentData.phone},email.eq.${appointmentData.email}`)
        .single();

      if (existingGuest && !guestCheckError) {
        // Use existing guest
        guestId = existingGuest.guest_id;
        console.log('📋 Using existing guest:', existingGuest);
      } else {
        // Create new guest
        const { data: newGuest, error: guestCreateError } = await supabase
          .from('guests')
          .insert([{
            full_name: appointmentData.guest_name,
            phone: appointmentData.phone,
            email: appointmentData.email,
            gender: appointmentData.gender || 'other',
            date_of_birth: appointmentData.date_of_birth || '1990-01-01',
            created_at: new Date().toISOString()
          }])
          .select('guest_id, full_name, phone, email')
          .single();

        if (guestCreateError || !newGuest) {
          return {
            success: false,
            error: `Failed to create guest record: ${guestCreateError?.message}`
          };
        }

        guestId = newGuest.guest_id;
        console.log('✅ Created new guest:', newGuest);
      }

      // Verify doctor exists
      const { data: doctor, error: doctorError } = await supabase
        .from('doctor_details')
        .select('doctor_id, staff:staff_members(staff_id, full_name)')
        .eq('doctor_id', appointmentData.doctor_id)
        .single();

      if (doctorError || !doctor) {
        return {
          success: false,
          error: `Doctor not found: ${doctorError?.message || 'Invalid doctor ID'}`
        };
      }

      // Create guest appointment with confirmed status
      const insertData = {
        guest_id: guestId,
        doctor_id: appointmentData.doctor_id,
        category_id: appointmentData.category_id,
        slot_id: appointmentData.slot_id,
        phone: appointmentData.phone,
        email: appointmentData.email,
        visit_type: appointmentData.visit_type,
        appointment_status: 'in_progress', // Receptionist creates in_progress appointments
        schedule: 'scheduled' as ScheduleEnum,
        appointment_date: appointmentData.appointment_date,
        appointment_time: appointmentData.appointment_time,
        message: appointmentData.message,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newAppointment, error: insertError } = await supabase
        .from('guest_appointments')
        .insert([insertData])
        .select(`
          guest_appointment_id,
          guest_id,
          doctor_id,
          slot_id,
          category_id,
          phone,
          email,
          visit_type,
          appointment_status,
          created_at,
          updated_at,
          schedule,
          message,
          appointment_date,
          appointment_time,
          guest:guests(guest_id, full_name, phone, email),
          doctor:doctor_details(doctor_id, staff:staff_members(staff_id, full_name)),
          category:service_categories(category_id, category_name)
        `)
        .single();

      if (insertError) {
        console.error('❌ Error creating guest appointment:', insertError);
        return {
          success: false,
          error: insertError.message
        };
      }

      // Update slot count if slot_id is provided
      if (appointmentData.slot_id) {
        await this.incrementSlotCount(appointmentData.slot_id);
      }

      console.log('✅ Guest appointment created successfully:', newAppointment);
      return {
        success: true,
        data: newAppointment
      };
    } catch (error: any) {
      console.error('❌ Error in createGuestAppointment:', error);
      return {
        success: false,
        error: error.message || 'Failed to create guest appointment'
      };
    }
  }

  // Helper method to increment slot count
  private async incrementSlotCount(slotId: string): Promise<void> {
    try {
      console.log('📊 Incrementing slot count for slot:', slotId);

      // Get current count
      const { data: currentSlot, error: fetchError } = await supabase
        .from('doctor_slot_assignments')
        .select('appointments_count, max_appointments')
        .eq('doctor_slot_id', slotId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching current slot count:', fetchError);
        return;
      }

      if (!currentSlot) {
        console.warn('⚠️ Slot not found:', slotId);
        return;
      }

      // Check if slot is already full
      if (currentSlot.appointments_count >= currentSlot.max_appointments) {
        console.warn('⚠️ Slot is already full:', {
          slotId,
          current: currentSlot.appointments_count,
          max: currentSlot.max_appointments
        });
        return;
      }

      // Increment count
      const newCount = currentSlot.appointments_count + 1;
      const { error: updateError } = await supabase
        .from('doctor_slot_assignments')
        .update({ appointments_count: newCount })
        .eq('doctor_slot_id', slotId);

      if (updateError) {
        console.error('❌ Error updating slot count:', updateError);
      } else {
        console.log('✅ Slot count updated:', {
          slotId,
          oldCount: currentSlot.appointments_count,
          newCount: newCount
        });
      }
    } catch (error: any) {
      console.error('❌ Error in incrementSlotCount:', error);
    }
  }

  // Admin appointment management methods (unified for both patient and guest appointments)
  async updateAppointment(
    appointmentId: string,
    appointmentData: Partial<any>,
    appointmentType?: 'patient' | 'guest',
    originalTable?: 'appointments' | 'guest_appointments'
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const updateData: any = { ...appointmentData };
      updateData['updated_at'] = new Date().toISOString();

      // Determine which table to update
      let tableName: string;
      let idField: string;

      if (originalTable) {
        tableName = originalTable;
        idField =
          originalTable === 'appointments'
            ? 'appointment_id'
            : 'guest_appointment_id';
      } else {
        // Fallback: try to determine from appointmentType or default to appointments
        tableName =
          appointmentType === 'guest' ? 'guest_appointments' : 'appointments';
        idField =
          appointmentType === 'guest'
            ? 'guest_appointment_id'
            : 'appointment_id';
      }

      // Remove fields that don't belong in the update using bracket notation
      delete updateData['appointment_type'];
      delete updateData['original_table'];
      delete updateData['original_id'];
      delete updateData['display_name'];
      delete updateData['patient_name'];
      delete updateData['guest_name'];
      delete updateData['doctor_name'];
      delete updateData['category_name'];
      delete updateData['slot_date'];
      delete updateData['slot_time'];

      const { data, error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq(idField, appointmentId)
        .select()
        .single();

      if (error) {
        console.error(`Error updating ${tableName}:`, error);
        return { success: false, error: error.message };
      }

      // Re-fetch the updated appointment with all JOIN data
      const refreshResult = await this.getAllAppointments();
      if (refreshResult.success && refreshResult.data) {
        const updatedAppointment = refreshResult.data.find(
          (apt: any) =>
            apt.original_id === appointmentId ||
            apt.appointment_id === appointmentId
        );

        if (updatedAppointment) {
          return { success: true, data: updatedAppointment };
        }
      }

      // Fallback: return basic updated data
      return {
        success: true,
        data: { ...data, appointment_type: appointmentType || 'patient' },
      };
    } catch (error) {
      console.error('Unexpected error updating appointment:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async deleteAppointment(
    appointmentId: string,
    appointmentType?: 'patient' | 'guest',
    originalTable?: 'appointments' | 'guest_appointments'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Determine which table to delete from
      let tableName: string;
      let idField: string;

      if (originalTable) {
        tableName = originalTable;
        idField =
          originalTable === 'appointments'
            ? 'appointment_id'
            : 'guest_appointment_id';
      } else {
        // Fallback: try to determine from appointmentType or try both tables
        if (appointmentType === 'guest') {
          tableName = 'guest_appointments';
          idField = 'guest_appointment_id';
        } else {
          tableName = 'appointments';
          idField = 'appointment_id';
        }
      }

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq(idField, appointmentId);

      if (error) {
        // If deletion failed and we don't know the table, try the other table
        if (!originalTable && !appointmentType) {
          const alternateTable =
            tableName === 'appointments'
              ? 'guest_appointments'
              : 'appointments';
          const alternateIdField =
            alternateTable === 'appointments'
              ? 'appointment_id'
              : 'guest_appointment_id';

          const { error: alternateError } = await supabase
            .from(alternateTable)
            .delete()
            .eq(alternateIdField, appointmentId);

          if (alternateError) {
            console.error(
              `Error deleting from both tables:`,
              error,
              alternateError
            );
            return {
              success: false,
              error: `Failed to delete appointment: ${error.message}`,
            };
          }

          return { success: true };
        }

        console.error(`Error deleting from ${tableName}:`, error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error deleting appointment:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Get appointment statistics for admin dashboard
  async getAppointmentStats(): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_status, visit_type, created_at');

      if (error) {
        console.error('Error fetching appointment stats:', error);
        return { success: false, error: error.message };
      }

      const stats = {
        total: data?.length || 0,
        pending:
          data?.filter((a) => a.appointment_status === 'pending').length || 0,
        in_progress:
          data?.filter((a) => a.appointment_status === 'in_progress').length ||
          0,
        completed:
          data?.filter((a) => a.appointment_status === 'completed').length || 0,
        cancelled:
          data?.filter((a) => a.appointment_status === 'cancelled').length || 0,
        consultation:
          data?.filter((a) => a.visit_type === 'consultation').length || 0,
        follow_up:
          data?.filter((a) => a.visit_type === 'follow-up').length || 0,
        emergency:
          data?.filter((a) => a.visit_type === 'emergency').length || 0,
        routine: data?.filter((a) => a.visit_type === 'routine').length || 0,
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Unexpected error fetching appointment stats:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Dashboard Statistics for Doctors
  async getDoctorDashboardStats(doctor_id: string) {
    const today = new Date().toISOString().split('T')[0];

    // Get today's appointments count
    const { data: todayAppointments, error: todayError } = await supabase
      .from('appointments')
      .select('appointment_id')
      .eq('doctor_id', doctor_id)
      .eq('appointment_date', today);

    if (todayError) throw todayError;

    // Get pending appointments count
    const { data: pendingAppointments, error: pendingError } = await supabase
      .from('appointments')
      .select('appointment_id')
      .eq('doctor_id', doctor_id)
      .eq('appointment_status', 'pending');

    if (pendingError) throw pendingError;

    // Get total patients count
    const { data: totalPatients, error: patientsError } = await supabase
      .from('appointments')
      .select('patient_id')
      .eq('doctor_id', doctor_id)
      .not('patient_id', 'is', null);

    if (patientsError) throw patientsError;

    // Get unique patients count
    const uniquePatients = new Set(totalPatients?.map((p) => p.patient_id))
      .size;

    // Get recent appointments
    const { data: recentAppointments, error: recentError } = await supabase
      .from('appointments')
      .select(
        `
        appointment_id,
        appointment_date,
        appointment_time,
        appointment_status,
        visit_type,
        patient:patients(full_name)
      `
      )
      .eq('doctor_id', doctor_id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) throw recentError;

    return {
      todayAppointments: todayAppointments?.length || 0,
      pendingAppointments: pendingAppointments?.length || 0,
      totalPatients: uniquePatients,
      recentAppointments: (recentAppointments || []).map((appt: any) => ({
        ...appt,
        patient_name: appt.patient?.full_name || 'Unknown Patient',
      })),
    };
  }

  // Get doctor services
  async getDoctorServices(doctor_id: string) {
    const { data, error } = await supabase
      .from('doctor_services')
      .select(
        `
        *,
        service:medical_services(
          service_id,
          service_name,
          service_description,
          service_cost,
          duration_minutes,
          category:service_categories(category_name)
        )
      `
      )
      .eq('doctor_id', doctor_id);

    if (error) throw error;
    return (data || []).map((ds: any) => ({
      ...ds.service,
      category_name: ds.service?.category?.category_name || 'General',
    }));
  }

  // Add service to doctor
  async addDoctorService(doctor_id: string, service_id: string): Promise<void> {
    const { error } = await supabase
      .from('doctor_services')
      .insert([{ doctor_id, service_id }]);

    if (error) throw error;
  }

  // Remove service from doctor
  async removeDoctorService(
    doctor_id: string,
    service_id: string
  ): Promise<void> {
    const { error } = await supabase
      .from('doctor_services')
      .delete()
      .eq('doctor_id', doctor_id)
      .eq('service_id', service_id);

    if (error) throw error;
  }

  //#endregion

  // RPC method for calling Supabase functions
  async callRpc(functionName: string, params: any): Promise<any> {
    const { data, error } = await supabase.rpc(functionName, params);
    if (error) throw error;
    return data;
  }

  // Authentication methods
  async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }
    return user;
  }

  // Sign in with email and password for RLS policies
  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error signing in:', error);
      throw error;
    }

    return data;
  }

  // Enhanced staff authentication with Supabase Auth integration
  async authenticateStaffWithSupabase(
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    staff?: Staff;
    supabaseUser?: any;
    error?: {
      code: string;
      message: string;
      timestamp: string;
    };
  }> {
    const timestamp = new Date().toISOString();

    try {
      console.log('🔐 Authenticating staff with Supabase Auth:', {
        email,
        timestamp,
      });

      // First authenticate with our custom method
      const authResult = await this.authenticateStaff(email, password);

      if (!authResult.success) {
        return authResult;
      }

      // If staff authentication successful, try to authenticate with Supabase Auth
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (data.user) {
          console.log('✅ Staff authenticated with Supabase Auth');
          return {
            success: true,
            staff: authResult.staff,
            supabaseUser: data.user,
          };
        }

        if (error) {
          console.log(
            '⚠️ Supabase Auth failed, proceeding with staff-only auth:',
            error.message
          );
        }
      } catch (supabaseError: any) {
        console.log(
          '⚠️ Supabase Auth error, proceeding with staff-only auth:',
          supabaseError.message
        );
      }

      // Return success even if Supabase Auth fails
      return {
        success: true,
        staff: authResult.staff,
      };
    } catch (error: any) {
      console.error('❌ Staff authentication error:', error);

      return {
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: error.message || 'Authentication failed. Please try again.',
          timestamp,
        },
      };
    }
  }

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }





  async getStaffByEmail(email: string): Promise<Staff | null> {
    const { data, error } = await supabase
      .from('staff_members')
      .select('*')
      .eq('working_email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No user found
      }
      throw error;
    }
    return data as Staff;
  }

  // Enhanced staff authentication with detailed error reporting
  async authenticateStaff(
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    staff?: Staff;
    error?: {
      code: string;
      message: string;
      timestamp: string;
    };
  }> {
    const timestamp = new Date().toISOString();

    try {
      console.log('🔍 Authenticating staff:', { email, timestamp });



      // Get staff member from database for other users
      const staff = await this.getStaffByEmail(email);

      if (!staff) {
        return {
          success: false,
          error: {
            code: 'STAFF_NOT_FOUND',
            message: 'No staff member found with this email address.',
            timestamp,
          },
        };
      }

      // Check if staff is active
      if (staff.staff_status !== 'active') {
        return {
          success: false,
          error: {
            code: 'STAFF_INACTIVE',
            message:
              'Staff account is not active. Please contact administrator.',
            timestamp,
          },
        };
      }

      // Validate password (using default password '123456' for all staff)
      const defaultPassword = '123456';
      if (password !== defaultPassword) {
        return {
          success: false,
          error: {
            code: 'INVALID_PASSWORD',
            message: 'Invalid password. Please check your credentials.',
            timestamp,
          },
        };
      }

      console.log('✅ Staff authentication successful:', {
        staff_id: staff.staff_id,
        role: staff.role,
        email: staff.working_email,
        timestamp,
      });

      return {
        success: true,
        staff,
      };
    } catch (error: any) {
      console.error('❌ Staff authentication error:', error);

      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message:
            error.message || 'Database connection error. Please try again.',
          timestamp,
        },
      };
    }
  }

  // ==================== SLOT MANAGEMENT METHODS ====================

  // Get doctor's assigned slots with details and appointments
  async getDoctorSlots(
    doctorId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<any[]> {
    let query = supabase
      .from('doctor_slot_assignments')
      .select(
        `
        *,
        slots (
          slot_id,
          slot_date,
          slot_time,
          is_active,
          created_at,
          updated_at
        )
      `
      )
      .eq('doctor_id', doctorId);

    if (dateFrom) {
      query = query.gte('slots.slot_date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('slots.slot_date', dateTo);
    }

    const { data, error } = await query.order('slots.slot_date', {
      ascending: true,
    });

    if (error) throw error;

    // Transform data to include calculated fields
    // For each slot, get the appointments (both patient and guest)
    const slotsWithAppointments = await Promise.all(
      (data || []).map(async (assignment) => {
        const slotAppointments = await this.getSlotAppointments(assignment.doctor_slot_id);

        return {
          ...assignment,
          slot_details: assignment.slots,
          is_full: assignment.appointments_count >= assignment.max_appointments,
          availability_percentage:
            (assignment.appointments_count / assignment.max_appointments) * 100,
          appointments: slotAppointments
        };
      })
    );

    return slotsWithAppointments;
  }

  // Get appointments for a specific slot
  async getSlotAppointments(slotId: string): Promise<any[]> {
    try {
      // Get patient appointments for this slot
      const { data: patientAppointments, error: patientError } = await supabase
        .from('appointments')
        .select(
          `
          appointment_id,
          appointment_date,
          appointment_time,
          appointment_status,
          visit_type,
          patient:patients(full_name, phone, email)
        `
        )
        .eq('slot_id', slotId);

      if (patientError) throw patientError;

      // Get guest appointments for this slot
      const { data: guestAppointments, error: guestError } = await supabase
        .from('guest_appointments')
        .select(
          `
          guest_appointment_id,
          appointment_date,
          appointment_time,
          appointment_status,
          visit_type,
          guest:guests(full_name, phone, email)
        `
        )
        .eq('slot_id', slotId);

      if (guestError) throw guestError;

      // Transform and combine appointments
      const transformedPatientAppointments = (patientAppointments || []).map((appt: any) => ({
        ...appt,
        patient_name: appt.patient?.full_name || 'Unknown',
        phone: appt.patient?.phone,
        email: appt.patient?.email,
        appointment_type: 'patient'
      }));

      const transformedGuestAppointments = (guestAppointments || []).map((appt: any) => ({
        appointment_id: appt.guest_appointment_id,
        appointment_date: appt.appointment_date,
        appointment_time: appt.appointment_time,
        appointment_status: appt.appointment_status,
        visit_type: appt.visit_type,
        patient_name: appt.guest?.full_name || 'Unknown Guest',
        phone: appt.guest?.phone,
        email: appt.guest?.email,
        appointment_type: 'guest'
      }));

      return [...transformedPatientAppointments, ...transformedGuestAppointments];
    } catch (error) {
      console.error('Error fetching slot appointments:', error);
      return [];
    }
  }

  // Get doctor slots for a specific date range (for calendar view)
  async getDoctorSlotsForDateRange(
    doctorId: string,
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    const { data, error } = await supabase
      .from('doctor_slot_assignments')
      .select(
        `
        *,
        slots!inner (
          slot_id,
          slot_date,
          slot_time,
          is_active
        )
      `
      )
      .eq('doctor_id', doctorId)
      .gte('slots.slot_date', startDate)
      .lte('slots.slot_date', endDate)
      .order('slots.slot_date', { ascending: true });

    if (error) throw error;

    return (data || []).map((assignment) => ({
      ...assignment,
      slot_details: assignment.slots,
      is_full: assignment.appointments_count >= assignment.max_appointments,
      availability_percentage:
        (assignment.appointments_count / assignment.max_appointments) * 100,
    }));
  }

  // Get slot statistics for a doctor
  async getDoctorSlotStatistics(
    doctorId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<any> {
    let query = supabase
      .from('doctor_slot_assignments')
      .select(
        `
        appointments_count,
        max_appointments,
        slots!inner (
          is_active,
          slot_date
        )
      `
      )
      .eq('doctor_id', doctorId);

    if (dateFrom) {
      query = query.gte('slots.slot_date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('slots.slot_date', dateTo);
    }

    const { data, error } = await query;

    if (error) throw error;

    const slots = data || [];
    const totalSlots = slots.length;
    const activeSlots = slots.filter((s: any) => s.slots.is_active).length;
    const fullSlots = slots.filter(
      (s: any) => s.appointments_count >= s.max_appointments
    ).length;
    const totalAppointments = slots.reduce(
      (sum: number, s: any) => sum + s.appointments_count,
      0
    );
    const totalCapacity = slots.reduce(
      (sum: number, s: any) => sum + s.max_appointments,
      0
    );
    const utilizationRate =
      totalCapacity > 0 ? (totalAppointments / totalCapacity) * 100 : 0;

    return {
      totalSlots,
      activeSlots,
      fullSlots,
      totalAppointments,
      totalCapacity,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
    };
  }

  // Update slot assignment capacity
  async updateSlotCapacity(
    assignmentId: string,
    maxAppointments: number
  ): Promise<any> {
    const { data, error } = await supabase
      .from('doctor_slot_assignments')
      .update({ max_appointments: maxAppointments })
      .eq('doctor_slot_id', assignmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
