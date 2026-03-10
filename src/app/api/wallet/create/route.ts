import { NextRequest, NextResponse } from "next/server";
import { connectDB, WalletModel } from "@/lib/db";
import { getPrivy } from "@/lib/privy";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.PRIVY_AUTH_ID) {
      return NextResponse.json(
        { message: "Auth key not provided" },
        { status: 400 },
      );
    }

    console.log({ privyAuthId: process.env.PRIVY_AUTH_ID });

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
    const existingWallet = await WalletModel.findOne({ privyUserId: userId });
    if (existingWallet) {
      return NextResponse.json({
        wallet: {
          id: existingWallet.id,
          walletId: existingWallet.walletId,
          address: existingWallet.address,
          publicKey: existingWallet.publicKey,
          isDeployed: existingWallet.isDeployed,
        },
      });
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

    const newWallet = await WalletModel.create({
      privyUserId: userId,
      walletId: wallet.id,
      address: wallet.address,
      publicKey: wallet.public_key,
      isDeployed: false,
    });

    return NextResponse.json({
      wallet: {
        id: newWallet.id,
        walletId: newWallet.walletId,
        address: newWallet.address,
        publicKey: newWallet.publicKey,
        isDeployed: newWallet.isDeployed,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
}
