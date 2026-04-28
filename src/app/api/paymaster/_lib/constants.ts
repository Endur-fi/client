type Hex = `0x${string}`;

export type AllowedEndurPair = {
  assetAddress: Hex;
  lstAddress: Hex;
  vaultAddress?: Hex;
};

/**
 * Avnu DEX "exchange" router (multi_route_swap) — from avnu-contracts-v2 README.
 * Used for DEX instant unstake: LST.approve(router) + multi_route_swap.
 */
export const AVNU_EXCHANGE_MAINNET: Hex =
  "0x04270219d365d6b017231b52e92b3fb5d7c8378b05e9abc97724537a80e93b0f";
export const AVNU_EXCHANGE_SEPOLIA: Hex =
  "0x02c56e8b00dbe2a71e57472685378fc8988bba947e9a99b26a00fade2b4fe7c2";

export const ENDUR_LST_PAIRS: AllowedEndurPair[] = [
  // Mainnet presets (from starkzap/src/staking/lst/presets.ts)
  {
    assetAddress:
      "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
    lstAddress:
      "0x028d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a",
    // Troves Hyper Vault for xSTRK (from client constants)
    vaultAddress:
      "0x046c7a54c82b1fe374353859f554a40b8bd31d3e30f742901579e7b57b1b5960",
  },
  {
    assetAddress:
      "0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac",
    lstAddress:
      "0x006a567e68c805323525fe1649adb80b03cddf92c23d2629a6779f54192dffc13",
  },
  {
    assetAddress:
      "0x04daa17763b286d1e59b97c283c0b8c949994c361e426a28f743c67bdfe9a32f",
    lstAddress:
      "0x043a35c1425a0125ef8c171f1a75c6f31ef8648edcc8324b55ce1917db3f9b91",
  },
  {
    assetAddress:
      "0x036834a40984312f7f7de8d31e3f6305b325389eaeea5b1c0664b2fb936461a4",
    lstAddress:
      "0x07dd3c80de9fcc5545f0cb83678826819c79619ed7992cc06ff81fc67cd2efe0",
  },
  {
    assetAddress:
      "0x0593e034dda23eea82d2ba9a30960ed42cf4a01502cc2351dc9b9881f9931a68",
    lstAddress:
      "0x0580f3dc564a7b82f21d40d404b3842d490ae7205e6ac07b1b7af2b4a5183dc9",
  },

  // Sepolia presets (from starkzap/src/staking/lst/presets.ts)
  {
    assetAddress:
      "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
    lstAddress:
      "0x042de5b868da876768213c48019b8d46cd484e66013ae3275f8a4b97b31fc7eb",
  },
  {
    assetAddress:
      "0x044ad07751ad782288413c7db42c48e1c4f6195876bca3b6caef449bb4fb8d36",
    lstAddress:
      "0x036a2c3c56ae806b12a84bb253cbc1a009e3da5469e6a736c483303b864c8e2b",
  },
  {
    assetAddress:
      "0x07e97477601e5606359303cf50c050fd3ba94f66bd041f4ed504673ba2b81696",
    lstAddress:
      "0x0226324f63d994834e4729dd1bab443fe50af8e97c608b812ee1f950ceae68c7",
  },
];

