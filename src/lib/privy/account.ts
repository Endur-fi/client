import { Account, hash, num } from "starknet";
import { RawSigner } from "./rawSigner";
import { getRpcProvider, setupPaymaster } from "./provider";
import { getPrivyClient } from "./privyClient";

const ACCOUNT_CLASS_HASH =
  process.env.ACCOUNT_CLASS_HASH ||
  "0x00e2eb8f5672af4e6a4e8a8f1b44989685e668489b0a25437733756c5a34a1d6";

interface BuildAccountParams {
  walletId: string;
  publicKey: string;
  classHash?: string;
  userJwt: string;
  userId?: string;
  origin?: string;
  paymasterRpc?: any;
}

/**
 * Build constructor calldata for OpenZeppelin AccountUpgradeable
 * Constructor signature: constructor(public_key: felt252)
 */
function buildReadyConstructor(publicKey: string) {
  // OpenZeppelin AccountUpgradeable only takes a single public_key parameter
  return [publicKey];
}

/**
 * Compute the Ready account address for a given public key
 */
export function computeReadyAddress(publicKey: string, classHash?: string) {
  const accountClassHash = classHash || ACCOUNT_CLASS_HASH;
  const calldata = buildReadyConstructor(publicKey);
  return hash.calculateContractAddressFromHash(
    publicKey,
    accountClassHash,
    calldata,
    0,
  );
}

/**
 * Get Starknet wallet from Privy
 */
export async function getStarknetWallet(walletId: string) {
  if (!walletId) throw new Error("walletId is required");
  const privy = getPrivyClient();
  const wallet: any = await privy.wallets().get(walletId);
  const chainType = wallet?.chainType || wallet?.chain_type;
  if (!wallet || !chainType || chainType !== "starknet") {
    throw new Error("Provided wallet is not a Starknet wallet");
  }
  const publicKey: string | undefined = wallet.public_key || wallet.publicKey;
  if (!publicKey) throw new Error("Wallet missing Starknet public key");
  const address: string | undefined = wallet.address;
  return { publicKey, address, chainType, wallet };
}

/**
 * Fetch public key from Privy Wallet API
 */
export async function getStarknetPublicKey({
  walletId,
}: {
  walletId: string;
}): Promise<string> {
  const { publicKey } = await getStarknetWallet(walletId);
  return publicKey.startsWith("0x") ? publicKey : `0x${publicKey}`;
}

/**
 * Call the Privy Wallet API raw_sign endpoint
 */
export async function rawSign(
  walletId: string,
  messageHash: string,
  opts: { userJwt: string; userId?: string; origin?: string },
): Promise<string> {
  const authPrivateKey = process.env.PRIVY_WALLET_AUTH_PRIVATE_KEY;
  if (!authPrivateKey) throw new Error("Missing PRIVY_WALLET_AUTH_PRIVATE_KEY");

  const privy = getPrivyClient();
  
  const result = await privy.wallets().rawSign(walletId, {
    params: {
      hash: messageHash,
    },
    authorization_context: {
      authorization_private_keys: [authPrivateKey],
    },
  });

  const sig = result.signature || result;
  if (!sig || typeof sig !== "string") {
    throw new Error("No signature returned from Privy");
  }

  return sig.startsWith("0x") ? sig : `0x${sig}`;
}

/**
 * Build a Starknet Account object with a Privy-backed signer
 */
export async function buildAccount({
  walletId,
  publicKey,
  classHash,
  userJwt,
  userId,
  origin,
  paymasterRpc,
}: BuildAccountParams): Promise<{ account: Account; address: string }> {
  console.log("PRIVY: buildAccount called for walletId:", walletId);

  const accountClassHash = classHash || ACCOUNT_CLASS_HASH;
  if (!accountClassHash) {
    console.log("PRIVY: ERROR - Missing ACCOUNT_CLASS_HASH in buildAccount");
    throw new Error("Missing ACCOUNT_CLASS_HASH");
  }

  const provider = getRpcProvider();
  const constructorCalldata = buildReadyConstructor(publicKey);
  const address = hash.calculateContractAddressFromHash(
    publicKey,
    accountClassHash,
    constructorCalldata,
    0,
  );
  console.log("PRIVY: Account address computed:", address);

  console.log("PRIVY: Creating Account instance with Privy-backed signer");
  const account = new Account({
    provider,
    address,
    signer: new (class extends RawSigner {
      async signRaw(messageHash: string): Promise<[string, string]> {
        console.log(
          "PRIVY: Signing message hash via Privy raw_sign:",
          messageHash,
        );
        const sig = await rawSign(walletId, messageHash, {
          userJwt,
          userId,
          origin,
        });
        console.log("PRIVY: Signature received from Privy");
        const body = sig.slice(2);
        return [`0x${body.slice(0, 64)}`, `0x${body.slice(64)}`];
      }
    })(),
    ...(paymasterRpc ? { paymaster: paymasterRpc } : {}),
  });
  console.log(
    "PRIVY: Account instance created",
    paymasterRpc ? "with paymaster" : "without paymaster",
  );

  return { account, address };
}

/**
 * Deploys the Privy wallet account contract using paymaster (matching starknet-privy-demo)
 * This function deploys the account without any initial calls, unlike the reference which calls get_counter
 */
export async function deployPrivyAccount({
  walletId,
  publicKey,
  classHash,
  userJwt,
  userId,
  origin,
}: Omit<BuildAccountParams, "paymasterRpc">): Promise<{
  transactionHash: string;
  address: string;
}> {
  console.log("PRIVY: deployPrivyAccount called for walletId:", walletId);

  const accountClassHash = classHash || ACCOUNT_CLASS_HASH;
  if (!accountClassHash) {
    console.log("PRIVY: ERROR - Missing ACCOUNT_CLASS_HASH");
    throw new Error("Missing ACCOUNT_CLASS_HASH");
  }
  console.log("PRIVY: Using account class hash:", accountClassHash);

  // Setup paymaster (will throw if not configured properly)
  console.log("PRIVY: Setting up paymaster");
  const { paymasterRpc, isSponsored, gasToken } = await setupPaymaster();
  console.log(
    "PRIVY: Paymaster setup complete - Mode:",
    isSponsored ? "sponsored" : "default",
    "GasToken:",
    gasToken || "N/A",
  );

  const constructorCalldata = buildReadyConstructor(publicKey);
  const contractAddress = hash.calculateContractAddressFromHash(
    publicKey,
    accountClassHash,
    constructorCalldata,
    0,
  );
  console.log("PRIVY: Computed contract address:", contractAddress);

  // Paymaster deployment data requires hex-encoded calldata
  const constructorHex: string[] = (
    Array.isArray(constructorCalldata)
      ? (constructorCalldata as any[])
      : ([] as any[])
  ).map((v: any) => num.toHex(v));
  console.log(
    "PRIVY: Constructor calldata encoded, length:",
    constructorHex.length,
  );

  const deploymentData = {
    class_hash: accountClassHash,
    salt: publicKey,
    calldata: constructorHex,
    address: contractAddress,
    version: 1,
  } as const;
  console.log("PRIVY: Deployment data prepared");

  // Build account with paymaster RPC
  console.log("PRIVY: Building account with Privy signer");
  const { account } = await buildAccount({
    walletId,
    publicKey,
    classHash: accountClassHash,
    userJwt,
    userId,
    origin,
    paymasterRpc,
  });
  console.log("PRIVY: Account built successfully");

  // Prepare paymaster fee details with correct structure
  // Match the reference implementation's structure exactly
  const paymasterDetails: any = isSponsored
    ? {
        feeMode: { mode: "sponsored" as const },
        deploymentData,
      }
    : {
        feeMode: { mode: "default" as const, gasToken },
        deploymentData,
      };

  console.log(
    `PRIVY: Processing with paymaster in ${isSponsored ? "sponsored" : "default"} mode...`,
  );

  let maxFee = undefined;

  // Estimate fees if not sponsored, then apply a 1.5x safety margin to maxFee
  if (!isSponsored) {
    console.log("PRIVY: Estimating fees for default mode...");
    const feeEstimation = await account.estimatePaymasterTransactionFee(
      [], // Empty calls for pure deployment (no initial transaction)
      paymasterDetails,
    );
    const suggested = feeEstimation.suggested_max_fee_in_gas_token;
    console.log("PRIVY: Estimated fee:", suggested.toString());
    const withMargin15 = (v: any) => {
      const bi = BigInt(v.toString());
      return (bi * BigInt(3) + BigInt(1)) / BigInt(2); // ceil(1.5x) - match reference implementation
    };
    maxFee = withMargin15(suggested);
    console.log("PRIVY: Max fee with 1.5x margin:", maxFee.toString());
  }

  // Execute deployment with paymaster
  // Unlike the reference which includes initialCall for get_counter,
  // we deploy without any initial transaction (empty calls array)
  console.log("PRIVY: Executing paymaster transaction...");
  const res = await account.executePaymasterTransaction(
    [], // Empty calls array - pure deployment without initial invoke
    paymasterDetails,
    maxFee,
  );

  console.log("PRIVY: Transaction hash:", res.transaction_hash);

  return {
    transactionHash: res.transaction_hash,
    address: contractAddress,
  };
}
