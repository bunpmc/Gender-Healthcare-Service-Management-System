import { Routes } from '@angular/router';
import { ReceptionistAuthGuard } from '../receptionist-auth.guard';

export const receptionistDashboardRoutes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('../dashboard/dashboard.component').then(m => m.DashboardComponent), 
    canActivate: [ReceptionistAuthGuard] 
  },
  { 
    path: 'payment-management', 
    loadComponent: () => import('../payment-management/payment-management.component').then(m => m.PaymentManagementComponent), 
    canActivate: [ReceptionistAuthGuard] 
  },
  { 
    path: 'appointment-management', 
    loadComponent: () => import('../appointment-management/appointment-management.component').then(m => m.AppointmentManagementComponent), 
    canActivate: [ReceptionistAuthGuard] 
  },
  { 
    path: 'patient-management', 
    loadComponent: () => import('../patient-management/patient-management.component').then(m => m.PatientManagementComponent), 
    canActivate: [ReceptionistAuthGuard] 
  },
  { 
    path: 'staff-management', 
    loadComponent: () => import('../staff-management/staff-management.component').then(m => m.StaffManagementComponent), 
    canActivate: [ReceptionistAuthGuard] 
  }
];
