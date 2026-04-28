import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import {
  assertAllowedEndurInvokeOrThrow,
  callsFromOutsideExecutionTypedDataOrThrow,
  classifyEndurOpAndAmountOrThrow,
  type EndurOpKind,
  type Hex,
} from "./_lib/allowlist";
import {
  enforceAmountLimitsOrThrow,
  enforceRateLimitOrThrow,
  readPaymasterLimitsFromEnv,
} from "./_lib/limits";
import {
  readBearerTokenOrNull,
  verifyPrivyJwtOrNull,
} from "./_lib/auth";
import { paymasterRequestSchema } from "./_lib/schemas";
import {
  validateAndParseAddress,
  type BigNumberish,
} from "starknet";

const ENDUR_PAYMASTER_LIMITS = readPaymasterLimitsFromEnv();

// (moved to ./_lib/allowlist.ts)

// (moved to ./_lib/allowlist.ts)

/*
type EndurOpKind = "stake" | "unstake";
function classifyEndurOpAndAmountOrThrow(callsRaw: unknown): {
  op: EndurOpKind;
  amount: bigint;
} {
  if (!Array.isArray(callsRaw)) throw new Error("Invalid invoke.calls");
  const calls = callsRaw.map(normalizeAvnuCall);
  if (calls.some((c) => c === null)) throw new Error("Invalid calls format");
  const normalized = calls as AvnuCall[];

  if (normalized.length === 1) {
    const c = normalized[0]!;
    if (c.selector !== selector("redeem")) {
      throw new Error("Forbidden call selector");
    }
    if (c.calldata.length !== 4) throw new Error("Invalid redeem calldata");
    const amount = uint256FromFeltsOrThrow(c.calldata[0]!, c.calldata[1]!);
    return { op: "unstake", amount };
  }

  // Stake + optional vault: approve + deposit into LST, then approve + deposit into vault.
  // Amount tracked is the initial asset deposit amount.
  if (normalized.length === 4) {
    const [approveAsset, depositLst, approveLst, depositVault] = normalized;
    if (approveAsset.selector !== selector("approve")) {
      throw new Error("First call must be approve");
    }
    if (approveAsset.calldata.length !== 3) {
      throw new Error("Invalid approve calldata");
    }
    const allowedDepositSelectors = new Set<Hex>([
      selector("deposit"),
      selector("deposit_with_referral"),
      selector("deposit_to_validator"),
    ]);
    if (!allowedDepositSelectors.has(depositLst.selector)) {
      throw new Error("Forbidden deposit selector");
    }
    if (depositLst.calldata.length < 2) {
      throw new Error("Invalid deposit calldata");
    }
    if (approveLst.selector !== selector("approve")) {
      throw new Error("Third call must be approve");
    }
    if (approveLst.calldata.length !== 3) {
      throw new Error("Invalid approve calldata");
    }
    if (!allowedDepositSelectors.has(depositVault.selector)) {
      throw new Error("Forbidden vault deposit selector");
    }
    if (depositVault.calldata.length < 2) {
      throw new Error("Invalid vault deposit calldata");
    }
    const amount = uint256FromFeltsOrThrow(
      depositLst.calldata[0]!,
      depositLst.calldata[1]!,
    );
    return { op: "stake", amount };
  }

  if (normalized.length !== 2) throw new Error("Forbidden calls length");
  const [approve, action] = normalized;

  // DEX unstake: amount is approved shares (uint256) on the LST approve.
  if (action.selector === selector("multi_route_swap")) {
    if (approve.selector !== selector("approve")) {
      throw new Error("First call must be approve");
    }
    if (approve.calldata.length !== 3) {
      throw new Error("Invalid approve calldata");
    }
    const amount = uint256FromFeltsOrThrow(
      approve.calldata[1]!,
      approve.calldata[2]!,
    );
    return { op: "unstake", amount };
  }

  const allowedDepositSelectors = new Set<Hex>([
    selector("deposit"),
    selector("deposit_with_referral"),
    selector("deposit_to_validator"),
  ]);
  if (!allowedDepositSelectors.has(action.selector)) {
    throw new Error("Forbidden deposit selector");
  }
  if (action.calldata.length < 2) throw new Error("Invalid deposit calldata");
  const amount = uint256FromFeltsOrThrow(
    action.calldata[0]!,
    action.calldata[1]!,
  );
  return { op: "stake", amount };
}

function callsFromOutsideExecutionTypedDataOrThrow(typed: unknown): unknown[] {
  if (!isRecord(typed)) throw new Error("Invalid invoke typed_data");
  const message = (typed as Record<string, unknown>).message;
  if (!isRecord(message)) throw new Error("Invalid invoke typed_data message");

  // SNIP-9 / OutsideExecutionTypedData V1:
  // message.calls: [{ to, selector, calldata_len, calldata }]
  const v1 = (message as Record<string, unknown>).calls;
  if (Array.isArray(v1)) {
    return v1.map((c) => {
      if (!isRecord(c)) throw new Error("Invalid invoke typed_data calls");
      return {
        to: (c as Record<string, unknown>).to,
        selector: (c as Record<string, unknown>).selector,
        calldata: (c as Record<string, unknown>).calldata,
      };
    });
  }

  // SNIP-9 / OutsideExecutionTypedData V2:
  // message.Calls: [{ To, Selector, Calldata }]
  const v2 = (message as Record<string, unknown>).Calls;
  if (Array.isArray(v2)) {
    return v2.map((c) => {
      if (!isRecord(c)) throw new Error("Invalid invoke typed_data Calls");
      return {
        to: (c as Record<string, unknown>).To,
        selector: (c as Record<string, unknown>).Selector,
        calldata: (c as Record<string, unknown>).Calldata,
      };
    });
  }

  throw new Error("Invalid invoke typed_data calls");
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
  const pair = ENDUR_LST_PAIRS.find(
    (p) =>
      (validateAndParseAddress(p.lstAddress).toLowerCase() as Hex) ===
      approve.to,
  );
  if (!pair) {
    throw new Error("DEX unstake: approve must be on a known Endur LST");
  }
  if (swap.selector !== selector("multi_route_swap")) {
    throw new Error("DEX unstake: second call must be multi_route_swap");
  }
  if (swap.to !== router) {
    throw new Error(
      "DEX unstake: swap must invoke the same Avnu router as approve",
    );
  }

  // avnu-contracts-v2 multi_route_swap calldata (leading fixed fields):
  // 0 sell_token_address
  // 1 sell_token_amount.low
  // 2 sell_token_amount.high
  // 3 buy_token_address
  // 4 buy_token_amount.low
  // 5 buy_token_amount.high
  // 6 buy_token_min_amount.low
  // 7 buy_token_min_amount.high
  // 8 beneficiary
  // 9 integrator_fee_amount_bps
  // 10 integrator_fee_recipient
  // 11 routes_len
  if (swap.calldata.length < 12) {
    throw new Error("DEX unstake: invalid multi_route_swap calldata");
  }

  let sellToken: Hex;
  let buyToken: Hex;
  let beneficiary: Hex;
  try {
    sellToken = validateAndParseAddress(
      swap.calldata[0] as BigNumberish,
    ).toLowerCase() as Hex;
    buyToken = validateAndParseAddress(
      swap.calldata[3] as BigNumberish,
    ).toLowerCase() as Hex;
    beneficiary = validateAndParseAddress(
      swap.calldata[8] as BigNumberish,
    ).toLowerCase() as Hex;
  } catch {
    throw new Error("DEX unstake: invalid token/beneficiary in calldata");
  }

  // Bind the swap to the LST that was approved, and to the expected underlying asset for that LST.
  const expectedSell = approve.to;
  const expectedBuy = validateAndParseAddress(
    pair.assetAddress,
  ).toLowerCase() as Hex;
  if (sellToken !== expectedSell) {
    throw new Error("DEX unstake: sell token must match approved LST");
  }
  if (buyToken !== expectedBuy) {
    throw new Error(
      "DEX unstake: buy token must match expected underlying asset",
    );
  }
  if (beneficiary !== userAddress) {
    throw new Error("DEX unstake: beneficiary must be the user");
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
        (validateAndParseAddress(p.lstAddress).toLowerCase() as Hex) === c.to,
    );
    if (!isKnownLst) throw new Error("Unknown Endur LST contract");
    return;
  }

  // Stake + optional vault: approve + deposit into LST, then approve + deposit into vault.
  if (normalized.length === 4) {
    const [approveAsset, depositLst, approveLst, depositVault] = normalized;
    if (approveAsset.selector !== selector("approve")) {
      throw new Error("First call must be approve");
    }
    if (approveAsset.calldata.length !== 3) {
      throw new Error("Invalid approve calldata");
    }
    if (approveLst.selector !== selector("approve")) {
      throw new Error("Third call must be approve");
    }
    if (approveLst.calldata.length !== 3) {
      throw new Error("Invalid approve calldata");
    }

    let spenderAssetToLst: Hex;
    let spenderLstToVault: Hex;
    try {
      spenderAssetToLst = validateAndParseAddress(
        approveAsset.calldata[0] as BigNumberish,
      ).toLowerCase() as Hex;
      spenderLstToVault = validateAndParseAddress(
        approveLst.calldata[0] as BigNumberish,
      ).toLowerCase() as Hex;
    } catch {
      throw new Error("Invalid approve spender");
    }

    // Pair is identified by the initial stake approval: asset.approve(LST)
    const pair = ENDUR_LST_PAIRS.find(
      (p) =>
        (validateAndParseAddress(p.assetAddress).toLowerCase() as Hex) ===
          approveAsset.to &&
        (validateAndParseAddress(p.lstAddress).toLowerCase() as Hex) ===
          spenderAssetToLst,
    );
    if (!pair) throw new Error("Approve must target an Endur LST spender");
    if (!pair.vaultAddress) {
      throw new Error("Vault staking not supported for this asset");
    }

    const allowedDepositSelectors = new Set<Hex>([
      selector("deposit"),
      selector("deposit_with_referral"),
      selector("deposit_to_validator"),
    ]);
    if (!allowedDepositSelectors.has(depositLst.selector)) {
      throw new Error("Forbidden deposit selector");
    }
    if (!allowedDepositSelectors.has(depositVault.selector)) {
      throw new Error("Forbidden vault deposit selector");
    }

    // Deposit into LST must target the LST contract from the pair.
    const lstAddr = validateAndParseAddress(pair.lstAddress).toLowerCase() as Hex;
    const vaultAddr = validateAndParseAddress(pair.vaultAddress).toLowerCase() as Hex;
    if (depositLst.to !== lstAddr) {
      throw new Error("Deposit must target Endur LST contract");
    }

    // LST approval must be on the LST contract and target the configured vault.
    if (approveLst.to !== lstAddr) {
      throw new Error("Second approve must be on Endur LST contract");
    }
    if (spenderLstToVault !== vaultAddr) {
      throw new Error("Vault approve must target configured vault");
    }

    // Vault deposit must target the configured vault.
    if (depositVault.to !== vaultAddr) {
      throw new Error("Vault deposit must target configured vault");
    }

    // Receiver in both deposits must be the user (same receiver slot as existing stake path).
    if (depositLst.calldata.length < 3 || depositVault.calldata.length < 3) {
      throw new Error("Invalid deposit calldata");
    }
    const receiver1 = validateAndParseAddress(
      depositLst.calldata[2] as BigNumberish,
    ).toLowerCase() as Hex;
    const receiver2 = validateAndParseAddress(
      depositVault.calldata[2] as BigNumberish,
    ).toLowerCase() as Hex;
    if (receiver1 !== userAddress || receiver2 !== userAddress) {
      throw new Error("User address mismatch in deposit");
    }

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
      (validateAndParseAddress(p.assetAddress).toLowerCase() as Hex) ===
        approve.to &&
      (validateAndParseAddress(p.lstAddress).toLowerCase() as Hex) === spender,
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
*/

/*
function parsePaymasterRequestOrThrow(
  body: unknown,
): PaymasterBuildTransactionParams {
  if (!isRecord(body)) throw new Error("Invalid JSON-RPC body");
  const req = body as JsonRpcRequest;
  const method = req.method;
  if (
    method !== "paymaster_buildTransaction" &&
    method !== "paymaster_executeTransaction"
  ) {
    throw new Error("Unsupported method");
  }

  const params = req.params;
  if (!params || !isRecord(params)) throw new Error("Missing params");

  const txRaw = (params as PaymasterBuildTransactionParams).transaction;
  if (!txRaw || !isRecord(txRaw)) throw new Error("Missing transaction");
  const txType = (txRaw as { type?: unknown }).type;
  if (txType !== "deploy" && txType !== "invoke") {
    throw new Error("Unsupported transaction type");
  }

  // Preserve `parameters` passthrough but ensure the transaction type is valid.
  return {
    transaction: txRaw as PaymasterBuildTransactionParams["transaction"],
    parameters: (params as PaymasterBuildTransactionParams).parameters,
  };
}
*/

export async function POST(request: Request) {
  try {
    const avnuApiKey = process.env.AVNU_API_KEY;
    if (!avnuApiKey) throw new Error("Missing AVNU_API_KEY");

    const userJwt = readBearerTokenOrNull(
      request.headers.get("authorization"),
    );
    if (!userJwt) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 },
      );
    }

    const claims = await verifyPrivyJwtOrNull(userJwt);
    if (!claims) {
      return NextResponse.json(
        { error: "Invalid or expired JWT token" },
        { status: 401 },
      );
    }
    const userId = claims.userId;

    const prisma = await getPrisma();
    const wallet = await prisma.wallet.findUnique({
      where: { privyUserId: userId },
    });
    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet not found for user" },
        { status: 404 },
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = paymasterRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }
    const { method: rpcMethod, params } = parsed.data;
    const tx = params.transaction;

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
        const rec = dep as Record<string, unknown>;
        try {
          validateAndParseAddress(rec.address as BigNumberish);
          validateAndParseAddress(rec.class_hash as BigNumberish);
          validateAndParseAddress(rec.salt as BigNumberish);
        } catch {
          return false;
        }
        return (
          Array.isArray(rec.calldata) && typeof rec.version === "number"
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
      const inv = invoke?.user_address ?? invoke?.userAddress;
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

      const typed = invoke?.typed_data ?? invoke?.typedData;
      const sig = invoke?.signature;

      let callsRaw: unknown;
      if (rpcMethod === "paymaster_buildTransaction") {
        callsRaw = invoke?.calls;
      } else if (rpcMethod === "paymaster_executeTransaction") {
        if (!typed) {
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
        try {
          callsRaw = callsFromOutsideExecutionTypedDataOrThrow(typed);
        } catch (e) {
          return NextResponse.json(
            {
              error:
                e instanceof Error ? e.message : "Invalid invoke typed_data",
            },
            { status: 400 },
          );
        }
      } else {
        return NextResponse.json(
          { error: "Unsupported method" },
          { status: 400 },
        );
      }

      try {
        assertAllowedEndurInvokeOrThrow(userAddress, callsRaw);
      } catch (e) {
        const forbidden = e instanceof Error ? e.message : "Forbidden request";
        return NextResponse.json({ error: forbidden }, { status: 403 });
      }

      // Amount checks apply to both build and execute.
      let op: EndurOpKind;
      let amount: bigint;
      try {
        ({ op, amount } = classifyEndurOpAndAmountOrThrow(callsRaw));
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : "Invalid calls" },
          { status: 400 },
        );
      }
      try {
        enforceAmountLimitsOrThrow(op, amount, ENDUR_PAYMASTER_LIMITS);
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : "Forbidden request" },
          { status: 403 },
        );
      }

      // Rolling hourly rate limit is only enforced on execute (one slot per sponsored execution),
      // and only for the "middle band" (min <= amount <= exempt).
      const isMiddleBand =
        amount <=
        (op === "stake"
          ? ENDUR_PAYMASTER_LIMITS.largeAmountExemptStake
          : ENDUR_PAYMASTER_LIMITS.largeAmountExemptUnstake);
      if (
        rpcMethod === "paymaster_executeTransaction" &&
        isMiddleBand &&
        ENDUR_PAYMASTER_LIMITS.middleBandRatePerHour > 0
      ) {
        try {
          await enforceRateLimitOrThrow(
            prisma,
            userId,
            ENDUR_PAYMASTER_LIMITS,
            Date.now(),
          );
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Rate limit exceeded";
          return NextResponse.json(
            { error: msg },
            { status: msg.includes("Rate limit") ? 429 : 500 },
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
