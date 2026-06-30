import { NextRequest, NextResponse } from "next/server";
import { buildPortfolioSnapshot } from "@/lib/portfolio";
import { getPrisma } from "@/lib/prisma";

export const revalidate = 60 * 2;

export async function GET(
  _request: NextRequest,
  { params }: { params: { address: string } },
) {
  try {
    const { address } = params;
    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 },
      );
    }

    const now = Date.now();
    const ttlMs = 1000 * 60 * 2; // 2 minutes
    const maxStaleMs = 1000 * 60 * 10; // 10 minutes (serve stale while refreshing)

    const prisma = await getPrisma();

    const cached = await (prisma as any).portfolioSnapshotCache.findUnique({
      where: { address: address.toLowerCase() },
    });

    if (cached?.snapshot && cached?.fetchedAt) {
      const fetchedAt = new Date(cached.fetchedAt).getTime();
      const ageMs = now - fetchedAt;

      if (ageMs <= ttlMs) {
        const resp = NextResponse.json({
          success: true,
          data: cached.snapshot,
        });
        resp.headers.set(
          "Cache-Control",
          `s-maxage=${revalidate}, stale-while-revalidate=60`,
        );
        resp.headers.set("X-Portfolio-Cache", "hit");
        return resp;
      }

      if (ageMs <= maxStaleMs) {
        (async () => {
          try {
            const fresh = await buildPortfolioSnapshot(address);
            await prisma.portfolioSnapshotCache.upsert({
              where: { address: address.toLowerCase() },
              create: {
                address: address.toLowerCase(),
                snapshot: fresh,
                blockNumber: (fresh as any)?.blockNumber ?? null,
                fetchedAt: new Date(),
              },
              update: {
                snapshot: fresh,
                blockNumber: (fresh as any)?.blockNumber ?? null,
                fetchedAt: new Date(),
              },
            });
          } catch (e) {
            console.error("Portfolio snapshot background refresh failed:", e);
          }
        })();

        const resp = NextResponse.json({
          success: true,
          data: cached.snapshot,
        });
        resp.headers.set(
          "Cache-Control",
          `s-maxage=${revalidate}, stale-while-revalidate=60`,
        );
        resp.headers.set("X-Portfolio-Cache", "stale");
        return resp;
      }
    }

    const data = await buildPortfolioSnapshot(address);
    await (prisma as any).portfolioSnapshotCache.upsert({
      where: { address: address.toLowerCase() },
      create: {
        address: address.toLowerCase(),
        snapshot: data,
        blockNumber: (data as any)?.blockNumber ?? null,
        fetchedAt: new Date(),
      },
      update: {
        snapshot: data,
        blockNumber: (data as any)?.blockNumber ?? null,
        fetchedAt: new Date(),
      },
    });

    const resp = NextResponse.json({ success: true, data });
    resp.headers.set(
      "Cache-Control",
      `s-maxage=${revalidate}, stale-while-revalidate=60`,
    );
    resp.headers.set("X-Portfolio-Cache", "miss");
    return resp;
  } catch (error) {
    console.error("Error building portfolio snapshot:", error);
    return NextResponse.json(
      {
        error: "Failed to build portfolio snapshot",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
