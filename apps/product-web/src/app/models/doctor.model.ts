import { Blog } from './blog.model';

export interface DoctorDetail {
  doctor_id: string;
  department: string;
  speciality: string;
  bio: string;
  slogan: string;
  license_no: string;
  about_me: AboutMe;
  educations: Educations;
  certifications: Certifications;
  staff_members: StaffMember;
  blogs: Blog[];
}

export interface AboutMe {
  description: string;
  experience: string;
}

export interface Educations {
  degrees: EducationItem[];
}

export interface EducationItem {
  degree: string;
  institution: string;
  year_completed: number;
}

export interface Certifications {
  certifications: CertificationItem[];
}

export interface CertificationItem {
  name: string;
  institution: string;
  year_awarded: number;
}

export interface StaffMember {
  full_name: string;
  gender: string;
  image_link: string;
  working_email: string;
  years_experience: number;
  languages: string[];
}

export interface Doctor {
  doctor_id: string;
  department: string;
  speciality: string;
  staff_members: {
    full_name: string;
    image_link: string;
    gender: string;
  };
}
