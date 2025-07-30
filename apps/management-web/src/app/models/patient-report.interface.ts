export interface PatientReport {
  report_id: string;
  patient_id?: string;
  report_content: string;
  report_description?: string;
  staff_id?: string;
  report_status: ReportStatus;
  created_at?: string;
  updated_at?: string;
  // Additional fields for display
  patient_name?: string;
  doctor_name?: string;
}

export enum ReportStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REVIEWED = 'reviewed',
  ARCHIVED = 'archived'
}

export interface CreatePatientReportRequest {
  patient_id: string;
  report_content: string;
  report_description?: string;
  report_status?: ReportStatus;
}

export interface UpdatePatientReportRequest {
  report_id: string;
  report_content?: string;
  report_description?: string;
  report_status?: ReportStatus;
}
