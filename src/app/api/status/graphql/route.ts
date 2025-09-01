import { gql } from "@apollo/client";
import { NextResponse } from "next/server";
import { Contract } from "starknet";

import WqAbi from "@/abi/wq.abi.json";
import apolloClient from "@/lib/apollo-client";

import { getProvider, WITHDRAWAL_QUEUE_ADDRESS } from "@/constants";

export const revalidate = 0;

export async function GET(_req: Request) {
  const provider = getProvider();

  if (!provider) {
    return NextResponse.json("Provider not found");
  }

  const wqContract = new Contract({abi: WqAbi, address: WITHDRAWAL_QUEUE_ADDRESS, providerOrAccount: provider});

  let contractReqId;
  let apiReqId;

  let latest_block = 0;
  try {
    latest_block = (await provider.getBlockLatestAccepted()).block_number;
  } catch (error) {
    console.error("latestBlockError:", error);
    return NextResponse.json({
      message: "latestBlockError",
      error,
    });
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
    return NextResponse.json({
      message: "contractReqIdError:",
      error,
    });
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
    throw error;
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
