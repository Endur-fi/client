import { PrivyClient } from "@privy-io/node";

let privy: PrivyClient | null = null;

export function getPrivy() {
  if (privy) {
    return privy;
  }

  const appId = process.env.PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("Missing PRIVY_APP_ID or PRIVY_APP_SECRET");
  }

  privy = new PrivyClient({
    appId,
    appSecret,
  });
  return privy;
}
