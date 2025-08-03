import { Routes } from '@angular/router';
import { ComponentCacheGuard } from '../shared/guards/component-cache.guard';
import { ComponentPreloadResolver } from '../shared/resolvers/component-preload.resolver';

export const adminRoutes: Routes = [
  { 
    path: '', 
    redirectTo: 'dashboard', 
    pathMatch: 'full' 
  },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./dashboard-content/dashboard-content.component').then(m => m.DashboardContentComponent),
    canActivate: [ComponentCacheGuard],
    resolve: { preload: ComponentPreloadResolver },
    data: { preload: true, title: 'Admin Dashboard' }
  },
  { 
    path: 'analytic', 
    loadComponent: () => import('./analytics-content/analytics-content.component').then(m => m.AnalyticsContentComponent),
    canActivate: [ComponentCacheGuard],
    resolve: { preload: ComponentPreloadResolver },
    data: { preload: true, title: 'Analytics' }
  },
  { 
    path: 'patient', 
    loadComponent: () => import('./patient-management/patient-management.component').then(m => m.PatientManagementComponent),
    canActivate: [ComponentCacheGuard],
    data: { title: 'Patient Management' }
  },
  { 
    path: 'staff', 
    loadComponent: () => import('./staff-management/staff-management.component').then(m => m.AdminStaffManagementComponent),
    canActivate: [ComponentCacheGuard],
    data: { title: 'Staff Management' }
  },
  { 
    path: 'appointment', 
    loadComponent: () => import('./appointment-management/appointment-management.component').then(m => m.AppointmentManagementComponent),
    canActivate: [ComponentCacheGuard],
    data: { title: 'Appointment Management' }
  },
  { 
    path: 'services', 
    loadComponent: () => import('./service-management/service-management.component').then(m => m.ServiceManagementComponent),
    canActivate: [ComponentCacheGuard],
    data: { title: 'Service Management' }
  }
];
