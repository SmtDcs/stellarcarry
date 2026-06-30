import {
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
  rpc as StellarRpc,
} from "@stellar/stellar-sdk";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const WASM_PATH = resolve(ROOT, "contracts/target/wasm32-unknown-unknown/release/escrow_mvp.wasm");
const RPC_URL = "https://soroban-testnet.stellar.org";
const FRIENDBOT = "https://friendbot.stellar.org";

async function main() {
  const wasm = readFileSync(WASM_PATH);

  const source = Keypair.random();
  console.log("Deployer:", source.publicKey());

  const r = await fetch(`${FRIENDBOT}?addr=${encodeURIComponent(source.publicKey())}`);
  if (!r.ok) throw new Error(`Friendbot: ${await r.text()}`);
  console.log("Funded deployer");

  await new Promise((res) => setTimeout(res, 10000));

  const rpc = new StellarRpc.Server(RPC_URL);
  let account;
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    try {
      account = await rpc.getAccount(source.publicKey());
      break;
    } catch {}
  }
  if (!account) throw new Error("Account not found after retries");

  console.log("Account found, deploying...");

  const uploadOperation = Operation.uploadContractWasm({ wasm });
  let tx = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(uploadOperation)
    .setTimeout(300)
    .build();
  tx = await rpc.prepareTransaction(tx);
  tx.sign(source);

  const uploadResult = await rpc.sendTransaction(tx);
  if (uploadResult.status === "ERROR") {
    throw new Error(`Upload failed: ${JSON.stringify(uploadResult)}`);
  }
  console.log("WASM uploaded, hash:", (uploadResult as any).hash);

  await new Promise((res) => setTimeout(res, 5000));

  const wasmHashHex = (uploadResult as any).wasmHash || (uploadResult as any).hash;
  if (!wasmHashHex) throw new Error("No wasmHash in upload result");
  const wasmHash = Buffer.from(wasmHashHex, "hex");
  console.log("WASM hash:", wasmHash.toString("hex"));

  const account2 = await rpc.getAccount(source.publicKey());

  const createOp = Operation.createCustomContract({
    wasmHash,
    address: source.publicKey(),
    salt: Buffer.alloc(32, 0),
  });

  tx = new TransactionBuilder(account2, {
    fee: "100000",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(createOp)
    .setTimeout(300)
    .build();

  tx = await rpc.prepareTransaction(tx);
  tx.sign(source);

  const deployResult = await rpc.sendTransaction(tx);
  if (deployResult.status === "ERROR") {
    throw new Error(`Deploy failed: ${JSON.stringify(deployResult)}`);
  }

  console.log("CONTRACT DEPLOYED!");
  console.log("Result:", JSON.stringify(deployResult, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
