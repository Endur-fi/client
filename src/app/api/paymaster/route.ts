import { NextResponse } from "next/server";

import {
  GuardWallet,
  validatePaymasterRequest,
} from "@/lib/paymaster-guard";
import {
  checkRateLimit,
  recordPaymasterUsage,
} from "@/lib/paymaster-rate-limit";
import { getPrisma } from "@/lib/prisma";
import { getPrivy } from "@/lib/privy";

/**
 * Build a JSON-RPC 2.0 error envelope tagged with our source so the client
 * can distinguish "rejected by Endur's paymaster gateway" from upstream AVNU
 * errors and surface a useful message to the user.
 *
 * Sent over HTTP 200 by JSON-RPC convention; starknet.js's PaymasterRpc
 * parses the body and throws an RpcError carrying { code, message, data }.
 *
 * Codes follow JSON-RPC server-error range (-32000..-32099) for our own
 * categories. We don't use HTTP semantics because starknet.js doesn't read
 * the status code.
 */
function endurRpcError(
  id: number | string | null,
  code: number,
  message: string,
) {
  return NextResponse.json(
    {
      jsonrpc: "2.0",
      id,
      error: {
        code,
        message,
        data: { source: "endur" },
      },
    },
    { status: 200 },
  );
}

/**
 * Try to read the JSON-RPC `id` from the raw body without re-throwing on
 * malformed input. Used so error responses can echo back the same id per spec.
 */
function tryReadId(body: unknown): number | string | null {
  if (body && typeof body === "object" && "id" in body) {
    const raw = (body as { id: unknown }).id;
    if (typeof raw === "number" || typeof raw === "string") return raw;
  }
  return null;
}

export async function POST(request: Request) {
  let parsedBody: unknown = null;

  try {
    const avnuApiKey = process.env.AVNU_API_KEY;
    if (!avnuApiKey) throw new Error("Missing AVNU_API_KEY");

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return endurRpcError(
        null,
        -32600,
        "Missing or invalid authorization header",
      );
    }

    const userJwt = authHeader.replace("Bearer ", "");
    const privy = getPrivy();

    let verifiedClaims;
    try {
      verifiedClaims = await privy.utils().auth().verifyAccessToken(userJwt);
    } catch {
      return endurRpcError(null, -32600, "Invalid or expired session");
    }

    const userId = verifiedClaims.user_id;

    const prisma = (await getPrisma()) as any;
    const wallet = await prisma.wallet.findUnique({
      where: { privyUserId: userId },
    });
    if (!wallet) {
      return endurRpcError(null, -32001, "No wallet on record for user");
    }

    parsedBody = await request.json();
    const id = tryReadId(parsedBody);

    const guardWallet: GuardWallet = {
      address: wallet.address,
      publicKey: wallet.publicKey,
      isDeployed: Boolean(wallet.isDeployed),
    };

    const guard = validatePaymasterRequest(parsedBody, guardWallet);
    if (!guard.ok) {
      console.warn("[paymaster] rejected request", {
        userId,
        reason: guard.reason,
      });
      return endurRpcError(
        id,
        -32602,
        "Request not eligible for sponsorship",
      );
    }

    // Rate-limit stake/unstake (deploy is a one-shot gated by isDeployed and
    // is not subject to the per-hour quota).
    if (guard.kind !== "deploy") {
      const rate = await checkRateLimit(
        prisma,
        userId,
        guard.kind,
        guard.assetSymbol,
        guard.amountWei,
      );
      if (!rate.ok) {
        // Use distinct codes for "below min" (-32602, validation) vs.
        // "rate exceeded" (-32029, rate-limit-ish). Both are surfaced to the
        // client with our `source: "endur"` discriminator.
        const code = rate.status === 429 ? -32029 : -32602;
        return endurRpcError(id, code, rate.message);
      }
    }

    const response = await fetch("https://starknet.paymaster.avnu.fi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-paymaster-api-key": avnuApiKey,
      },
      body: JSON.stringify(parsedBody),
    });

    const data = await response.json();

    if (response.ok) {
      if (guard.kind === "deploy") {
        try {
          await prisma.wallet.update({
            where: { privyUserId: userId },
            data: { isDeployed: true },
          });
        } catch (err) {
          console.error("[paymaster] failed to mark wallet deployed", {
            userId,
            err,
          });
        }
      } else if (
        parsedBody &&
        typeof parsedBody === "object" &&
        (parsedBody as { method?: unknown }).method ===
          "paymaster_executeTransaction"
      ) {
        // Only successful executes consume gas, so only they count toward
        // the rate-limit window. Build-only quotes (and failed executes)
        // are free for the user.
        await recordPaymasterUsage(
          prisma,
          userId,
          guard.kind,
          guard.assetSymbol,
          guard.amountWei,
        );
      }
    }

    // Forward AVNU's response verbatim. AVNU returns valid JSON-RPC, so
    // success bodies pass through untouched and AVNU's own error envelopes
    // (without our `source: "endur"` tag) reach the client unchanged — the
    // client treats those as generic "something went wrong".
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    const id = tryReadId(parsedBody);
    // Never leak raw Prisma/RPC error messages to the client.
    // Keep the response generic; log the details server-side instead.
    console.error("[paymaster] unhandled error", error);
    return endurRpcError(id, -32603, "Internal server error");
  }
}
