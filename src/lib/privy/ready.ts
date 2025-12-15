import {
  Account,
  CallData,
  CairoOption,
  CairoOptionVariant,
  CairoCustomEnum,
  hash,
  num,
} from "starknet";
import { getRpcProvider, setupPaymaster } from "./provider";
import { RawSigner } from "./rawSigner";
import { getPrivyClient } from "./privyClient";

function buildReadyConstructor(publicKey: string) {
  const signerEnum = new CairoCustomEnum({
    Starknet: { pubkey: publicKey },
  });
  const guardian = new CairoOption(CairoOptionVariant.None);
  return CallData.compile({ owner: signerEnum, guardian });
}

/**
 * Compute the Ready account address for a given public key.
 * Uses READY_CLASSHASH from environment for the class hash.
 */
export function computeReadyAddress(publicKey: string) {
  const calldata = buildReadyConstructor(publicKey);
  return hash.calculateContractAddressFromHash(
    publicKey,
    process.env.READY_CLASSHASH as string,
    calldata,
    0,
  );
}

export async function buildReadyAccount({
  walletId,
  publicKey,
  classHash,
  userJwt,
  userId,
  origin,
  paymasterRpc,
}: {
  walletId: string;
  publicKey: string;
  classHash: string;
  userJwt: string;
  userId?: string;
  origin?: string;
  paymasterRpc?: any;
}): Promise<{ account: Account; address: string }> {
  const provider = getRpcProvider();
  const constructorCalldata = buildReadyConstructor(publicKey);
  const address = hash.calculateContractAddressFromHash(
    publicKey,
    classHash,
    constructorCalldata,
    0,
  );
  const account = new Account({
    provider,
    address,
    signer: new (class extends RawSigner {
      async signRaw(messageHash: string): Promise<[string, string]> {
        const sig = await rawSign(walletId, messageHash, {
          userJwt,
          userId,
          origin,
        });
        const body = sig.slice(2);
        return [`0x${body.slice(0, 64)}`, `0x${body.slice(64)}`];
      }
    })(),
    ...(paymasterRpc ? { paymaster: paymasterRpc } : {}),
  });
  return { account, address };
}

export async function rawSign(
  walletId: string,
  messageHash: string,
  opts: { userJwt: string; userId?: string; origin?: string },
) {
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

export async function deployReadyAccount({
  walletId,
  publicKey,
  classHash,
  userJwt,
  userId,
  origin,
}: {
  walletId: string;
  publicKey: string;
  classHash: string;
  userJwt: string;
  userId?: string;
  origin?: string;
}) {
  const provider = getRpcProvider();
  const { paymasterRpc, isSponsored, gasToken } = await setupPaymaster();

  const constructorCalldata = buildReadyConstructor(publicKey);
  const contractAddress = hash.calculateContractAddressFromHash(
    publicKey,
    classHash,
    constructorCalldata,
    0,
  );

  // Paymaster deployment data requires hex-encoded calldata
  const constructorHex: string[] = (
    Array.isArray(constructorCalldata)
      ? (constructorCalldata as any[])
      : ([] as any[])
  ).map((v: any) => num.toHex(v));

  const deploymentData = {
    class_hash: classHash,
    salt: publicKey,
    calldata: constructorHex,
    address: contractAddress,
    version: 1,
  } as const;

  const { account } = await buildReadyAccount({
    walletId,
    publicKey,
    classHash,
    userJwt,
    userId,
    origin,
    paymasterRpc,
  });

  // Prepare paymaster fee details with correct structure
  const paymasterDetails = isSponsored
    ? {
        feeMode: { mode: "sponsored" as const },
        deploymentData,
      }
    : {
        feeMode: { mode: "default" as const, gasToken: gasToken! },
        deploymentData,
      };

  console.log(
    `Deploying wallet with paymaster in ${
      isSponsored ? "sponsored" : "default"
    } mode...`,
  );

  // Use deployAccount with paymaster
  // For paymaster deployment, we need to use executePaymasterTransaction
  // with an empty call array to just deploy
  const emptyCall = {
    contractAddress,
    entrypoint: "0x0", // Empty call
    calldata: [],
  };

  let maxFee = undefined;

  // Estimate fees if not sponsored
  if (!isSponsored) {
    console.log("Estimating fees...");
    const feeEstimation = await account.estimatePaymasterTransactionFee(
      [emptyCall],
      paymasterDetails,
    );
    const suggested = feeEstimation.suggested_max_fee_in_gas_token;
    console.log("Estimated fee:", suggested.toString());
    const withMargin15 = (v: any) => {
      const bi = BigInt(v.toString());
      return (bi * BigInt(3) + BigInt(1)) / BigInt(2); // ceil(1.5x)
    };
    maxFee = withMargin15(suggested);
  }

  // Deploy account using paymaster transaction
  const res = await account.executePaymasterTransaction(
    [emptyCall],
    paymasterDetails,
    maxFee,
  );

  console.log("Deployment transaction hash:", res.transaction_hash);

  // Wait for transaction to be accepted
  await provider.waitForTransaction(res.transaction_hash);

  return res;
}

export async function getReadyAccount({
  walletId,
  publicKey,
  classHash,
  userJwt,
  userId,
  origin,
}: {
  walletId: string;
  publicKey: string;
  classHash: string;
  userJwt: string;
  userId?: string;
  origin?: string;
}): Promise<{ account: Account; address: string }> {
  return buildReadyAccount({
    walletId,
    publicKey,
    classHash,
    userJwt,
    userId,
    origin,
  });
}

/**
 * Check if a wallet address is deployed on-chain
 */
export async function isWalletDeployed(address: string): Promise<boolean> {
  try {
    const provider = getRpcProvider();
    const classHash = await provider.getClassHashAt(address);
    // If classHash exists, wallet is deployed
    return !!classHash;
  } catch (error: any) {
    // If error indicates contract doesn't exist, wallet is not deployed
    if (
      error?.message?.includes("Contract not found") ||
      error?.message?.includes("not found")
    ) {
      return false;
    }
    // Re-throw other errors
    throw error;
  }
}
