import { Contract, type RpcProvider } from "starknet";

import MINTING_ABI from "@/abi/minting.abi.json";
import STAKING_ABI from "@/abi/staking.abi.json";
import {
  getProvider,
  SN_MINTING_CURVE_ADRESS,
  SN_STAKING_ADRESS,
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

  async getYearlyMinting(lstDecimals: number) {
    if (!lstDecimals) {
      return MyNumber.fromZero();
    }

    const mintingContract = new Contract(
      MINTING_ABI,
      SN_MINTING_CURVE_ADRESS,
      this.provider,
    );

    const { data: yearlyMinting, error } = await tryCatch(
      mintingContract.call("yearly_mint"),
    );

    if (yearlyMinting) {
      return new MyNumber(yearlyMinting.toString(), lstDecimals);
    }

    if (error) {
      console.error("yearlyMintingError", error);
      return MyNumber.fromZero();
    }
  }
  async getSNTotalStaked(lstDecimals: number) {
    if (!lstDecimals) {
      return MyNumber.fromZero();
    }

    const stakingContract = new Contract(
      STAKING_ABI,
      SN_STAKING_ADRESS,
      this.provider,
    );

    const { data: totalStaked, error } = await tryCatch(
      stakingContract.call("get_total_stake"),
    );

    if (totalStaked) {
      return new MyNumber(totalStaked.toString(), lstDecimals);
    }

    if (error) {
      console.error("snTotalStakedError", error);
      return MyNumber.fromZero();
    }
  }
}

export default StakingService;
