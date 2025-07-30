/**
 * Name Utility Service
 * Provides consistent name formatting across the application
 * Handles Vietnamese names and English translations properly
 */

export class NameUtil {
  /**
   * Convert name to proper Title Case
   * @param name - The name to format
   * @returns Properly capitalized name
   */
  static toTitleCase(name: string | null | undefined): string {
    if (!name || typeof name !== 'string') {
      return '';
    }

    return name
      .toLowerCase()
      .split(' ')
      .map(word => {
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ')
      .trim();
  }

  /**
   * Format Vietnamese name properly
   * Handles special Vietnamese name conventions
   * @param name - The Vietnamese name to format
   * @returns Properly formatted Vietnamese name
   */
  static formatVietnameseName(name: string | null | undefined): string {
    if (!name || typeof name !== 'string') {
      return '';
    }

    // Common Vietnamese name prefixes that should be lowercase
    const lowercasePrefixes = ['của', 'và', 'hoặc', 'với'];
    
    return name
      .toLowerCase()
      .split(' ')
      .map((word, index) => {
        if (word.length === 0) return word;
        
        // Keep certain prefixes lowercase unless they're the first word
        if (index > 0 && lowercasePrefixes.includes(word)) {
          return word;
        }
        
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ')
      .trim();
  }

  /**
   * Extract initials from a name
   * @param name - The name to extract initials from
   * @returns Initials (max 2 characters)
   */
  static getInitials(name: string | null | undefined): string {
    if (!name || typeof name !== 'string') {
      return 'N/A';
    }

    const words = name.trim().split(' ').filter(word => word.length > 0);
    if (words.length === 0) return 'N/A';
    
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    
    // Take first letter of first word and first letter of last word
    const firstInitial = words[0].charAt(0).toUpperCase();
    const lastInitial = words[words.length - 1].charAt(0).toUpperCase();
    
    return firstInitial + lastInitial;
  }

  /**
   * Format doctor name with title
   * @param name - The doctor's name
   * @param includeTitle - Whether to include "Dr." prefix
   * @returns Formatted doctor name
   */
  static formatDoctorName(name: string | null | undefined, includeTitle: boolean = true): string {
    if (!name || typeof name !== 'string') {
      return includeTitle ? 'Dr. Unknown' : 'Unknown';
    }

    const formattedName = this.toTitleCase(name);
    return includeTitle ? `Dr. ${formattedName}` : formattedName;
  }

  /**
   * Validate if a name is properly formatted
   * @param name - The name to validate
   * @returns True if properly formatted, false otherwise
   */
  static isProperlyFormatted(name: string | null | undefined): boolean {
    if (!name || typeof name !== 'string') {
      return false;
    }

    const trimmed = name.trim();
    if (trimmed.length === 0) return false;

    // Check if first letter of each word is uppercase
    const words = trimmed.split(' ').filter(word => word.length > 0);
    return words.every(word => {
      const firstChar = word.charAt(0);
      return firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase();
    });
  }

  /**
   * Clean and normalize name input
   * Removes extra spaces, special characters, etc.
   * @param name - The name to clean
   * @returns Cleaned name
   */
  static cleanName(name: string | null | undefined): string {
    if (!name || typeof name !== 'string') {
      return '';
    }

    return name
      .replace(/[^\p{L}\s'-]/gu, '') // Keep only letters, spaces, hyphens, and apostrophes
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  /**
   * Format full name for display
   * Combines cleaning and proper capitalization
   * @param name - The name to format
   * @returns Fully formatted name
   */
  static formatFullName(name: string | null | undefined): string {
    const cleaned = this.cleanName(name);
    return this.toTitleCase(cleaned);
  }

  /**
   * Check if name appears to be Vietnamese
   * @param name - The name to check
   * @returns True if appears to be Vietnamese, false otherwise
   */
  static isVietnameseName(name: string | null | undefined): boolean {
    if (!name || typeof name !== 'string') {
      return false;
    }

    // Common Vietnamese name patterns and characters
    const vietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    const commonVietnameseNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];
    
    return vietnameseChars.test(name) || commonVietnameseNames.some(vName => name.includes(vName));
  }
}

/**
 * Angular Pipe for name formatting
 * Usage: {{ name | formatName }}
 */
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatName',
  standalone: true
})
export class FormatNamePipe implements PipeTransform {
  transform(value: string | null | undefined, format: 'title' | 'vietnamese' | 'doctor' | 'clean' = 'title'): string {
    switch (format) {
      case 'vietnamese':
        return NameUtil.formatVietnameseName(value);
      case 'doctor':
        return NameUtil.formatDoctorName(value);
      case 'clean':
        return NameUtil.cleanName(value);
      default:
        return NameUtil.toTitleCase(value);
    }
  }
}
