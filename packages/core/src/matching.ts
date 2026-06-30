import type { Request, Traveler, MatchResult } from './types';
import { ValidationError } from './errors';

/**
 * Filters travelers to those who can fulfil the request:
 * - matching route (`traveler.fromCountry === request.fromCountry && traveler.toCountry === request.toCountry`)
 * - on time (`traveler.travelDay <= request.deadlineDay`)
 * - sufficient capacity (`traveler.capacityG >= request.itemWeightG`)
 *
 * Scores each survivor by their `reputation` (integer 0–100).
 * Sorts by score descending, tie-broken by travelDay ascending, then id ascending.
 *
 * Pure and deterministic: same inputs always produce the same ranking.
 *
 * @param request - the buyer's request; must have valid non-empty id, buyer, countries, and non-negative numbers.
 * @param travelers - candidate travelers; empty, null, or undefined returns `[]`.
 * @returns ranked match results (best first), each with `travelerId` and `score`
 * @throws {ValidationError} if the request has malformed fields.
 */
export function matchTravelers(request: Request, travelers: Traveler[]): MatchResult[] {
  // Guard: null / undefined / non-array travelers => []
  if (!Array.isArray(travelers)) {
    return [];
  }

  // Guard: malformed request fields
  if (!request.id || typeof request.id !== 'string' || request.id.trim() === '') {
    throw new ValidationError('request.id must be a non-empty string');
  }
  if (!request.buyer || typeof request.buyer !== 'string' || request.buyer.trim() === '') {
    throw new ValidationError('request.buyer must be a non-empty string');
  }
  if (!request.fromCountry || typeof request.fromCountry !== 'string' || request.fromCountry.trim() === '') {
    throw new ValidationError('request.fromCountry must be a non-empty string');
  }
  if (!request.toCountry || typeof request.toCountry !== 'string' || request.toCountry.trim() === '') {
    throw new ValidationError('request.toCountry must be a non-empty string');
  }
  if (!Number.isInteger(request.itemWeightG) || request.itemWeightG < 0) {
    throw new ValidationError(`request.itemWeightG must be a non-negative integer, got ${request.itemWeightG}`);
  }
  if (!Number.isInteger(request.rewardStroops) || request.rewardStroops < 0) {
    throw new ValidationError(`request.rewardStroops must be a non-negative integer, got ${request.rewardStroops}`);
  }
  if (!Number.isInteger(request.deadlineDay) || request.deadlineDay < 0) {
    throw new ValidationError(`request.deadlineDay must be a non-negative integer, got ${request.deadlineDay}`);
  }

  // Early return if no travelers
  if (travelers.length === 0) {
    return [];
  }

  // Skip malformed traveler entries rather than crashing
  const validTravelers = travelers.filter(t => {
    if (!t || typeof t !== 'object') return false;
    if (!t.id || typeof t.id !== 'string' || t.id.trim() === '') return false;
    if (!t.toCountry || typeof t.toCountry !== 'string' || t.toCountry.trim() === '') return false;
    if (!t.fromCountry || typeof t.fromCountry !== 'string' || t.fromCountry.trim() === '') return false;
    if (!Number.isInteger(t.travelDay) || t.travelDay < 0) return false;
    if (!Number.isInteger(t.capacityG) || t.capacityG < 0) return false;
    if (!Number.isInteger(t.reputation) || t.reputation < 0 || t.reputation > 100) return false;
    return true;
  });

  const qualified = validTravelers.filter(t =>
    t.fromCountry === request.fromCountry &&
    t.toCountry === request.toCountry &&
    t.travelDay <= request.deadlineDay &&
    t.capacityG >= request.itemWeightG
  );

  qualified.sort((a, b) => {
    if (b.reputation !== a.reputation) return b.reputation - a.reputation;
    if (a.travelDay !== b.travelDay) return a.travelDay - b.travelDay;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  return qualified.map(t => ({ travelerId: t.id, score: t.reputation }));
}
