import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SupabaseService } from '../../../supabase.service';
import { Patient } from '../../../models/patient.interface';

@Component({
  selector: 'app-patient-create-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './patient-create-modal.component.html',
  styleUrls: ['./patient-create-modal.component.css']
})
export class PatientCreateModalComponent implements OnInit, OnDestroy {
  @Input() isVisible = false;
  @Output() close = new EventEmitter<void>();
  @Output() patientCreated = new EventEmitter<Patient>();

  // Form and step management
  patientForm: FormGroup;
  currentStep = 1;
  totalSteps = 4;

  // State management
  isSubmitting = false;
  isAutoSaving = false;
  lastSaved: Date | null = null;

  // Auto-save timer
  private autoSaveTimer: any;
  private autoSaveInterval = 30000; // 30 seconds

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService
  ) {
    this.patientForm = this.createForm();
  }

  ngOnInit() {
    // Set up auto-save when form changes
    this.patientForm.valueChanges.subscribe(() => {
      this.scheduleAutoSave();
    });
  }

  ngOnDestroy() {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
  }

  /**
   * Create the reactive form with validation
   */
  private createForm(): FormGroup {
    return this.fb.group({
      // Step 1: Basic Information
      full_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      date_of_birth: ['', [Validators.required]],
      gender: ['', [Validators.required]],

      // Step 2: Contact & Address
      emergency_contact_name: [''],
      emergency_contact_phone: [''],
      address: [''],

      // Step 3: Medical Information
      blood_type: [''],
      vaccination_status: ['not_vaccinated'],
      allergies: [''],
      medical_history: [''],

      // Step 4: Account Settings
      patient_status: ['active'],
      insurance_provider: [''],
      insurance_policy_number: [''],
      notes: ['']
    });
  }

  /**
   * Get the title for the current step
   */
  getStepTitle(): string {
    const titles = [
      'Basic Information',
      'Contact & Address',
      'Medical Information',
      'Account Settings'
    ];
    return titles[this.currentStep - 1] || '';
  }

  /**
   * Check if a field is invalid and has been touched
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.patientForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Check if the current step is valid
   */
  isCurrentStepValid(): boolean {
    const stepFields = this.getStepFields(this.currentStep);
    return stepFields.every(fieldName => {
      const field = this.patientForm.get(fieldName);
      return field ? field.valid : true;
    });
  }

  /**
   * Get the fields for a specific step
   */
  private getStepFields(step: number): string[] {
    const stepFieldsMap: { [key: number]: string[] } = {
      1: ['full_name', 'email', 'phone', 'date_of_birth', 'gender'],
      2: ['emergency_contact_name', 'emergency_contact_phone', 'address'],
      3: ['blood_type', 'vaccination_status', 'allergies', 'medical_history'],
      4: ['patient_status', 'insurance_provider', 'insurance_policy_number', 'notes']
    };
    return stepFieldsMap[step] || [];
  }

  /**
   * Move to the next step
   */
  nextStep() {
    if (this.currentStep < this.totalSteps && this.isCurrentStepValid()) {
      this.currentStep++;
    }
  }

  /**
   * Move to the previous step
   */
  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  /**
   * Schedule auto-save
   */
  private scheduleAutoSave() {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }

    this.autoSaveTimer = setTimeout(() => {
      this.autoSave();
    }, this.autoSaveInterval);
  }

  /**
   * Auto-save form data to local storage
   */
  private async autoSave() {
    if (this.patientForm.dirty && this.patientForm.valid) {
      this.isAutoSaving = true;

      try {
        // Save to local storage as backup
        const formData = this.patientForm.value;
        localStorage.setItem('patient_form_draft', JSON.stringify({
          data: formData,
          timestamp: new Date().toISOString()
        }));

        this.lastSaved = new Date();

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        this.isAutoSaving = false;
      }
    }
  }

  /**
   * Load draft data from local storage
   */
  private loadDraft() {
    try {
      const draft = localStorage.getItem('patient_form_draft');
      if (draft) {
        const { data, timestamp } = JSON.parse(draft);
        const draftDate = new Date(timestamp);
        const now = new Date();
        const hoursDiff = (now.getTime() - draftDate.getTime()) / (1000 * 60 * 60);

        // Only load draft if it's less than 24 hours old
        if (hoursDiff < 24) {
          this.patientForm.patchValue(data);
          this.lastSaved = draftDate;
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  }

  /**
   * Clear draft data
   */
  private clearDraft() {
    localStorage.removeItem('patient_form_draft');
  }

  /**
   * Submit the form
   */
  async onSubmit() {
    if (this.patientForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      try {
        const formData = this.patientForm.value;

        // Create patient data object
        const patientData: Partial<Patient> = {
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
          address: formData.address,
          vaccination_status: formData.vaccination_status,
          allergies: formData.allergies,
          patient_status: formData.patient_status
        };

        // Submit to Supabase
        const result = await this.supabaseService.createPatient(patientData);

        if (result.success && result.data) {
          // Clear draft and emit success
          this.clearDraft();
          this.patientCreated.emit(result.data);
          this.closeModal();

          // Show success message (you can implement a toast service)
          console.log('Patient created successfully!');
        } else {
          throw new Error(result.error || 'Failed to create patient');
        }

      } catch (error) {
        console.error('Error creating patient:', error);
        // Show error message (you can implement a toast service)
        alert('Failed to create patient. Please try again.');
      } finally {
        this.isSubmitting = false;
      }
    }
  }

  /**
   * Close the modal
   */
  closeModal() {
    // Ask for confirmation if form has unsaved changes
    if (this.patientForm.dirty && !this.isSubmitting) {
      const confirmClose = confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmClose) {
        return;
      }
    }

    this.resetForm();
    this.close.emit();
  }

  /**
   * Reset the form to initial state
   */
  private resetForm() {
    this.patientForm.reset();
    this.currentStep = 1;
    this.isSubmitting = false;
    this.isAutoSaving = false;
    this.lastSaved = null;

    // Set default values
    this.patientForm.patchValue({
      vaccination_status: 'not_vaccinated',
      patient_status: 'active'
    });

    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
  }

  /**
   * Handle modal visibility changes
   */
  ngOnChanges() {
    if (this.isVisible) {
      this.loadDraft();
    }
  }
}
