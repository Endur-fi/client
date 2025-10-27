import { atom } from "jotai";

export const tabsAtom = atom("strk"); //TODO: move to common.store.ts
export const activeSubTabAtom = atom("stake"); //TODO: move to common.store.ts
export const isMerryChristmasAtom = atom(true); //TODO: if this is a global constant move it to constant and do not use atom as it is not going to be updated by code
export const isStakeInputFocusAtom = atom(false);
