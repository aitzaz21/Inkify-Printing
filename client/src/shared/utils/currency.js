/**
 * Currency formatting — PKR
 * All monetary values on this platform are in Pakistani Rupees.
 */

export const CURRENCY_SYMBOL = 'PKR';

/**
 * Format a number as PKR amount.
 * e.g.  1200 → "PKR 1,200"
 *       0    → "Free"  (when allowFree = true)
 */
export const fmt = (amount, allowFree = false) => {
  const n = Number(amount || 0);
  if (allowFree && n === 0) return 'Free';
  return `PKR ${n.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

/**
 * Inline shorthand — just PKR prefix, no commas (for compact spots)
 */
export const fmtShort = (amount) => `PKR ${Number(amount || 0).toFixed(0)}`;
