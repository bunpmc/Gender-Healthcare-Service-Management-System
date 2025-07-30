/**
 * Date Utility Service
 * Provides consistent date and time formatting across the application
 * Handles Vietnamese locale and timezone considerations
 */

export class DateUtil {
  // Vietnamese locale
  private static readonly VI_LOCALE = 'vi-VN';
  
  // Common date formats
  private static readonly FORMATS = {
    DATE_ONLY: { year: 'numeric', month: '2-digit', day: '2-digit' } as Intl.DateTimeFormatOptions,
    DATE_LONG: { year: 'numeric', month: 'long', day: 'numeric' } as Intl.DateTimeFormatOptions,
    DATE_SHORT: { month: 'short', day: 'numeric' } as Intl.DateTimeFormatOptions,
    TIME_ONLY: { hour: '2-digit', minute: '2-digit', hour12: false } as Intl.DateTimeFormatOptions,
    TIME_12H: { hour: '2-digit', minute: '2-digit', hour12: true } as Intl.DateTimeFormatOptions,
    DATETIME: { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    } as Intl.DateTimeFormatOptions,
    DATETIME_LONG: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    } as Intl.DateTimeFormatOptions
  };

  /**
   * Format date to Vietnamese locale
   * @param date - Date to format
   * @param format - Format type
   * @returns Formatted date string
   */
  static formatDate(date: string | Date | null | undefined, format: keyof typeof DateUtil.FORMATS = 'DATE_ONLY'): string {
    if (!date) return '';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return '';
      
      return new Intl.DateTimeFormat(this.VI_LOCALE, this.FORMATS[format]).format(dateObj);
    } catch (error) {
      console.warn('Error formatting date:', error);
      return '';
    }
  }

  /**
   * Format time only
   * @param date - Date to extract time from
   * @param use12Hour - Whether to use 12-hour format
   * @returns Formatted time string
   */
  static formatTime(date: string | Date | null | undefined, use12Hour: boolean = false): string {
    if (!date) return '';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return '';
      
      const format = use12Hour ? this.FORMATS.TIME_12H : this.FORMATS.TIME_ONLY;
      return new Intl.DateTimeFormat(this.VI_LOCALE, format).format(dateObj);
    } catch (error) {
      console.warn('Error formatting time:', error);
      return '';
    }
  }

  /**
   * Format date and time together
   * @param date - Date to format
   * @param long - Whether to use long format
   * @returns Formatted datetime string
   */
  static formatDateTime(date: string | Date | null | undefined, long: boolean = false): string {
    if (!date) return '';
    
    const format = long ? 'DATETIME_LONG' : 'DATETIME';
    return this.formatDate(date, format);
  }

  /**
   * Get relative time (e.g., "2 hours ago", "in 3 days")
   * @param date - Date to compare
   * @returns Relative time string
   */
  static getRelativeTime(date: string | Date | null | undefined): string {
    if (!date) return '';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return '';
      
      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) return 'Vừa xong';
      if (diffMinutes < 60) return `${diffMinutes} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays < 7) return `${diffDays} ngày trước`;
      
      return this.formatDate(date, 'DATE_SHORT');
    } catch (error) {
      console.warn('Error calculating relative time:', error);
      return '';
    }
  }

  /**
   * Check if date is today
   * @param date - Date to check
   * @returns True if date is today
   */
  static isToday(date: string | Date | null | undefined): boolean {
    if (!date) return false;
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return false;
      
      const today = new Date();
      return dateObj.toDateString() === today.toDateString();
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if date is in the past
   * @param date - Date to check
   * @returns True if date is in the past
   */
  static isPast(date: string | Date | null | undefined): boolean {
    if (!date) return false;
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return false;
      
      return dateObj.getTime() < new Date().getTime();
    } catch (error) {
      return false;
    }
  }

  /**
   * Get start of day
   * @param date - Date to get start of day for
   * @returns Start of day date
   */
  static getStartOfDay(date: string | Date | null | undefined): Date | null {
    if (!date) return null;
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return null;
      
      const startOfDay = new Date(dateObj);
      startOfDay.setHours(0, 0, 0, 0);
      return startOfDay;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get end of day
   * @param date - Date to get end of day for
   * @returns End of day date
   */
  static getEndOfDay(date: string | Date | null | undefined): Date | null {
    if (!date) return null;
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return null;
      
      const endOfDay = new Date(dateObj);
      endOfDay.setHours(23, 59, 59, 999);
      return endOfDay;
    } catch (error) {
      return null;
    }
  }

  /**
   * Format date for input fields (YYYY-MM-DD)
   * @param date - Date to format
   * @returns Date string in YYYY-MM-DD format
   */
  static formatForInput(date: string | Date | null | undefined): string {
    if (!date) return '';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return '';
      
      return dateObj.toISOString().split('T')[0];
    } catch (error) {
      return '';
    }
  }

  /**
   * Parse date from various formats
   * @param dateString - Date string to parse
   * @returns Parsed Date object or null
   */
  static parseDate(dateString: string | null | undefined): Date | null {
    if (!dateString) return null;
    
    try {
      const parsed = new Date(dateString);
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get age from date of birth
   * @param dateOfBirth - Date of birth
   * @returns Age in years
   */
  static getAge(dateOfBirth: string | Date | null | undefined): number {
    if (!dateOfBirth) return 0;
    
    try {
      const birthDate = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
      if (isNaN(birthDate.getTime())) return 0;
      
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return Math.max(0, age);
    } catch (error) {
      return 0;
    }
  }
}

/**
 * Angular Pipe for date formatting
 * Usage: {{ date | formatDate:'DATE_LONG' }}
 */
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatDate',
  standalone: true
})
export class FormatDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined, format: keyof typeof DateUtil['FORMATS'] = 'DATE_ONLY'): string {
    return DateUtil.formatDate(value, format);
  }
}
