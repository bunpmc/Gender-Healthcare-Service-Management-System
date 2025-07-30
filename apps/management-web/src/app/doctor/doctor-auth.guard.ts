import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DoctorAuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {

    console.log('🛡️ DoctorAuthGuard: Checking authentication for route:', state.url);

    // Check if user is authenticated as a doctor
    const role = localStorage.getItem('role');
    const staffId = localStorage.getItem('staff_id') || localStorage.getItem('doctor_id');

    console.log('🔍 Authentication check:', {
      role,
      staffId: staffId ? 'exists' : 'missing',
      url: state.url
    });

    // Check if user is authenticated as doctor
    const isAuthenticated = role === 'doctor' && staffId;

    if (isAuthenticated) {
      console.log('✅ Doctor authentication verified - access granted');
      return true;
    } else {
      console.log('❌ Doctor authentication failed - redirecting to login');
      console.log('🔍 Missing:', {
        role: role !== 'doctor' ? 'Invalid role: ' + role : 'OK',
        staffId: !staffId ? 'Missing staff_id' : 'OK'
      });

      // Store the attempted URL for redirect after login
      localStorage.setItem('doctor_redirect_url', state.url);

      // Redirect to unified login
      this.router.navigate(['/login']);
      return false;
    }
  }
}
