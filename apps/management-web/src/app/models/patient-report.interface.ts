// Re-export PatientReport from database.interface.ts for consistency
export type { PatientReport } from './database.interface';

// Define ReportStatus locally as it's not in database.interface
export enum ReportStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REVIEWED = 'reviewed',
  ARCHIVED = 'archived'
}

// Keep legacy interface for backward compatibility if needed
export interface LegacyPatientReport {
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
