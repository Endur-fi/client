import { Contract, type RpcProvider } from "starknet";

import ERC_4626_ABI from "@/abi/erc4626.abi.json";
import NOSTRA_STRK_ABI from "@/abi/nostra.strk.abi.json";
import {
  getProvider,
  LST_ADDRRESS,
  NST_STRK_ADDRESS,
  STRK_DECIMALS,
} from "@/constants";
import MyNumber from "@/lib/MyNumber";
import { tryCatch } from "@/lib/utils";

class LSTService {
  private provider: RpcProvider;

  constructor() {
    this.provider = getProvider();

    if (!this.provider) {
      console.error("Provider not found");
      throw new Error("Provider not found");
    }
  }

  getLSTContract(provider: RpcProvider) {
    return new Contract(ERC_4626_ABI, LST_ADDRRESS, provider);
  }

  getNstSTRKContract(provider: RpcProvider) {
    return new Contract(NOSTRA_STRK_ABI, NST_STRK_ADDRESS, provider);
  }

  async getTotalSupply() {
    const lstContract = this.getLSTContract(this.provider);

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
    const lstContract = this.getLSTContract(this.provider);

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
