import { Routes } from '@angular/router';
import { DoctorAuthGuard } from '../doctor-auth.guard';

export const doctorDashboardRoutes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('../dashboard/dashboard.component').then(m => m.DashboardComponent), 
    canActivate: [DoctorAuthGuard] 
  },
  { 
    path: 'profile', 
    loadComponent: () => import('../profile/profile.component').then(m => m.ProfileComponent), 
    canActivate: [DoctorAuthGuard] 
  },
  { 
    path: 'consultant-meetings', 
    loadComponent: () => import('../consultant-meetings/consultant-meetings.component').then(m => m.ConsultantMeetingsComponent), 
    canActivate: [DoctorAuthGuard] 
  },
  { 
    path: 'patients', 
    loadComponent: () => import('../patients/patients.component').then(m => m.PatientsComponent), 
    canActivate: [DoctorAuthGuard] 
  },
  { 
    path: 'blog-posts', 
    loadComponent: () => import('../blog-posts/blog-posts.component').then(m => m.BlogPostsComponent), 
    canActivate: [DoctorAuthGuard] 
  },
  { 
    path: 'staff-management', 
    loadComponent: () => import('../staff-management/staff-management.component').then(m => m.DoctorStaffManagementComponent), 
    canActivate: [DoctorAuthGuard] 
  }
];
