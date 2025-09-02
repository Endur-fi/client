import { type BlockIdentifier, Contract, type RpcProvider } from "starknet";

import ERC_4626_ABI from "@/abi/erc4626.abi.json";
import NOSTRA_STRK_ABI from "@/abi/nostra.strk.abi.json";
import {
  getProvider,
  NST_STRK_ADDRESS,
  xSTRK_TOKEN_MAINNET_DEPLOYMENT_BLOCK,
} from "@/constants";
import MyNumber from "@/lib/MyNumber";
import { isContractNotDeployed, tryCatch } from "@/lib/utils";

class LSTService {
  private provider: RpcProvider;

  constructor() {
    this.provider = getProvider();

    if (!this.provider) {
      console.error("Provider not found");
      throw new Error("Provider not found");
    }
  }

  getLSTContract(lstAddress: string) {
    if (!lstAddress) {
      throw new Error("LST address is required");
    }
    return new Contract({abi: ERC_4626_ABI, address: lstAddress, providerOrAccount: this.provider});
  }

  getNstSTRKContract() {
    return new Contract({abi: NOSTRA_STRK_ABI, address: NST_STRK_ADDRESS, providerOrAccount: this.provider});
  }

  async getTotalSupply(
    lstAddress: string,
    decimals: number,
    blockNumber?: BlockIdentifier,
  ) {
    const lstContract = this.getLSTContract(lstAddress);
    if (
      isContractNotDeployed(blockNumber, xSTRK_TOKEN_MAINNET_DEPLOYMENT_BLOCK)
    ) {
      return MyNumber.fromZero();
    }

    const { data: balance, error } = await tryCatch(
      lstContract.call("total_supply", [], {
        blockIdentifier: blockNumber,
      }),
    );

    if (balance) {
      return new MyNumber(balance.toString(), decimals);
    }

    if (error) {
      console.error("totalSupplyError", error.message);
      return MyNumber.fromZero();
    }

    return MyNumber.fromZero();
  }

  async getTotalStaked(
    lstAddress: string,
    decimals: number,
    blockNumber?: BlockIdentifier,
  ) {
    const lstContract = this.getLSTContract(lstAddress);
    if (
      isContractNotDeployed(blockNumber, xSTRK_TOKEN_MAINNET_DEPLOYMENT_BLOCK)
    ) {
      return MyNumber.fromZero();
    }
    const { data: balance, error } = await tryCatch(
      lstContract.call("total_assets", [], {
        blockIdentifier: blockNumber,
      }),
    );

    if (balance) {
      return new MyNumber(balance.toString(), decimals);
    }

    if (error) {
      console.error("totalStakedError", error.message);
      return MyNumber.fromZero();
    }

    return MyNumber.fromZero();
  }
}

export default LSTService;
