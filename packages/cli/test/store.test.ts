import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, unlinkSync, rmdirSync } from 'fs';
import { load, save, type Store } from '../src/store.js';
import type { Request, Traveler, EscrowState } from '@stellarcarry/core';

const STORE_FILE = './.stellarcarry/store.json';
const STORE_DIR = './.stellarcarry';

function cleanStore() {
  if (existsSync(STORE_FILE)) unlinkSync(STORE_FILE);
  if (existsSync(STORE_DIR)) rmdirSync(STORE_DIR);
}

describe('Store round-trip', () => {
  afterEach(() => cleanStore());

  it('returns empty store when file does not exist', () => {
    const store = load();
    expect(store.requests).toEqual([]);
    expect(store.travelers).toEqual([]);
    expect(store.escrows).toEqual([]);
  });

  it('preserves data across save/load round-trip', () => {
    const request: Request = {
      id: 'req-1',
      buyer: 'GAAAAAAA',
      fromCountry: 'TR',
      toCountry: 'DE',
      itemWeightG: 500,
      rewardStroops: 1000,
      deadlineDay: 100,
    };
    const traveler: Traveler = {
      id: 'trav-1',
      account: 'GAAAAAAB',
      fromCountry: 'TR',
      toCountry: 'DE',
      travelDay: 50,
      capacityG: 1000,
      reputation: 80,
    };

    const store: Store = {
      requests: [request],
      travelers: [traveler],
      escrows: [
        {
          id: 'esc-1',
          requestId: 'req-1',
          travelerId: 'trav-1',
          amountStroops: 1000,
          deadline: 2000000000n,
          state: 'Created' as EscrowState,
        },
      ],
    };

    save(store);
    const restored = load();

    expect(restored.requests).toEqual([request]);
    expect(restored.travelers).toEqual([traveler]);
    expect(restored.escrows.length).toBe(1);
    expect(restored.escrows[0].id).toBe('esc-1');
    expect(restored.escrows[0].requestId).toBe('req-1');
    expect(restored.escrows[0].travelerId).toBe('trav-1');
    expect(restored.escrows[0].amountStroops).toBe(1000);
    expect(restored.escrows[0].deadline).toBe(2000000000n);
    expect(restored.escrows[0].state).toBe('Created');
  });

  it('handles multiple requests and travelers', () => {
    const r1: Request = { id: 'r1', buyer: 'B1', fromCountry: 'US', toCountry: 'GB', itemWeightG: 100, rewardStroops: 500, deadlineDay: 10 };
    const r2: Request = { id: 'r2', buyer: 'B2', fromCountry: 'DE', toCountry: 'FR', itemWeightG: 300, rewardStroops: 200, deadlineDay: 20 };
    const t1: Traveler = { id: 't1', account: 'A1', fromCountry: 'US', toCountry: 'GB', travelDay: 5, capacityG: 500, reputation: 50 };
    const t2: Traveler = { id: 't2', account: 'A2', fromCountry: 'DE', toCountry: 'FR', travelDay: 15, capacityG: 800, reputation: 90 };

    const store: Store = { requests: [r1, r2], travelers: [t1, t2], escrows: [] };
    save(store);

    const restored = load();
    expect(restored.requests).toHaveLength(2);
    expect(restored.travelers).toHaveLength(2);
    expect(restored.escrows).toHaveLength(0);
  });
});
