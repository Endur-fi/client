import { type BlockIdentifier, Contract, type RpcProvider } from "starknet";

import ERC_4626_ABI from "@/abi/erc4626.abi.json";
import NOSTRA_STRK_ABI from "@/abi/nostra.strk.abi.json";
import {
  getProvider,
  LST_ADDRRESS,
  NST_STRK_ADDRESS,
  STRK_DECIMALS,
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

  getLSTContract(provider: RpcProvider) {
    return new Contract({abi: ERC_4626_ABI, address: LST_ADDRRESS, providerOrAccount: provider});
  }

  getNstSTRKContract(provider: RpcProvider) {
    return new Contract({abi: NOSTRA_STRK_ABI, address: NST_STRK_ADDRESS, providerOrAccount: provider});
  }

  async getTotalSupply(blockNumber?: BlockIdentifier) {
    const lstContract = this.getLSTContract(this.provider);
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
      return new MyNumber(balance.toString(), STRK_DECIMALS);
    }

    if (error) {
      console.error("totalSupplyError", error.message);
      return MyNumber.fromZero();
    }

    return MyNumber.fromZero();
  }

  async getTotalStaked(blockNumber?: BlockIdentifier) {
    const lstContract = this.getLSTContract(this.provider);
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
      return new MyNumber(balance.toString(), STRK_DECIMALS);
    }

    if (error) {
      console.error("totalStakedError", error.message);
      return MyNumber.fromZero();
    }

    return MyNumber.fromZero();
  }
}

export default LSTService;
