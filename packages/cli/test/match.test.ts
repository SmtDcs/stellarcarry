import { describe, it, expect } from 'vitest';
import { matchTravelers, type Request, type Traveler } from '@stellarcarry/core';

const request: Request = {
  id: 'r1',
  buyer: 'B',
  fromCountry: 'TR',
  toCountry: 'DE',
  itemWeightG: 500,
  rewardStroops: 1000,
  deadlineDay: 100,
};

const travelers: Traveler[] = [
  { id: 't1', account: 'A1', fromCountry: 'TR', toCountry: 'DE', travelDay: 50, capacityG: 1000, reputation: 80 },
  { id: 't2', account: 'A2', fromCountry: 'TR', toCountry: 'DE', travelDay: 60, capacityG: 600, reputation: 90 },
  { id: 't3', account: 'A3', fromCountry: 'TR', toCountry: 'US', travelDay: 40, capacityG: 2000, reputation: 99 },
  { id: 't4', account: 'A4', fromCountry: 'TR', toCountry: 'DE', travelDay: 120, capacityG: 800, reputation: 95 },
  { id: 't5', account: 'A5', fromCountry: 'TR', toCountry: 'DE', travelDay: 70, capacityG: 300, reputation: 100 },
];

describe('matchTravelers on fixed fixture', () => {
  it('filters by route, timing, and capacity, then ranks by reputation descending', () => {
    const results = matchTravelers(request, travelers);
    expect(results).toEqual([
      { travelerId: 't2', score: 90 },
      { travelerId: 't1', score: 80 },
    ]);
  });

  it('returns empty array when no traveler qualifies', () => {
    const results = matchTravelers({ ...request, toCountry: 'JP' }, travelers);
    expect(results).toEqual([]);
  });

  it('returns empty array when weight exceeds all capacities', () => {
    const results = matchTravelers({ ...request, itemWeightG: 5000 }, travelers);
    expect(results).toEqual([]);
  });

  it('returns empty array when all travelers are too late', () => {
    const results = matchTravelers({ ...request, deadlineDay: 10 }, travelers);
    expect(results).toEqual([]);
  });

  it('tie-breaks by travelDay ascending when reputations are equal', () => {
    const tied: Traveler[] = [
      { id: 'ta', account: 'A1', fromCountry: 'TR', toCountry: 'DE', travelDay: 70, capacityG: 1000, reputation: 50 },
      { id: 'tb', account: 'A2', fromCountry: 'TR', toCountry: 'DE', travelDay: 60, capacityG: 1000, reputation: 50 },
      { id: 'tc', account: 'A3', fromCountry: 'TR', toCountry: 'DE', travelDay: 80, capacityG: 1000, reputation: 50 },
    ];
    const results = matchTravelers(request, tied);
    expect(results).toEqual([
      { travelerId: 'tb', score: 50 },
      { travelerId: 'ta', score: 50 },
      { travelerId: 'tc', score: 50 },
    ]);
  });
});
