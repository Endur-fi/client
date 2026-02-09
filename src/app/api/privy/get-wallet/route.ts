import { NextRequest, NextResponse } from "next/server";
import { getPrivyClient } from "@/lib/privy/privyClient";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Get JWT from Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 },
      );
    }

    const userJwt = authHeader.substring(7);
    const privy = getPrivyClient();

    // Verify the JWT token
    let verifiedClaims;
    try {
      verifiedClaims = await privy.utils().auth().verifyAuthToken(userJwt);
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired JWT token" },
        { status: 401 },
      );
    }

    const userId = verifiedClaims.user_id;

    // Check database for existing wallet
    const wallet = await prisma.privyWallet.findUnique({
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
        isDeployed: wallet.isDeployed,
        deploymentTxHash: wallet.deploymentTxHash,
      },
    });
  } catch (error: any) {
    console.error("Error fetching wallet:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch wallet" },
      { status: 500 },
    );
  }
}
