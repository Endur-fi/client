import { NextRequest, NextResponse } from "next/server";
import { getPrivyClient } from "@/lib/privy/privyClient";
import { buildAccount, getStarknetPublicKey } from "@/lib/privy/account";
import { Call } from "starknet";

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

    // Parse request body
    const body = await req.json();
    const { walletId, calls } = body;

    if (!walletId) {
      return NextResponse.json(
        { error: "Missing walletId in request body" },
        { status: 400 },
      );
    }

    if (!calls || !Array.isArray(calls) || calls.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid calls in request body" },
        { status: 400 },
      );
    }

    // Get public key
    const publicKey = await getStarknetPublicKey({ walletId });

    // Build account
    const { account, address } = await buildAccount({
      walletId,
      publicKey,
      userJwt,
      userId,
      origin: req.headers.get("origin") || undefined,
    });

    // Normalize calls
    const normalizedCalls: Call[] = calls.map((call: any) => ({
      contractAddress: call.contractAddress || call.contract_address,
      entrypoint: call.entrypoint,
      calldata: call.calldata || [],
    }));

    // Execute transaction
    const result = await account.execute(normalizedCalls, {
      skipValidate: false,
    });

    return NextResponse.json({
      transactionHash: result.transaction_hash,
      address,
    });
  } catch (error: any) {
    console.error("Error executing transaction:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to execute transaction" },
      { status: 500 },
    );
  }
}
