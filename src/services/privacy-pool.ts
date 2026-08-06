import { Contract, type RpcProvider } from "starknet";

import PRIVACY_POOL_ABI from "@/abi/privacy_pool.abi.json";
import { getProvider, PRIVACY_POOL_ADDRESS, STRK_DECIMALS } from "@/constants";
import MyNumber from "@/lib/MyNumber";
import { tryCatch } from "@/lib/utils";

class PrivacyPoolService {
  private provider: RpcProvider;

  constructor() {
    this.provider = getProvider();

    if (!this.provider) {
      console.error("Provider not found");
      throw new Error("Provider not found");
    }
  }

  getPrivacyPoolContract() {
    return new Contract({
      abi: PRIVACY_POOL_ABI,
      address: PRIVACY_POOL_ADDRESS,
      providerOrAccount: this.provider,
    });
  }

  /**
   * Fee charged by the privacy pool on a Shield & Stake, always denominated in
   * STRK. Throws on failure so the caller's query can retry instead of caching
   * a stale fallback for the whole refetch window; callers fall back to
   * `SHIELD_AND_STAKE_FEE_STRK_FALLBACK` once the retries are exhausted.
   */
  async getFeeAmount() {
    const privacyPoolContract = this.getPrivacyPoolContract();

    const { data: feeAmount, error } = await tryCatch(
      privacyPoolContract.call("get_fee_amount"),
    );

    if (feeAmount !== undefined && feeAmount !== null) {
      return new MyNumber(feeAmount.toString(), STRK_DECIMALS);
    }

    console.error("privacyPoolFeeAmountError", error);
    throw error ?? new Error("Empty get_fee_amount response");
  }
}

export default PrivacyPoolService;
