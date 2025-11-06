import { atom } from "jotai";

export const tabsAtom = atom("strk");
export const activeSubTabAtom = atom("stake");
export const isMerryChristmasAtom = atom(true); //TODO: if this is a global constant move it to constant and do not use atom as it is not going to be updated by code - DOUBT:HEMANT - we were using it to update as well before but we're not using it now, so i think we either remove all of it usage along with this atom or we'll keep like this for now, wdys?
export const isStakeInputFocusAtom = atom(false);
