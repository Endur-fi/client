import { NextResponse } from "next/server";
import { getPrivy } from "@/lib/privy";
import { getPrisma } from "@/lib/prisma";
import {
  addAddressPadding,
  hash,
  validateAndParseAddress,
  type BigNumberish,
} from "starknet";

type Hex = `0x${string}`;

type JsonRpcRequest = {
  id?: unknown;
  jsonrpc?: unknown;
  method?: unknown;
  params?: {
    transaction?: unknown;
    parameters?: unknown;
  };
};

type PaymasterBuildTransactionParams = {
  transaction:
    | {
        type: "deploy";
        deployment?: {
          address?: unknown;
          class_hash?: unknown;
          salt?: unknown;
          calldata?: unknown;
          version?: unknown;
        };
      }
    | {
        type: "invoke";
        invoke?: {
          user_address?: unknown;
          calls?: unknown;
        };
      };
  parameters?: unknown;
};

type AllowedEndurPair = {
  assetAddress: Hex;
  lstAddress: Hex;
};

/**
 * Avnu DEX "exchange" router (multi_route_swap) — from avnu-contracts-v2 README.
 * Used for DEX instant unstake: LST.approve(router) + multi_route_swap.
 */
const AVNU_EXCHANGE_MAINNET: Hex =
  "0x04270219d365d6b017231b52e92b3fb5d7c8378b05e9abc97724537a80e93b0f";
const AVNU_EXCHANGE_SEPOLIA: Hex =
  "0x02c56e8b00dbe2a71e57472685378fc8988bba947e9a99b26a00fade2b4fe7c2";

const ENDUR_LST_PAIRS: AllowedEndurPair[] = [
  // Mainnet presets (from starkzap/src/staking/lst/presets.ts)
  {
    assetAddress:
      "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
    lstAddress: "0x028d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a",
  },
  {
    assetAddress:
      "0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac",
    lstAddress: "0x006a567e68c805323525fe1649adb80b03cddf92c23d2629a6779f54192dffc13",
  },
  {
    assetAddress:
      "0x04daa17763b286d1e59b97c283c0b8c949994c361e426a28f743c67bdfe9a32f",
    lstAddress: "0x043a35c1425a0125ef8c171f1a75c6f31ef8648edcc8324b55ce1917db3f9b91",
  },
  {
    assetAddress:
      "0x036834a40984312f7f7de8d31e3f6305b325389eaeea5b1c0664b2fb936461a4",
    lstAddress: "0x07dd3c80de9fcc5545f0cb83678826819c79619ed7992cc06ff81fc67cd2efe0",
  },
  {
    assetAddress:
      "0x0593e034dda23eea82d2ba9a30960ed42cf4a01502cc2351dc9b9881f9931a68",
    lstAddress: "0x0580f3dc564a7b82f21d40d404b3842d490ae7205e6ac07b1b7af2b4a5183dc9",
  },

  // Sepolia presets (from starkzap/src/staking/lst/presets.ts)
  {
    assetAddress:
      "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
    lstAddress: "0x042de5b868da876768213c48019b8d46cd484e66013ae3275f8a4b97b31fc7eb",
  },
  {
    assetAddress:
      "0x044ad07751ad782288413c7db42c48e1c4f6195876bca3b6caef449bb4fb8d36",
    lstAddress: "0x036a2c3c56ae806b12a84bb253cbc1a009e3da5469e6a736c483303b864c8e2b",
  },
  {
    assetAddress:
      "0x07e97477601e5606359303cf50c050fd3ba94f66bd041f4ed504673ba2b81696",
    lstAddress: "0x0226324f63d994834e4729dd1bab443fe50af8e97c608b812ee1f950ceae68c7",
  },
];

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object";
}

/**
 * Canonical 0x felts (selectors, calldata limbs) for comparisons.
 * Not every felt is a valid address — use `validateAndParseAddress` for contract addresses.
 */
function normalizeFeltHex(addr: unknown): Hex | null {
  if (typeof addr !== "string") return null;
  const trimmed = addr.trim();
  if (!trimmed.toLowerCase().startsWith("0x")) return null;
  const hex = trimmed.slice(2);
  if (hex.length === 0) return null;
  if (!new RegExp("^[0-9a-fA-F]+$").test(hex)) return null;
  try {
    return addAddressPadding(trimmed).toLowerCase() as Hex;
  } catch {
    return null;
  }
}

const AVNU_EXCHANGE_ROUTERS: ReadonlySet<Hex> = new Set(
  [AVNU_EXCHANGE_MAINNET, AVNU_EXCHANGE_SEPOLIA].map(
    (a) => validateAndParseAddress(a).toLowerCase() as Hex,
  ),
);

function selector(name: string): Hex {
  return normalizeFeltHex(hash.getSelectorFromName(name)) as Hex;
}

type AvnuCall = { to: Hex; selector: Hex; calldata: string[] };
function normalizeAvnuCall(raw: unknown): AvnuCall | null {
  if (!isRecord(raw)) return null;
  let to: Hex;
  try {
    to = validateAndParseAddress(raw.to as BigNumberish).toLowerCase() as Hex;
  } catch {
    return null;
  }
  const sel = normalizeFeltHex(raw.selector);
  const calldataRaw = raw.calldata;
  if (!sel || !Array.isArray(calldataRaw)) return null;
  const calldata: string[] = [];
  for (const x of calldataRaw) {
    if (typeof x !== "string") return null;
    const v = normalizeFeltHex(x);
    if (!v) return null;
    calldata.push(v);
  }
  return { to, selector: sel, calldata };
}

function calldataMentionsUser(user: Hex, calldata: string[]): boolean {
  for (const f of calldata) {
    try {
      if (
        validateAndParseAddress(f as BigNumberish).toLowerCase() === user
      ) {
        return true;
      }
    } catch {
      // not an address felt
    }
  }
  return false;
}

function assertAvnuDexUnstakeOrThrow(
  userAddress: Hex,
  approve: AvnuCall,
  swap: AvnuCall,
): void {
  if (approve.selector !== selector("approve")) {
    throw new Error("DEX unstake: first call must be approve");
  }
  if (approve.calldata.length !== 3) {
    throw new Error("Invalid approve calldata for DEX unstake");
  }
  let router: Hex;
  try {
    router = validateAndParseAddress(
      approve.calldata[0] as BigNumberish,
    ).toLowerCase() as Hex;
  } catch {
    throw new Error("DEX unstake: invalid router in approve");
  }
  if (!AVNU_EXCHANGE_ROUTERS.has(router)) {
    throw new Error("DEX unstake: approve must target a known Avnu exchange");
  }
  const lstIsKnown = ENDUR_LST_PAIRS.some(
    (p) =>
      validateAndParseAddress(p.lstAddress).toLowerCase() as Hex === approve.to,
  );
  if (!lstIsKnown) {
    throw new Error("DEX unstake: approve must be on a known Endur LST");
  }
  if (swap.selector !== selector("multi_route_swap")) {
    throw new Error("DEX unstake: second call must be multi_route_swap");
  }
  if (swap.to !== router) {
    throw new Error("DEX unstake: swap must invoke the same Avnu router as approve");
  }
  if (!calldataMentionsUser(userAddress, swap.calldata)) {
    throw new Error("DEX unstake: user address must appear in multi_route_swap calldata");
  }
}

function assertAllowedEndurInvokeOrThrow(
  userAddress: Hex,
  callsRaw: unknown,
): void {
  if (!Array.isArray(callsRaw)) {
    throw new Error("Invalid invoke.calls");
  }

  const calls = callsRaw.map(normalizeAvnuCall);
  if (calls.some((c) => c === null)) {
    throw new Error("Invalid calls format");
  }
  const normalized = calls as AvnuCall[];

  // Unstake (redeem): exactly one call.
  if (normalized.length === 1) {
    const c = normalized[0]!;
    if (c.selector !== selector("redeem")) {
      throw new Error("Forbidden call selector");
    }
    // redeem(uint256 shares, address receiver, address owner)
    if (c.calldata.length !== 4) {
      throw new Error("Invalid redeem calldata");
    }
    let receiver: Hex;
    let owner: Hex;
    try {
      receiver = validateAndParseAddress(
        c.calldata[2] as BigNumberish,
      ).toLowerCase() as Hex;
      owner = validateAndParseAddress(
        c.calldata[3] as BigNumberish,
      ).toLowerCase() as Hex;
    } catch {
      throw new Error("Invalid redeem calldata");
    }
    if (receiver !== userAddress || owner !== userAddress) {
      throw new Error("User address mismatch in redeem");
    }
    const isKnownLst = ENDUR_LST_PAIRS.some(
      (p) =>
        validateAndParseAddress(p.lstAddress).toLowerCase() as Hex === c.to,
    );
    if (!isKnownLst) throw new Error("Unknown Endur LST contract");
    return;
  }

  // Stake/deposit: approve + deposit-like call.
  if (normalized.length !== 2) {
    throw new Error("Forbidden calls length");
  }

  const [approve, action] = normalized;

  if (approve.selector !== selector("approve")) {
    throw new Error("First call must be approve");
  }
  if (approve.calldata.length !== 3) {
    throw new Error("Invalid approve calldata");
  }

  // DEX instant unstake: LST.approve(Avnu exchange) + multi_route_swap (not deposit).
  if (action.selector === selector("multi_route_swap")) {
    assertAvnuDexUnstakeOrThrow(userAddress, approve, action);
    return;
  }

  let spender: Hex;
  try {
    spender = validateAndParseAddress(
      approve.calldata[0] as BigNumberish,
    ).toLowerCase() as Hex;
  } catch {
    throw new Error("Invalid approve spender");
  }

  const pair = ENDUR_LST_PAIRS.find(
    (p) =>
      validateAndParseAddress(p.assetAddress).toLowerCase() as Hex ===
        approve.to &&
      validateAndParseAddress(p.lstAddress).toLowerCase() as Hex === spender,
  );
  if (!pair) throw new Error("Approve must target an Endur LST spender");

  const allowedDepositSelectors = new Set<Hex>([
    selector("deposit"),
    selector("deposit_with_referral"),
    selector("deposit_to_validator"),
  ]);
  if (!allowedDepositSelectors.has(action.selector)) {
    throw new Error("Forbidden deposit selector");
  }
  if (
    action.to !==
    (validateAndParseAddress(pair.lstAddress).toLowerCase() as Hex)
  ) {
    throw new Error("Deposit must target Endur LST contract");
  }

  // All deposit variants begin with uint256 amount (2 felts).
  if (action.calldata.length < 3) {
    throw new Error("Invalid deposit calldata");
  }
  const receiver = validateAndParseAddress(
    action.calldata[2] as BigNumberish,
  ).toLowerCase() as Hex;
  if (receiver !== userAddress) {
    throw new Error("User address mismatch in deposit");
  }
}

function parsePaymasterBuildTransactionOrThrow(
  body: unknown,
): PaymasterBuildTransactionParams {
  if (!isRecord(body)) throw new Error("Invalid JSON-RPC body");
  const req = body as JsonRpcRequest;
  if (
    req.method !== "paymaster_buildTransaction" &&
    req.method !== "paymaster_executeTransaction"
  ) {
    throw new Error("Unsupported method");
  }
  const params = req.params;
  if (!params || !isRecord(params)) throw new Error("Missing params");
  const tx = (params as any).transaction as any;
  if (!tx || !isRecord(tx)) throw new Error("Missing transaction");
  const type = (tx as any).type;
  if (type !== "deploy" && type !== "invoke") {
    throw new Error("Unsupported transaction type");
  }
  return params as unknown as PaymasterBuildTransactionParams;
}

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
    let verifiedClaims: any;
    try {
      verifiedClaims = await privy.utils().auth().verifyAccessToken(userJwt);
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired JWT token" },
        { status: 401 },
      );
    }

    const userId = verifiedClaims?.user_id as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prisma = (await getPrisma()) as any;
    const wallet = await prisma.wallet.findUnique({
      where: { privyUserId: userId },
    });
    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet not found for user" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const rpcMethod = isRecord(body) ? (body as Record<string, unknown>).method : null;
    let params: PaymasterBuildTransactionParams;
    try {
      params = parsePaymasterBuildTransactionOrThrow(body);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Invalid request body" },
        { status: 400 },
      );
    }

    const tx = params.transaction as any;

    if (tx.type === "deploy") {
      if (wallet.isDeployed) {
        return NextResponse.json(
          { error: "Wallet already deployed" },
          { status: 403 },
        );
      }
      const dep = tx.deployment;
      const ok = (() => {
        if (!dep || typeof dep !== "object") return false;
        try {
          validateAndParseAddress((dep as any).address as BigNumberish);
          validateAndParseAddress((dep as any).class_hash as BigNumberish);
          validateAndParseAddress((dep as any).salt as BigNumberish);
        } catch {
          return false;
        }
        return (
          Array.isArray((dep as any).calldata) &&
          typeof (dep as any).version === "number"
        );
      })();
      if (!ok) {
        return NextResponse.json(
          { error: "Invalid deploy payload" },
          { status: 400 },
        );
      }
    } else {
      const invoke = tx.invoke;
      let userAddress: Hex;
      try {
        userAddress = validateAndParseAddress(
          wallet.address as BigNumberish,
        ).toLowerCase() as Hex;
      } catch {
        return NextResponse.json(
          { error: "Invalid wallet address" },
          { status: 500 },
        );
      }
      const inv =
        (invoke as Record<string, unknown> | undefined)?.user_address ??
        (invoke as Record<string, unknown> | undefined)?.userAddress;
      if (
        inv === null ||
        inv === undefined ||
        (typeof inv === "string" && !inv.trim())
      ) {
        return NextResponse.json(
          { error: "Missing invoke user_address" },
          { status: 400 },
        );
      }
      if (typeof inv !== "string") {
        return NextResponse.json(
          { error: "Invalid invoke user_address" },
          { status: 400 },
        );
      }
      let invokeUser: Hex;
      try {
        invokeUser = validateAndParseAddress(
          inv as BigNumberish,
        ).toLowerCase() as Hex;
      } catch {
        return NextResponse.json(
          { error: "Invalid invoke user_address" },
          { status: 400 },
        );
      }
      if (invokeUser !== userAddress) {
        return NextResponse.json(
          { error: "Wallet address mismatch" },
          { status: 403 },
        );
      }
      // Call-shape allowlist only applies to build: execute carries typed_data + signature, not calls.
      if (rpcMethod === "paymaster_buildTransaction") {
        try {
          assertAllowedEndurInvokeOrThrow(userAddress, invoke?.calls);
        } catch (e) {
          const forbidden = e instanceof Error ? e.message : "Forbidden request";
          return NextResponse.json(
            { error: forbidden },
            { status: 403 },
          );
        }
      } else if (rpcMethod === "paymaster_executeTransaction") {
        const typed =
          (invoke as Record<string, unknown> | undefined)?.typed_data ??
          (invoke as Record<string, unknown> | undefined)?.typedData;
        const sig = (invoke as Record<string, unknown> | undefined)?.signature;
        if (!typed || typeof typed !== "object") {
          return NextResponse.json(
            { error: "Missing invoke typed_data" },
            { status: 400 },
          );
        }
        if (!Array.isArray(sig) || sig.length === 0) {
          return NextResponse.json(
            { error: "Missing invoke signature" },
            { status: 400 },
          );
        }
      }
    }

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
