import { describe, it, expect } from 'vitest';
import {
  Keypair,
  Networks,
  StrKey,
  hash,
} from '@stellar/stellar-sdk';
import { EscrowClient } from '@stellarcarry/core';

const SRC_KEY = Keypair.random().publicKey();
const BUYER_KEY = Keypair.random().publicKey();
const TRAVELER_KEY = Keypair.random().publicKey();
const CONTRACT_ID = StrKey.encodeContract(hash(Buffer.from('test_escrow_contract')));

function makeClient(passphrase?: string): EscrowClient {
  return new EscrowClient({ contractId: CONTRACT_ID, networkPassphrase: passphrase });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyOp = any;

function getInvokeContractArgs(tx: ReturnType<EscrowClient['buildCreateEscrow']>): AnyOp {
  const op = tx.operations[0] as AnyOp;
  const func = op.func as AnyOp;
  expect(func.switch().name).toBe('hostFunctionTypeInvokeContract');
  return func.invokeContract() as AnyOp;
}

describe('EscrowClient', () => {
  describe('constructor', () => {
    it('defaults to Stellar Testnet passphrase', () => {
      const c = new EscrowClient({ contractId: CONTRACT_ID });
      expect(c.networkPassphrase).toBe('Test SDF Network ; September 2015');
    });

    it('accepts a custom network passphrase', () => {
      const c = new EscrowClient({
        contractId: CONTRACT_ID,
        networkPassphrase: 'My Local Network ; test 1',
      });
      expect(c.networkPassphrase).toBe('My Local Network ; test 1');
    });
  });

  describe('buildCreateEscrow', () => {
    it('builds a transaction with the create_escrow function and correct args', () => {
      const client = makeClient();
      const amount = 1_000_000_000n;
      const tx = client.buildCreateEscrow(SRC_KEY, BUYER_KEY, TRAVELER_KEY, amount, 0n);

      const args = getInvokeContractArgs(tx);
      expect(args.functionName()).toBe('create_escrow');

      const scArgs = args.args() as AnyOp[];
      expect(scArgs.length).toBe(4);

      // 1st arg: buyer address
      expect(scArgs[0].switch().name).toBe('scvAddress');
      // 2nd arg: traveler address
      expect(scArgs[1].switch().name).toBe('scvAddress');
      // 3rd arg: amount as i128
      expect(scArgs[2].switch().name).toBe('scvI128');
      // 4th arg: deadline as u64
      expect(scArgs[3].switch().name).toBe('scvU64');

      const i128 = scArgs[2].i128() as AnyOp;
      // lo is Uint64 (unsigned), lo.low is the low 32 bits as a number
      expect(i128.lo().low).toBe(1_000_000_000);
      // hi is Int64 (signed), should be 0
      expect(i128.hi().high).toBe(0);
    });
  });

  describe('buildFund', () => {
    it('builds a transaction with the fund function and escrow id arg', () => {
      const client = makeClient();
      const escrowId = 7n;
      const tx = client.buildFund(SRC_KEY, escrowId);

      const args = getInvokeContractArgs(tx);
      expect(args.functionName()).toBe('fund');

      const scArgs = args.args() as AnyOp[];
      expect(scArgs.length).toBe(1);
      expect(scArgs[0].switch().name).toBe('scvU64');
      // u64() returns UnsignedHyper; compare its toString()
      expect(String(scArgs[0].u64())).toBe('7');
    });
  });

  describe('buildConfirmDelivery', () => {
    it('builds a transaction with the confirm_delivery function', () => {
      const client = makeClient();
      const escrowId = 42n;
      const tx = client.buildConfirmDelivery(SRC_KEY, escrowId);

      const args = getInvokeContractArgs(tx);
      expect(args.functionName()).toBe('confirm_delivery');

      const scArgs = args.args() as AnyOp[];
      expect(scArgs.length).toBe(1);
      expect(scArgs[0].switch().name).toBe('scvU64');
      expect(String(scArgs[0].u64())).toBe('42');
    });
  });

  describe('buildRelease', () => {
    it('builds a transaction with the release function', () => {
      const client = makeClient();
      const escrowId = 99n;
      const tx = client.buildRelease(TRAVELER_KEY, escrowId);

      const args = getInvokeContractArgs(tx);
      expect(args.functionName()).toBe('release');

      const scArgs = args.args() as AnyOp[];
      expect(scArgs.length).toBe(1);
      expect(scArgs[0].switch().name).toBe('scvU64');
      expect(String(scArgs[0].u64())).toBe('99');
    });
  });

  describe('buildRefund', () => {
    it('builds a transaction with the refund function', () => {
      const client = makeClient();
      const escrowId = 3n;
      const tx = client.buildRefund(SRC_KEY, escrowId);

      const args = getInvokeContractArgs(tx);
      expect(args.functionName()).toBe('refund');

      const scArgs = args.args() as AnyOp[];
      expect(scArgs.length).toBe(1);
      expect(scArgs[0].switch().name).toBe('scvU64');
      expect(String(scArgs[0].u64())).toBe('3');
    });
  });

  describe('contract-id wiring', () => {
    it('wires the contract ID into the built transaction operation', () => {
      const client = new EscrowClient({ contractId: CONTRACT_ID });
      const tx = client.buildFund(SRC_KEY, 1n);
      const args = getInvokeContractArgs(tx);

      // The contract address is embedded in the operation
      const contractAddress = args.contractAddress() as AnyOp;
      expect(typeof contractAddress).toBe('object');
      expect(contractAddress.toXDR('hex').length).toBeGreaterThan(0);
    });

    it('uses different contract IDs for different client instances', () => {
      const otherContract = StrKey.encodeContract(hash(Buffer.from('other_contract')));
      const client1 = new EscrowClient({ contractId: CONTRACT_ID });
      const client2 = new EscrowClient({ contractId: otherContract });

      const tx1 = client1.buildFund(SRC_KEY, 1n);
      const tx2 = client2.buildFund(SRC_KEY, 1n);

      const addr1 = (getInvokeContractArgs(tx1).contractAddress() as AnyOp).toXDR('hex') as string;
      const addr2 = (getInvokeContractArgs(tx2).contractAddress() as AnyOp).toXDR('hex') as string;

      expect(addr1).not.toBe(addr2);
    });
  });
});
