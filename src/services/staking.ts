import { Contract, type RpcProvider } from "starknet";

import MINTING_ABI from "@/abi/minting.abi.json";
import STAKING_ABI from "@/abi/staking.abi.json";
import {
  getProvider,
  SN_MINTING_CURVE_ADRESS,
  SN_STAKING_ADRESS,
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
    const mintingContract = new Contract(
      MINTING_ABI,
      SN_MINTING_CURVE_ADRESS,
      this.provider,
    );

    const { data: yearlyMinting, error } = await tryCatch(
      mintingContract.call("yearly_mint"),
    );

    if (yearlyMinting) {
      return new MyNumber(yearlyMinting.toString(), STRK_DECIMALS);
    }

    if (error) {
      console.error("yearlyMintingError", error);
      return MyNumber.fromZero();
    }
  }
  async getSNTotalStaked() {
    const stakingContract = new Contract(
      STAKING_ABI,
      SN_STAKING_ADRESS,
      this.provider,
    );

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
}

export default StakingService;
