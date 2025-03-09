import { NextResponse } from "next/server";
export const revalidate = 24 * 60 * 60; // 24 hours

export async function GET(_req: Request) {
    const AVNU_TOKENS_API = 'https://starknet.api.avnu.fi/v1/starknet/tokens'
    const res = await fetch(AVNU_TOKENS_API);
    const data = await res.json();
    const resp = NextResponse.json(data);
    resp.headers.set(
        "Cache-Control",
        `s-maxage=${revalidate}, stale-while-revalidate=3600, stale-if-error=${revalidate * 2}`,
    );
    return resp;
}