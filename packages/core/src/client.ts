import {
  Account,
  Asset,
  Memo,
  Networks,
  Operation,
  Transaction,
  TransactionBuilder,
  nativeToScVal,
  rpc as StellarRpc,
} from '@stellar/stellar-sdk';

import { ValidationError, NetworkError } from './errors';

export { Networks };
export type SimulationResult = StellarRpc.Api.SimulateTransactionResponse;
export type SendResult = StellarRpc.Api.SendTransactionResponse;
export type GetTransactionResult = StellarRpc.Api.GetTransactionResponse;

/**
 * Stellar Testnet passphrase.
 */
export const TESTNET_PASSPHRASE = Networks.TESTNET;

/**
 * Builds Stellar/Soroban transactions to drive the escrow contract
 * and perform simple XLM payments.
 * Supports transaction simulation and submission via RPC.
 */
export class EscrowClient {
  /** Soroban contract strkey. */
  readonly contractId: string;
  /** Stellar network passphrase. */
  readonly networkPassphrase: string;
  /** RPC server instance (lazy). */
  private _rpc: StellarRpc.Server | null = null;
  /** RPC server URL for simulation/submission. */
  readonly rpcUrl: string;

  /**
   * @param opts.contractId - Soroban contract strkey (starts with "C").
   * @param opts.networkPassphrase - defaults to Stellar Testnet.
   * @param opts.rpcUrl - RPC server URL for simulation/submission (defaults to testnet).
   * @throws {ValidationError} if contractId is empty or not a string.
   */
  constructor(opts: {
    contractId: string;
    networkPassphrase?: string;
    rpcUrl?: string;
  }) {
    if (!opts.contractId || typeof opts.contractId !== 'string' || opts.contractId.trim() === '') {
      throw new ValidationError('contractId must be a non-empty string');
    }

    const passphrase = opts.networkPassphrase ?? Networks.TESTNET;

    this.contractId = opts.contractId;
    this.networkPassphrase = passphrase;
    this.rpcUrl = opts.rpcUrl ?? 'https://soroban-testnet.stellar.org';
  }

  /** Get or create the RPC server instance. */
  get rpc(): StellarRpc.Server {
    if (!this._rpc) {
      this._rpc = new StellarRpc.Server(this.rpcUrl);
    }
    return this._rpc;
  }

  /**
   * Simulate a transaction via Soroban RPC.
   * Returns the full simulation response including results, events, and costs.
   */
  async simulate(tx: Transaction): Promise<SimulationResult> {
    return this.rpc.simulateTransaction(tx);
  }

  /**
   * Submit a transaction to the network via Soroban RPC.
   */
  async submit(tx: Transaction): Promise<SendResult> {
    return this.rpc.sendTransaction(tx);
  }

  /**
   * Get a transaction result by hash.
   */
  async getTransaction(hash: string): Promise<GetTransactionResult> {
    return this.rpc.getTransaction(hash);
  }

  /**
   * Build a transaction whose single operation is an `invokeContractFunction`
   * call to `funcName` on the configured contract.
   *
   * @param sourcePubKey - Stellar account public key (G…) of the submitter.
   * @param funcName - contract method name.
   * @param scvArgs - array of pre-built `xdr.ScVal` arguments.
   * @param sequence - optional account sequence number (fetched from Horizon).
   */
  private buildTransaction(
    sourcePubKey: string,
    funcName: string,
    scvArgs: ReturnType<typeof nativeToScVal>[],
    sequence?: string,
  ): Transaction {
    const account = new Account(sourcePubKey, sequence ?? '0');

    const builder = new TransactionBuilder(account, {
      fee: '100000',
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        Operation.invokeContractFunction({
          contract: this.contractId,
          function: funcName,
          args: scvArgs,
        }),
      )
      .setTimeout(300);

    // Soroban transactions need resource fees from simulation
    // For now, set a high fee to cover costs
    return builder.build();
  }

  /**
   * Build a `create_escrow` invocation.
   *
   * @param sourcePubKey - buyer's Stellar account public key.
   * @param buyer - buyer's Stellar account address.
   * @param traveler - traveler's Stellar account address.
   * @param amountStroops - escrow amount in integer stroops.
   * @param deadline - Stellar ledger timestamp (Unix seconds, NOT milliseconds)
   *   after which refund is allowed (u64).
   * @throws {ValidationError} if any string argument is empty or if amountStroops or deadline are negative.
   */
  buildCreateEscrow(
    sourcePubKey: string,
    buyer: string,
    traveler: string,
    amountStroops: bigint,
    deadline: bigint,
    sequence?: string,
  ): Transaction {
    if (!sourcePubKey || typeof sourcePubKey !== 'string' || sourcePubKey.trim() === '') {
      throw new ValidationError('sourcePubKey must be a non-empty string');
    }
    if (!buyer || typeof buyer !== 'string' || buyer.trim() === '') {
      throw new ValidationError('buyer must be a non-empty string');
    }
    if (!traveler || typeof traveler !== 'string' || traveler.trim() === '') {
      throw new ValidationError('traveler must be a non-empty string');
    }
    if (typeof amountStroops !== 'bigint' || amountStroops < 0n) {
      throw new ValidationError(`amountStroops must be a non-negative bigint, got ${amountStroops}`);
    }
    if (typeof deadline !== 'bigint' || deadline < 0n) {
      throw new ValidationError(`deadline must be a non-negative bigint, got ${deadline}`);
    }

    return this.buildTransaction(sourcePubKey, 'create_escrow', [
      nativeToScVal(buyer, { type: 'address' }),
      nativeToScVal(traveler, { type: 'address' }),
      nativeToScVal(amountStroops, { type: 'i128' }),
      nativeToScVal(deadline, { type: 'u64' }),
    ], sequence);
  }

  /**
   * Build a `fund` invocation. Only the buyer may call; enforced on-chain.
   *
   * @param sourcePubKey - buyer's Stellar account public key.
   * @param escrowId - numeric escrow ID on the contract (u64).
   * @throws {ValidationError} if sourcePubKey is empty or escrowId is negative.
   */
  buildFund(sourcePubKey: string, escrowId: bigint, sequence?: string): Transaction {
    if (!sourcePubKey || typeof sourcePubKey !== 'string' || sourcePubKey.trim() === '') {
      throw new ValidationError('sourcePubKey must be a non-empty string');
    }
    if (typeof escrowId !== 'bigint' || escrowId < 0n) {
      throw new ValidationError(`escrowId must be a non-negative bigint, got ${escrowId}`);
    }

    return this.buildTransaction(sourcePubKey, 'fund', [
      nativeToScVal(escrowId, { type: 'u64' }),
    ], sequence);
  }

  /**
   * Build a `confirm_delivery` invocation. Only the buyer may call.
   *
   * @param sourcePubKey - buyer's Stellar account public key.
   * @param escrowId - numeric escrow ID on the contract (u64).
   * @throws {ValidationError} if sourcePubKey is empty or escrowId is negative.
   */
  buildConfirmDelivery(sourcePubKey: string, escrowId: bigint, sequence?: string): Transaction {
    if (!sourcePubKey || typeof sourcePubKey !== 'string' || sourcePubKey.trim() === '') {
      throw new ValidationError('sourcePubKey must be a non-empty string');
    }
    if (typeof escrowId !== 'bigint' || escrowId < 0n) {
      throw new ValidationError(`escrowId must be a non-negative bigint, got ${escrowId}`);
    }

    return this.buildTransaction(sourcePubKey, 'confirm_delivery', [
      nativeToScVal(escrowId, { type: 'u64' }),
    ], sequence);
  }

  /**
   * Build a `release` invocation. Only the traveler may call; enforced on-chain.
   *
   * @param sourcePubKey - traveler's Stellar account public key.
   * @param escrowId - numeric escrow ID on the contract (u64).
   * @throws {ValidationError} if sourcePubKey is empty or escrowId is negative.
   */
  buildRelease(sourcePubKey: string, escrowId: bigint, sequence?: string): Transaction {
    if (!sourcePubKey || typeof sourcePubKey !== 'string' || sourcePubKey.trim() === '') {
      throw new ValidationError('sourcePubKey must be a non-empty string');
    }
    if (typeof escrowId !== 'bigint' || escrowId < 0n) {
      throw new ValidationError(`escrowId must be a non-negative bigint, got ${escrowId}`);
    }

    return this.buildTransaction(sourcePubKey, 'release', [
      nativeToScVal(escrowId, { type: 'u64' }),
    ], sequence);
  }

  /**
   * Build a `refund` invocation. Only the buyer may call; enforced on-chain.
   *
   * @param sourcePubKey - buyer's Stellar account public key.
   * @param escrowId - numeric escrow ID on the contract (u64).
   * @throws {ValidationError} if sourcePubKey is empty or escrowId is negative.
   */
  buildRefund(sourcePubKey: string, escrowId: bigint, sequence?: string): Transaction {
    if (!sourcePubKey || typeof sourcePubKey !== 'string' || sourcePubKey.trim() === '') {
      throw new ValidationError('sourcePubKey must be a non-empty string');
    }
    if (typeof escrowId !== 'bigint' || escrowId < 0n) {
      throw new ValidationError(`escrowId must be a non-negative bigint, got ${escrowId}`);
    }

    return this.buildTransaction(sourcePubKey, 'refund', [
      nativeToScVal(escrowId, { type: 'u64' }),
    ]);
  }

  /**
   * Build a `get_escrow` invocation to query on-chain escrow state.
   * The return value must be extracted via RPC simulation; this method
   * only constructs the transaction.
   *
   * @param sourcePubKey - caller's Stellar account public key.
   * @param escrowId - numeric escrow ID on the contract (u64).
   * @throws {ValidationError} if sourcePubKey is empty or escrowId is negative.
   */
  /**
   * Build a simple XLM payment transaction.
   *
   * @param sourcePubKey - sender's Stellar account public key.
   * @param destination - recipient's Stellar account public key.
   * @param amountStroops - amount in integer stroops (1 XLM = 10^7 stroops).
   * @param memo - optional memo text.
   * @param sequence - account sequence number from Horizon.
   * @throws {ValidationError} if any argument is invalid.
   */
  buildSendXlm(
    sourcePubKey: string,
    destination: string,
    amountStroops: bigint,
    memo?: string,
    sequence?: string,
  ): Transaction {
    if (!sourcePubKey || typeof sourcePubKey !== 'string' || sourcePubKey.trim() === '') {
      throw new ValidationError('sourcePubKey must be a non-empty string');
    }
    if (!destination || typeof destination !== 'string' || destination.trim() === '') {
      throw new ValidationError('destination must be a non-empty string');
    }
    if (typeof amountStroops !== 'bigint' || amountStroops <= 0n) {
      throw new ValidationError(`amountStroops must be a positive bigint, got ${amountStroops}`);
    }

    const account = new Account(sourcePubKey, sequence ?? '0');
    const builder = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        Operation.payment({
          destination,
          asset: Asset.native(),
          amount: amountStroops.toString(),
        }),
      )
      .setTimeout(300);

    if (memo) {
      builder.addMemo(Memo.text(memo));
    }

    return builder.build();
  }

  buildGetEscrow(sourcePubKey: string, escrowId: bigint): Transaction {
    if (!sourcePubKey || typeof sourcePubKey !== 'string' || sourcePubKey.trim() === '') {
      throw new ValidationError('sourcePubKey must be a non-empty string');
    }
    if (typeof escrowId !== 'bigint' || escrowId < 0n) {
      throw new ValidationError(`escrowId must be a non-negative bigint, got ${escrowId}`);
    }

    return this.buildTransaction(sourcePubKey, 'get_escrow', [
      nativeToScVal(escrowId, { type: 'u64' }),
    ]);
  }
}
