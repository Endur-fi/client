import { NextResponse } from "next/server";
import { getPrivy } from "@/lib/privy";

export async function POST(request: Request) {
  try {
    const authPrivateKey = process.env.PRIVY_AUTH_PRIVATE_KEY;
    if (!authPrivateKey) throw new Error("Missing PRIVY_AUTH_PRIVATE_KEY");
    console.log({ authPrivateKey });

    const body: { walletId: string; hash: string } = await request.json();
    console.log({ body });

    const privy = getPrivy();
    const result = await privy.wallets().rawSign(body.walletId, {
      params: { hash: body.hash },
      authorization_context: {
        authorization_private_keys: [authPrivateKey],
      },
    });

    return NextResponse.json({ signature: result.signature });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
}
