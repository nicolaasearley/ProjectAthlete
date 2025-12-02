/**
 * Date utility functions for backend to handle date-only values correctly
 * Prevents timezone issues when storing dates
 */

/**
 * Parse a date string (YYYY-MM-DD or ISO format) to a Date object normalized to local date
 * This ensures the date represents the intended day regardless of timezone
 */
export function parseDateString(dateString: string): Date {
  // Handle ISO format (e.g., "2024-01-01T00:00:00.000Z" or "2024-01-01T00:00:00")
  if (dateString.includes('T')) {
    // Extract just the date part (YYYY-MM-DD) from ISO string
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  
  // Handle YYYY-MM-DD format
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Create date at local midnight to avoid UTC conversion issues
  // Note: JavaScript Date months are 0-indexed (0 = January)
  return new Date(year, month - 1, day);
}

/**
 * Normalize a date to start of day in local timezone
 */
export function normalizeToDateOnly(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Format a date to YYYY-MM-DD string
 */
export function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

