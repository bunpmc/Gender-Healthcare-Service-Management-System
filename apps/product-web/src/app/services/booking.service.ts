// ================== IMPORTS ==================
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../environments/environment';
import {
  type TimeSlot,
  type DoctorSlotDetail,
  type AppointmentCreateRequest,
  type AppointmentResponse,
  type Appointment,
  type GuestAppointment,
} from '../models/booking.model';
import { Observable } from 'rxjs';
import { AppointmentService } from './appointment.service';

// ================== SERVICE DECORATOR ==================
@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private appointmentService = inject(AppointmentService);

  // =========== CONSTRUCTOR ===========
  constructor(private http: HttpClient) {}

  // =========== PRIVATE HEADER BUILDER ===========
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }

  // =========== FETCH AVAILABLE SLOTS ===========
  /**
   * Lấy danh sách slot khả dụng theo bác sĩ và ngày
   */
  getAvailableSlots(
    doctor_id: string,
    slot_date: string
  ): Observable<TimeSlot[]> {
    return this.http.post<TimeSlot[]>(
      `${environment.apiEndpoint}/get-available-slots`,
      {
        p_doctor_id: doctor_id,
        p_slot_date: slot_date,
        p_start_time: '00:00:00',
        p_end_time: '23:59:59',
        p_slot_id: null,
      },
      { headers: this.getHeaders() }
    );
  }

  // =========== FETCH SLOTS BY DOCTOR ID ===========
  /**
   * Lấy danh sách slot theo doctor_id từ API mới
   */
  fetchSlotsByDoctorId(doctor_id: string): Observable<any> {
    const params = new HttpParams().set('doctor_id', doctor_id);
    return this.http.get(`${environment.apiEndpoint}/fetch-slot-by-doctor-id`, {
      params,
      headers: this.getHeaders(),
    });
  }

  // =========== BOOK APPOINTMENT ===========
  /**
   * Đặt lịch hẹn mới (legacy method - kept for backward compatibility)
   */
  bookAppointment(payload: any): Observable<any> {
    return this.http.post(
      `${environment.apiEndpoint}/book-appointment`,
      payload,
      { headers: this.getHeaders() }
    );
  }

  // =========== CREATE APPOINTMENT (NEW METHOD) ===========
  /**
   * Create appointment using the new appointment service
   * Handles both logged-in users and guests
   */
  createAppointment(
    request: AppointmentCreateRequest
  ): Observable<AppointmentResponse> {
    return this.appointmentService.createAppointment(request);
  }

  // =========== GET APPOINTMENT DETAILS ===========
  /**
   * Get appointment details by ID
   */
  getAppointmentById(appointmentId: string): Observable<Appointment | null> {
    return this.appointmentService.getAppointmentById(appointmentId);
  }

  /**
   * Get guest appointment details by ID
   */
  getGuestAppointmentById(
    guestAppointmentId: string
  ): Observable<GuestAppointment | null> {
    return this.appointmentService.getGuestAppointmentById(guestAppointmentId);
  }
}
