import { NextRequest, NextResponse } from "next/server";
import { getPrivyClient } from "@/lib/privy/privyClient";
import { deployPrivyAccount, getStarknetPublicKey } from "@/lib/privy/account";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  let wallet: any = null; // Store wallet at higher scope for error handling
  
  try {
    console.log("PRIVY: Starting wallet deployment request");

    // Get JWT from Authorization header
    const authHeader = req.headers.get("authorization");
    console.log("PRIVY: Checking authorization header");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("PRIVY: Missing or invalid authorization header");
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 },
      );
    }

    const userJwt = authHeader.substring(7);
    console.log("PRIVY: JWT token extracted, initializing Privy client");
    const privy = getPrivyClient();

    // Verify the JWT token
    let verifiedClaims;
    try {
      console.log("PRIVY: Verifying JWT token");
      verifiedClaims = await privy.verifyAuthToken(userJwt);
      console.log("PRIVY: JWT verified successfully, userId:", verifiedClaims.userId);
    } catch (error: any) {
      console.log("PRIVY: JWT verification failed:", error.message);
      return NextResponse.json(
        { error: "Invalid or expired JWT token" },
        { status: 401 },
      );
    }

    const userId = verifiedClaims.userId;

    // Parse request body
    const body = await req.json();
    const { walletId } = body;
    console.log("PRIVY: Request body parsed, walletId:", walletId || "not provided");

    // Find wallet in database
    console.log("PRIVY: Searching for wallet in database");
    wallet = walletId
      ? await prisma.privyWallet.findUnique({
          where: { walletId },
        })
      : await prisma.privyWallet.findUnique({
          where: { privyUserId: userId },
        });

    if (!wallet) {
      console.log("PRIVY: Wallet not found in database");
      return NextResponse.json(
        { error: "Wallet not found. Please create wallet first." },
        { status: 404 },
      );
    }

    console.log("PRIVY: Wallet found - ID:", wallet.walletId, "Address:", wallet.address, "Deployed:", wallet.isDeployed);

    // Check if already deployed
    // NOTE: Race conditions can still occur here if multiple requests are sent simultaneously.
    // The "Tx already sent" error is caught in the error handler below.
    if (wallet.isDeployed) {
      console.log("PRIVY: Wallet already deployed, returning existing deployment info");
      return NextResponse.json({
        transactionHash: wallet.deploymentTxHash,
        address: wallet.address,
        isDeployed: true,
      });
    }

    // Get public key
    console.log("PRIVY: Fetching public key from Privy API");
    const publicKey = await getStarknetPublicKey({ walletId: wallet.walletId });
    console.log("PRIVY: Public key retrieved:", publicKey);

    // Deploy account
    console.log("PRIVY: Starting account deployment with paymaster");
    const { transactionHash, address } = await deployPrivyAccount({
      walletId: wallet.walletId,
      publicKey,
      userJwt,
      userId,
      origin: req.headers.get("origin") || undefined,
    });
    console.log("PRIVY: Account deployed successfully, txHash:", transactionHash, "address:", address);

    // Update database with the CORRECT computed address from deployment
    console.log("PRIVY: Updating wallet deployment status in database");
    await prisma.privyWallet.update({
      where: { id: wallet.id },
      data: {
        address, // Update with the correct computed address
        isDeployed: true,
        deploymentTxHash: transactionHash,
        updatedAt: new Date(),
      },
    });
    console.log("PRIVY: Database updated successfully with address:", address);

    console.log("PRIVY: Deployment completed successfully - Address:", address, "TxHash:", transactionHash);
    return NextResponse.json({
      transactionHash,
      address, // Return the correct address
      isDeployed: true,
    });
  } catch (error: any) {
    console.error("PRIVY: ERROR - Deployment failed:", error.message);
    console.error("PRIVY: ERROR - Stack trace:", error.stack);
    
    // Handle "Tx already sent" error - this means deployment is already in progress
    if (wallet && error.message && error.message.includes("Tx already sent")) {
      console.log("PRIVY: Transaction already sent - checking if deployment succeeded");
      
      // Wait a moment and re-check the wallet status
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedWallet = await prisma.privyWallet.findUnique({
        where: { id: wallet.id },
      });
      
      if (updatedWallet?.isDeployed) {
        console.log("PRIVY: Deployment succeeded in parallel request");
        return NextResponse.json({
          transactionHash: updatedWallet.deploymentTxHash,
          address: updatedWallet.address,
          isDeployed: true,
        });
      }
      
      return NextResponse.json(
        { error: "Deployment already in progress. Please retry in a few seconds." },
        { status: 409 }, // Conflict
      );
    }
    
    return NextResponse.json(
      { error: error?.message || "Failed to deploy wallet" },
      { status: 500 },
    );
  }
}
