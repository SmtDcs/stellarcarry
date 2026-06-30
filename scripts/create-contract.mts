import {
  Address,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
  rpc as StellarRpc,
} from "@stellar/stellar-sdk";
import { writeFileSync } from "fs";

const WASM_HASH_HEX = "6f98f090155d8419c1e50d18f1afb7c5888056d1d757520bfe8d374cb4414024";
const RPC_URL = "https://soroban-testnet.stellar.org";
const FRIENDBOT = "https://friendbot.stellar.org";

async function main() {
  const source = Keypair.random();
  console.log("Deployer:", source.publicKey());
  console.log("Secret:", source.secret());

  const r = await fetch(`${FRIENDBOT}?addr=${encodeURIComponent(source.publicKey())}`);
  if (!r.ok) throw new Error(`Friendbot: ${await r.text()}`);
  console.log("Funded");

  const rpc = new StellarRpc.Server(RPC_URL);
  let account;
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    try { account = await rpc.getAccount(source.publicKey()); break; } catch {}
  }
  if (!account) throw new Error("Account not found");

  const wasmHash = Buffer.from(WASM_HASH_HEX, "hex");
  const deployerAddr = new Address(source.publicKey());
  console.log("Creating contract from WASM:", WASM_HASH_HEX);

  const createOp = Operation.createCustomContract({
    wasmHash,
    address: deployerAddr,
    salt: Buffer.alloc(32, 0),
  });

  let tx = new TransactionBuilder(account, {
    fee: "1000000",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(createOp)
    .setTimeout(300)
    .build();

  tx = await rpc.prepareTransaction(tx);
  tx.sign(source);

  const result = await rpc.sendTransaction(tx);
  console.log("Result:", JSON.stringify(result, null, 2));

  if (result.status === "SUCCESS") {
    console.log("\n🎉 CONTRACT DEPLOYED!");
  }
}

main().catch(console.error);
