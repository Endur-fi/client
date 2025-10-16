## Hemant's working changes (branch: feat/hemant-route-updates)

### Routing and pages

- Below directories can be deleted cuz the specific pages have been migrated to dynamic routes:
  - `src/app/btc`
  - `src/app/defi-btc`
  - `src/app/defi`
  - `src/app/lbtc`
  - `src/app/portfolio`
  - `src/app/solvbtc`
  - `src/app/strk`
  - `src/app/tbtc`
  - `src/app/wbtc`

- Added dynamic token routes:
  - `src/app/[token]/page.tsx`
  - `src/app/[token]/defi/page.tsx`
  - `src/app/[token]/portfolio/page.tsx`

### Component updates

- Modified:
  - `src/components/sidebar-menu-items.tsx`
  - `src/components/stats.tsx`
  - `src/components/ui/chart.tsx`

- Added:
  - `src/components/strk-portfolio-page/` (and its subcomponents which were moved from `@/app/portfolio/_components`)

### `src/app/[token]/page.tsx` changes

- Simplified metadata generation and token normalization:
  - Use a single lowercase pass (`lowerToken`) and a lookup map for symbols.
  - Handle `btc` early with a dedicated title/description.
  - Use `import type { Metadata }` and drop unused default React import.
  - Use implicit function component type for the page export.
