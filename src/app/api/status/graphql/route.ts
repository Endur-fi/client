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

  const wqContract = new Contract(WqAbi, WITHDRAWAL_QUEUE_ADDRESS, provider);

  let contractReqId;
  let apiReqId;

  try {
    const res = await wqContract.call("get_queue_state");
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
        query Withdraw_queues($where: Withdraw_queueWhereInput) {
          withdraw_queues(where: $where) {
            request_id
          }
        }
      `,
    });

    apiReqId =
      data?.withdraw_queues[data?.withdraw_queues.length - 1]?.request_id;
  } catch (error) {
    console.error("apiReqIdError:", error);
    throw error;
  }

  if (contractReqId === apiReqId) {
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
