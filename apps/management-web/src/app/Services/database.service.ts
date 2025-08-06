import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { supabase } from '../supabase-client';
import {
    DoctorDetails,
    MedicalService,
    BlogPost,
    Slot,
    StaffMember,
    Appointment,
    Patient,
    MedicalServiceCategory as ServiceCategory
} from '../models/database.interface';

export interface DoctorProfile {
    doctor_id: string;
    department: string;
    speciality: string;
    bio?: string;
    slogan?: string;
    educations?: any;
    certifications?: any;
    about_me?: string;
    license_no?: string;
    staff_members: {
        full_name: string;
        gender: string;
        image_link?: string;
        working_email: string;
        years_experience?: number;
        languages?: any[];
    };
    blogs: Array<{
        blog_id: string;
        title: string;
        excerpt?: string;
        image_link?: string;
        created_at: string;
        updated_at: string;
        doctor_id: string;
    }>;
}

export interface ServiceWithDoctors extends MedicalService {
    service_categories: ServiceCategory;
    doctors: Array<{
        id: string;
        fullname: string;
        gender: string;
        img?: string;
    }>;
}

export interface BlogWithDoctor extends BlogPost {
    doctor_details: {
        id: string;
        fullname: string;
        gender: string;
        img?: string;
    };
}

export interface DoctorWithServices {
    doctor_id: string;
    full_name: string;
    gender: string;
    image_link?: string;
    specialization: string;
    services: Array<{
        service_id: string;
        service_name: string;
    }>;
}

export interface ServiceForBooking {
    service_id: string;
    service_name: string;
    description?: string;
}

export interface DoctorForBooking {
    doctor_id: string;
    full_name: string;
    image_link?: string;
    gender: string;
    specialization: string;
    services: string[]; // Array of service IDs
}

@Injectable({
    providedIn: 'root'
})
export class DatabaseService {

    constructor() { }

    /**
     * Fetch doctor profile by ID and email (for verification)
     */
    fetchDoctorProfile(doctorId: string, email: string): Observable<DoctorProfile> {
        return from(this.callDatabaseFunction<DoctorProfile>('fetch_doctor_id', {
            p_doctor_id: doctorId,
            p_email: email
        }));
    }

    /**
     * Fetch all services with categories
     */
    fetchAllServices(): Observable<MedicalService[]> {
        return from(this.callDatabaseFunction<MedicalService[]>('fetch_service'));
    }

    /**
     * Fetch service by ID with linked doctors
     */
    fetchServiceById(serviceId: string): Observable<ServiceWithDoctors> {
        return from(this.callDatabaseFunction<ServiceWithDoctors>('fetch_service_id', {
            p_service_id: serviceId
        }));
    }

    /**
     * Fetch blog by ID (also increments view count)
     */
    fetchBlogById(blogId: string): Observable<BlogWithDoctor> {
        return from(this.callDatabaseFunction<BlogWithDoctor>('fetch_blog_id', {
            input_blog_id: blogId
        }));
    }

    /**
     * Fetch slots by doctor ID for next 7 days
     */
    fetchSlotsByDoctorId(doctorId: string): Observable<Slot[]> {
        return from(this.callDatabaseFunction<Slot[]>('fetch_slot_by_doctor_id', {
            p_doctor_id: doctorId
        }));
    }

    /**
     * Fetch services by doctor ID
     */
    fetchServicesByDoctorId(doctorId: string): Observable<DoctorWithServices> {
        return from(this.callDatabaseFunction<DoctorWithServices>('fetch_service_by_doctor_id', {
            p_doctor_id: doctorId
        }));
    }

    /**
     * Fetch services for booking (active services only)
     */
    fetchServicesForBooking(): Observable<ServiceForBooking[]> {
        return from(this.callDatabaseFunction<ServiceForBooking[]>('fetch_serviceBooking'));
    }

    /**
     * Fetch doctors for booking with their services
     */
    fetchDoctorsForBooking(): Observable<DoctorForBooking[]> {
        return from(this.callDatabaseFunction<DoctorForBooking[]>('fetch_doctorBooking'));
    }

    /**
     * Get analytics data for dashboard
     */
    getDashboardAnalytics(): Observable<{
        total_patients: number;
        total_appointments: number;
        total_doctors: number;
        total_revenue: number;
        monthly_stats: any[];
    }> {
        return from(this.callDatabaseFunction<{
            total_patients: number;
            total_appointments: number;
            total_doctors: number;
            total_revenue: number;
            monthly_stats: any[];
        }>('get_dashboard_analytics'));
    }

    /**
     * Get patient statistics
     */
    getPatientStats(): Observable<{
        active_patients: number;
        new_patients_this_month: number;
        patient_growth_rate: number;
    }> {
        return from(this.callDatabaseFunction<{
            active_patients: number;
            new_patients_this_month: number;
            patient_growth_rate: number;
        }>('get_patient_stats'));
    }

    /**
     * Get appointment statistics
     */
    getAppointmentStats(): Observable<{
        total_appointments: number;
        pending_appointments: number;
        completed_appointments: number;
        cancelled_appointments: number;
        appointments_this_month: number;
    }> {
        return from(this.callDatabaseFunction<{
            total_appointments: number;
            pending_appointments: number;
            completed_appointments: number;
            cancelled_appointments: number;
            appointments_this_month: number;
        }>('get_appointment_stats'));
    }

    /**
     * Get revenue statistics
     */
    getRevenueStats(): Observable<{
        total_revenue: number;
        monthly_revenue: number;
        revenue_growth_rate: number;
        top_services: any[];
    }> {
        return from(this.callDatabaseFunction<{
            total_revenue: number;
            monthly_revenue: number;
            revenue_growth_rate: number;
            top_services: any[];
        }>('get_revenue_stats'));
    }

    /**
     * Get staff statistics
     */
    getStaffStats(): Observable<{
        total_doctors: number;
        total_receptionists: number;
        active_staff: number;
        staff_on_leave: number;
    }> {
        return from(this.callDatabaseFunction<{
            total_doctors: number;
            total_receptionists: number;
            active_staff: number;
            staff_on_leave: number;
        }>('get_staff_stats'));
    }

    /**
     * Auto insert slots for next month (call on last day of month)
     */
    autoInsertSlotsForNextMonth(): Observable<{ success: boolean; message?: string }> {
        return from(this.callProcedure('auto_insert_slots_for_next_month'));
    }

    /**
     * Assign doctors to slots for date range
     */
    assignDoctorsToSlots(startDate: string, endDate: string): Observable<{ success: boolean }> {
        return from(this.callDatabaseFunction<{ success: boolean }>('assign_doctors_to_slots', {
            start_date: startDate,
            end_date: endDate
        }));
    }

    /**
     * Generic method to call database functions
     */
    private async callDatabaseFunction<T>(
        functionName: string,
        params: Record<string, any> = {}
    ): Promise<T> {
        try {
            console.log(`🔧 Calling database function: ${functionName}`);
            console.log('📝 Parameters:', params);

            const { data, error } = await supabase.rpc(functionName, params);

            if (error) {
                console.error(`❌ Database function ${functionName} error:`, error);
                throw new Error(error.message || `Failed to call ${functionName}`);
            }

            console.log(`✅ Database function ${functionName} success:`, data);
            return data as T;

        } catch (error) {
            console.error(`💥 Database function ${functionName} failed:`, error);
            throw error;
        }
    }

    /**
     * Generic method to call stored procedures
     */
    private async callProcedure(
        procedureName: string,
        params: Record<string, any> = {}
    ): Promise<{ success: boolean; message?: string }> {
        try {
            console.log(`⚙️ Calling stored procedure: ${procedureName}`);
            console.log('📝 Parameters:', params);

            const { data, error } = await supabase.rpc(procedureName, params);

            if (error) {
                console.error(`❌ Procedure ${procedureName} error:`, error);
                return {
                    success: false,
                    message: error.message || `Failed to execute ${procedureName}`
                };
            }

            console.log(`✅ Procedure ${procedureName} completed:`, data);
            return {
                success: true,
                message: data?.message || 'Procedure executed successfully'
            };

        } catch (error) {
            console.error(`💥 Procedure ${procedureName} failed:`, error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Insert slots for date range
     */
    insertSlotsRange(startDate: string, endDate: string): Observable<{ success: boolean }> {
        return from(this.callDatabaseFunction<{ success: boolean }>('insert_slots_range', {
            start_date: startDate,
            end_date: endDate
        }));
    }

    /**
     * Get available slots for specific date and doctor
     */
    getAvailableSlots(doctorId?: string, date?: string): Observable<Slot[]> {
        return from(this.callDatabaseFunction<Slot[]>('get_available_slots', {
            p_doctor_id: doctorId,
            p_date: date
        }));
    }

    /**
     * Get appointment history for patient
     */
    getPatientAppointmentHistory(patientId: string): Observable<Appointment[]> {
        return from(this.callDatabaseFunction<Appointment[]>('get_patient_appointment_history', {
            p_patient_id: patientId
        }));
    }

    /**
     * Get doctor's appointment schedule
     */
    getDoctorSchedule(doctorId: string, startDate?: string, endDate?: string): Observable<Appointment[]> {
        return from(this.callDatabaseFunction<Appointment[]>('get_doctor_schedule', {
            p_doctor_id: doctorId,
            p_start_date: startDate,
            p_end_date: endDate
        }));
    }
}
