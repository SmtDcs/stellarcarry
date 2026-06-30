import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname } from 'path';
import type { Request, Traveler, Escrow } from '@stellarcarry/core';

export interface Store {
  requests: Request[];
  travelers: Traveler[];
  escrows: Escrow[];
}

const FILE = './.stellarcarry/store.json';

interface BigintSerde {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __bigint__: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function reviver(_key: string, value: any): any {
  if (value !== null && typeof value === 'object' && '__bigint__' in value) {
    return BigInt((value as BigintSerde).__bigint__);
  }
  return value;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function bigintReplacer(_key: string, value: any): any {
  if (typeof value === 'bigint') {
    return { __bigint__: String(value) };
  }
  return value;
}

export function load(): Store {
  if (!existsSync(FILE)) return { requests: [], travelers: [], escrows: [] };
  return JSON.parse(readFileSync(FILE, 'utf-8'), reviver) as Store;
}

export function save(store: Store): void {
  const dir = dirname(FILE);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(FILE, JSON.stringify(store, bigintReplacer, 2));
}
