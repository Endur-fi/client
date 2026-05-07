import { NextRequest, NextResponse } from "next/server";
import { getPrivy } from "@/lib/privy";
import { getPrisma, PrismaClientType } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.PRIVY_AUTH_ID) {
      return NextResponse.json(
        { message: "Auth key not provided" },
        { status: 400 },
      );
    }

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

    let prisma: PrismaClientType;
    try {
      prisma = await getPrisma();
    } catch (err) {
      // If the DB is down / prisma fails, returning a raw 500 here can put
      // the upstream client SDK into a sticky error state until refresh.
      // Degrade gracefully: respond 200 with wallet:null so the client can
      // retry connection flows without a full reload.
      return NextResponse.json({ wallet: null });
    }

    try {
      const existingWallet = await prisma.wallet.findUnique({
        where: { privyUserId: userId },
      });
      if (existingWallet) {
        return NextResponse.json({
          wallet: {
            id: existingWallet.id,
            walletId: existingWallet.walletId,
            address: existingWallet.address,
            publicKey: existingWallet.publicKey,
          },
        });
      }
    } catch (err) {
      // See above: if Prisma fails, degrade gracefully so the client can
      // re-run its auth/connect flow.
      return NextResponse.json({ wallet: null });
    }

    const wallet = await privy.wallets().create({
      chain_type: "starknet",
      owner: { user_id: userId },
      additional_signers: [
        {
          signer_id: process.env.PRIVY_AUTH_ID,
        },
      ],
    });

    if (!wallet.public_key) {
      return NextResponse.json({ wallet: null });
    }

    try {
      const newWallet = await prisma.wallet.create({
        data: {
          privyUserId: userId,
          walletId: wallet.id,
          address: wallet.address,
          publicKey: wallet.public_key,
          isDeployed: false,
        },
      });

      return NextResponse.json({
        wallet: {
          id: newWallet.id,
          walletId: newWallet.walletId,
          address: newWallet.address,
          publicKey: newWallet.publicKey,
        },
      });
    } catch (err) {
      // DB failed while persisting the wallet. Do not return a wallet object.
      // Let the client reset and retry once DB is healthy.
      return NextResponse.json({ wallet: null });
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
