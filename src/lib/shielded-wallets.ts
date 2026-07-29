/**
 * Wallet connector names (matched case-insensitively, as a substring) that
 * are known to support Endur's shielded/privacy flows (zero-knowledge
 * deposits, shielded balances, etc). Any other connected wallet should have
 * shielded-mode UI disabled with an explanation.
 */
export const SHIELDED_MODE_SUPPORTED_WALLETS = ["ready", "xverse"];

/**
 * Returns true if the given wallet connector name supports shielded mode.
 * Returns false when no wallet is connected (name is undefined/null).
 */
export function isShieldedModeSupported(
  connectorName?: string | null,
): boolean {
  if (!connectorName) return false;

  const normalizedName = connectorName.toLowerCase();
  return SHIELDED_MODE_SUPPORTED_WALLETS.some((wallet) =>
    normalizedName.includes(wallet),
  );
}
