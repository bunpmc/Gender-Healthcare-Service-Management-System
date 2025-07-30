import { Routes } from '@angular/router';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { PatientsComponent } from '../patients/patients.component';
import { BlogPostsComponent } from '../blog-posts/blog-posts.component';
import { ProfileComponent } from '../profile/profile.component';
import { ConsultantMeetingsComponent } from '../consultant-meetings/consultant-meetings.component';
import { DoctorAuthGuard } from '../doctor-auth.guard';

export const doctorDashboardRoutes: Routes = [
  { path: '', component: DashboardComponent, canActivate: [DoctorAuthGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [DoctorAuthGuard] },
  { path: 'consultant-meetings', component: ConsultantMeetingsComponent, canActivate: [DoctorAuthGuard] },
  { path: 'patients', component: PatientsComponent, canActivate: [DoctorAuthGuard] },
  { path: 'blog-posts', component: BlogPostsComponent, canActivate: [DoctorAuthGuard] }
];
