import { atom } from "jotai";

export const chartFilter = atom("7d");

export const blockBefore1DayAtom = atom<null | number>(null);
export const blockBefore7DayAtom = atom<null | number>(null);
export const blockBefore30DayAtom = atom<null | number>(null);
export const blockBefore90DayAtom = atom<null | number>(null);
export const blockBefore180DayAtom = atom<null | number>(null);
