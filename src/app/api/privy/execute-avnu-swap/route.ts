import { NextRequest, NextResponse } from "next/server";
import { getPrivyClient } from "@/lib/privy/privyClient";
import { buildAccount, getStarknetPublicKey } from "@/lib/privy/account";
import { executeSwap, type Quote } from "@avnu/avnu-sdk";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 },
      );
    }

    const userJwt = authHeader.substring(7);
    const privy = getPrivyClient();

    let verifiedClaims;
    try {
      verifiedClaims = await privy.utils().auth().verifyAuthToken(userJwt);
    } catch (error: any) {
      console.error("JWT verification failed:", error?.message || error);
      return NextResponse.json(
        { error: "Invalid or expired JWT token. Please refresh your session." },
        { status: 401 },
      );
    }

    const userId = verifiedClaims.user_id;

    if (!userId) {
      return NextResponse.json(
        { error: "Invalid token: missing user ID" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { walletId, quote } = body as { walletId?: string; quote?: Quote };

    if (!walletId) {
      return NextResponse.json(
        { error: "Missing walletId in request body" },
        { status: 400 },
      );
    }

    if (!quote) {
      return NextResponse.json(
        { error: "Missing quote in request body" },
        { status: 400 },
      );
    }

    const publicKey = await getStarknetPublicKey({ walletId });

    const { account, address } = await buildAccount({
      walletId,
      publicKey,
      userJwt,
      userId,
      origin: req.headers.get("origin") || undefined,
    });

    // Ensure the quote's takerAddress matches the actual account address
    const quoteTakerAddress = (quote as any).takerAddress;
    if (quoteTakerAddress && quoteTakerAddress.toLowerCase() !== address.toLowerCase()) {
      console.log(
        `[Avnu Swap] Updating quote takerAddress from ${quoteTakerAddress} to ${address}`,
      );
    }
    const updatedQuote = {
      ...quote,
      takerAddress: address,
    };

    let result: any;
    try {
      result = await executeSwap(account, updatedQuote);
    } catch (swapError: any) {
      // Provide better error message for insufficient balance
      if (
        swapError?.message?.includes("exceed balance") ||
        swapError?.baseError?.data?.includes("exceed balance") ||
        swapError?.baseError?.code === 55
      ) {
        // Extract balance from error message if available
        const balanceMatch = swapError?.baseError?.data?.match(/balance \(([^)]+)\)/);
        const balanceStr = balanceMatch
          ? `${(BigInt(balanceMatch[1]) / BigInt("1000000000000000000")).toString()} STRK`
          : "insufficient";
        
        throw new Error(
          `Insufficient balance to pay transaction fees. Your account has ${balanceStr} STRK, which is not enough to cover the transaction fees. Please ensure you have enough STRK tokens to cover the transaction fees.`,
        );
      }
      throw swapError;
    }

    // Avoid returning BigInt-heavy raw result to keep JSON serialization safe
    return NextResponse.json({
      transactionHash:
        result?.transaction_hash || result?.transactionHash || null,
      address,
    });
  } catch (error: any) {
    console.error("Error executing Avnu swap via Privy:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to execute Avnu swap" },
      { status: 500 },
    );
  }
}
