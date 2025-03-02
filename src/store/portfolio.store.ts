import { atom } from "jotai";

import { type ProtocolConfig } from "@/components/defi";

export const chartFilter = atom("7d");
export const tableDataAtom = atom<ProtocolConfig[]>([]);
