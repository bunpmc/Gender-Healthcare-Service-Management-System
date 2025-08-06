import { Component } from '@angular/core';
import { TypeSafeUtils } from '../utils/type-safe-utils';

@Component({
    template: ''
})
export abstract class BaseComponent {

    // Date/time utilities
    public formatDate(date: string | Date | null | undefined): string {
        return TypeSafeUtils.formatDate(date);
    }

    public calculateAge(dateOfBirth: string | Date | null | undefined): number {
        return TypeSafeUtils.calculateAge(dateOfBirth);
    }

    // Gender utilities
    public formatGender(gender: string | undefined | null): string {
        return TypeSafeUtils.formatGender(gender);
    }

    public getGenderIcon(gender: string | undefined | null): string {
        return TypeSafeUtils.getGenderIcon(gender);
    }

    public getGenderBadgeClass(gender: string | undefined | null): string {
        return TypeSafeUtils.getGenderBadgeClass(gender);
    }

    // Status utilities
    public formatStatus(status: string | undefined | null): string {
        return TypeSafeUtils.formatStatus(status);
    }

    public getStatusBadgeClass(status: string | undefined | null): string {
        return TypeSafeUtils.getStatusBadgeClass(status);
    }

    public getStatusColor(status: string | undefined | null): string {
        return TypeSafeUtils.getStatusColor(status);
    }

    // Blog status utilities
    public getBlogStatusBadgeClass(blogStatus: string | undefined | null): string {
        return TypeSafeUtils.getBlogStatusBadgeClass(blogStatus);
    }

    // Safe value utilities
    protected safeString(value: any): string {
        if (value === null || value === undefined) return '';
        return String(value);
    }

    protected safeNumber(value: any): number {
        if (value === null || value === undefined || isNaN(Number(value))) return 0;
        return Number(value);
    }
}
