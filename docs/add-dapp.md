# Add DApp to portfolio
1. create store file in src/store (e.g. src/store/opus.store.ts)
2. Add in defi-holding.ts, in DefiHoldings (look for ADD_DAPP_HERE comments)
3. Add in stats.tsx of portfolio in `totalXSTRKAcrossDefiHoldingsAtom`
4. Add in holdings route. Look for comment `ADD_NEW_PROTOCOL`
5. Similarly add in block-holdings route. 
6. Add in portfolio-page.tsx, look for `ADD_NEW_PROTOCOL`
7. Add in Chart.tsx, look for `ADD_DAPP_HERE`