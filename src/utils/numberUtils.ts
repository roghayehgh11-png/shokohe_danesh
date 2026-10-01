// Utility functions for number and currency formatting with 3-digit comma separators

/**
 * Format a number or string with 3-digit comma separators (e.g. 5000000 -> 5,000,000)
 */
export const formatWithCommas = (val: number | string | undefined | null): string => {
  if (val === undefined || val === null || val === '') return '';
  // Convert Persian/Arabic digits to Latin digits first if any
  const latin = val
    .toString()
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/,/g, '')
    .replace(/[^\d]/g, '');

  if (!latin) return '';
  const num = parseInt(latin, 10);
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US');
};

/**
 * Parse a comma-formatted string back to a pure numeric integer
 */
export const parseFormattedNumber = (val: string | number | undefined | null): number => {
  if (val === undefined || val === null || val === '') return 0;
  const latin = val
    .toString()
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/,/g, '')
    .replace(/[^\d]/g, '');

  if (!latin) return 0;
  const num = parseInt(latin, 10);
  return isNaN(num) ? 0 : num;
};

/**
 * Format to Persian localized currency string (تومان)
 */
export const formatToman = (val: number | undefined | null): string => {
  if (val === undefined || val === null) return '۰ تومان';
  return `${val.toLocaleString('fa-IR')} تومان`;
};
