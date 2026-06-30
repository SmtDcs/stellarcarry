/**
 * Typed error hierarchy for {@link @stellarcarry/core}.
 *
 * All errors extend {@link StellarCarryError} so consumers can catch a single type
 * with `instanceof` checks or a single `catch` block.
 *
 * @module errors
 */

/**
 * Base error for all SDK errors.
 *
 * Abstract class — never thrown directly. Subclasses provide specific error names
 * so consumers can distinguish error types at runtime.
 *
 * @abstract
 * @extends Error
 */
export abstract class StellarCarryError extends Error {
  /**
   * @param message - Human-readable description of the error.
   */
  constructor(message: string) {
    super(message);
    this.name = 'StellarCarryError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when input validation fails.
 *
 * Covers malformed strings, negative amounts, invalid public keys, out-of-range
 * values, and any other pre-condition check that rejects user-supplied data
 * before it reaches the network.
 *
 * @extends StellarCarryError
 */
export class ValidationError extends StellarCarryError {
  /**
   * @param message - Human-readable description of the validation failure.
   */
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Thrown when a disallowed network passphrase is supplied.
 *
 * The SDK only supports local / Docker quickstart (`http://localhost:8000`).
 * Supplying testnet or mainnet passphrases or RPC URLs will raise this error.
 *
 * @extends StellarCarryError
 */
export class NetworkError extends StellarCarryError {
  /**
   * @param message - Human-readable description, typically naming the rejected network.
   */
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}
