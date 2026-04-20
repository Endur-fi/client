import { NextResponse } from "next/server";
import { getPrivy } from "@/lib/privy";

export async function POST(request: Request) {
  try {
    const avnuApiKey = process.env.AVNU_API_KEY;
    if (!avnuApiKey) throw new Error("Missing AVNU_API_KEY");

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 },
      );
    }

    const userJwt = authHeader.replace("Bearer ", "");
    const privy = getPrivy();
    try {
      await privy.utils().auth().verifyAccessToken(userJwt);
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired JWT token" },
        { status: 401 },
      );
    }

    const body = await request.json();

    const response = await fetch("https://starknet.paymaster.avnu.fi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-paymaster-api-key": avnuApiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
}
