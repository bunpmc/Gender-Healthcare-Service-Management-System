import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReceptionistAuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {

    console.log('🛡️ ReceptionistAuthGuard: Checking authentication for route:', state.url);

    // Check if user is authenticated as a receptionist
    const role = localStorage.getItem('role');
    const staffId = localStorage.getItem('staff_id') || localStorage.getItem('receptionist_id');

    console.log('🔍 Authentication check:', {
      role,
      staffId: staffId ? 'exists' : 'missing',
      url: state.url
    });

    // Check if user is authenticated as receptionist
    const isAuthenticated = role === 'receptionist' && staffId;

    if (isAuthenticated) {
      console.log('✅ Receptionist authentication verified - access granted');
      return true;
    } else {
      console.log('❌ Receptionist authentication failed - redirecting to login');
      console.log('🔍 Missing:', {
        role: role !== 'receptionist' ? 'Invalid role: ' + role : 'OK',
        staffId: !staffId ? 'Missing staff_id' : 'OK'
      });

      // Store the attempted URL for redirect after login
      localStorage.setItem('receptionist_redirect_url', state.url);

      // Redirect to shared login page
      this.router.navigate(['/login']);
      return false;
    }
  }
}
