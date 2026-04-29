# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (HTTP)
npm run dev:https    # Start dev server (HTTPS)
npm run build        # Production build
npm run lint         # Run Next.js linter
npm run lint:fix     # Auto-fix ESLint issues
npm run format:fix   # Auto-format with Prettier
```

No test suite is configured in this repo.

## Architecture

**Endur.fi** is a liquid staking and DeFi platform on Starknet. Users stake STRK or BTC derivatives (WBTC, tBTC, LBTC, solvBTC) to receive LST tokens (xSTRK, xWBTC, xtBTC, xLBTC, xsBTC).

**Stack**: Next.js 14 App Router + React 19 + TypeScript (strict) + Tailwind CSS + Radix UI/shadcn

### Blockchain Layer
- **Starknet integration**: `@starknet-react/core` + `starknet.js` for wallet/contract interactions
- **Wallet**: StarknetKit multi-wallet connector, configured in root layout
- **Contracts**: ABIs in `/src/abi/`, addresses in `/src/constants/`
- **Chain**: Controlled by `NEXT_PUBLIC_CHAIN_ID` (SN_MAIN or SN_SEPOLIA). Mainnet assets: STRK, WBTC, tBTC, LBTC, solvBTC. Testnet: STRK + test BTC assets.
- **RPC**: `RPC_URL` / `NEXT_PUBLIC_RPC_URL` env vars, falls back to BlastAPI public endpoint

### LST Config System
`LST_CONFIG` (in `/src/constants/index.ts`) is the central registry: `buildLSTConfig()` reads `NEXT_PUBLIC_CHAIN_ID` and builds a `LSTNetworkConfig` keyed by asset symbol. Every LST asset has `LST_ADDRESS`, `WITHDRAWAL_QUEUE_ADDRESS`, and optionally `TROVES_HYPER_VAULT_ADDRESS`. Use helpers `getLSTAssetBySymbol()`, `getLSTAssetsByCategory()` rather than hardcoding addresses.

### State Management
Jotai atoms with `jotai-tanstack-query` for async state:
- `lstConfigAtom` (common.store) — currently selected LST asset config; drives most other atoms
- `userAddressAtom` — connected wallet address
- `providerAtom` / `currentBlockAtom` — Starknet RPC provider and latest block (polling)
- `lst.store.ts` — per-LST balances, exchange rates, withdrawal queue state
- `defi.store.ts` — aggregates all DeFi protocol data; defines `DAppHoldingsFn` interface that each protocol store implements
- Per-protocol stores: `nostra`, `vesu`, `ekubo`, `haiko`, `avnu`, `opus`, `strkfarm`, `merry`
- `staking.store.ts` — Starknet network staking stats (APY, total staked)
- `portfolio.store.ts` — aggregated user portfolio across all protocols

The pattern for async atoms: use `atomWithQuery` (wraps TanStack Query) for the raw query, then a plain `atom` that unwraps `{ data, error }` into `{ value, error, isLoading }`.

### Services Layer
`/src/services/` wraps Starknet contract calls into typed classes:
- `LSTService` — LST/ERC-4626 contract interactions (balance, totalAssets, totalSupply, convert)
- `StakingService` — Starknet native staking contracts (yearly mint, total staked, APY calculation)
- `AvnuService` — AVNU swap integration

### Data Fetching
- Apollo GraphQL client (`/src/lib/apollo-client.ts`) for on-chain indexed queries; queries/mutations in `/src/constants/queries.ts` and `mutations.ts`
- Axios for REST API calls (`/src/lib/api.ts`)
- Dune Analytics SDK (server actions in `/src/actions/`) for on-chain metrics
- Next.js API routes (`/src/app/api/`) — all GET-only with CORS headers, cached with `revalidate`

### Key Utilities
- `MyNumber` (`/src/lib/MyNumber.ts`) — custom BigInt wrapper (backed by `bignumber.js` + `ethers`) for blockchain token amounts. Use `MyNumber.fromEther(str, decimals)` to parse human-readable, `.toEtherStr()` to format, `.operate()` for arithmetic. Always carry `decimals` with the value.
- `MyAnalytics` (`/src/lib/analytics.ts`) — Mixpanel wrapper. Use `MyAnalytics.track(AnalyticsEvents.X, props)`. All event name constants live in `/src/lib/analytics-events.ts` — add new events there, never use raw strings.
- `tryCatch` utility in `/src/lib/utils.ts` — wraps async calls returning `{ data, error }` instead of throwing
- `createAtomWithStorage` in `common.store.ts` — SSR-safe `atomWithStorage` wrapper

### Routing (App Router)
- `/` — redirects to `/btc`
- `/strk`, `/btc`, `/wbtc`, `/tbtc`, `/lbtc`, `/solvbtc` — per-asset staking pages (share `stake.tsx` / `unstake.tsx` components driven by `lstConfigAtom`)
- `/defi` — DeFi opportunities/pools aggregator
- `/portfolio` — user portfolio dashboard
- `/rewards`, `/rewards/[allocation]` — rewards/leaderboard with Merkle claim flow
- `/r/[referralCode]` — referral redirect handler
- `/api/*` — server-side endpoints

### Component Patterns
- Staking UI: `stake.tsx` and `unstake.tsx` are the primary interactive components, each self-contained with form validation (zod + react-hook-form) and transaction handling via `useTransactionHandler` hook
- `asset-selector.tsx` — drives `lstConfigAtom` when user switches between assets
- `providers.tsx` — wraps app with Jotai, StarknetKit, Apollo, and analytics providers

### Environment Variables
- `NEXT_PUBLIC_CHAIN_ID` — `SN_MAIN` or `SN_SEPOLIA`
- `NEXT_PUBLIC_IS_PAUSED` — disables staking UI
- `IS_FEE_REBATES_REWARDS_PAUSED` — feature flag for fee rebates
- `NEXT_PUBLIC_MIXPANEL_TOKEN` — analytics (omit to disable tracking)
- `DUNE_API_KEY` — Dune Analytics
- `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` — email service
- `NEXT_PUBLIC_NST_STRK_ADDRESS` — Nostra staked STRK token address
- `RPC_URL` / `NEXT_PUBLIC_RPC_URL` — Starknet RPC endpoint
