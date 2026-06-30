import { NextResponse } from "next/server";
import { Account, Asset, Memo, Networks, Operation, TransactionBuilder } from "@stellar/stellar-sdk";

export async function POST(req: Request) {
  try {
    const { sourcePubKey, destination, amountStroops, memo, sequence } = await req.json();

    if (!sourcePubKey || !destination || !amountStroops) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const acct = new Account(sourcePubKey, String(sequence));
    const xlmAmount = (Number(amountStroops) / 1e7).toFixed(7);
    const builder = new TransactionBuilder(acct, {
      fee: "100",
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(Operation.payment({
        destination,
        asset: Asset.native(),
        amount: xlmAmount,
      }))
      .setTimeout(300);

    if (memo) {
      builder.addMemo(Memo.text(String(memo)));
    }

    const tx = builder.build();
    console.log("[API] Built tx for", sourcePubKey.slice(0, 10), "seq:", sequence, "amountStroops:", amountStroops, "fee: 100");
    return NextResponse.json({ xdr: tx.toXDR() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    console.error("[API] Error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
