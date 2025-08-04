// Type safety utilities for template operations
export class TypeSafeUtils {

    /**
     * Safely format date/string for display
     */
    static formatDate(date: string | Date | null | undefined): string {
        if (!date) return 'N/A';
        if (typeof date === 'string') {
            const parsed = new Date(date);
            return isNaN(parsed.getTime()) ? 'Invalid Date' : parsed.toLocaleDateString();
        }
        if (date instanceof Date) {
            return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
        }
        return 'N/A';
    }

    /**
     * Safely calculate age from date of birth
     */
    static calculateAge(dateOfBirth: string | Date | null | undefined): number {
        if (!dateOfBirth) return 0;

        let birthDate: Date;
        if (typeof dateOfBirth === 'string') {
            birthDate = new Date(dateOfBirth);
        } else if (dateOfBirth instanceof Date) {
            birthDate = dateOfBirth;
        } else {
            return 0;
        }

        if (isNaN(birthDate.getTime())) return 0;

        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            return age - 1;
        }
        return age;
    }

    /**
     * Safely format gender with fallback
     */
    static formatGender(gender: string | undefined | null): string {
        if (!gender || gender === '') return 'Not specified';

        switch (gender.toLowerCase()) {
            case 'male': return 'Male';
            case 'female': return 'Female';
            case 'other': return 'Other';
            default: return 'Not specified';
        }
    }

    /**
     * Safely format status with fallback
     */
    static formatStatus(status: string | undefined | null): string {
        if (!status || status === '') return 'Unknown';
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }

    /**
     * Get gender badge class with safety
     */
    static getGenderBadgeClass(gender: string | undefined | null): string {
        const genderLower = (gender || '').toLowerCase();
        const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';

        switch (genderLower) {
            case 'male':
                return `${baseClasses} bg-blue-100 text-blue-800`;
            case 'female':
                return `${baseClasses} bg-pink-100 text-pink-800`;
            case 'other':
                return `${baseClasses} bg-purple-100 text-purple-800`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800`;
        }
    }

    /**
     * Get status badge class with safety
     */
    static getStatusBadgeClass(status: string | undefined | null): string {
        const statusLower = (status || '').toLowerCase();
        const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';

        switch (statusLower) {
            case 'active':
                return `${baseClasses} bg-green-100 text-green-800`;
            case 'inactive':
                return `${baseClasses} bg-gray-100 text-gray-800`;
            case 'suspended':
                return `${baseClasses} bg-red-100 text-red-800`;
            case 'deleted':
                return `${baseClasses} bg-red-100 text-red-800`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800`;
        }
    }

    /**
     * Get gender icon with safety
     */
    static getGenderIcon(gender: string | undefined | null): string {
        const genderLower = (gender || '').toLowerCase();

        switch (genderLower) {
            case 'male': return '♂';
            case 'female': return '♀';
            case 'other': return '⚧';
            default: return '?';
        }
    }

    /**
     * Get status color class with safety
     */
    static getStatusColor(status: string | undefined | null): string {
        const statusLower = (status || '').toLowerCase();

        switch (statusLower) {
            case 'active': return 'text-green-600';
            case 'inactive': return 'text-gray-600';
            case 'suspended': return 'text-red-600';
            case 'deleted': return 'text-red-600';
            default: return 'text-gray-600';
        }
    }

    /**
     * Safely get blog status badge class
     */
    static getBlogStatusBadgeClass(status: string | undefined | null): string {
        const statusLower = (status || '').toLowerCase();
        const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';

        switch (statusLower) {
            case 'published':
                return `${baseClasses} bg-green-100 text-green-800`;
            case 'draft':
                return `${baseClasses} bg-yellow-100 text-yellow-800`;
            case 'archived':
                return `${baseClasses} bg-gray-100 text-gray-800`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800`;
        }
    }
}
