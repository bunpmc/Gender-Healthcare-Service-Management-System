// ================== IMPORTS ==================
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { type Doctor, type DoctorDetail } from '../models/doctor.model';
import { DoctorBooking } from '../models/booking.model';
import { Observable } from 'rxjs';

// ================== SERVICE DECORATOR ==================
@Injectable({
  providedIn: 'root',
})
export class DoctorService {
  // =========== CONSTRUCTOR ===========
  constructor(private http: HttpClient) {}

  // =========== PRIVATE HEADER BUILDER ===========
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }

  // =========== FETCH DOCTORS ===========
  /**
   * Gọi API lấy danh sách bác sĩ, có filter
   */
  getDoctors(name: string, specialty: string, gender: string) {
    let params = new HttpParams();
    if (name) params = params.set('name', name);
    if (specialty && specialty !== 'All')
      params = params.set('specialty', specialty);
    if (gender && gender !== 'All') params = params.set('gender', gender);

    return this.http.get<Doctor[]>(`${environment.apiEndpoint}/fetch-doctor`, {
      params,
    });
  }

  // =========== FETCH DOCTORS FOR BOOKING (APPOINTMENT PAGE) ===========
  /**
   * Lấy danh sách bác sĩ cho appointment booking từ endpoint fetch-doctorBooking
   */
  fetchDoctorBooking(): Observable<DoctorBooking[]> {
    return this.http.get<DoctorBooking[]>(
      `${environment.apiEndpoint}/fetch-doctorBooking`,
      {
        headers: this.getHeaders(),
      }
    );
  }

  // =========== FETCH DOCTOR BY ID ===========
  getDoctorById(id: string): Observable<DoctorDetail> {
    const params = new HttpParams().set('doctor_id', id);
    return this.http.get<DoctorDetail>(
      `${environment.apiEndpoint}/fetch-doctor-id`,
      { params }
    );
  }

  // =========== FETCH DOCTOR BY SERVICE ===========
  /**
   * Lấy danh sách bác sĩ theo service_id
   */
  getDoctorsByService(service_id: string): Observable<DoctorBooking[]> {
    return this.http.post<DoctorBooking[]>(
      `${environment.apiEndpoint}/fetch-doctor`,
      { service_id },
      { headers: this.getHeaders() }
    );
  }
}
