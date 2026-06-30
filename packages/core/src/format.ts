/**
 * Format an integer stroops amount as a human-readable XLM string.
 *
 * Stroops are the indivisible unit on Stellar; 1 XLM = 10^7 stroops.
 * This function converts integer stroops to a formatted XLM string with
 * up to 4 fractional digits, suitable for display.
 *
 * @param stroops - The amount in integer stroops (e.g. `1234567890`).
 * @returns A formatted XLM string (e.g. `"123.4568 XLM"`).
 *
 * @example
 * ```ts
 * formatStroops(1234567890); // "123.4568 XLM"
 * formatStroops(10000000);   // "1 XLM"
 * ```
 */
export function formatStroops(stroops: number): string {
  return `${(stroops / 1e7).toLocaleString(undefined, { maximumFractionDigits: 4 })} XLM`;
}
