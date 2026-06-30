#!/usr/bin/env node
// @stellarcarry/cli — thin CLI over @stellarcarry/core. LOCAL network only.
import { Command } from 'commander';
import { randomUUID } from 'crypto';
import type { Request, Traveler, Escrow } from '@stellarcarry/core';
import { EscrowState, matchTravelers, EscrowClient, deadlineDayToLedgerTimestamp } from '@stellarcarry/core';
import { load, save, bigintReplacer } from './store.js';

const LOCAL_HOST_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/;
const FORBIDDEN_NETWORK_RE = /testnet|mainnet|futurenet/i;

function isValidLocalUrl(raw: string): boolean {
  return LOCAL_HOST_RE.test(raw);
}

function rejectNonLocal(target?: string): string | undefined {
  if (!target) return undefined;
  if (!isValidLocalUrl(target) || FORBIDDEN_NETWORK_RE.test(target)) {
    console.error(`ERROR: Only local network is supported, got "${target}". Use --network http://localhost:8000 or omit the flag.`);
    process.exit(1);
  }
  return target;
}

function parseIntArg(v: string): number {
  const raw = Number(v);
  if (!Number.isInteger(raw) || raw < 0) {
    console.error(`ERROR: expected a non-negative integer, got "${v}"`);
    process.exit(1);
  }
  return raw;
}

function parsePositiveIntArg(v: string): number {
  const raw = Number(v);
  if (!Number.isInteger(raw) || raw <= 0) {
    console.error(`ERROR: expected a positive integer, got "${v}"`);
    process.exit(1);
  }
  return raw;
}

function parseBigIntArg(v: string): bigint {
  try {
    const n = BigInt(v);
    if (n < 0n) throw new Error();
    return n;
  } catch {
    console.error(`ERROR: expected a non-negative bigint, got "${v}"`);
    process.exit(1);
  }
}

function validatePassphrase(v: string): string {
  if (v.includes('testnet') || v.includes('mainnet') || v.includes('public', 0) || v.includes('Test SDF') || v.includes('Public Global')) {
    console.error('ERROR: Only local (Standalone) network passphrase is supported.');
    process.exit(1);
  }
  return v;
}

function jsonPrint(value: unknown): void {
  console.log(JSON.stringify(value, bigintReplacer, 2));
}

function makeClient(opts: { contractId: string; networkPassphrase?: string }): EscrowClient {
  try {
    return new EscrowClient(opts);
  } catch (e: unknown) {
    console.error(`ERROR: ${(e as Error).message}`);
    process.exit(1);
  }
}

function loadAndCheckEmpty(kind: 'requests' | 'travelers' | 'escrows'): ReturnType<typeof load> {
  const store = load();
  const list: unknown[] = store[kind] as unknown[];
  if (list.length === 0) {
    const commands: Record<string, string> = {
      requests: 'post-request',
      travelers: 'add-traveler',
      escrows: 'create-escrow',
    };
    console.error(`ERROR: No ${kind} found in the store. Use \`${commands[kind]}\` first.`);
    process.exit(1);
  }
  return store;
}

const program = new Command();
program
  .name('stellarcarry')
  .description('P2P cross-border shopping & delivery with Soroban escrow (LOCAL network only)')
  .option('--network <url>', 'Soroban RPC URL — must be a localhost URL (http://localhost:8000). Rejects testnet/mainnet/futurenet.', rejectNonLocal)
  .on('--help', () => {
    console.log('');
    console.log('Network:');
    console.log('  Only local network is supported. Set --network or STELLARCARRY_NETWORK to a localhost URL.');
    console.log('  Testnet and mainnet URLs are rejected at startup.');
  })
  .addHelpText('after', `
Workflow (lifecycle):
  post-request  →  add-traveler  →  match  →  create-escrow  →  fund  →  confirm-delivery  →  release

Every step persists to ./.stellarcarry/store.json.
All amounts are integer stroops (1 XLM = 10^7 stroops).
Network is LOCAL only — testnet and mainnet are rejected.
`);

program
  .command('post-request')
  .description('Post a new shopping request to the local store')
  .requiredOption('--buyer <account>', 'buyer Stellar account')
  .requiredOption('--from <country>', 'ISO country code where item is bought')
  .requiredOption('--to <country>', 'ISO country code to deliver to')
  .requiredOption('--weight <grams>', 'item weight in grams', parseIntArg)
  .requiredOption('--reward <stroops>', 'reward offered (stroops, positive integer)', parsePositiveIntArg)
  .requiredOption('--deadline <day>', 'latest acceptable travel day (integer)', parseIntArg)
  .action((opts) => {
    const request: Request = {
      id: randomUUID(),
      buyer: opts.buyer,
      fromCountry: opts.from,
      toCountry: opts.to,
      itemWeightG: opts.weight,
      rewardStroops: opts.reward,
      deadlineDay: opts.deadline,
    };
    const store = load();
    store.requests.push(request);
    save(store);
    console.log(JSON.stringify(request, null, 2));
  });

program
  .command('add-traveler')
  .description('Register a traveler in the local store')
  .requiredOption('--account <account>', 'traveler Stellar account')
  .requiredOption('--from <country>', 'ISO country code of origin')
  .requiredOption('--to <country>', 'ISO country code of destination')
  .requiredOption('--day <n>', 'travel day index', parseIntArg)
  .requiredOption('--capacity <grams>', 'carrying capacity in grams', parseIntArg)
  .requiredOption('--reputation <n>', 'reputation score 0..100', parseIntArg)
  .action((opts) => {
    const traveler: Traveler = {
      id: randomUUID(),
      account: opts.account,
      fromCountry: opts.from,
      toCountry: opts.to,
      travelDay: opts.day,
      capacityG: opts.capacity,
      reputation: opts.reputation,
    };
    const store = load();
    store.travelers.push(traveler);
    save(store);
    console.log(JSON.stringify(traveler, null, 2));
  });

program
  .command('match')
  .description('Match a request against registered travelers and print ranked results')
  .requiredOption('--request <id>', 'request ID to match')
  .action((opts) => {
    const store = loadAndCheckEmpty('requests');
    const request = store.requests.find(r => r.id === opts.request);
    if (!request) {
      console.error(`ERROR: request "${opts.request}" not found. Use \`match --request <id>\` with an id from \`post-request\`.`);
      process.exit(1);
    }
    if (store.travelers.length === 0) {
      console.error('ERROR: No travelers registered. Use `add-traveler` first.');
      process.exit(1);
    }
    const results = matchTravelers(request, store.travelers);
    if (results.length === 0) {
      console.log('No matching travelers found. Try adjusting the request criteria.');
    } else {
      console.log(JSON.stringify(results, null, 2));
    }
  });

program
  .command('create-escrow')
  .description('Create an escrow for a matched request+traveler pair')
  .requiredOption('--request <id>', 'request ID')
  .requiredOption('--traveler <id>', 'traveler ID')
  .requiredOption('--contract <id>', 'Soroban escrow contract ID')
  .requiredOption('--buyer <pubkey>', 'buyer Stellar public key (G…)')
  .requiredOption('--token <id>', 'Stellar asset contract address')
  .requiredOption('--amount <stroops>', 'escrow amount in stroops (positive integer)', parseBigIntArg)
  .option('--deadline <timestamp>', 'refund deadline override as Unix timestamp (seconds)', parseBigIntArg)
  .option('--passphrase <str>', 'network passphrase', validatePassphrase)
  .action((opts) => {
    if (opts.amount <= 0n) {
      console.error(`ERROR: amount must be positive, got ${opts.amount}`);
      process.exit(1);
    }
    const store = loadAndCheckEmpty('requests');
    const request = store.requests.find(r => r.id === opts.request);
    if (!request) {
      console.error(`ERROR: request "${opts.request}" not found. Use an id from \`post-request\`.`);
      process.exit(1);
    }
    if (store.travelers.length === 0) {
      console.error('ERROR: No travelers registered. Use `add-traveler` first.');
      process.exit(1);
    }
    const traveler = store.travelers.find(t => t.id === opts.traveler);
    if (!traveler) {
      console.error(`ERROR: traveler "${opts.traveler}" not found. Use an id from \`add-traveler\`.`);
      process.exit(1);
    }
    const deadline: bigint = opts.deadline !== undefined
      ? opts.deadline
      : deadlineDayToLedgerTimestamp(request.deadlineDay);
    const client = makeClient({ contractId: opts.contract, networkPassphrase: opts.passphrase });
    const tx = client.buildCreateEscrow(
      opts.buyer,
      request.buyer,
      traveler.account,
      opts.token,
      opts.amount,
      deadline,
    );
    const escrow: Escrow = {
      id: randomUUID(),
      requestId: request.id,
      travelerId: traveler.id,
      amountStroops: Number(opts.amount),
      deadline,
      state: EscrowState.Created as EscrowState,
    };
    store.escrows.push(escrow);
    save(store);
    jsonPrint({ escrow, txXdr: tx.toEnvelope().toXDR('base64') });
  });

program
  .command('fund')
  .description('Fund an escrow (buyer transfers tokens to contract)')
  .requiredOption('--escrow <id>', 'escrow ID (local store id)')
  .requiredOption('--contract <id>', 'Soroban escrow contract ID')
  .requiredOption('--buyer <pubkey>', 'buyer Stellar public key (G…)')
  .requiredOption('--escrow-contract-id <n>', 'on-chain escrow numeric ID (u64)', parseBigIntArg)
  .option('--passphrase <str>', 'network passphrase', validatePassphrase)
  .action((opts) => {
    const store = loadAndCheckEmpty('escrows');
    const escrow = store.escrows.find(e => e.id === opts.escrow);
    if (!escrow) {
      console.error(`ERROR: escrow "${opts.escrow}" not found. Use an id from \`create-escrow\`.`);
      process.exit(1);
    }
    const client = makeClient({ contractId: opts.contract, networkPassphrase: opts.passphrase });
    const getEscrowTx = client.buildGetEscrow(opts.buyer, opts.escrowContractId);
    void getEscrowTx;
    console.warn('WARNING: on-chain state not verified. Simulate the get_escrow transaction to confirm escrow state before funding.');
    if (escrow.state !== (EscrowState.Created as EscrowState)) {
      console.error(`ERROR: local state is "${escrow.state}", expected "Created". May be stale — verify on-chain.`);
      process.exit(1);
    }
    const tx = client.buildFund(opts.buyer, opts.escrowContractId);
    escrow.state = EscrowState.Funded as EscrowState;
    save(store);
    jsonPrint({ escrow, txXdr: tx.toEnvelope().toXDR('base64') });
  });

program
  .command('confirm-delivery')
  .description('Confirm delivery of items (buyer)')
  .requiredOption('--escrow <id>', 'escrow ID (local store id)')
  .requiredOption('--contract <id>', 'Soroban escrow contract ID')
  .requiredOption('--buyer <pubkey>', 'buyer Stellar public key (G…)')
  .requiredOption('--escrow-contract-id <n>', 'on-chain escrow numeric ID (u64)', parseBigIntArg)
  .option('--passphrase <str>', 'network passphrase', validatePassphrase)
  .action((opts) => {
    const store = loadAndCheckEmpty('escrows');
    const escrow = store.escrows.find(e => e.id === opts.escrow);
    if (!escrow) {
      console.error(`ERROR: escrow "${opts.escrow}" not found. Use an id from \`create-escrow\`.`);
      process.exit(1);
    }
    const client = makeClient({ contractId: opts.contract, networkPassphrase: opts.passphrase });
    const getEscrowTx = client.buildGetEscrow(opts.buyer, opts.escrowContractId);
    void getEscrowTx;
    console.warn('WARNING: on-chain state not verified. Simulate the get_escrow transaction to confirm escrow state before confirming delivery.');
    if (escrow.state !== (EscrowState.Funded as EscrowState)) {
      console.error(`ERROR: local state is "${escrow.state}", expected "Funded". May be stale — verify on-chain.`);
      process.exit(1);
    }
    const tx = client.buildConfirmDelivery(opts.buyer, opts.escrowContractId);
    escrow.state = EscrowState.Delivered as EscrowState;
    save(store);
    jsonPrint({ escrow, txXdr: tx.toEnvelope().toXDR('base64') });
  });

program
  .command('release')
  .description('Release funds to traveler after confirmed delivery')
  .requiredOption('--escrow <id>', 'escrow ID (local store id)')
  .requiredOption('--contract <id>', 'Soroban escrow contract ID')
  .requiredOption('--traveler <pubkey>', 'traveler Stellar public key (G…)')
  .requiredOption('--escrow-contract-id <n>', 'on-chain escrow numeric ID (u64)', parseBigIntArg)
  .option('--passphrase <str>', 'network passphrase', validatePassphrase)
  .action((opts) => {
    const store = loadAndCheckEmpty('escrows');
    const escrow = store.escrows.find(e => e.id === opts.escrow);
    if (!escrow) {
      console.error(`ERROR: escrow "${opts.escrow}" not found. Use an id from \`create-escrow\`.`);
      process.exit(1);
    }
    const client = makeClient({ contractId: opts.contract, networkPassphrase: opts.passphrase });
    const getEscrowTx = client.buildGetEscrow(opts.traveler, opts.escrowContractId);
    void getEscrowTx;
    console.warn('WARNING: on-chain state not verified. Simulate the get_escrow transaction to confirm escrow state before releasing.');
    if (escrow.state !== (EscrowState.Delivered as EscrowState)) {
      console.error(`ERROR: local state is "${escrow.state}", expected "Delivered". May be stale — verify on-chain.`);
      process.exit(1);
    }
    const tx = client.buildRelease(opts.traveler, opts.escrowContractId);
    escrow.state = EscrowState.Released as EscrowState;
    save(store);
    jsonPrint({ escrow, txXdr: tx.toEnvelope().toXDR('base64') });
  });

program
  .command('refund')
  .description('Refund escrowed funds to buyer (only after deadline)')
  .requiredOption('--escrow <id>', 'escrow ID (local store id)')
  .requiredOption('--contract <id>', 'Soroban escrow contract ID')
  .requiredOption('--buyer <pubkey>', 'buyer Stellar public key (G…)')
  .requiredOption('--escrow-contract-id <n>', 'on-chain escrow numeric ID (u64)', parseBigIntArg)
  .option('--passphrase <str>', 'network passphrase', validatePassphrase)
  .action((opts) => {
    const store = loadAndCheckEmpty('escrows');
    const escrow = store.escrows.find(e => e.id === opts.escrow);
    if (!escrow) {
      console.error(`ERROR: escrow "${opts.escrow}" not found. Use an id from \`create-escrow\`.`);
      process.exit(1);
    }
    const client = makeClient({ contractId: opts.contract, networkPassphrase: opts.passphrase });
    const getEscrowTx = client.buildGetEscrow(opts.buyer, opts.escrowContractId);
    void getEscrowTx;
    console.warn('WARNING: on-chain state not verified. Simulate the get_escrow transaction to confirm escrow state and deadline before refunding.');
    if (escrow.state !== (EscrowState.Funded as EscrowState)) {
      console.error(`ERROR: local state is "${escrow.state}", expected "Funded". May be stale — verify on-chain.`);
      process.exit(1);
    }
    const tx = client.buildRefund(opts.buyer, opts.escrowContractId);
    escrow.state = EscrowState.Refunded as EscrowState;
    save(store);
    jsonPrint({ escrow, txXdr: tx.toEnvelope().toXDR('base64') });
  });

const envTarget = process.env.STELLARCARRY_NETWORK;
if (envTarget) rejectNonLocal(envTarget);

program.parse();
