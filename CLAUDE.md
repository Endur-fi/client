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

**Endur.fi** is a liquid staking and DeFi platform on Starknet (StarkNet blockchain). Users can stake STRK tokens and various BTC derivatives (xyBTC, xWBTC, xtBTC, xLBTC, xsBTC) to receive LST (liquid staking tokens).

**Stack**: Next.js 14 App Router + React 19 + TypeScript (strict) + Tailwind CSS + Radix UI/shadcn

### Blockchain Layer
- **Starknet integration**: `@starknet-react/core` + `starknet.js` for wallet/contract interactions
- **Wallet**: StarknetKit multi-wallet connector, configured in root layout
- **Contracts**: ABIs in `/src/abi/`, addresses in `/src/constants/`
- **Chain**: Controlled by env var `NEXT_PUBLIC_CHAIN_ID` (SN_MAIN or SN_SEPOLIA)

### State Management
Jotai atoms with `jotai-tanstack-query` for async state. Each DeFi protocol has its own store file:
- `/src/store/common.store.ts` — shared state (user address, etc.)
- `/src/store/lst.store.ts` — liquid staking token state
- `/src/store/defi.store.ts` — DeFi protocol aggregation
- Per-protocol stores: `nostra`, `vesu`, `ekubo`, `haiko`, `avnu`, `opus`, `strkfarm`, `merry`

### Data Fetching
- Apollo GraphQL client (`/src/lib/apollo-client.ts`) for blockchain queries
- Axios for REST API calls (`/src/lib/api.ts`)
- Dune Analytics SDK (server actions in `/src/actions/`) for on-chain metrics
- Next.js API routes for server-side data (cached with revalidation)

### Key Utilities
- `MyNumber` (`/src/lib/MyNumber.ts`) — custom BigInt wrapper for blockchain amounts with formatting/arithmetic
- `/src/lib/portfolio.ts` — portfolio calculation logic
- `/src/lib/analytics.ts` — Mixpanel event tracking

### Routing (App Router)
- `/strk`, `/btc`, `/wbtc`, `/tbtc`, `/lbtc`, `/solvbtc` — per-asset staking pages
- `/defi` — DeFi opportunities/pools aggregator
- `/portfolio` — user portfolio dashboard
- `/rewards` — rewards/leaderboard
- `/api/*` — server-side API endpoints (all GET-only with CORS headers)

### Environment Variables
- `NEXT_PUBLIC_CHAIN_ID` — `SN_MAIN` or `SN_SEPOLIA`
- `IS_PAUSED`, `IS_FEE_REBATES_REWARDS_PAUSED` — feature flags
- `MIXPANEL_TOKEN`, `DUNE_API_KEY` — analytics
- `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` — email service
