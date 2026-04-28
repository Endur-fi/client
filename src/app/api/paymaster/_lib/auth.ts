import { NextResponse } from "next/server";
import { getPrivy } from "@/lib/privy";
import { getPrisma } from "@/lib/prisma";

export function readBearerTokenOrNull(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  return token.length ? token : null;
}

export async function verifyPrivyJwtOrNull(
  userJwt: string,
): Promise<{ userId: string } | null> {
  const privy = getPrivy();
  let verifiedClaims: unknown;
  try {
    verifiedClaims = await privy.utils().auth().verifyAccessToken(userJwt);
  } catch {
    return null;
  }
  if (!verifiedClaims || typeof verifiedClaims !== "object") return null;
  const rec = verifiedClaims as Record<string, unknown>;
  if (typeof rec.user_id !== "string") return null;
  return { userId: rec.user_id };
  return null;
}

export async function getUserWalletOrNull(userId: string) {
  const prisma = await getPrisma();
  return prisma.wallet.findUnique({ where: { privyUserId: userId } });
}

export function jsonUnauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

