import { type RpcProvider } from "starknet";

import { getProvider, STRK_DECIMALS } from "@/constants";
import MyNumber from "@/lib/MyNumber";
import { tryCatch } from "@/lib/utils";
import { getLSTContract } from "@/store/lst.store";

class LSTService {
  private provider: RpcProvider;

  constructor() {
    this.provider = getProvider();

    if (!this.provider) {
      console.error("Provider not found");
      throw new Error("Provider not found");
    }
  }

  async getTotalSupply() {
    const lstContract = getLSTContract(this.provider);

    const { data: balance, error } = await tryCatch(
      lstContract.call("total_supply"),
    );

    if (balance) {
      return new MyNumber(balance.toString(), STRK_DECIMALS);
    }

    if (error) {
      console.error("totalSupplyError", error.message);
      return MyNumber.fromZero();
    }
  }

  async getTotalStaked() {
    const lstContract = getLSTContract(this.provider);

    const { data: balance, error } = await tryCatch(
      lstContract.call("total_assets"),
    );

    if (balance) {
      return new MyNumber(balance.toString(), STRK_DECIMALS);
    }

    if (error) {
      console.error("totalStakedError", error.message);
      return MyNumber.fromZero();
    }
  }
}

export default LSTService;
