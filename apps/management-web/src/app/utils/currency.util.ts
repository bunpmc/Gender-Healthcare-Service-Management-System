/**
 * Currency Utility Service
 * Provides consistent currency formatting across the application
 * All monetary values are displayed in Vietnamese Dong (VND)
 */

export class CurrencyUtil {
  /**
   * Format amount to Vietnamese Dong currency
   * @param amount - The amount to format
   * @returns Formatted currency string in VND
   */
  static formatVND(amount: number | null | undefined): string {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0 ₫';
    }

    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Format amount to Vietnamese Dong with custom format
   * @param amount - The amount to format
   * @returns Formatted currency string like "XXX,XXX đồng"
   */
  static formatVNDCustom(amount: number | null | undefined): string {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0 đồng';
    }

    const formatted = new Intl.NumberFormat('vi-VN').format(amount);
    return `${formatted} đồng`;
  }

  /**
   * Format amount to compact format (K, M, B)
   * @param amount - The amount to format
   * @returns Compact formatted string
   */
  static formatCompact(amount: number | null | undefined): string {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0';
    }

    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}B ₫`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M ₫`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K ₫`;
    }
    
    return `${amount.toLocaleString('vi-VN')} ₫`;
  }

  /**
   * Parse currency string back to number
   * @param currencyString - The currency string to parse
   * @returns Parsed number or 0 if invalid
   */
  static parseVND(currencyString: string): number {
    if (!currencyString) return 0;
    
    // Remove currency symbols and spaces
    const cleanString = currencyString
      .replace(/[₫đồng,\s]/g, '')
      .replace(/\./g, '');
    
    const parsed = parseFloat(cleanString);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Validate if amount is a valid currency value
   * @param amount - The amount to validate
   * @returns True if valid, false otherwise
   */
  static isValidAmount(amount: any): boolean {
    if (amount === null || amount === undefined) return false;
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return !isNaN(num) && num >= 0;
  }

  /**
   * Convert amount to hundreds of thousands format for display
   * @param amount - The amount in VND
   * @returns Formatted string showing hundreds of thousands
   */
  static formatHundredThousands(amount: number | null | undefined): string {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0 nghìn ₫';
    }

    const hundredThousands = amount / 100000;
    if (hundredThousands >= 1) {
      return `${hundredThousands.toFixed(1)} trăm nghìn ₫`;
    } else {
      return this.formatVND(amount);
    }
  }
}

/**
 * Angular Pipe for currency formatting
 * Usage: {{ amount | vndCurrency }}
 */
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'vndCurrency',
  standalone: true
})
export class VndCurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined, format: 'standard' | 'custom' | 'compact' = 'standard'): string {
    switch (format) {
      case 'custom':
        return CurrencyUtil.formatVNDCustom(value);
      case 'compact':
        return CurrencyUtil.formatCompact(value);
      default:
        return CurrencyUtil.formatVND(value);
    }
  }
}
