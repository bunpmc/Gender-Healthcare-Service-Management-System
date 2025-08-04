import { Routes } from '@angular/router';

// Auth guards
import { AdminAuthGuard } from './admin/admin-auth.guard';
import { DoctorAuthGuard } from './doctor/doctor-auth.guard';
import { ReceptionistAuthGuard } from './receptionist/receptionist-auth.guard';

export const routes: Routes = [
  // Redirect to login page directly (streamlined user experience)
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./shared/login/staff-login.component').then(m => m.StaffLoginComponent)
  },

  // Auth routes
  {
    path: 'auth/login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },

  // Optional: Keep landing page accessible via direct URL if needed
  {
    path: 'portal',
    loadComponent: () => import('./staff-portal-landing/staff-portal-landing.component').then(m => m.StaffPortalLandingComponent)
  },

  // Debug tools - lazy loaded (remove in production)
  {
    path: 'debug',
    loadComponent: () => import('./debug-supabase.component').then(m => m.DebugSupabaseComponent),
    data: { preload: false } // Don't preload debug tools
  },

  // Admin routes (management system) - lazy loaded with layout, preload for better UX
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [AdminAuthGuard],
    loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes),
    data: { preload: true } // Mark for selective preloading
  },

  // Doctor routes (doctor portal) - lazy loaded, preload dashboard
  {
    path: 'doctor/dashboard',
    loadComponent: () => import('./doctor/doctor-dashboard/doctor-dashboard.component').then(m => m.DoctorDashboardComponent),
    canActivate: [DoctorAuthGuard],
    loadChildren: () => import('./doctor/doctor-dashboard/doctor-dashboard.routes').then(m => m.doctorDashboardRoutes),
    data: { preload: true } // Mark for selective preloading
  },

  // Receptionist routes (receptionist portal) - lazy loaded, preload dashboard
  {
    path: 'receptionist/dashboard',
    loadComponent: () => import('./receptionist/receptionist-dashboard/receptionist-dashboard.component').then(m => m.ReceptionistDashboardComponent),
    canActivate: [ReceptionistAuthGuard],
    loadChildren: () => import('./receptionist/receptionist-dashboard/receptionist-dashboard.routes').then(m => m.receptionistDashboardRoutes),
    data: { preload: true } // Mark for selective preloading
  },

  // Redirects for compatibility - all roles use unified login
  { path: 'admin/login', redirectTo: '/login', pathMatch: 'full' }, // Redirect old admin login to unified login
  { path: 'doctor', redirectTo: '/login', pathMatch: 'full' }, // Redirect /doctor to unified login
  { path: 'doctor/login', redirectTo: '/login', pathMatch: 'full' }, // Redirect old doctor login to unified login
  { path: 'receptionist', redirectTo: '/login', pathMatch: 'full' }, // Redirect /receptionist to unified login

  // Default redirect - go to staff portal landing
  { path: '**', redirectTo: '/', pathMatch: 'full' }
];


