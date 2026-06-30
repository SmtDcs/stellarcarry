// Build first: 
//   cd contracts && cargo build --target wasm32-unknown-unknown --release
//   wasm-opt --mvp-features -all -O0 target/wasm32-unknown-unknown/release/escrow.wasm -o target/wasm32-unknown-unknown/release/escrow_mvp.wasm

import {
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
  rpc as StellarRpc,
  Address,
} from "@stellar/stellar-sdk";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const WASM_PATH = resolve(ROOT, "contracts/target/wasm32-unknown-unknown/release/escrow_mvp.wasm");
const RPC_URL = "https://soroban-testnet.stellar.org";
const FRIENDBOT = "https://friendbot.stellar.org";
const NETWORK = Networks.TESTNET;

async function waitForAccount(rpc: StellarRpc.Server, pubKey: string, retries = 20): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      return await rpc.getAccount(pubKey);
    } catch {
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  throw new Error("Account not found after " + retries + " retries");
}

async function main() {
  const wasm = readFileSync(WASM_PATH);
  const wasmHash = createHash("sha256").update(wasm).digest();
  console.log("WASM size:", wasm.length, "bytes");
  console.log("WASM hash:", wasmHash.toString("hex"));
  console.log("RPC:", RPC_URL);

  const source = Keypair.random();
  console.log("Deployer public key:", source.publicKey());
  console.log("Deployer secret key:", source.secret());

  console.log("Funding via Friendbot...");
  const fbRes = await fetch(`${FRIENDBOT}?addr=${encodeURIComponent(source.publicKey())}`);
  if (!fbRes.ok) {
    console.error("Friendbot failed:", fbRes.status, await fbRes.text());
    process.exit(1);
  }
  console.log("Funded!");

  const rpc = new StellarRpc.Server(RPC_URL);
  let account = await waitForAccount(rpc, source.publicKey());
  console.log("Account ready, seq:", account.sequenceNumber());

  // Step 1: Upload WASM
  console.log("\nUploading WASM...");
  const uploadOp = Operation.uploadContractWasm({ wasm });
  let tx = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: NETWORK,
  })
    .addOperation(uploadOp)
    .setTimeout(300)
    .build();

  tx = await rpc.prepareTransaction(tx);
  tx.sign(source);
  const uploadResult = await rpc.sendTransaction(tx);
  console.log("Upload:", uploadResult.status, uploadResult.hash);

  if (uploadResult.status === "ERROR") {
    console.error("Upload failed:", JSON.stringify(uploadResult).slice(0, 500));
    process.exit(1);
  }

  // Wait for upload confirmation
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 3000));
    try {
      const tr = await rpc.getTransaction(uploadResult.hash);
      console.log("Upload tx status:", tr.status);
      if (tr.status === "SUCCESS") break;
      if (tr.status === "FAILED") {
        console.error("Upload failed on-chain");
        process.exit(1);
      }
    } catch {}
  }

  // Step 2: Create contract instance
  account = await waitForAccount(rpc, source.publicKey());
  console.log("\nCreating contract instance...");
  const deployerAddr = new Address(source.publicKey());

  const createOp = Operation.createCustomContract({
    wasmHash,
    address: deployerAddr,
    salt: Buffer.alloc(32, 0),
  });

  tx = new TransactionBuilder(account, {
    fee: "1000000",
    networkPassphrase: NETWORK,
  })
    .addOperation(createOp)
    .setTimeout(300)
    .build();

  tx = await rpc.prepareTransaction(tx);
  tx.sign(source);
  const deployResult = await rpc.sendTransaction(tx);
  console.log("Deploy:", deployResult.status, deployResult.hash);

  // Wait for deploy confirmation
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 3000));
    try {
      const tr = await rpc.getTransaction(deployResult.hash);
      console.log("Deploy tx status:", tr.status);
      if (tr.status === "SUCCESS") break;
      if (tr.status === "FAILED") {
        console.error("Deploy failed on-chain");
        process.exit(1);
      }
    } catch {}
  }

  // Step 3: Derive contract ID
  const { hash, xdr, StrKey } = await import("@stellar/stellar-sdk");
  const networkId = hash(Buffer.from(NETWORK));
  const addrSc = deployerAddr.toScAddress();
  const preimageObj = xdr.ContractIdPreimage.contractIdPreimageFromAddress(
    new xdr.ContractIdPreimageFromAddress({
      address: addrSc,
      salt: Buffer.alloc(32, 0),
    })
  );
  const preimageHash = xdr.HashIdPreimage.envelopeTypeContractId(
    new xdr.HashIdPreimageContractId({
      networkId,
      contractIdPreimage: preimageObj,
    })
  );
  const contractIdHash = hash(xdr.HashIdPreimage.toXDR(preimageHash));
  const contractId = StrKey.encodeContract(contractIdHash);

  console.log("\n🎉 CONTRACT DEPLOYED!");
  console.log("Contract ID:", contractId);

  writeFileSync(resolve(ROOT, ".contract-address"), contractId + "\n");
  console.log("Saved to .contract-address");
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
