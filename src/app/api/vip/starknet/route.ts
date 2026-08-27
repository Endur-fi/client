import { NextResponse } from "next/server";

export const revalidate = 300; // 5 minutes

const STARKNET_VIP_API_URL = "https://api.vip.starknet.io/vip/v1/wallets";

interface StarknetVipCtaLink {
  label: string;
  url: string;
}

interface StarknetVipCta {
  body: string;
  links: StarknetVipCtaLink[];
}

interface StarknetVipApiResponse {
  version: number;
  updated_at: string;
  wallets: string[];
  cta: StarknetVipCta;
}

interface StarknetVipData {
  wallets: string[];
  cta: StarknetVipCta | null;
  updatedAt: string | null;
}

/**
 * Canonicalize a felt to "0x" + 64 lowercase hex chars, matching the format
 * documented for `wallets` in the Starknet VIP API so a simple `Set.has()`
 * on the client can compare against a normalized connected address.
 */
function normalizeAddress(value: string): string | null {
  try {
    const big = BigInt(value);
    return `0x${big.toString(16).padStart(64, "0").toLowerCase()}`;
  } catch {
    return null;
  }
}

// In-memory fallback so a transient upstream failure (429/503/network error)
// doesn't blank out the CTA for users while a fresh fetch is in flight.
let lastGoodData: StarknetVipData | null = null;

export async function GET(_req: Request) {
  const apiKey = process.env.STARKNET_VIP_API_KEY;

  if (!apiKey) {
    console.error("STARKNET_VIP_API_KEY is not configured");
    const res = NextResponse.json({
      success: true,
      data: lastGoodData ?? { wallets: [], cta: null, updatedAt: null },
    });
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  try {
    const upstream = await fetch(STARKNET_VIP_API_URL, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      next: { revalidate },
    });

    if (!upstream.ok) {
      throw new Error(
        `Starknet VIP API responded with status ${upstream.status}`,
      );
    }

    const body: StarknetVipApiResponse = await upstream.json();

    console.log("[api/vip/starknet] upstream response:", body);

    const wallets = (body.wallets || [])
      .map(normalizeAddress)
      .filter((w): w is string => w !== null);

    const data: StarknetVipData = {
      wallets,
      cta: body.cta ?? null,
      updatedAt: body.updated_at ?? null,
    };

    lastGoodData = data;

    const response = NextResponse.json({ success: true, data });
    response.headers.set(
      "Cache-Control",
      `s-maxage=${revalidate}, stale-while-revalidate=180`,
    );
    return response;
  } catch (error) {
    console.error("Error fetching Starknet VIP wallets:", error);

    const response = NextResponse.json({
      success: true,
      data: lastGoodData ?? { wallets: [], cta: null, updatedAt: null },
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}
