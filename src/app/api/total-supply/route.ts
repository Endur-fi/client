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
    const totalSupply = await lstContract.call("total_supply");

    const totalSupplyNum = Number(
      new MyNumber(totalSupply.toString(), STRK_DECIMALS).toEtherToFixedDecimals(6),
    );

    const response = new Response(totalSupplyNum);

    return response;
  } catch (error) {
    console.error("totalStakedError", error);
    return NextResponse.json({
      message: "totalStakedError",
      error,
    });
  }
}
