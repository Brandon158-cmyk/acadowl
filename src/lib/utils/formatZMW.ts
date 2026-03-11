/**
 * Format a number as Zambian Kwacha (ZMW) currency.
 *
 * @example
 * formatZMW(1500) // 'K 1,500.00'
 * formatZMW(1500.5) // 'K 1,500.50'
 * formatZMW(0) // 'K 0.00'
 */
export function formatZMW(amount: number): string {
  return `K ${amount.toLocaleString('en-ZM', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Parse a ZMW formatted string back to a number.
 */
export function parseZMW(formatted: string): number {
  return parseFloat(formatted.replace(/[^0-9.-]/g, ''));
}
