import { NextRequest, NextResponse } from "next/server";
import { RpcProvider } from "starknet";
import { getPrivy } from "@/lib/privy";
import { getPrisma } from "@/lib/prisma";

function getRpcUrl(): string {
  const url =
    process.env.RPC_URL?.trim() || process.env.NEXT_PUBLIC_RPC_URL?.trim();
  if (!url) {
    throw new Error("Missing RPC_URL or NEXT_PUBLIC_RPC_URL");
  }
  return url;
}

async function isDeployedOnChain(address: string): Promise<boolean> {
  const provider = new RpcProvider({ nodeUrl: getRpcUrl() });
  try {
    const classHash = await provider.getClassHashAt(address);
    return !!classHash;
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
    if (msg.includes("contract not found") || msg.includes("contract_not_found")) {
      return false;
    }
    throw err;
  }
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

    const userId = verifiedClaims?.user_id as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const deployed = await isDeployedOnChain(wallet.address);

    if (deployed && !wallet.isDeployed) {
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { isDeployed: true },
      });
    }

    return NextResponse.json({ isDeployed: deployed });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}

