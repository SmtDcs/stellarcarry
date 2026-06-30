import {
  Address,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
  rpc as StellarRpc,
} from "@stellar/stellar-sdk";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const WASM_PATH = resolve(ROOT, "contracts/target/wasm32-unknown-unknown/release/escrow_mvp.wasm");
const RPC_URL = "https://soroban-testnet.stellar.org";
const FRIENDBOT = "https://friendbot.stellar.org";

async function main() {
  const wasm = readFileSync(WASM_PATH);
  const wasmHash = createHash("sha256").update(wasm).digest();
  console.log("WASM hash:", wasmHash.toString("hex"));
  console.log("WASM size:", wasm.length, "bytes");

  const source = Keypair.random();
  console.log("Deployer:", source.publicKey());
  console.log("Secret:", source.secret());

  const r = await fetch(`${FRIENDBOT}?addr=${encodeURIComponent(source.publicKey())}`);
  if (!r.ok) throw new Error(`Friendbot: ${await r.text()}`);
  console.log("Funded");

  const rpc = new StellarRpc.Server(RPC_URL);

  let account;
  for (let i = 0; i < 12; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    try { account = await rpc.getAccount(source.publicKey()); break; } catch {}
  }
  if (!account) throw new Error("Account not found");

  // Upload
  const uploadOp = Operation.uploadContractWasm({ wasm });
  let tx = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(uploadOp)
    .setTimeout(300)
    .build();

  tx = await rpc.prepareTransaction(tx);
  tx.sign(source);
  const uploadRes = await rpc.sendTransaction(tx);
  console.log("Upload:", uploadRes.status, uploadRes.hash);

  if (uploadRes.status === "ERROR") throw new Error("Upload failed");

  // Wait, create
  await new Promise((r) => setTimeout(r, 8000));

  let account2;
  for (let i = 0; i < 12; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    try { account2 = await rpc.getAccount(source.publicKey()); break; } catch {}
  }
  if (!account2) throw new Error("Account not found after upload");

  const deployerAddr = new Address(source.publicKey());
  const createOp = Operation.createCustomContract({
    wasmHash,
    address: deployerAddr,
    salt: Buffer.alloc(32, 0),
  });

  tx = new TransactionBuilder(account2, {
    fee: "1000000",
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(createOp)
    .setTimeout(300)
    .build();

  tx = await rpc.prepareTransaction(tx);
  tx.sign(source);

  const deployRes = await rpc.sendTransaction(tx);
  console.log("Deploy:", deployRes.status, deployRes.hash);

  if (deployRes.status === "ERROR") throw new Error("Deploy failed");

  // Hash
  const { hash } = await import("@stellar/stellar-sdk");
  const { xdr } = await import("@stellar/stellar-sdk");
  const { StrKey } = await import("@stellar/stellar-sdk");

  const networkId = hash(Buffer.from(Networks.TESTNET));
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

  console.log("\n🎉 KONTRAT DEPLOY EDİLDİ!");
  console.log("Contract ID:", contractId);

  const { writeFileSync } = await import("fs");
  writeFileSync(resolve(ROOT, ".contract-address"), contractId + "\n");
}

main().catch(console.error);
