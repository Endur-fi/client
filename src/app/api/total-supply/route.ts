import { NextResponse } from "next/server";
import { RpcProvider } from "starknet";

import { getProvider, STRK_DECIMALS } from "@/constants";
import MyNumber from "@/lib/MyNumber";
import { getLSTContract } from "@/store/lst.store";

export const revalidate = 120;

export async function GET(_req: Request) {
  const provider = getProvider();

  if (!provider) {
    return NextResponse.json("Provider not found");
  }

  try {
    const lstContract = getLSTContract(provider as RpcProvider);
    const totalStaked = await lstContract.call("total_assets");
    const totalSupply = await lstContract.call("total_supply");

    const tvlInStrk = Number(
      new MyNumber(totalStaked.toString(), STRK_DECIMALS).toEtherStr(),
    );

    const rate =
      Number(totalStaked.toString()) / Number(totalSupply.toString());

    const tvlInXStrk = tvlInStrk / rate;

    const response = new Response(tvlInXStrk.toString());

    return response;
  } catch (error) {
    console.error("totalStakedError", error);
    return NextResponse.json({
      message: "totalStakedError",
      error,
    });
  }
}
