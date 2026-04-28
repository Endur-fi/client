import { NextResponse } from "next/server";

import { getPrisma } from "@/lib/prisma";
import { getPrivy } from "@/lib/privy";
import {
  GuardWallet,
  validatePaymasterRequest,
} from "@/lib/paymaster-guard";

export async function POST(request: Request) {
  try {
    const avnuApiKey = process.env.AVNU_API_KEY;
    if (!avnuApiKey) throw new Error("Missing AVNU_API_KEY");

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 },
      );
    }

    const userJwt = authHeader.replace("Bearer ", "");
    const privy = getPrivy();

    let verifiedClaims;
    try {
      verifiedClaims = await privy.utils().auth().verifyAccessToken(userJwt);
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired JWT token" },
        { status: 401 },
      );
    }

    const userId = verifiedClaims.user_id;

    const prisma = (await getPrisma()) as any;
    const wallet = await prisma.wallet.findUnique({
      where: { privyUserId: userId },
    });
    if (!wallet) {
      return NextResponse.json(
        { error: "No wallet on record for user" },
        { status: 403 },
      );
    }

    const body = await request.json();

    const guardWallet: GuardWallet = {
      address: wallet.address,
      publicKey: wallet.publicKey,
      isDeployed: Boolean(wallet.isDeployed),
    };

    const guard = validatePaymasterRequest(body, guardWallet);
    if (!guard.ok) {
      console.warn("[paymaster] rejected request", {
        userId,
        reason: guard.reason,
      });
      return NextResponse.json(
        { error: "Request not eligible for sponsorship" },
        { status: 400 },
      );
    }

    const response = await fetch("https://starknet.paymaster.avnu.fi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-paymaster-api-key": avnuApiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.ok && guard.kind === "deploy") {
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
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
