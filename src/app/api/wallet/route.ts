import { NextRequest, NextResponse } from "next/server";
import { getPrivy } from "@/lib/privy";
import { getPrisma, PrismaClientType } from "@/lib/prisma";

export async function GET(request: NextRequest) {
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

    try {
      const prisma: PrismaClientType = await getPrisma();
      const wallet = await prisma.wallet.findUnique({
        where: { privyUserId: userId },
      });
      if (!wallet) {
        return NextResponse.json({ wallet: null });
      }

      return NextResponse.json({
        wallet: {
          id: wallet.id,
          walletId: wallet.walletId,
          address: wallet.address,
          publicKey: wallet.publicKey,
        },
      });
    } catch (err) {
      // If the DB is down / prisma fails, returning a raw 500 here can put
      // the upstream client SDK into a sticky error state until refresh.
      // Degrade gracefully: respond 200 with wallet:null so the client can
      // retry connection flows without a full reload.
      return NextResponse.json({ wallet: null });
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
