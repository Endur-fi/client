import { NextRequest, NextResponse } from "next/server";
import { getRpcProvider } from "@/lib/privy/provider";
import { Contract } from "starknet";
import erc4626Abi from "@/abi/erc4626.abi.json";

// Cache for token decimals (tokenAddress -> decimals)
const decimalsCache = new Map<string, number>();

async function getTokenDecimals(
  tokenAddress: string,
  provider: any,
): Promise<number> {
  // Check cache first
  if (decimalsCache.has(tokenAddress)) {
    return decimalsCache.get(tokenAddress)!;
  }

  // Fetch decimals from contract
  const tokenContract = new Contract({
    abi: erc4626Abi,
    address: tokenAddress,
    providerOrAccount: provider,
  });

  try {
    const decimalsResult = await tokenContract.call("decimals", []);
    const decimals = Number(decimalsResult);
    // Cache the result
    decimalsCache.set(tokenAddress, decimals);
    return decimals;
  } catch {
    // If decimals call fails, use default and cache it
    const defaultDecimals = 18;
    decimalsCache.set(tokenAddress, defaultDecimals);
    console.warn(
      `Could not fetch decimals for ${tokenAddress}, using default 18`,
    );
    return defaultDecimals;
  }
}

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

    const body = await req.json();
    const { address, tokenAddress } = body;

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 },
      );
    }

    if (!tokenAddress) {
      return NextResponse.json(
        { error: "Token address is required" },
        { status: 400 },
      );
    }

    // Get RPC provider
    const provider = getRpcProvider();

    // Create contract instance (ERC4626 ABI includes balanceOf and balance_of)
    const tokenContract = new Contract({
      abi: erc4626Abi,
      address: tokenAddress,
      providerOrAccount: provider,
    });

    // Query balance using balance_of
    const balanceResult = await tokenContract.call("balance_of", [address]);

    // Get decimals (cached)
    const decimals = await getTokenDecimals(tokenAddress, provider);

    // Format balance
    const balance = balanceResult.toString();
    const formattedBalance = (Number(balance) / 10 ** decimals).toString();

    return NextResponse.json({
      value: balance,
      decimals,
      formatted: formattedBalance,
    });
  } catch (error: any) {
    console.error("Error fetching balance:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch balance" },
      { status: 500 },
    );
  }
}
