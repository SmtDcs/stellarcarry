import { NextResponse } from "next/server";
import { EscrowClient } from "@stellarcarry/core";

const CONTRACT_ID = "CDYZYD7PV2O7FWZC3MJVB2XXOQ3BBC3Y2JLO7EWO7WP6XIGCRRUX6SK4";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, sourcePubKey, params } = body as {
      action: string;
      sourcePubKey: string;
      params: Record<string, unknown>;
    };

    if (!action || !sourcePubKey) {
      return NextResponse.json(
        { error: "action and sourcePubKey are required" },
        { status: 400 }
      );
    }

    const client = new EscrowClient({ contractId: CONTRACT_ID });

    let tx;
    switch (action) {
      case "create_escrow": {
        tx = client.buildCreateEscrow(
          sourcePubKey,
          params.buyer as string,
          params.traveler as string,
          BigInt(params.amountStroops as string),
          BigInt(params.deadline as string),
        );
        break;
      }
      case "fund":
        tx = client.buildFund(sourcePubKey, BigInt(params.escrowId as string));
        break;
      case "confirm_delivery":
        tx = client.buildConfirmDelivery(sourcePubKey, BigInt(params.escrowId as string));
        break;
      case "release":
        tx = client.buildRelease(sourcePubKey, BigInt(params.escrowId as string));
        break;
      case "refund":
        tx = client.buildRefund(sourcePubKey, BigInt(params.escrowId as string));
        break;
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    const simulation = await client.simulate(tx) as unknown as Record<string, unknown>;

    if ((simulation as Record<string, unknown>).error) {
      return NextResponse.json({
        success: false,
        error: {
          type: "simulation",
          message: parseSimulationError(simulation as Record<string, unknown>),
          raw: simulation,
        },
      });
    }

    return NextResponse.json({
      success: true,
      xdr: tx.toXDR(),
      simulation,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        success: false,
        error: {
          type: detectErrorType(msg),
          message: msg,
        },
      },
      { status: 400 }
    );
  }
}

function parseSimulationError(sim: Record<string, unknown>): string {
  if (typeof sim.errorMessage === "string") return sim.errorMessage;

  const events = sim.events as unknown[] | undefined;
  if (events) {
    for (const ev of events) {
      const e = ev as Record<string, unknown>;
      const topics = e.topics as unknown[] | undefined;
      if (topics) {
        for (const t of topics) {
          if (typeof t === "string" && t.includes("Error")) {
            return `Contract error: ${t}`;
          }
        }
      }
      if (typeof e.data === "string" && e.data.length > 0) {
        return e.data;
      }
    }
  }

  const result = sim.result as Record<string, unknown> | undefined;
  if (result && typeof result.message === "string") return result.message;

  return "Simulation failed — check contract state and parameters";
}

function detectErrorType(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("auth") || lower.includes("signer") || lower.includes("signature")) return "auth";
  if (lower.includes("state") || lower.includes("must be in")) return "state";
  if (lower.includes("deadline") || lower.includes("not yet")) return "deadline";
  if (lower.includes("sequence") || lower.includes("bad_seq")) return "sequence";
  if (lower.includes("fund") || lower.includes("underfunded") || lower.includes("balance")) return "funds";
  if (lower.includes("not found") || lower.includes("missing")) return "not_found";
  if (lower.includes("validation") || lower.includes("invalid")) return "validation";
  return "unknown";
}
