import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { SupabaseService } from '../supabase.service';
import { LoggerService } from '../core/services/logger.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {

    constructor(
        private supabaseService: SupabaseService,
        private router: Router,
        private logger: LoggerService
    ) { }

    async canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Promise<boolean> {
        try {
            const user = await this.supabaseService.getCurrentUser();

            if (user) {
                this.logger.info('✅ User authenticated:', user.email);
                return true;
            } else {
                this.logger.warn('⚠️ User not authenticated, redirecting to login');
                this.router.navigate(['/auth/login'], {
                    queryParams: { returnUrl: state.url }
                });
                return false;
            }
        } catch (error) {
            this.logger.error('❌ Authentication check failed:', error);
            this.router.navigate(['/auth/login'], {
                queryParams: { returnUrl: state.url }
            });
            return false;
        }
    }
}
