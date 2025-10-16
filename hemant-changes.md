## Hemant's working changes (branch: feat/route-updates)

### Routing and pages

- Deleted legacy token-specific pages (migrated to dynamic routes):
  - `src/app/btc/page.tsx`
  - `src/app/defi-btc/page.tsx`
  - `src/app/defi/page.tsx`
  - `src/app/lbtc/page.tsx`
  - `src/app/portfolio/_components/chart.tsx`
  - `src/app/portfolio/_components/data-filters.tsx`
  - `src/app/portfolio/_components/defi-holding.tsx`
  - `src/app/portfolio/_components/multi-select.tsx`
  - `src/app/portfolio/_components/portfolio-page.tsx`
  - `src/app/portfolio/_components/stats.tsx`
  - `src/app/portfolio/_components/table/columns.tsx`
  - `src/app/portfolio/_components/table/data-table.tsx`
  - `src/app/portfolio/page.tsx`
  - `src/app/solvbtc/page.tsx`
  - `src/app/strk/page.tsx`
  - `src/app/tbtc/page.tsx`
  - `src/app/wbtc/page.tsx`

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
  - `src/components/strk-portfolio-page/` (and its subcomponents)

### `src/app/[token]/page.tsx` changes

- Simplified metadata generation and token normalization:
  - Use a single lowercase pass (`lowerToken`) and a lookup map for symbols.
  - Handle `btc` early with a dedicated title/description.
  - Use `import type { Metadata }` and drop unused default React import.
  - Use implicit function component type for the page export.
