import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SupabaseService } from '../../supabase.service';
import { Router } from '@angular/router';
import { Doctor, DoctorDetails, Staff } from '../../models/staff.interface';

interface EducationItem {
  degree: string;
  institution: string;
  year_completed: number;
}

interface CertificationItem {
  name: string;
  institution: string;
  year_awarded: number;
}

interface AboutMeData {
  description: string;
  experience: string;
  approach?: string;
}

@Component({
  selector: 'app-doctor-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  doctor: Doctor | null = null;
  loading = true;
  saving = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Form states
  isEditingBasic = false;
  isEditingProfessional = false;
  isEditingBio = false;
  isEditingEducation = false;
  isEditingCertifications = false;
  isEditingLanguages = false;

  // Forms
  basicInfoForm!: FormGroup;
  professionalForm!: FormGroup;
  bioForm!: FormGroup;
  educationForm!: FormGroup;
  certificationForm!: FormGroup;
  languagesForm!: FormGroup;

  // Data arrays
  educations: EducationItem[] = [];
  certifications: CertificationItem[] = [];
  languages: string[] = [];

  // Temporary form data
  newEducation: EducationItem = { degree: '', institution: '', year_completed: new Date().getFullYear() };
  newCertification: CertificationItem = { name: '', institution: '', year_awarded: new Date().getFullYear() };
  newLanguage = '';

  doctorId: string | null = null;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.initializeForms();
  }

  ngOnInit() {
    this.doctorId = localStorage.getItem('doctor_id') || localStorage.getItem('staff_id');
    if (!this.doctorId) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadDoctorProfile();
  }

  private initializeForms() {
    this.basicInfoForm = this.fb.group({
      full_name: ['', [Validators.required]],
      working_email: ['', [Validators.required, Validators.email]],
      gender: ['', [Validators.required]],
      image_link: ['']
    });

    this.professionalForm = this.fb.group({
      department: ['', [Validators.required, this.validateDepartment]],
      speciality: ['', [Validators.required, this.validateSpeciality]],
      license_no: ['', [Validators.required]],
      years_experience: [0, [Validators.required, Validators.min(0)]]
    });

    this.bioForm = this.fb.group({
      bio: [''],
      slogan: [''],
      about_description: [''],
      about_experience: [''],
      about_approach: ['']
    });

    this.educationForm = this.fb.group({
      degree: ['', [Validators.required]],
      institution: ['', [Validators.required]],
      year_completed: [new Date().getFullYear(), [Validators.required]]
    });

    this.certificationForm = this.fb.group({
      name: ['', [Validators.required]],
      institution: ['', [Validators.required]],
      year_awarded: [new Date().getFullYear(), [Validators.required]]
    });

    this.languagesForm = this.fb.group({
      language: ['', [Validators.required]]
    });
  }

  async loadDoctorProfile() {
    try {
      this.loading = true;
      this.error = null;

      // Use the new getDoctorProfile method that joins both tables
      const profileData = await this.supabaseService.getDoctorProfile(this.doctorId!);

      if (profileData) {
        // Transform the joined data into the expected Doctor interface
        // Handle doctor_details which can be an array or null
        let doctorDetails = null;
        if (profileData.doctor_details) {
          if (Array.isArray(profileData.doctor_details)) {
            doctorDetails = profileData.doctor_details.length > 0 ? profileData.doctor_details[0] : null;
          } else {
            doctorDetails = profileData.doctor_details;
          }
        }

        this.doctor = {
          ...profileData,
          doctor_details: doctorDetails
        };

        console.log('🔍 Loaded doctor profile:', this.doctor);
        console.log('🔍 Doctor details:', this.doctor?.doctor_details);

        this.populateForms();
        this.extractArrayData();
      } else {
        this.error = 'Doctor profile not found';
      }
    } catch (error: any) {
      this.error = error.message || 'Failed to load doctor profile';
      console.error('Profile loading error:', error);
    } finally {
      this.loading = false;
    }
  }

  private populateForms() {
    if (!this.doctor) return;

    // Basic info form
    this.basicInfoForm.patchValue({
      full_name: this.doctor.full_name || '',
      working_email: this.doctor.working_email || '',
      gender: this.doctor.gender || '',
      image_link: this.doctor.image_link || ''
    });

    // Professional form
    console.log('🔍 Populating professional form with:', {
      department: this.doctor.doctor_details?.department,
      speciality: this.doctor.doctor_details?.speciality,
      license_no: this.doctor.doctor_details?.license_no,
      years_experience: this.doctor.years_experience
    });

    this.professionalForm.patchValue({
      department: this.doctor.doctor_details?.department || '',
      speciality: this.doctor.doctor_details?.speciality || '',
      license_no: this.doctor.doctor_details?.license_no || '',
      years_experience: this.doctor.years_experience || 0
    });

    console.log('🔍 Professional form values after patch:', this.professionalForm.value);

    // Bio form
    const aboutMe = this.doctor.doctor_details?.about_me || {};
    this.bioForm.patchValue({
      bio: this.doctor.doctor_details?.bio || '',
      slogan: this.doctor.doctor_details?.slogan || '',
      about_description: aboutMe.description || '',
      about_experience: aboutMe.experience || '',
      about_approach: aboutMe.approach || ''
    });
  }

  private extractArrayData() {
    if (!this.doctor?.doctor_details) return;

    // Extract educations
    const educationsData = this.doctor.doctor_details.educations;
    if (educationsData && educationsData.degrees) {
      this.educations = educationsData.degrees;
    }

    // Extract certifications
    const certificationsData = this.doctor.doctor_details.certifications;
    if (certificationsData && certificationsData.certifications) {
      this.certifications = certificationsData.certifications;
    }

    // Extract languages
    if (this.doctor.languages && Array.isArray(this.doctor.languages)) {
      this.languages = [...this.doctor.languages];
    }
  }

  // Edit mode toggles
  toggleEditBasic() {
    this.isEditingBasic = !this.isEditingBasic;
    if (!this.isEditingBasic) {
      this.populateForms(); // Reset form if canceling
    }
  }

  toggleEditProfessional() {
    this.isEditingProfessional = !this.isEditingProfessional;
    if (!this.isEditingProfessional) {
      this.populateForms();
    }
  }

  toggleEditBio() {
    this.isEditingBio = !this.isEditingBio;
    if (!this.isEditingBio) {
      this.populateForms();
    }
  }

  toggleEditEducation() {
    this.isEditingEducation = !this.isEditingEducation;
  }

  toggleEditCertifications() {
    this.isEditingCertifications = !this.isEditingCertifications;
  }

  toggleEditLanguages() {
    this.isEditingLanguages = !this.isEditingLanguages;
  }

  // Save methods
  async saveBasicInfo() {
    if (this.basicInfoForm.valid && this.doctorId) {
      try {
        this.saving = true;
        const formData = this.basicInfoForm.value;

        await this.supabaseService.updateDoctorProfile(this.doctorId, formData);

        this.successMessage = 'Basic information updated successfully';
        this.isEditingBasic = false;
        await this.loadDoctorProfile();
        this.clearMessages();
      } catch (error: any) {
        this.error = error.message || 'Failed to update basic information';
      } finally {
        this.saving = false;
      }
    }
  }

  async saveProfessionalInfo() {
    if (this.professionalForm.valid && this.doctorId) {
      try {
        this.saving = true;
        const formData = this.professionalForm.value;

        // Split data between staff and doctor_details
        const staffData = {
          years_experience: formData.years_experience
        };

        const doctorData = {
          department: formData.department,
          speciality: formData.speciality,
          license_no: formData.license_no
        };

        await this.supabaseService.updateDoctorProfile(this.doctorId, staffData, doctorData);

        this.successMessage = 'Professional information updated successfully';
        this.isEditingProfessional = false;
        await this.loadDoctorProfile();
        this.clearMessages();
      } catch (error: any) {
        this.error = error.message || 'Failed to update professional information';
      } finally {
        this.saving = false;
      }
    }
  }

  async saveBioInfo() {
    if (this.bioForm.valid && this.doctorId) {
      try {
        this.saving = true;
        const formData = this.bioForm.value;

        const aboutMe = {
          description: formData.about_description,
          experience: formData.about_experience,
          approach: formData.about_approach
        };

        const doctorData = {
          bio: formData.bio,
          slogan: formData.slogan,
          about_me: aboutMe
        };

        await this.supabaseService.updateDoctorProfile(this.doctorId, {}, doctorData);

        this.successMessage = 'Bio information updated successfully';
        this.isEditingBio = false;
        await this.loadDoctorProfile();
        this.clearMessages();
      } catch (error: any) {
        this.error = error.message || 'Failed to update bio information';
      } finally {
        this.saving = false;
      }
    }
  }

  // Array management methods
  addEducation() {
    if (this.educationForm.valid) {
      this.educations.push({ ...this.educationForm.value });
      this.educationForm.reset({
        degree: '',
        institution: '',
        year_completed: new Date().getFullYear()
      });
      this.saveEducations();
    }
  }

  removeEducation(index: number) {
    this.educations.splice(index, 1);
    this.saveEducations();
  }

  addCertification() {
    if (this.certificationForm.valid) {
      this.certifications.push({ ...this.certificationForm.value });
      this.certificationForm.reset({
        name: '',
        institution: '',
        year_awarded: new Date().getFullYear()
      });
      this.saveCertifications();
    }
  }

  removeCertification(index: number) {
    this.certifications.splice(index, 1);
    this.saveCertifications();
  }

  addLanguage() {
    if (this.languagesForm.valid) {
      const language = this.languagesForm.value.language.trim();
      if (language && !this.languages.includes(language)) {
        this.languages.push(language);
        this.languagesForm.reset();
        this.saveLanguages();
      }
    }
  }

  removeLanguage(index: number) {
    this.languages.splice(index, 1);
    this.saveLanguages();
  }

  private async saveEducations() {
    if (this.doctorId) {
      try {
        const doctorData = {
          educations: { degrees: this.educations }
        };
        await this.supabaseService.updateDoctorProfile(this.doctorId, {}, doctorData);
        this.successMessage = 'Education updated successfully';
        this.clearMessages();
      } catch (error: any) {
        this.error = error.message || 'Failed to update education';
      }
    }
  }

  private async saveCertifications() {
    if (this.doctorId) {
      try {
        const doctorData = {
          certifications: { certifications: this.certifications }
        };
        await this.supabaseService.updateDoctorProfile(this.doctorId, {}, doctorData);
        this.successMessage = 'Certifications updated successfully';
        this.clearMessages();
      } catch (error: any) {
        this.error = error.message || 'Failed to update certifications';
      }
    }
  }

  private async saveLanguages() {
    if (this.doctorId) {
      try {
        const staffData = {
          languages: this.languages
        };
        await this.supabaseService.updateDoctorProfile(this.doctorId, staffData);
        this.successMessage = 'Languages updated successfully';
        this.clearMessages();
      } catch (error: any) {
        this.error = error.message || 'Failed to update languages';
      }
    }
  }

  private clearMessages() {
    setTimeout(() => {
      this.successMessage = null;
      this.error = null;
    }, 3000);
  }

  // Utility methods
  getDepartmentDisplayName(department: string): string {
    const departments: { [key: string]: string } = {
      'reproductive_health': 'Reproductive Health',
      'urology': 'Urology',
      'gynecology': 'Gynecology',
      'transgender_care': 'Transgender Care',
      'sexual_health': 'Sexual Health'
    };
    return departments[department] || department;
  }

  // Custom validator for department enum
  validateDepartment(control: any) {
    const validDepartments = [
      'reproductive_health',
      'urology',
      'gynecology',
      'transgender_care',
      'sexual_health'
    ];

    if (!control.value || validDepartments.includes(control.value)) {
      return null; // Valid
    }

    return { invalidDepartment: true }; // Invalid
  }

  // Get all valid department options
  getValidDepartments() {
    return [
      { value: 'reproductive_health', label: 'Reproductive Health' },
      { value: 'urology', label: 'Urology' },
      { value: 'gynecology', label: 'Gynecology' },
      { value: 'transgender_care', label: 'Transgender Care' },
      { value: 'sexual_health', label: 'Sexual Health' }
    ];
  }

  // Custom validator for speciality enum
  validateSpeciality(control: any) {
    const validSpecialities = [
      'reproductive_specialist',
      'urologist',
      'gynecologist',
      'endocrinologist',
      'sexual_health_specialist'
    ];

    if (!control.value || validSpecialities.includes(control.value)) {
      return null; // Valid
    }

    return { invalidSpeciality: true }; // Invalid
  }

  // Get all valid speciality options
  getValidSpecialities() {
    return [
      { value: 'reproductive_specialist', label: 'Reproductive Specialist' },
      { value: 'urologist', label: 'Urologist' },
      { value: 'gynecologist', label: 'Gynecologist' },
      { value: 'endocrinologist', label: 'Endocrinologist' },
      { value: 'sexual_health_specialist', label: 'Sexual Health Specialist' }
    ];
  }

  getSpecialityDisplayName(speciality: string): string {
    const specialities: { [key: string]: string } = {
      'reproductive_specialist': 'Reproductive Specialist',
      'urologist': 'Urologist',
      'gynecologist': 'Gynecologist',
      'endocrinologist': 'Endocrinologist',
      'sexual_health_specialist': 'Sexual Health Specialist'
    };
    return specialities[speciality] || speciality;
  }

  getGenderDisplayName(gender: string): string {
    const genders: { [key: string]: string } = {
      'male': 'Male',
      'female': 'Female',
      'other': 'Other'
    };
    return genders[gender] || gender;
  }

  getCurrentYear(): number {
    return new Date().getFullYear();
  }
}
