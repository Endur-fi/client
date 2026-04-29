/**
 * Paymaster guard
 *
 * Validates JSON-RPC bodies forwarded to AVNU's paymaster
 * (https://starknet.paymaster.avnu.fi) via /api/paymaster.
 *
 * We only sponsor three things:
 *   1. Privy account `deploy` for the JWT-bound user (once).
 *   2. Stake on Endur (optionally chained with a TrovesHyper deposit).
 *   3. Unstake on Endur (request_withdrawal) or via AVNU dex (multi_route_swap
 *      LST -> underlying asset).
 *
 * Layer 1 (Zod): JSON-RPC envelope + per-call structural validation with
 *   address normalization.
 * Layer 2 (this file's matchers): cross-field equality against the JWT-bound
 *   wallet, deploy address re-derivation, and call-template pattern matching.
 */
import { hash } from "starknet";
import { z } from "zod";

import {
  AVNU_EXCHANGE_ADDRESS,
  LST_CONFIG,
  NETWORK,
  PRIVY_ACCOUNT_CLASS_HASH_SN_MAIN,
} from "@/constants";

// ---------------------------------------------------------------------------
// Address / felt normalization
// ---------------------------------------------------------------------------

const HEX_FELT_REGEX = /^0x[0-9a-fA-F]{1,64}$/;

/**
 * Canonicalize an addressable hex string to "0x" + 64 lowercase hex chars so
 * `===` comparison is reliable across different leading-zero / casing inputs.
 */
function normalizeAddress(value: string): string {
  const big = BigInt(value);
  return `0x${big.toString(16).padStart(64, "0").toLowerCase()}`;
}

/**
 * Looser normalization for arbitrary felts (amounts, salts, calldata items)
 * where leading-zero padding is not required for equality, but we still want
 * a canonical hex form.
 */
function normalizeFelt(value: string): string {
  const big = BigInt(value);
  return `0x${big.toString(16)}`;
}

function eqAddr(a: string, b: string): boolean {
  try {
    return normalizeAddress(a) === normalizeAddress(b);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Pre-computed selectors
// ---------------------------------------------------------------------------

const SELECTORS = {
  approve: hash.getSelectorFromName("approve"),
  deposit: hash.getSelectorFromName("deposit"),
  deposit_to_validator: hash.getSelectorFromName("deposit_to_validator"),
  deposit_with_referral: hash.getSelectorFromName("deposit_with_referral"),
  redeem: hash.getSelectorFromName("redeem"),
  multi_route_swap: hash.getSelectorFromName("multi_route_swap"),
} as const;

const DEPOSIT_SELECTORS = new Set(
  [
    SELECTORS.deposit,
    SELECTORS.deposit_to_validator,
    SELECTORS.deposit_with_referral,
  ].map(normalizeAddress),
);

// ---------------------------------------------------------------------------
// Zod schemas (layer 1: structural)
// ---------------------------------------------------------------------------

const HexFelt = z
  .string()
  .regex(HEX_FELT_REGEX, "must be 0x-prefixed hex felt");

const CallSchema = z.object({
  to: HexFelt,
  selector: HexFelt,
  calldata: z.array(HexFelt).max(64),
});

const TypedDataCallSchema = z.object({
  To: HexFelt,
  Selector: HexFelt,
  Calldata: z.array(HexFelt).max(64),
});

const TypedDataSchema = z.object({
  message: z.object({
    Calls: z.array(TypedDataCallSchema).min(1).max(8),
  })
});

const DeployTransaction = z.object({
  type: z.literal("deploy"),
  deployment: z.object({
    address: HexFelt,
    class_hash: HexFelt,
    salt: HexFelt,
    calldata: z.array(HexFelt).max(16),
  }),
});

const InvokeBuildTransaction = z.object({
  type: z.literal("invoke"),
  invoke: z.object({
    user_address: HexFelt,
    calls: z.array(CallSchema).min(1).max(8),
  }),
});

const InvokeExecuteTransaction = z.object({
  type: z.literal("invoke"),
  invoke: z.object({
    user_address: HexFelt,
    typed_data: TypedDataSchema,
    signature: z.array(HexFelt).min(2).max(8),
  }),
});

const BuildEnvelope = z.object({
  // jsonrpc: z.literal("2.0"), can ignore
  id: z.union([z.number(), z.string()]),
  method: z.literal("paymaster_buildTransaction"),
  params: z.object({
    transaction: z.union([DeployTransaction, InvokeBuildTransaction])
  }),
});

const ExecuteEnvelope = z.object({
  // jsonrpc: z.literal("2.0"), can ignore
  id: z.union([z.number(), z.string()]),
  method: z.literal("paymaster_executeTransaction"),
  params: z.object({
    transaction: InvokeExecuteTransaction
  }),
});

const PaymasterEnvelope = z.union([BuildEnvelope, ExecuteEnvelope]);

// ---------------------------------------------------------------------------
// Layer 2: business-rule matchers
// ---------------------------------------------------------------------------

export type GuardWallet = {
  address: string;
  publicKey: string;
  isDeployed: boolean;
};

export type PaymasterKind =
  | "deploy"
  | "stake"
  | "stake+hyper"
  | "unstake-endur"
  | "unstake-avnu";

/** Non-deploy kinds carry the amount + asset for downstream rate limiting. */
export type GuardOpDetails = {
  assetSymbol: string;
  amountWei: bigint;
};

export type GuardResult =
  | { ok: true; kind: "deploy" }
  | ({ ok: true; kind: Exclude<PaymasterKind, "deploy"> } & GuardOpDetails)
  | { ok: false; reason: string };

type NormalizedCall = {
  to: string;
  selector: string;
  calldata: string[];
};

function fail(reason: string): GuardResult {
  return { ok: false, reason };
}

/**
 * Decode a u256 split across two felts (low, high) into a single bigint.
 * Felts are normalized to 0x-prefixed hex; BigInt() handles them directly.
 */
const U256_HIGH_SHIFT = BigInt(128);
function u256FromLowHigh(low: string, high: string): bigint {
  return BigInt(low) | (BigInt(high) << U256_HIGH_SHIFT);
}

function normalizeCalls(
  calls: Array<{ to: string; selector: string; calldata: string[] }>,
): NormalizedCall[] {
  return calls.map((c) => ({
    to: normalizeAddress(c.to),
    selector: normalizeAddress(c.selector),
    calldata: c.calldata.map(normalizeFelt),
  }));
}

/**
 * Find an LST in LST_CONFIG whose LST_ADDRESS matches `addr`.
 * Returns undefined if no LST claims that address.
 */
function findLstByLstAddress(addr: string) {
  return Object.values(LST_CONFIG).find((cfg) =>
    eqAddr(cfg.LST_ADDRESS, addr),
  );
}

function findLstByAssetAddress(addr: string) {
  return Object.values(LST_CONFIG).find((cfg) =>
    eqAddr(cfg.ASSET_ADDRESS, addr),
  );
}

// ---- deploy ---------------------------------------------------------------

function matchDeploy(
  tx: z.infer<typeof DeployTransaction>,
  wallet: GuardWallet,
): GuardResult {
  if (wallet.isDeployed) {
    return fail("wallet already deployed");
  }
  if (NETWORK !== "SN_MAIN") {
    return fail("deploy sponsorship only enabled on SN_MAIN");
  }

  const { address, class_hash, salt, calldata } = tx.deployment;

  if (!eqAddr(address, wallet.address)) {
    return fail("deployment.address does not match JWT-bound wallet");
  }
  if (!eqAddr(class_hash, PRIVY_ACCOUNT_CLASS_HASH_SN_MAIN)) {
    return fail("deployment.class_hash not in allowed Privy class hashes");
  }

  // Cryptographically bind salt + calldata to the wallet by re-deriving the
  // contract address: derived === wallet.address holds iff (class_hash, salt,
  // calldata) match what Privy originally used to compute wallet.address.
  // Pedersen collisions are infeasible, so this single check supersedes any
  // per-field equality check on salt or calldata and is forward-compatible
  // with future Privy account constructor shapes.
  //
  // The 4th arg is `deployerAddress`; for native account-abstraction deploys
  // (Starknet DEPLOY_ACCOUNT, which is what type: "deploy" maps to), the
  // deployer is 0. Non-zero would be for UDC-style contract deploys.
  const derived = hash.calculateContractAddressFromHash(
    salt,
    class_hash,
    calldata,
    0,
  );
  if (!eqAddr(derived, wallet.address)) {
    return fail("derived deploy address does not match wallet");
  }

  return { ok: true, kind: "deploy" };
}

// ---- invoke call patterns -------------------------------------------------

type LstCfg = (typeof LST_CONFIG)[keyof typeof LST_CONFIG];

/**
 * approve(spender, amount.low, amount.high) on `tokenAddr`, with `spender`
 * equal to one of `allowedSpenders`.
 */
function isApprove(
  call: NormalizedCall,
  tokenAddr: string,
  allowedSpenders: string[],
): boolean {
  if (!eqAddr(call.to, tokenAddr)) return false;
  if (!eqAddr(call.selector, SELECTORS.approve)) return false;
  if (call.calldata.length !== 3) return false;
  return allowedSpenders.some((s) => eqAddr(call.calldata[0], s));
}

/**
 * Endur LST deposit (any of `deposit`, `deposit_to_validator`,
 * `deposit_with_referral`). receiver is calldata[2].
 */
function isLstDeposit(
  call: NormalizedCall,
  lstAddr: string,
  user: string,
): boolean {
  if (!eqAddr(call.to, lstAddr)) return false;
  const sel = call.selector;
  if (!DEPOSIT_SELECTORS.has(sel)) return false;
  // deposit:                [amt.low, amt.high, receiver]                  (3)
  // deposit_to_validator:   [amt.low, amt.high, receiver, validator]       (4)
  // deposit_with_referral:  [amt.low, amt.high, receiver, referrer]        (4)
  if (call.calldata.length !== 3 && call.calldata.length !== 4) return false;
  return eqAddr(call.calldata[2], user);
}

/**
 * TrovesHyper vault deposit(amount.low, amount.high, receiver).
 */
function isTrovesDeposit(
  call: NormalizedCall,
  trovesAddr: string,
  user: string,
): boolean {
  if (!eqAddr(call.to, trovesAddr)) return false;
  if (!eqAddr(call.selector, SELECTORS.deposit)) return false;
  if (call.calldata.length !== 3) return false;
  return eqAddr(call.calldata[2], user);
}

/**
 * LST.request_withdrawal(amount.low, amount.high, receiver, owner)
 * with both receiver and owner equal to the user.
 */
function isRequestWithdrawal(
  call: NormalizedCall,
  lstAddr: string,
  user: string,
): boolean {
  if (!eqAddr(call.to, lstAddr)) return false;
  if (!eqAddr(call.selector, SELECTORS.redeem)) return false;
  if (call.calldata.length !== 4) return false;
  return eqAddr(call.calldata[2], user) && eqAddr(call.calldata[3], user);
}

/**
 * AVNU multi_route_swap(...) layout (positional):
 *   [0]      sell_token
 *   [1..2]   sell_amount.low/high
 *   [3]      buy_token
 *   [4..5]   buy_amount.low/high
 *   [6..7]   buy_amount_min.low/high
 *   [8]      beneficiary
 *   [9]      integrator_fee
 *   [10]     integrator_fee_recipient
 *   [11..]   routes (length-prefixed)
 * We bind sell_token -> LST, buy_token -> underlying asset, beneficiary -> user.
 * Routes/slippage are user-signed and AVNU-validated; not our concern.
 */
function isAvnuSwapLstToAsset(
  call: NormalizedCall,
  lst: LstCfg,
  user: string,
): boolean {
  if (!eqAddr(call.to, AVNU_EXCHANGE_ADDRESS)) return false;
  if (!eqAddr(call.selector, SELECTORS.multi_route_swap)) return false;
  if (call.calldata.length < 12) return false;
  if (!eqAddr(call.calldata[0], lst.LST_ADDRESS)) return false;
  if (!eqAddr(call.calldata[3], lst.ASSET_ADDRESS)) return false;
  if (!eqAddr(call.calldata[8], user)) return false;
  return true;
}

/**
 * Try to match the call array against one of our supported templates.
 * Returns the matched kind + amount/asset (for non-deploy kinds), or a
 * failure reason.
 *
 * Amount-extraction layout (after a positive structural match):
 *   stake / stake+hyper:   call[1] = LST.deposit(amount.low, amount.high, ..)
 *                          -> calldata[0..1]
 *   unstake-endur:         call[0] = LST.redeem(amount.low, amount.high, ..)
 *                          -> calldata[0..1]
 *   unstake-avnu:          call[1] = AVNU.multi_route_swap(sell_token,
 *                                       sell_amount.low, sell_amount.high, ..)
 *                          -> calldata[1..2]
 */
function matchCalls(
  calls: NormalizedCall[],
  user: string,
): GuardResult {
  // ---- 1 call: unstake via Endur (redeem on LST) -------------------------
  if (calls.length === 1) {
    const c = calls[0];
    const lst = findLstByLstAddress(c.to);
    if (lst && isRequestWithdrawal(c, lst.LST_ADDRESS, user)) {
      return {
        ok: true,
        kind: "unstake-endur",
        assetSymbol: lst.SYMBOL,
        amountWei: u256FromLowHigh(c.calldata[0], c.calldata[1]),
      };
    }
    return fail("single-call shape did not match unstake-endur");
  }

  // ---- 2 calls: stake (approve + deposit) OR unstake-avnu (approve + swap)
  if (calls.length === 2) {
    const [a, b] = calls;

    // unstake-avnu: approve(LST -> AVNU), multi_route_swap(LST -> asset)
    {
      const lst = findLstByLstAddress(a.to);
      if (
        lst &&
        isApprove(a, lst.LST_ADDRESS, [AVNU_EXCHANGE_ADDRESS]) &&
        isAvnuSwapLstToAsset(b, lst, user)
      ) {
        return {
          ok: true,
          kind: "unstake-avnu",
          assetSymbol: lst.SYMBOL,
          amountWei: u256FromLowHigh(b.calldata[1], b.calldata[2]),
        };
      }
    }

    // stake: approve(asset -> LST), deposit(LST)
    {
      const lst = findLstByAssetAddress(a.to);
      if (
        lst &&
        isApprove(a, lst.ASSET_ADDRESS, [lst.LST_ADDRESS]) &&
        isLstDeposit(b, lst.LST_ADDRESS, user)
      ) {
        return {
          ok: true,
          kind: "stake",
          assetSymbol: lst.SYMBOL,
          amountWei: u256FromLowHigh(b.calldata[0], b.calldata[1]),
        };
      }
    }

    return fail("two-call shape matched neither stake nor unstake-avnu");
  }

  // ---- 4 calls: stake + TrovesHyper deposit ------------------------------
  if (calls.length === 4) {
    const [a, b, c, d] = calls;
    const lst = findLstByAssetAddress(a.to);
    const trovesAddr = lst?.TROVES_HYPER_VAULT_ADDRESS;
    if (!lst || !trovesAddr) {
      return fail("four-call shape requires an LST with troves-hyper vault");
    }
    if (
      isApprove(a, lst.ASSET_ADDRESS, [lst.LST_ADDRESS]) &&
      isLstDeposit(b, lst.LST_ADDRESS, user) &&
      isApprove(c, lst.LST_ADDRESS, [trovesAddr]) &&
      isTrovesDeposit(d, trovesAddr, user)
    ) {
      return {
        ok: true,
        kind: "stake+hyper",
        assetSymbol: lst.SYMBOL,
        amountWei: u256FromLowHigh(b.calldata[0], b.calldata[1]),
      };
    }
    return fail("four-call shape did not match stake+hyper");
  }

  return fail(`unsupported call count: ${calls.length}`);
}

// ---- public entrypoint ----------------------------------------------------

/**
 * Validate an incoming JSON-RPC body against the user's wallet.
 *
 * `wallet` is fetched server-side from prisma using the Privy user id encoded
 * in the bearer JWT, so attempting to spoof user_address in the body fails
 * here (it must match wallet.address).
 */
export function validatePaymasterRequest(
  rawBody: unknown,
  wallet: GuardWallet,
): GuardResult {
  const parsed = PaymasterEnvelope.safeParse(rawBody);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return fail(
      `invalid envelope: ${issue?.path.join(".") || "<root>"}: ${issue?.message || "shape mismatch"}`,
    );
  }

  const body = parsed.data;

  // ---- paymaster_buildTransaction ---------------------------------------
  if (body.method === "paymaster_buildTransaction") {
    const tx = body.params.transaction;

    if (tx.type === "deploy") {
      return matchDeploy(tx, wallet);
    }

    // invoke build
    if (!eqAddr(tx.invoke.user_address, wallet.address)) {
      return fail("invoke.user_address does not match JWT-bound wallet");
    }
    const calls = normalizeCalls(tx.invoke.calls);
    return matchCalls(calls, normalizeAddress(wallet.address));
  }

  // ---- paymaster_executeTransaction -------------------------------------
  const tx = body.params.transaction;
  if (!eqAddr(tx.invoke.user_address, wallet.address)) {
    return fail("invoke.user_address does not match JWT-bound wallet");
  }

  // Translate typed_data Calls (capitalized field names) into our normalized
  // shape so the same matchCalls covers both build and execute paths.
  const calls = normalizeCalls(
    tx.invoke.typed_data.message.Calls.map((c) => ({
      to: c.To,
      selector: c.Selector,
      calldata: c.Calldata,
    })),
  );
  return matchCalls(calls, normalizeAddress(wallet.address));
}
