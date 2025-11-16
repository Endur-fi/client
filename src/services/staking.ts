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

// Interface for merged APY data response
export interface APYData {
  yearlyMinting: MyNumber;
  totalStakingPower: {
    totalStakingPowerSTRK: MyNumber;
    totalStakingPowerBTC: MyNumber;
  };
  alpha: number;
}

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

  // REMOVED: getSNTotalStaked - not needed/used anywhere

  async getTotalStakingPower() {
    const stakingContract = new Contract({
      abi: STAKING_ABI,
      address: SN_STAKING_ADRESS,
      providerOrAccount: this.provider,
    });

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
    const stakingRewardContract = new Contract({
      abi: STAKING_REWARD_ABI,
      address: SN_STAKING_REWARD_ADDRESS,
      providerOrAccount: this.provider,
    });

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

  /**
   * Fetches all APY-related data in a single optimized call using Promise.all
   * This merges three separate contract calls:
   * 1. yearly_mint from minting contract
   * 2. get_current_total_staking_power from staking contract  
   * 3. get_alpha from staking reward contract
   */
  async getAPYData(): Promise<APYData> {
    // Create contract instances
    const mintingContract = new Contract({
      abi: MINTING_ABI,
      address: SN_MINTING_CURVE_ADRESS,
      providerOrAccount: this.provider,
    });

    const stakingContract = new Contract({
      abi: STAKING_ABI,
      address: SN_STAKING_ADRESS,
      providerOrAccount: this.provider,
    });

    const stakingRewardContract = new Contract({
      abi: STAKING_REWARD_ABI,
      address: SN_STAKING_REWARD_ADDRESS,
      providerOrAccount: this.provider,
    });

    try {
      // Execute all three contract calls in parallel for optimal performance
      const [yearlyMintingResult, totalStakingPowerResult, alphaResult] = await Promise.all([
        tryCatch(mintingContract.call("yearly_mint")),
        tryCatch(stakingContract.call("get_current_total_staking_power")),
        tryCatch(stakingRewardContract.call("get_alpha")),
      ]);

      // Process yearly minting
      let yearlyMinting = MyNumber.fromZero();
      if (yearlyMintingResult.data) {
        yearlyMinting = new MyNumber(yearlyMintingResult.data.toString(), 18);
      } else if (yearlyMintingResult.error) {
        console.error("yearlyMintingError in merged call", yearlyMintingResult.error);
      }

      // Process total staking power
      let totalStakingPower = {
        totalStakingPowerSTRK: MyNumber.fromZero(),
        totalStakingPowerBTC: MyNumber.fromZero(),
      };
      if (totalStakingPowerResult.data) {
        const stakingPowers = totalStakingPowerResult.data as any;
        totalStakingPower = {
          totalStakingPowerSTRK: new MyNumber(
            stakingPowers[0].amount_18_decimals.toString(),
            18,
          ),
          totalStakingPowerBTC: new MyNumber(
            stakingPowers[1].amount_18_decimals.toString(),
            18,
          ),
        };
      } else if (totalStakingPowerResult.error) {
        console.error("totalStakingPowerError in merged call", totalStakingPowerResult.error);
      }

      // Process alpha
      let alpha = 0;
      if (alphaResult.data) {
        alpha = Number(alphaResult.data);
      } else if (alphaResult.error) {
        console.error("alphaError in merged call", alphaResult.error);
      }

      return {
        yearlyMinting,
        totalStakingPower,
        alpha,
      };
    } catch (error) {
      console.error("Error in merged APY data call", error);
      
      // Return default values on error
      return {
        yearlyMinting: MyNumber.fromZero(),
        totalStakingPower: {
          totalStakingPowerSTRK: MyNumber.fromZero(),
          totalStakingPowerBTC: MyNumber.fromZero(),
        },
        alpha: 0,
      };
    }
  }
}

export default StakingService;
