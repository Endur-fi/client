import { NextResponse } from "next/server";

import { getProvider, LST_CONFIG, STRK_DECIMALS } from "@/constants";
import MyNumber from "@/lib/MyNumber";
import LSTService from "@/services/lst";

export const revalidate = 120;

export async function GET(_req: Request) {
  const provider = getProvider();

  if (!provider) {
    const res = NextResponse.json(
      { message: "Provider not found" },
      { status: 500 },
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
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

  const res = NextResponse.json(
    {
      message: "totalSupplyError",
    },
    { status: 500 },
  );
  res.headers.set("Cache-Control", "no-store");
  return res;
}
