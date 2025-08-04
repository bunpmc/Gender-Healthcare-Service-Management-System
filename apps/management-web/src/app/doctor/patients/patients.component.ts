import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../supabase.service';
import { Router } from '@angular/router';
import { Patient } from '../../models/patient.interface';
import { PatientReport, CreatePatientReportRequest, ReportStatus } from '../../models/patient-report.interface';
import { BaseComponent } from '../../shared/base.component';

@Component({
  selector: 'app-doctor-patients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patients.component.html',
  styleUrls: ['./patients.component.css']
})
export class PatientsComponent extends BaseComponent implements OnInit {
  patients: Patient[] = [];
  filteredPatients: Patient[] = [];
  loading = true;
  error: string | null = null;
  doctorId: string | null = null;

  // Filter properties
  searchTerm = '';
  selectedGender = '';
  selectedStatus = '';

  // Modal properties
  showPatientModal = false;
  showReportModal = false;
  showPeriodModal = false;
  selectedPatient: Patient | null = null;
  patientReports: PatientReport[] = [];
  // Period tracking functionality removed - keeping empty array for template compatibility
  patientPeriods: any[] = [];
  patientAppointments: any[] = [];

  // Report form
  reportForm: CreatePatientReportRequest = {
    patient_id: '',
    report_content: '',
    report_description: '',
    report_status: ReportStatus.PENDING
  };

  // Gender options
  genderOptions = [
    { value: '', label: 'All Genders' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ];

  // Status options
  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    super();
  }

  ngOnInit() {
    this.doctorId = localStorage.getItem('doctor_id') || localStorage.getItem('staff_id');
    if (!this.doctorId) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadPatients();
  }

  async loadPatients() {
    try {
      this.loading = true;
      this.error = null;

      if (!this.doctorId) {
        console.warn('No doctor ID found');
        this.patients = [];
        this.applyFilters();
        return;
      }

      // Get patients and guests for this specific doctor
      const result = await this.supabaseService.getDoctorPatientsAndGuests(this.doctorId);
      if (result.success && result.data) {
        this.patients = result.data;
        this.applyFilters();
        console.log('✅ Loaded patients and guests for doctor:', this.patients.length);
      } else {
        this.error = result.error || 'Failed to load patients';
        console.error('❌ Error loading patients:', result.error);
      }
    } catch (error: any) {
      this.error = error.message || 'Failed to load patients';
      console.error('Patients error:', error);
    } finally {
      this.loading = false;
    }
  }

  applyFilters() {
    this.filteredPatients = this.patients.filter(patient => {
      const matchesSearch = !this.searchTerm ||
        patient.full_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        patient.phone.includes(this.searchTerm) ||
        patient.email.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesGender = !this.selectedGender ||
        patient.gender === this.selectedGender;

      const matchesStatus = !this.selectedStatus ||
        patient.patient_status === this.selectedStatus;

      return matchesSearch && matchesGender && matchesStatus;
    });
  }

  onSearchChange() {
    this.applyFilters();
  }

  onFilterChange() {
    this.applyFilters();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedGender = '';
    this.selectedStatus = '';
    this.applyFilters();
  }

  async openPatientModal(patient: Patient) {
    this.selectedPatient = patient;
    this.showPatientModal = true;

    try {
      // Load patient reports
      this.patientReports = await this.supabaseService.getDoctorPatientReports(this.doctorId!);
      this.patientReports = this.patientReports.filter(r => r.patient_id === patient.id);

      // Load patient appointments
      this.patientAppointments = await this.supabaseService.getAppointmentsByDoctor(this.doctorId!);
      this.patientAppointments = this.patientAppointments.filter(a => a.patient_id === patient.id);

      // Period tracking functionality removed
    } catch (error: any) {
      console.error('Error loading patient details:', error);
    }
  }

  closePatientModal() {
    this.showPatientModal = false;
    this.selectedPatient = null;
    this.patientReports = [];
    this.patientPeriods = [];
    this.patientAppointments = [];
  }

  openReportModal(patient: Patient) {
    console.log('🔍 Opening report modal for patient:', {
      patient: patient,
      patient_id: patient.id,
      patient_name: patient.full_name,
      patient_type: (patient as any).patient_type
    });

    // Check if this is a guest
    if ((patient as any).patient_type === 'guest') {
      this.error = 'Reports cannot be created for guests. Only registered patients can have medical reports.';
      console.warn('⚠️ Attempted to create report for guest:', patient.full_name);
      return;
    }

    this.selectedPatient = patient;
    this.reportForm = {
      patient_id: patient.id,
      report_content: '',
      report_description: '',
      report_status: ReportStatus.PENDING
    };
    this.showReportModal = true;
    this.error = null; // Clear any previous errors
  }

  closeReportModal() {
    this.showReportModal = false;
    this.selectedPatient = null;
    this.reportForm = {
      patient_id: '',
      report_content: '',
      report_description: '',
      report_status: ReportStatus.PENDING
    };
  }

  async createReport() {
    if (!this.selectedPatient || !this.reportForm.report_content.trim()) return;

    try {
      console.log('🔍 Creating report with data:', {
        doctorId: this.doctorId,
        selectedPatient: this.selectedPatient,
        reportForm: this.reportForm
      });

      // Validate patient_id exists
      if (!this.reportForm.patient_id) {
        throw new Error('Patient ID is missing');
      }

      await this.supabaseService.createPatientReport(this.doctorId!, this.reportForm);
      this.closeReportModal();
      // Refresh patient data if modal is open
      if (this.showPatientModal && this.selectedPatient) {
        this.openPatientModal(this.selectedPatient);
      }
    } catch (error: any) {
      this.error = error.message || 'Failed to create report';
      console.error('Create report error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    }
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  // Debug method to check database consistency
  async debugPatientData() {
    try {
      console.log('🔍 Starting patient data debug...');

      // Check current patients list
      console.log('🔍 Current patients in component:', this.patients.map(p => ({ id: p.id, name: p.full_name })));

      // Check patients from getAllPatients
      const allPatientsResult = await this.supabaseService.getAllPatients();
      if (allPatientsResult.success && allPatientsResult.data) {
        console.log('🔍 All patients from getAllPatients:', allPatientsResult.data.map((p: any) => ({ id: p.id, name: p.full_name })));
      }

      // Check if selected patient exists
      if (this.selectedPatient) {
        console.log('🔍 Selected patient:', { id: this.selectedPatient.id, name: this.selectedPatient.full_name });

        // Check if patient exists in the fetched data
        if (allPatientsResult.success && allPatientsResult.data && this.selectedPatient) {
          const foundPatient = allPatientsResult.data.find((p: any) => p.id === this.selectedPatient!.id);
          console.log('🔍 Patient found in database:', !!foundPatient);
        }
      }

    } catch (error) {
      console.error('🔍 Debug error:', error);
    }
  }
}