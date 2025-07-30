import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AdminAuthGuard implements CanActivate {
  constructor(private router: Router) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    console.log('🛡️ AdminAuthGuard: Checking authentication for route:', state.url);

    const role = localStorage.getItem('role');
    const staffId = localStorage.getItem('staff_id');
    const email = localStorage.getItem('email');

    console.log('🔍 Admin authentication check:', {
      role,
      staffId: staffId ? 'exists' : 'missing',
      email: email ? 'exists' : 'missing',
      url: state.url
    });

    // Check for administrator role (matching database value)
    if (role === 'administrator' && staffId) {
      console.log('✅ Admin access granted');
      return true;
    }

    // Log unauthorized access attempt
    console.warn('❌ Admin access denied:', {
      reason: role !== 'administrator' ? 'Invalid role' : 'Missing staff ID',
      currentRole: role,
      requiredRole: 'administrator'
    });

    // Redirect to unified login if not authenticated as admin
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: state.url, error: 'admin_access_required' }
    });
    return false;
  }
}
