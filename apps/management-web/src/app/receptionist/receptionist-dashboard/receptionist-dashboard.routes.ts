import { Routes } from '@angular/router';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { PaymentManagementComponent } from '../payment-management/payment-management.component';
import { AppointmentManagementComponent } from '../appointment-management/appointment-management.component';
import { PatientManagementComponent } from '../patient-management/patient-management.component';
import { ReceptionistAuthGuard } from '../receptionist-auth.guard';

export const receptionistDashboardRoutes: Routes = [
  { path: '', component: DashboardComponent, canActivate: [ReceptionistAuthGuard] },
  { path: 'payment-management', component: PaymentManagementComponent, canActivate: [ReceptionistAuthGuard] },
  { path: 'appointment-management', component: AppointmentManagementComponent, canActivate: [ReceptionistAuthGuard] },
  { path: 'patient-management', component: PatientManagementComponent, canActivate: [ReceptionistAuthGuard] }
];
