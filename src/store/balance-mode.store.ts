import { atom } from "jotai";

export enum BalanceMode {
  UNSHIELDED = "unshielded",
  SHIELDED = "shielded",
}

export const balanceModeAtom = atom<BalanceMode>(BalanceMode.UNSHIELDED);
