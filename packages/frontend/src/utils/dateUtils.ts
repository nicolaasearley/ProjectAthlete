/**
 * Date utility functions to handle timezone issues
 */

/**
 * Get today's date in local timezone as YYYY-MM-DD string
 * This ensures we use local date, not UTC
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convert a date string (YYYY-MM-DD) to a Date object in local timezone
 * This prevents UTC conversion issues
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  // Create date in local timezone (month is 0-indexed in Date constructor)
  return new Date(year, month - 1, day);
}

/**
 * Format a date to YYYY-MM-DD string using local timezone
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a date string for display using local timezone
 * Handles both ISO date strings (2024-01-01T00:00:00.000Z) and YYYY-MM-DD format
 */
export function formatDateForDisplay(dateString: string): string {
  if (!dateString) return 'Invalid Date';
  
  try {
    // Handle ISO date strings (from backend)
    let date: Date;
    if (dateString.includes('T')) {
      // ISO format: parse directly
      date = new Date(dateString);
    } else {
      // YYYY-MM-DD format: parse as local date
      date = parseLocalDate(dateString);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return 'Invalid Date';
  }
}

