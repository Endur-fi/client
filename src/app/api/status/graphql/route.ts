import { gql } from "@apollo/client";
import { NextResponse } from "next/server";
import { Contract } from "starknet";

import WqAbi from "@/abi/wq.abi.json";
import apolloClient from "@/lib/apollo-client";

import { getProvider } from "@/constants";

export const revalidate = 0;

export async function GET(_req: Request, context: any) {
  const { params } = context;

  const withdrawlQueueAddress = params.withdrawlQueueAddress;

  if (!withdrawlQueueAddress) {
    const res = NextResponse.json(
      {
        error: "Withdrawal Queue Address Required",
      },
      { status: 400 },
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  const provider = getProvider();

  if (!provider) {
    const res = NextResponse.json(
      { message: "Provider not found" },
      { status: 500 },
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  const wqContract = new Contract({
    abi: WqAbi,
    address: withdrawlQueueAddress,
    providerOrAccount: provider,
  });

  let contractReqId;
  let apiReqId;

  let latest_block = 0;
  try {
    latest_block = (await provider.getBlockLatestAccepted()).block_number;
  } catch (error) {
    console.error("latestBlockError:", error);
    const res = NextResponse.json(
      {
        message: "latestBlockError",
        error,
      },
      { status: 500 },
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
  console.log("latest_block", latest_block);

  try {
    const res = await wqContract.call("get_queue_state", [], {
      blockIdentifier: Math.max(latest_block - 10, 0), // check the state matches for atleast 2 blocks before
    });
    // @ts-ignore
    contractReqId = Number(res?.max_request_id);
  } catch (error) {
    console.error("contractReqIdError:", error);
    const res = NextResponse.json(
      {
        message: "contractReqIdError:",
        error,
      },
      { status: 500 },
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  try {
    const { data } = await apolloClient.query({
      query: gql`
        query FindFirstWithdraw_queue(
          $orderBy: [Withdraw_queueOrderByWithRelationInput!]
        ) {
          findFirstWithdraw_queue(orderBy: $orderBy) {
            request_id
          }
        }
      `,
      variables: {
        orderBy: [
          {
            request_id: "desc",
          },
        ],
      },
    });

    apiReqId = data?.findFirstWithdraw_queue?.request_id;
  } catch (error) {
    console.error("apiReqIdError:", error);
    const res = NextResponse.json(
      {
        message: "apiReqIdError:",
        error,
      },
      { status: 500 },
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  console.log("contractReqId", contractReqId);
  console.log("apiReqId", apiReqId);
  if (contractReqId <= apiReqId) {
    return NextResponse.json({
      status: "active",
      contractReqId,
      apiReqId,
    });
  }

  return NextResponse.json({
    status: "failure",
    contractReqId,
    apiReqId,
  });
}
