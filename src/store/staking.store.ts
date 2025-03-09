import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";

import MyNumber from "@/lib/MyNumber";
import StakingService from "@/services/staking";

import { currentBlockAtom, providerAtom } from "./common.store";

const stakingService = new StakingService();

const snTotalStakedQueryAtom = atomWithQuery((get) => {
  return {
    queryKey: ["snTotalStaked", get(currentBlockAtom), get(providerAtom)],
    queryFn: () => stakingService.getSNTotalStaked(),
    refetchInterval: 60000,
  };
});

export const snTotalStakedAtom = atom((get) => {
  const { data, error } = get(snTotalStakedQueryAtom);
  return {
    value: error || !data ? MyNumber.fromZero() : data,
    error,
    isLoading: !data && !error,
  };
});

export const yearlyMintingQueryAtom = atomWithQuery((get) => {
  return {
    queryKey: ["yearlyMinting", get(currentBlockAtom), get(providerAtom)],
    queryFn: () => stakingService.getYearlyMinting(),
    refetchInterval: 60000,
  };
});

export const yearlyMintingAtom = atom((get) => {
  const { data, error } = get(yearlyMintingQueryAtom);
  return {
    value: error || !data ? MyNumber.fromZero() : data,
    error,
    isLoading: !data && !error,
  };
});

export const snAPYAtom = atom((get) => {
  const yearlyMintRes = get(yearlyMintingAtom);
  const totalStakedRes = get(snTotalStakedAtom);

  let value = 0;
  if (!totalStakedRes.value.isZero()) {
    value =
      Number(yearlyMintRes.value.toEtherToFixedDecimals(4)) /
      Number(totalStakedRes.value.toEtherToFixedDecimals(4));
  }

  const newValue = (1 + value / 365) ** 365 - 1;

  return {
    value: newValue,
    isLoading: yearlyMintRes.isLoading || totalStakedRes.isLoading,
    error: yearlyMintRes.error || totalStakedRes.error,
  };
});
