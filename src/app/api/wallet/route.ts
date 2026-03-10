import { NextRequest, NextResponse } from "next/server";
import { connectDB, WalletModel } from "@/lib/db";
import { getPrivy } from "@/lib/privy";

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

    await connectDB();
    const wallet = await WalletModel.findOne({ privyUserId: userId });

    if (!wallet) {
      return NextResponse.json({ wallet: null });
    }

    return NextResponse.json({
      wallet: {
        id: wallet.id,
        walletId: wallet.walletId,
        address: wallet.address,
        publicKey: wallet.publicKey,
        isDeployed: wallet.isDeployed,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
}
