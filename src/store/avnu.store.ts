import { atom } from "jotai";
import { Quote } from "@avnu/avnu-sdk";

export const avnuQuoteAtom = atom<Quote | null>(null);
export const avnuLoadingAtom = atom<boolean>(false);
export const avnuErrorAtom = atom<string | null>(null); 