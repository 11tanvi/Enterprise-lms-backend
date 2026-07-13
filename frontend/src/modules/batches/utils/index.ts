/**
 * Batch module utilities (Placeholder)
 */

/**
 * Format date helper for batch schedule timelines
 * @param dateString Date string to format
 * @returns Formatted date string
 */
export function formatBatchDate(dateString?: string): string {
  if (!dateString) return 'TBD';
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}
