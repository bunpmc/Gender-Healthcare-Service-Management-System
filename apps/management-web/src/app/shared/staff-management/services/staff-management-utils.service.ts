import { Injectable } from '@angular/core';
import { Staff } from '../../../models/staff.interface';
import { StaffFilters, PaginationConfig } from '../models/staff-management.interface';

@Injectable({
  providedIn: 'root'
})
export class StaffManagementUtilsService {

  /**
   * Apply filters to staff list
   */
  applyFilters(staff: Staff[], filters: StaffFilters): Staff[] {
    return staff.filter(member => {
      const matchesSearch = !filters.search || 
        member.full_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        member.working_email.toLowerCase().includes(filters.search.toLowerCase()) ||
        member.staff_id.toLowerCase().includes(filters.search.toLowerCase());

      const matchesRole = !filters.role || member.role === filters.role;

      const matchesStatus = !filters.status || member.staff_status === filters.status;

      const matchesAvailability = !filters.availability || 
        (filters.availability === 'available' && member.is_available) ||
        (filters.availability === 'unavailable' && !member.is_available);

      return matchesSearch && matchesRole && matchesStatus && matchesAvailability;
    });
  }

  /**
   * Get paginated staff data
   */
  getPaginatedData(staff: Staff[], pagination: PaginationConfig): Staff[] {
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return staff.slice(startIndex, endIndex);
  }

  /**
   * Calculate total pages
   */
  getTotalPages(totalItems: number, pageSize: number): number {
    return Math.ceil(totalItems / pageSize);
  }

  /**
   * Get staff member initials
   */
  getInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  /**
   * Get role display name
   */
  getRoleName(roleValue: string): string {
    const roleMap: { [key: string]: string } = {
      administrator: 'Administrator',
      admin: 'Administrator',
      doctor: 'Doctor',
      receptionist: 'Receptionist',
      nurse: 'Nurse',
      manager: 'Manager'
    };
    return roleMap[roleValue] || roleValue;
  }

  /**
   * Get status badge CSS class
   */
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'on_leave':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  }

  /**
   * Get role badge CSS class
   */
  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'administrator':
      case 'admin':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'doctor':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'receptionist':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'nurse':
        return 'bg-pink-100 text-pink-800 border border-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  }

  /**
   * Format date string
   */
  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch {
      return 'Invalid Date';
    }
  }

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Export staff data to CSV
   */
  exportToCSV(staff: Staff[], filename: string = 'staff-export'): void {
    const headers = [
      'Staff ID',
      'Full Name', 
      'Email',
      'Role',
      'Experience (Years)',
      'Hired Date',
      'Status',
      'Availability',
      'Gender',
      'Languages'
    ];

    const csvData = staff.map(member => [
      member.staff_id,
      member.full_name,
      member.working_email,
      this.getRoleName(member.role),
      member.years_experience || 0,
      this.formatDate(member.hired_at),
      member.staff_status,
      member.is_available ? 'Available' : 'Unavailable',
      member.gender || 'N/A',
      member.languages?.join(', ') || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Generate page numbers for pagination
   */
  getPageNumbers(totalPages: number, currentPage: number, maxVisible: number = 5): number[] {
    const pages: number[] = [];
    const half = Math.floor(maxVisible / 2);
    
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  /**
   * Sort staff array by field
   */
  sortStaff(staff: Staff[], field: keyof Staff, direction: 'asc' | 'desc' = 'asc'): Staff[] {
    return [...staff].sort((a, b) => {
      const aVal = a[field] || '';
      const bVal = b[field] || '';
      
      if (direction === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
  }
}
