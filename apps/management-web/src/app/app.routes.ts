import { Routes } from '@angular/router';

// Landing page - optional access via /portal route
import { StaffPortalLandingComponent } from './staff-portal-landing/staff-portal-landing.component';

// Admin components
import { PatientManagementComponent } from './admin/patient-management/patient-management.component';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { StaffManagementComponent } from './admin/staff-management/staff-management.component';
import { AppointmentManagementComponent } from './admin/appointment-management/appointment-management.component';
import { ServiceManagementComponent } from './admin/service-management/service-management.component';
import { AnalyticManagementComponent } from './admin/analytic-management/analytic-management.component';

import { DebugSupabaseComponent } from './debug-supabase.component';

// Admin Layout Components
import { AdminLayoutComponent } from './admin/admin-layout/admin-layout.component';
import { DashboardContentComponent } from './admin/dashboard-content/dashboard-content.component';
import { AnalyticsContentComponent } from './admin/analytics-content/analytics-content.component';

// Doctor components
import { DoctorDashboardComponent } from './doctor/doctor-dashboard/doctor-dashboard.component';
import { doctorDashboardRoutes } from './doctor/doctor-dashboard/doctor-dashboard.routes';

// Receptionist components
import { ReceptionistDashboardComponent } from './receptionist/receptionist-dashboard/receptionist-dashboard.component';
import { receptionistDashboardRoutes } from './receptionist/receptionist-dashboard/receptionist-dashboard.routes';

// Auth components and guards
import { StaffLoginComponent } from './shared/login/staff-login.component';
import { AdminAuthGuard } from './admin/admin-auth.guard';
import { DoctorAuthGuard } from './doctor/doctor-auth.guard';
import { ReceptionistAuthGuard } from './receptionist/receptionist-auth.guard';

export const routes: Routes = [
  // Redirect to login page directly (streamlined user experience)
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: StaffLoginComponent },

  // Optional: Keep landing page accessible via direct URL if needed
  { path: 'portal', component: StaffPortalLandingComponent },

  // Debug tools
  { path: 'debug', component: DebugSupabaseComponent },

  // Admin routes (management system) - protected by auth guard with layout
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AdminAuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardContentComponent },
      { path: 'analytic', component: AnalyticsContentComponent },
      { path: 'patient', component: PatientManagementComponent },
      { path: 'staff', component: StaffManagementComponent },
      { path: 'appointment', component: AppointmentManagementComponent },
      { path: 'services', component: ServiceManagementComponent }
    ]
  },

  // Doctor routes (doctor portal) - protected by auth guard
  {
    path: 'doctor/dashboard',
    component: DoctorDashboardComponent,
    canActivate: [DoctorAuthGuard],
    children: doctorDashboardRoutes
  },

  // Receptionist routes (receptionist portal) - protected by auth guard
  {
    path: 'receptionist/dashboard',
    component: ReceptionistDashboardComponent,
    canActivate: [ReceptionistAuthGuard],
    children: receptionistDashboardRoutes
  },

  // Redirects for compatibility - all roles use unified login
  { path: 'admin/login', redirectTo: '/login', pathMatch: 'full' }, // Redirect old admin login to unified login
  { path: 'doctor', redirectTo: '/login', pathMatch: 'full' }, // Redirect /doctor to unified login
  { path: 'doctor/login', redirectTo: '/login', pathMatch: 'full' }, // Redirect old doctor login to unified login
  { path: 'receptionist', redirectTo: '/login', pathMatch: 'full' }, // Redirect /receptionist to unified login

  // Default redirect - go to staff portal landing
  { path: '**', redirectTo: '/', pathMatch: 'full' }
];


