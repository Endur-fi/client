import { NextResponse } from "next/server";

import { getProvider, LST_CONFIG, STRK_DECIMALS } from "@/constants";
import MyNumber from "@/lib/MyNumber";
import LSTService from "@/services/lst";

export const revalidate = 120;

//TODO: remove if not needed
export async function GET(_req: Request) {
  const provider = getProvider();

  if (!provider) {
    return NextResponse.json("Provider not found");
  }

  const lstService = new LSTService();

  const totalSupply = await lstService.getTotalSupply(
    LST_CONFIG.STRK.LST_ADDRESS,
    LST_CONFIG.STRK.DECIMALS,
  );

  if (totalSupply) {
    const totalSupplyNum = Number(
      new MyNumber(
        totalSupply.toString(),
        STRK_DECIMALS,
      ).toEtherToFixedDecimals(6),
    );

    const response = new Response(totalSupplyNum.toString());

    return response;
  }

  return NextResponse.json({
    message: "totalSupplyError",
  });
}
