/**
 * Utility functions for name formatting and manipulation
 */
export class NameUtil {
  /**
   * Format doctor name with proper "Dr." prefix handling
   * Prevents duplicate "Dr." prefixes
   * @param name - The doctor's name (may or may not already include "Dr.")
   * @param includeTitle - Whether to ensure "Dr." prefix is present
   * @returns Formatted doctor name
   */
  static formatDoctorName(name: string | null | undefined, includeTitle: boolean = true): string {
    if (!name || typeof name !== 'string') {
      return includeTitle ? 'Dr. Unknown' : 'Unknown';
    }

    const trimmedName = name.trim();
    
    if (!includeTitle) {
      // Remove "Dr." prefix if it exists
      return trimmedName.replace(/^Dr\.\s*/i, '');
    }

    // Check if name already starts with "Dr." (case insensitive)
    if (/^Dr\.\s*/i.test(trimmedName)) {
      return trimmedName;
    }

    // Add "Dr." prefix if it doesn't exist
    return `Dr. ${trimmedName}`;
  }

  /**
   * Clean and format a name to title case
   * @param name - The name to format
   * @returns Formatted name in title case
   */
  static toTitleCase(name: string | null | undefined): string {
    if (!name || typeof name !== 'string') {
      return '';
    }

    return name
      .trim()
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Extract initials from a name
   * @param name - The full name
   * @param maxInitials - Maximum number of initials to return (default: 2)
   * @returns Initials string
   */
  static getInitials(name: string | null | undefined, maxInitials: number = 2): string {
    if (!name || typeof name !== 'string') {
      return 'UN';
    }

    // Remove "Dr." prefix for initials extraction
    const cleanName = name.replace(/^Dr\.\s*/i, '').trim();
    
    return cleanName
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, maxInitials)
      .join('');
  }

  /**
   * Check if a name already has "Dr." prefix
   * @param name - The name to check
   * @returns True if name starts with "Dr."
   */
  static hasDoctorPrefix(name: string | null | undefined): boolean {
    if (!name || typeof name !== 'string') {
      return false;
    }
    return /^Dr\.\s*/i.test(name.trim());
  }
}

/**
 * Angular Pipe for doctor name formatting
 * Usage: {{ doctorName | doctorName }}
 * Usage: {{ doctorName | doctorName:false }} // without "Dr." prefix
 */
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'doctorName',
  standalone: true
})
export class DoctorNamePipe implements PipeTransform {
  transform(value: string | null | undefined, includeTitle: boolean = true): string {
    return NameUtil.formatDoctorName(value, includeTitle);
  }
}

/**
 * Angular Pipe for name initials
 * Usage: {{ fullName | initials }}
 * Usage: {{ fullName | initials:3 }} // max 3 initials
 */
@Pipe({
  name: 'initials',
  standalone: true
})
export class InitialsPipe implements PipeTransform {
  transform(value: string | null | undefined, maxInitials: number = 2): string {
    return NameUtil.getInitials(value, maxInitials);
  }
}
