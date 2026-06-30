// Frozen spec for the traveler-matching engine. These assertions define the
// contract for matchTravelers; keep them intact.
import { describe, it, expect } from 'vitest';
import { matchTravelers, type Request, type Traveler } from '@stellarcarry/core';

const request: Request = {
  id: 'r1', buyer: 'B',
  fromCountry: 'TR', toCountry: 'DE',
  itemWeightG: 500, rewardStroops: 1000, deadlineDay: 100,
};

const travelers: Traveler[] = [
  { id: 't1', account: 'A1', fromCountry: 'TR', toCountry: 'DE', travelDay: 50,  capacityG: 1000, reputation: 80 },
  { id: 't2', account: 'A2', fromCountry: 'TR', toCountry: 'DE', travelDay: 60,  capacityG: 600,  reputation: 90 },
  { id: 't3', account: 'A3', fromCountry: 'TR', toCountry: 'US', travelDay: 40,  capacityG: 2000, reputation: 99 }, // wrong route
  { id: 't4', account: 'A4', fromCountry: 'TR', toCountry: 'DE', travelDay: 120, capacityG: 800,  reputation: 95 }, // too late
  { id: 't5', account: 'A5', fromCountry: 'TR', toCountry: 'DE', travelDay: 70,  capacityG: 300,  reputation: 100 }, // too small
];

describe('matchTravelers (FROZEN)', () => {
  it('filters by route, timing, and capacity, then ranks by reputation (desc)', () => {
    expect(matchTravelers(request, travelers)).toEqual([
      { travelerId: 't2', score: 90 },
      { travelerId: 't1', score: 80 },
    ]);
  });

  it('returns an empty array when no traveler qualifies', () => {
    expect(matchTravelers({ ...request, toCountry: 'JP' }, travelers)).toEqual([]);
  });
});
