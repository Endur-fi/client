import { Contract, type RpcProvider } from "starknet";

import MINTING_ABI from "@/abi/minting.abi.json";
import STAKING_ABI from "@/abi/staking.abi.json";
import STAKING_REWARD_ABI from "@/abi/staking-reward.abi.json";
import {
  getProvider,
  SN_MINTING_CURVE_ADRESS,
  SN_STAKING_ADRESS,
  SN_STAKING_REWARD_ADDRESS,
  STRK_DECIMALS,
} from "@/constants";
import MyNumber from "@/lib/MyNumber";
import { tryCatch } from "@/lib/utils";

class StakingService {
  private provider: RpcProvider;

  constructor() {
    this.provider = getProvider();

    if (!this.provider) {
      console.error("Provider not found");
      throw new Error("Provider not found");
    }
  }

  async getYearlyMinting() {
    const mintingContract = new Contract({
      abi: MINTING_ABI,
      address: SN_MINTING_CURVE_ADRESS,
      providerOrAccount: this.provider,
    });

    const { data: yearlyMinting, error } = await tryCatch(
      mintingContract.call("yearly_mint"),
    );

    if (yearlyMinting) {
      // Yearly minting is always in STRK (18 decimals)
      return new MyNumber(yearlyMinting.toString(), 18);
    }

    if (error) {
      console.error("yearlyMintingError", error);
      return MyNumber.fromZero();
    }

    return MyNumber.fromZero();
  }

  async getSNTotalStaked() {
    const stakingContract = new Contract({
      abi: STAKING_ABI,
      address: SN_STAKING_ADRESS,
      providerOrAccount: this.provider,
    });

    const { data: totalStaked, error } = await tryCatch(
      stakingContract.call("get_total_stake"),
    );

    if (totalStaked) {
      return new MyNumber(totalStaked.toString(), STRK_DECIMALS);
    }

    if (error) {
      console.error("snTotalStakedError", error);
      return MyNumber.fromZero();
    }
  }

  async getTotalStakingPower() {
    const stakingContract = new Contract(
      STAKING_ABI,
      SN_STAKING_ADRESS,
      this.provider,
    );

    const { data: totalStakingPower, error } = await tryCatch(
      stakingContract.call("get_current_total_staking_power"),
    );

    if (totalStakingPower) {
      const stakingPowers = totalStakingPower as any;
      return {
        totalStakingPowerSTRK: new MyNumber(
          stakingPowers[0].amount_18_decimals.toString(),
          18,
        ),
        totalStakingPowerBTC: new MyNumber(
          stakingPowers[1].amount_18_decimals.toString(),
          18,
        ),
      };
    }

    if (error) {
      console.error("snTotalStakedError", error);
      return {
        totalStakingPowerSTRK: MyNumber.fromZero(),
        totalStakingPowerBTC: MyNumber.fromZero(),
      };
    }

    return {
      totalStakingPowerSTRK: MyNumber.fromZero(),
      totalStakingPowerBTC: MyNumber.fromZero(),
    };
  }

  async getAlpha() {
    const stakingRewardContract = new Contract(
      STAKING_REWARD_ABI,
      SN_STAKING_REWARD_ADDRESS,
      this.provider,
    );

    const { data: alpha, error } = await tryCatch(
      stakingRewardContract.call("get_alpha"),
    );

    if (alpha) {
      return Number(alpha);
    }

    if (error) {
      console.error("alphaError", error);
      return 0;
    }

    return 0;
  }
}

export default StakingService;
