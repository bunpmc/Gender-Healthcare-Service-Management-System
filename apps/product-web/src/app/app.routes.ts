import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './pages/login-page/login-page.component';
import { RegisterComponent } from './pages/register-page/register-page.component';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { AppointmentPageComponent } from './pages/appointment-page/appointment-page.component';
import { DoctorsPageComponent } from './pages/doctors-page/doctors-page.component';
import { BlogsPageComponent } from './pages/blogs-page/blogs-page.component';
import { DoctorDetailComponent } from './pages/doctor-detail-page/doctor-detail-page.component';
import { BlogDetailComponent } from './pages/blog-detail-page/blog-detail-page.component';
import { ForgotPasswordComponent } from './pages/forget-password-page/forget-password-page.component';
import { ServicePageComponent } from './pages/services-page/services-page.component';
import { ConsultationPageComponent } from './pages/consultation-page/consultation-page.component';
import { LeaveAppointmentGuard } from './guards/leave-appointment.guard';
import { ServiceDetailComponent } from './pages/service-detail-page/service-detail-page.component';
import { Transaction } from './pages/transaction-page/transaction-page';
import { CartComponent } from './components/cart/cart.component';
import { PaymentResultComponent } from './pages/payment-result-page/payment-result-page.component';
import { DashboardComponent } from './pages/dashboard-page/dashboard-page.component';
import { AppointmentResultComponent } from './pages/appointment-result-page/appointment-result-page.component';
import { AppointmentPaymentPageComponent } from './pages/appointment-payment-page/appointment-payment-page.component';
import { PeriodTrackingComponent } from './pages/period-tracking-page/period-tracking-page.component';
import { ErrorPageComponent } from './pages/error-page/error-page.component';
import { ErrorDemoComponent } from './components/error-demo/error-demo.component';
import { EmailForgotPasswordPageComponent } from './pages/email-forgot-password-page/email-forgot-password-page.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent, data: { breadcrumb: 'Home' } },
  { path: 'login', component: LoginComponent },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
  },
  {
    path: 'forgot-password-email',
    component: EmailForgotPasswordPageComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  {
    path: 'appointment',
    component: AppointmentPageComponent,
    data: { breadcrumb: 'Appointment' },
    canDeactivate: [LeaveAppointmentGuard],
  },
  {
    path: 'appointment-success',
    component: AppointmentResultComponent,
    data: { breadcrumb: 'Appointment Success' },
  },
  {
    path: 'appointment-payment',
    component: AppointmentPaymentPageComponent,
    data: { breadcrumb: 'Appointment Payment' },
  },
  {
    path: 'period-tracking',
    component: PeriodTrackingComponent,
    data: { breadcrumb: 'Period Tracking' },
  },
  {
    path: 'consultation',
    component: ConsultationPageComponent,
    data: { breadcrumb: 'consultation' },
  },
  {
    path: 'doctor',
    component: DoctorsPageComponent,
    data: { breadcrumb: 'Doctors' },
  },
  {
    path: 'doctor/:id',
    component: DoctorDetailComponent,
    data: { breadcrumb: '...' },
  }, // Will be replaced with Doctor's name dynamically
  {
    path: 'blog',
    component: BlogsPageComponent,
    data: { breadcrumb: 'Blogs' },
  },
  {
    path: 'blog/:id',
    component: BlogDetailComponent,
    data: { breadcrumb: '...' },
  },
  {
    path: 'service',
    component: ServicePageComponent,
    data: { breadcrumb: 'services' },
  },
  {
    path: 'service/:id',
    component: ServiceDetailComponent,
    data: { breadcrumb: '...' },
  },
  {
    path: 'cart',
    component: CartComponent,
    data: { breadcrumb: 'Cart' },
  },
  {
    path: 'transaction',
    component: Transaction,
    data: { breadcrumb: 'Transaction' },
  },
  {
    path: 'payment-result',
    component: PaymentResultComponent,
    data: { breadcrumb: 'Payment Result' },
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./pages/auth-callback-page/auth-callback.component').then(
        (m) => m.AuthCallbackComponent
      ),
  },
  {
    path: 'error',
    component: ErrorPageComponent,
    data: { breadcrumb: 'Error' },
  },
  {
    path: 'error-demo',
    component: ErrorDemoComponent,
    data: { breadcrumb: 'Error Demo' },
  },
  {
    path: '**',
    component: ErrorPageComponent,
    data: { breadcrumb: 'Page Not Found' },
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
