// @stellarcarry/core — shared domain types. Amounts are integer stroops (1 XLM = 10^7 stroops).

/**
 * A buyer's request for an item to be purchased abroad and delivered.
 * Amounts are integer stroops — never floats.
 */
export interface Request {
  id: string;
  /** Buyer's Stellar account address */
  buyer: string;
  /** ISO country the item is bought in */
  fromCountry: string;
  /** ISO country to deliver to */
  toCountry: string;
  /** Item weight in grams */
  itemWeightG: number;
  /** Reward offered to the traveler in stroops (integer) */
  rewardStroops: number;
  /** Latest acceptable travel day (integer day index) */
  deadlineDay: number;
}

/**
 * A traveler willing to carry items during a trip.
 * `reputation` is an integer 0–100.
 */
export interface Traveler {
  id: string;
  /** Traveler's Stellar account address */
  account: string;
  /** ISO country the traveler departs from */
  fromCountry: string;
  /** ISO country the traveler travels to */
  toCountry: string;
  /** Integer day index of travel */
  travelDay: number;
  /** Carrying capacity in grams */
  capacityG: number;
  /** On-chain reputation score (integer 0–100) */
  reputation: number;
}

/**
 * Result of matching a request to a traveler.
 * `score` equals the traveler's reputation (0–100).
 */
export interface MatchResult {
  /** Matched traveler's id */
  travelerId: string;
  /** Match score (traveler's reputation, 0–100) */
  score: number;
}

/**
 * Mirrors the Rust contract's EscrowState variants exactly.
 */
export enum EscrowState {
  Created = 'Created',
  Funded = 'Funded',
  Delivered = 'Delivered',
  Released = 'Released',
  Refunded = 'Refunded',
}

/**
 * An escrow instance on the Soroban contract.
 */
export interface Escrow {
  id: string;
  requestId: string;
  travelerId: string;
  /** Amount held in escrow, in stroops (integer) */
  amountStroops: number;
  /** Ledger timestamp after which refund is allowed (u64, Unix seconds) */
  deadline: bigint;
  state: EscrowState;
}
