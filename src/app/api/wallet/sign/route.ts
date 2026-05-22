import { NextResponse } from "next/server";
import { getPrivy } from "@/lib/privy";
import { getPrisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const authPrivateKey = process.env.PRIVY_AUTH_PRIVATE_KEY;
    if (!authPrivateKey) throw new Error("Missing PRIVY_AUTH_PRIVATE_KEY");

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 },
      );
    }

    const userJwt = authHeader.replace("Bearer ", "");

    const body: { walletId: string; hash: string } = await request.json();

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

    const userId = (verifiedClaims as any)?.user_id as string | undefined;
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

    if (wallet.walletId !== body.walletId) {
      return NextResponse.json({ error: "Wallet mismatch" }, { status: 403 });
    }

    const result = await privy.wallets().rawSign(body.walletId, {
      params: { hash: body.hash },
      authorization_context: {
        authorization_private_keys: [authPrivateKey],
      },
    });

    return NextResponse.json({ signature: result.signature });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
}
