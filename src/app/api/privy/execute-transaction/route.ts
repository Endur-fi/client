import { NextRequest, NextResponse } from "next/server";
import { getPrivy } from "@/lib/privy";
import { getPrisma } from "@/lib/prisma";
import { StarkZap, OnboardStrategy, accountPresets } from "starkzap";
import type { Call } from "starknet";

type Body = {
  walletId?: string;
  calls: Call[];
};

function normalizeCalls(input: any): Call[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((c: any) => {
      const contractAddress = c?.contractAddress ?? c?.to;
      const entrypoint = c?.entrypoint ?? c?.selector;
      const calldata = c?.calldata ?? [];
      if (
        typeof contractAddress !== "string" ||
        typeof entrypoint !== "string" ||
        !Array.isArray(calldata)
      ) {
        return null;
      }
      return { contractAddress, entrypoint, calldata } as Call;
    })
    .filter(Boolean) as Call[];
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 },
      );
    }

    const userJwt = authHeader.replace("Bearer ", "");
    const privy = getPrivy();

    let verifiedClaims: any;
    try {
      verifiedClaims = await privy.utils().auth().verifyAccessToken(userJwt);
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired JWT token" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as Body;
    const calls = normalizeCalls((body as any)?.calls);
    const callsLen = calls.length;

    if (calls.length === 0) {
      return NextResponse.json(
        { error: "non-empty calls are required" },
        { status: 400 },
      );
    }

    const userId = verifiedClaims.user_id as string;
    const prisma = (await getPrisma()) as any;
    const wallet = await prisma.wallet.findUnique({
      where: { privyUserId: userId },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet not found for user" },
        { status: 404 },
      );
    }

    if (body.walletId && wallet.walletId !== body.walletId) {
      return NextResponse.json(
        { error: "Wallet mismatch" },
        { status: 403 },
      );
    }

    const origin = new URL(request.url).origin;
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL ?? "";
    const chainId = process.env.NEXT_PUBLIC_CHAIN_ID ?? "";
    const network = chainId === "SN_MAIN" ? "mainnet" : "sepolia";

    if (!rpcUrl) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_RPC_URL" },
        { status: 500 },
      );
    }

    const sdk = new StarkZap({
      network,
      rpcUrl,
      paymaster: {
        nodeUrl: `${origin}/api/paymaster`,
      },
    });

    const onboard = await sdk.onboard({
      strategy: OnboardStrategy.Privy,
      accountPreset: accountPresets.argentXV050,
      privy: {
        resolve: async () => ({
          walletId: wallet.walletId,
          publicKey: wallet.publicKey,
          serverUrl: `${origin}/api/wallet/sign`,
        }),
      },
      deploy: "if_needed",
    });

    const tx = await onboard.wallet.execute(calls, { feeMode: "sponsored" });

    return NextResponse.json({ transactionHash: (tx as any)?.hash });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}

