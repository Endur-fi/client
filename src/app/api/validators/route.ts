import { NextResponse } from "next/server";

import { getProvider, LST_CONFIG, STRK_DECIMALS } from "@/constants";
import MyNumber from "@/lib/MyNumber";
import { getAssetPrice, tryCatch } from "@/lib/utils";
import LSTService from "@/services/lst";
import StakingService from "@/services/staking";
import { randomBytes } from "ethers";

export const revalidate = 60 * 60; // 1 hour

export async function GET(_req: Request) {
    // Add dynamic logic later to return all Supported Validators and their Stake

    const validators =[{
      name: "Karnot",
      address: '',
      staked: {
        STRK: {
            amount: 0,
            usdValue: 0
        },
        BTC: {
            amount: 0,
            usdValue: 0
        }
      },
      stakeUSDValue: 1000,
    }, {
        name: "Argent",
        address: '',
        staked: {
          STRK: {
              amount: 0,
              usdValue: 0
          },
          BTC: {
              amount: 0,
              usdValue: 0
          }
        },
        stakeUSDValue: 500
    }, {
        name: "Avnu",
        address: '',
        staked: {
          STRK: {
              amount: 0,
              usdValue: 0
          },
          BTC: {
              amount: 0,
              usdValue: 0
          }
        },
        stakeUSDValue: 250
    }];

    // ! update this hardcoded logic too
    return NextResponse.json(process.env.NEXT_PUBLIC_CHAIN_ID == 'SN_SEPOLIA' ? validators : validators.slice(0, 1));
}
