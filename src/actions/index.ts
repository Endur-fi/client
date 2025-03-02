"use server";

import { DuneClient } from "@duneanalytics/client-sdk";
import axios from "axios";
import { Contract } from "starknet";

import ekuboPositionAbi from "@/abi/ekubo.position.abi.json";
import erc4626Abi from "@/abi/erc4626.abi.json";
import nostraLpAbi from "@/abi/nostra.lp.abi.json";

import { getProvider, STRK_DECIMALS, VESU_vXSTRK_ADDRESS } from "@/constants";
import MyNumber from "@/lib/MyNumber";
import { EKUBO_POSITION_ADDRESS, XSTRK_ADDRESS } from "@/store/ekubo.store";
import {
  i_XSTRK_C_CONTRACT_ADDRESS,
  i_XSTRK_CONTRACT_ADDRESS,
  LP_TOKEN_CONTRACT_ADDRESS,
  N_XSTRK_C_CONTRACT_ADDRESS,
  N_XSTRK_CONTRACT_ADDRESS,
} from "@/store/nostra.store";

const dune = new DuneClient(process.env.DUNE_API_KEY!);

export const getAvgWaitTime = async () => {
  try {
    const query_result = await dune.getLatestResult({ queryId: 4345214 });
    return query_result.result?.rows[0]?.wait_time_hours as string;
  } catch (e) {
    console.warn("Failed to fetch avg wait time", e);
    return "4hr"; // something dummy for now. need to take this to backend route
  }
};

export const getVxSTRKBalance = async (
  blockNumber: string,
  userAddress: string,
) => {
  const provider = getProvider();

  if (!blockNumber || !userAddress || !provider) return 0;

  let totalBalance = 0;

  try {
    const VESU_xSTRK = VESU_vXSTRK_ADDRESS;

    const contract = new Contract(erc4626Abi, VESU_xSTRK, provider);

    const shares = await contract.call("balance_of", [userAddress], {
      blockIdentifier: Number(blockNumber) ?? "latest",
    });

    const balance = await contract.call("convert_to_assets", [shares], {
      blockIdentifier: Number(blockNumber) ?? "latest",
    });

    totalBalance += Number(
      new MyNumber(balance.toString(), STRK_DECIMALS).toEtherToFixedDecimals(2),
    );

    return totalBalance;
  } catch (error) {
    console.error("userXSTRKBalanceAtom [3]", error);
  }

  return totalBalance;
};

export const getHaikoxSTRKBalance = async (
  blockNumber: string,
  userAddress: string,
) => {
  if (!blockNumber || !userAddress) return 0;

  let sum = 0;

  try {
    const res = await axios.get(
      `https://app.haiko.xyz/api/v1/positions?network=mainnet&isActive=true&user=${userAddress}`,
    );

    if (res?.data) {
      res.data?.map((position: any) => {
        if (position.market.baseSymbol === "xSTRK") {
          sum += position.baseAmount + position.baseFees;
        } else if (position.market.quoteSymbol === "xSTRK") {
          sum += position.quoteAmount + position.quoteFees;
        }
      });
    }

    return sum;
  } catch (error) {
    console.error("userHaikoBalanceAtom [3]", error);
    return 0;
  }
};

export const getNostraxSTRKBalance = async (
  blockNo: string,
  userAddress: string,
) => {
  const provider = getProvider();

  if (!blockNo || !userAddress || !provider) return 0;

  const blockNumber = Number(blockNo);

  let totalBalance = 0;

  try {
    const contract = new Contract(
      erc4626Abi,
      N_XSTRK_CONTRACT_ADDRESS,
      provider,
    );

    const balance = await contract.call("balance_of", [userAddress], {
      blockIdentifier: blockNumber ?? "latest",
    });

    const bal = new MyNumber(balance.toString(), STRK_DECIMALS);
    totalBalance += Number(bal.toEtherToFixedDecimals(2));
  } catch (error) {
    console.error("usernxSTRKBalance [3]", error);
    return 0;
  }

  try {
    const contract = new Contract(
      erc4626Abi,
      N_XSTRK_C_CONTRACT_ADDRESS,
      provider,
    );

    const balance = await contract.call("balance_of", [userAddress], {
      blockIdentifier: blockNumber ?? "latest",
    });

    const bal = new MyNumber(balance.toString(), STRK_DECIMALS);
    totalBalance += Number(bal.toEtherToFixedDecimals(2));
  } catch (error) {
    console.error("usernxSTRKcBalance [3]", error);
    return 0;
  }

  try {
    const contract = new Contract(
      erc4626Abi,
      i_XSTRK_CONTRACT_ADDRESS,
      provider,
    );

    const balance = await contract.call("balance_of", [userAddress], {
      blockIdentifier: blockNumber ?? "latest",
    });

    const bal = new MyNumber(balance.toString(), STRK_DECIMALS);
    totalBalance += Number(bal.toEtherToFixedDecimals(2));
  } catch (error) {
    console.error("userixSTRKBalance [3]", error);
    return 0;
  }

  try {
    const contract = new Contract(
      erc4626Abi,
      i_XSTRK_C_CONTRACT_ADDRESS,
      provider,
    );

    const balance = await contract.call("balance_of", [userAddress], {
      blockIdentifier: blockNumber ?? "latest",
    });

    const bal = new MyNumber(balance.toString(), STRK_DECIMALS);
    totalBalance += Number(bal.toEtherToFixedDecimals(2));
  } catch (error) {
    console.error("userixSTRKcBalance [3]", error);
    return 0;
  }

  try {
    const contract = new Contract(
      nostraLpAbi,
      LP_TOKEN_CONTRACT_ADDRESS,
      provider,
    );

    const balance = await contract.call("balance_of", [userAddress], {
      blockIdentifier: blockNumber ?? "latest",
    });
    const totalSupply = await contract.call("total_supply");
    const getReserves: any = await contract.call("get_reserves");

    const balanceStr = new MyNumber(
      balance.toString(),
      STRK_DECIMALS,
    ).toEtherStr();

    const totalSupplyStr = new MyNumber(
      totalSupply.toString(),
      STRK_DECIMALS,
    ).toEtherStr();

    const getReserves0Str = new MyNumber(
      getReserves[0].toString(),
      STRK_DECIMALS,
    ).toEtherStr();

    console.log(balanceStr, "balance_lptoken");
    console.log(totalSupplyStr, "totalSupply");
    console.log(getReserves0Str, "getReserves[0]");

    const lpTokenBalance =
      (Number(balanceStr) / Number(totalSupplyStr)) * Number(getReserves0Str);

    console.log(lpTokenBalance, "lpTokenBalance");

    const bal = MyNumber.fromEther(lpTokenBalance.toFixed(8), STRK_DECIMALS);
    totalBalance += Number(bal.toEtherToFixedDecimals(2));
  } catch (error) {
    console.error("userLPTokenBalance [3]", error);
    return 0;
  }

  return totalBalance;
};

export const getEkuboxSTRKBalance = async (
  blockNo: string,
  userAddress: string,
) => {
  const provider = getProvider();

  if (!blockNo || !userAddress || !provider) return 0;

  const blockNumber = Number(blockNo);

  let xSTRKAmount = MyNumber.fromZero();
  let STRKAmount = MyNumber.fromZero();

  try {
    const res = await axios.get(
      `https://mainnet-api.ekubo.org/positions/${userAddress}`,
    );

    const positionContract = new Contract(
      ekuboPositionAbi,
      EKUBO_POSITION_ADDRESS,
      provider,
    );

    if (res?.data) {
      const filteredData = res?.data?.data?.filter(
        (position: any) =>
          position.pool_key.token0 === XSTRK_ADDRESS ||
          position.pool_key.token1 === XSTRK_ADDRESS,
      );

      if (filteredData) {
        for (let i = 0; i < filteredData.length; i++) {
          const position = filteredData[i];
          if (!position.id) continue;

          console.log(position, "position");
          const result: any = await positionContract.call(
            "get_token_info",
            [
              position?.id,
              position.pool_key,
              {
                lower: {
                  mag: Math.abs(position?.bounds?.lower),
                  sign: position?.bounds?.lower < 0 ? 1 : 0,
                },
                upper: {
                  mag: Math.abs(position?.bounds?.upper),
                  sign: position?.bounds?.upper < 0 ? 1 : 0,
                },
              },
            ],
            {
              blockIdentifier: blockNumber ?? "latest",
            },
          );

          console.log(result, "position responsee2");

          if (XSTRK_ADDRESS === position.pool_key.token0) {
            xSTRKAmount = xSTRKAmount.operate(
              "plus",
              new MyNumber(
                result.amount0.toString(),
                STRK_DECIMALS,
              ).toEtherToFixedDecimals(6),
            );
            xSTRKAmount = xSTRKAmount.operate(
              "plus",
              new MyNumber(
                result.fees0.toString(),
                STRK_DECIMALS,
              ).toEtherToFixedDecimals(6),
            );
            STRKAmount = STRKAmount.operate(
              "plus",
              new MyNumber(
                result.amount1.toString(),
                STRK_DECIMALS,
              ).toEtherToFixedDecimals(6),
            );
            STRKAmount = STRKAmount.operate(
              "plus",
              new MyNumber(
                result.fees1.toString(),
                STRK_DECIMALS,
              ).toEtherToFixedDecimals(6),
            );
          } else {
            xSTRKAmount = xSTRKAmount.operate(
              "plus",
              new MyNumber(
                result.amount1.toString(),
                STRK_DECIMALS,
              ).toEtherToFixedDecimals(6),
            );
            xSTRKAmount = xSTRKAmount.operate(
              "plus",
              new MyNumber(
                result.fees1.toString(),
                STRK_DECIMALS,
              ).toEtherToFixedDecimals(6),
            );
            STRKAmount = STRKAmount.operate(
              "plus",
              new MyNumber(
                result.amount0.toString(),
                STRK_DECIMALS,
              ).toEtherToFixedDecimals(6),
            );
            STRKAmount = STRKAmount.operate(
              "plus",
              new MyNumber(
                result.fees0.toString(),
                STRK_DECIMALS,
              ).toEtherToFixedDecimals(6),
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("userEkuboxSTRKPositionsQueryAtom [3]", error);
  }

  return Number(xSTRKAmount.toEtherToFixedDecimals(2));
};
