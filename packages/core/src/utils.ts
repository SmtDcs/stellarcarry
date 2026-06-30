import { ValidationError } from './errors';

/** Seconds per day as a bigint. */
const SECONDS_PER_DAY = 86400n;

/**
 * Converts a domain-model `deadlineDay` (integer day index) to a Soroban
 * ledger timestamp in Unix seconds (u64).
 *
 * This is domain logic that belongs in the SDK, not the CLI.
 *
 * @param deadlineDay - integer day index from a {@link Request}
 * @returns ledger timestamp (Unix seconds) as a u64-safe bigint
 * @throws {ValidationError} if deadlineDay is not a non-negative integer.
 */
export function deadlineDayToLedgerTimestamp(deadlineDay: number): bigint {
  if (!Number.isInteger(deadlineDay) || deadlineDay < 0) {
    throw new ValidationError(`deadlineDay must be a non-negative integer, got ${deadlineDay}`);
  }
  return BigInt(deadlineDay) * SECONDS_PER_DAY;
}
