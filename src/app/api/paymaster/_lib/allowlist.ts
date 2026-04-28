import {
  addAddressPadding,
  hash,
  validateAndParseAddress,
  type BigNumberish,
} from "starknet";
import { AVNU_EXCHANGE_MAINNET, AVNU_EXCHANGE_SEPOLIA, ENDUR_LST_PAIRS } from "./constants";

export type Hex = `0x${string}`;

const HEX_RE = /^[0-9a-fA-F]+$/;

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
  if (!HEX_RE.test(hex)) return null;
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

export type AvnuCall = { to: Hex; selector: Hex; calldata: string[] };

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

function uint256FromFeltsOrThrow(low: string, high: string): bigint {
  let lo: bigint;
  let hi: bigint;
  try {
    lo = BigInt(low);
    hi = BigInt(high);
  } catch {
    throw new Error("Invalid uint256 calldata");
  }
  if (lo < BigInt(0) || hi < BigInt(0)) throw new Error("Invalid uint256 calldata");
  return (hi << BigInt(128)) + lo;
}

export type EndurOpKind = "stake" | "unstake";

export function classifyEndurOpAndAmountOrThrow(callsRaw: unknown): {
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
    const amount = uint256FromFeltsOrThrow(approve.calldata[1]!, approve.calldata[2]!);
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
  const amount = uint256FromFeltsOrThrow(action.calldata[0]!, action.calldata[1]!);
  return { op: "stake", amount };
}

export function callsFromOutsideExecutionTypedDataOrThrow(typed: unknown): unknown[] {
  if (!isRecord(typed)) throw new Error("Invalid invoke typed_data");
  const message = (typed as Record<string, unknown>).message;
  if (!isRecord(message)) throw new Error("Invalid invoke typed_data message");

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

function assertAvnuDexUnstakeOrThrow(userAddress: Hex, approve: AvnuCall, swap: AvnuCall): void {
  if (approve.selector !== selector("approve")) {
    throw new Error("DEX unstake: first call must be approve");
  }
  if (approve.calldata.length !== 3) {
    throw new Error("Invalid approve calldata for DEX unstake");
  }
  let router: Hex;
  try {
    router = validateAndParseAddress(approve.calldata[0] as BigNumberish).toLowerCase() as Hex;
  } catch {
    throw new Error("DEX unstake: invalid router in approve");
  }
  if (!AVNU_EXCHANGE_ROUTERS.has(router)) {
    throw new Error("DEX unstake: approve must target a known Avnu exchange");
  }
  const pair = ENDUR_LST_PAIRS.find(
    (p) => (validateAndParseAddress(p.lstAddress).toLowerCase() as Hex) === approve.to,
  );
  if (!pair) {
    throw new Error("DEX unstake: approve must be on a known Endur LST");
  }
  if (swap.selector !== selector("multi_route_swap")) {
    throw new Error("DEX unstake: second call must be multi_route_swap");
  }
  if (swap.to !== router) {
    throw new Error("DEX unstake: swap must invoke the same Avnu router as approve");
  }

  if (swap.calldata.length < 12) {
    throw new Error("DEX unstake: invalid multi_route_swap calldata");
  }

  let sellToken: Hex;
  let buyToken: Hex;
  let beneficiary: Hex;
  try {
    sellToken = validateAndParseAddress(swap.calldata[0] as BigNumberish).toLowerCase() as Hex;
    buyToken = validateAndParseAddress(swap.calldata[3] as BigNumberish).toLowerCase() as Hex;
    beneficiary = validateAndParseAddress(swap.calldata[8] as BigNumberish).toLowerCase() as Hex;
  } catch {
    throw new Error("DEX unstake: invalid token/beneficiary in calldata");
  }

  const expectedSell = approve.to;
  const expectedBuy = validateAndParseAddress(pair.assetAddress).toLowerCase() as Hex;
  if (sellToken !== expectedSell) {
    throw new Error("DEX unstake: sell token must match approved LST");
  }
  if (buyToken !== expectedBuy) {
    throw new Error("DEX unstake: buy token must match expected underlying asset");
  }
  if (beneficiary !== userAddress) {
    throw new Error("DEX unstake: beneficiary must be the user");
  }
}

export function assertAllowedEndurInvokeOrThrow(userAddress: Hex, callsRaw: unknown): void {
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
    if (c.calldata.length !== 4) {
      throw new Error("Invalid redeem calldata");
    }
    let receiver: Hex;
    let owner: Hex;
    try {
      receiver = validateAndParseAddress(c.calldata[2] as BigNumberish).toLowerCase() as Hex;
      owner = validateAndParseAddress(c.calldata[3] as BigNumberish).toLowerCase() as Hex;
    } catch {
      throw new Error("Invalid redeem calldata");
    }
    if (receiver !== userAddress || owner !== userAddress) {
      throw new Error("User address mismatch in redeem");
    }
    const isKnownLst = ENDUR_LST_PAIRS.some(
      (p) => (validateAndParseAddress(p.lstAddress).toLowerCase() as Hex) === c.to,
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

    const pair = ENDUR_LST_PAIRS.find(
      (p) =>
        (validateAndParseAddress(p.assetAddress).toLowerCase() as Hex) === approveAsset.to &&
        (validateAndParseAddress(p.lstAddress).toLowerCase() as Hex) === spenderAssetToLst,
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

    const lstAddr = validateAndParseAddress(pair.lstAddress).toLowerCase() as Hex;
    const vaultAddr = validateAndParseAddress(pair.vaultAddress).toLowerCase() as Hex;
    if (depositLst.to !== lstAddr) {
      throw new Error("Deposit must target Endur LST contract");
    }

    if (approveLst.to !== lstAddr) {
      throw new Error("Second approve must be on Endur LST contract");
    }
    if (spenderLstToVault !== vaultAddr) {
      throw new Error("Vault approve must target configured vault");
    }

    if (depositVault.to !== vaultAddr) {
      throw new Error("Vault deposit must target configured vault");
    }

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
    spender = validateAndParseAddress(approve.calldata[0] as BigNumberish).toLowerCase() as Hex;
  } catch {
    throw new Error("Invalid approve spender");
  }

  const pair = ENDUR_LST_PAIRS.find(
    (p) =>
      (validateAndParseAddress(p.assetAddress).toLowerCase() as Hex) === approve.to &&
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
  if (action.to !== (validateAndParseAddress(pair.lstAddress).toLowerCase() as Hex)) {
    throw new Error("Deposit must target Endur LST contract");
  }

  if (action.calldata.length < 3) {
    throw new Error("Invalid deposit calldata");
  }
  const receiver = validateAndParseAddress(action.calldata[2] as BigNumberish).toLowerCase() as Hex;
  if (receiver !== userAddress) {
    throw new Error("User address mismatch in deposit");
  }
}

