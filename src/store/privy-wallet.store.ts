import { atom } from "jotai";
import type { WalletSetupStep } from "@/components/wallet/WalletSetupProgress";

export interface PrivyWalletData {
  walletId: string;
  address: string;
  publicKey: string;
  isDeployed: boolean;
}

// Wallet data atom
export const privyWalletAtom = atom<PrivyWalletData | null>(null);

// Wallet setup step atom
export const walletSetupStepAtom = atom<WalletSetupStep>("idle");

// Loading state atom
export const isLoadingWalletAtom = atom<boolean>(false);

// Modal state atom
export const isWalletModalOpenAtom = atom<boolean>(false);
