import { NextRequest, NextResponse } from "next/server";
import { getPrivyClient } from "@/lib/privy/privyClient";
import { prisma } from "@/lib/prisma";
import { computeReadyAddress } from "@/lib/privy/account";

export async function POST(req: NextRequest) {
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

    // Check database for existing wallet first
    const existingWallet = await prisma.privyWallet.findUnique({
      where: { privyUserId: userId },
    });

    if (existingWallet) {
      // Return existing wallet
      return NextResponse.json({
        walletId: existingWallet.walletId,
        address: existingWallet.address,
        publicKey: existingWallet.publicKey,
        isDeployed: existingWallet.isDeployed,
      });
    }

    if (!process.env.PRIVY_WALLET_AUTH_ID!) {
      console.error(
        "Server Error creating wallet, Missing PRIVY_WALLET_AUTH_ID env",
      );
      return NextResponse.json(
        { error: "Failed to create wallet, Missing PRIVY_WALLET_AUTH_ID env" },
        { status: 500 },
      );
    }

    // Create wallet using Privy Wallet API
    const wallet = await privy.wallets().create({
      chain_type: "starknet",
      owner: { user_id: userId },
      additional_signers: [
        {
          signer_id: process.env.PRIVY_WALLET_AUTH_ID,
        },
      ],
    });

    const walletData = wallet as any;

    const publicKey = walletData.public_key || walletData.publicKey || "";
    if (!publicKey) {
      throw new Error("Failed to get public key from Privy wallet");
    }

    // Calculate address deterministically from public key (same calculation used in deployment)
    const address = computeReadyAddress(publicKey);

    // Save to database - use upsert to handle race conditions
    // If another request created the wallet between our check and this create, upsert will handle it
    try {
      const savedWallet = await prisma.privyWallet.create({
        data: {
          privyUserId: userId,
          walletId: walletData.id,
          address, // Use calculated address, not Privy's address
          publicKey,
          isDeployed: false,
        },
      });

      return NextResponse.json({
        walletId: savedWallet.walletId,
        address: savedWallet.address,
        publicKey: savedWallet.publicKey,
        isDeployed: savedWallet.isDeployed,
      });
    } catch (createError: any) {
      // Handle race condition: if wallet was created by another request between check and create
      if (
        createError.code === "P2002" &&
        createError.meta?.target?.includes("privyUserId")
      ) {
        // Fetch the wallet that was just created by the other request
        const wallet = await prisma.privyWallet.findUnique({
          where: { privyUserId: userId },
        });

        if (wallet) {
          // Return the existing wallet
          return NextResponse.json({
            walletId: wallet.walletId,
            address: wallet.address,
            publicKey: wallet.publicKey,
            isDeployed: wallet.isDeployed,
          });
        }
      }
      // Re-throw if it's not a unique constraint error or wallet not found
      throw createError;
    }
  } catch (error: any) {
    console.error("Error creating wallet:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create wallet" },
      { status: 500 },
    );
  }
}
