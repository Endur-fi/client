General:
1. keep code grouped in a file as in all the states together, functions together - meaning if there is a function group nothing should be there between two function. -applies to stores, component, services, utils, hooks
2. Every significant function should have a comment explaining what the function is doing in brief
3. should not use atom for global constant, rather use constant files to store as a simple const

--routes:
// keep support for old routes - configure in next.config
token=[strk, btc]
/:token
/:token/defi
/:token/portfolio
/leaderboard

-- feature based folders: we will refactor the code in single function component first and later we will think about separating the hooks and utils

src/features/
- staking
	use this staking component in page.tsx of each token and variants (strk, btc, wbtc, lbtc...)
	index:
		1. variant will be passed as a prop
		2. set active tab using this variant prop. use object to map variants with token

	components/TokenTab:
	components/StakeSubTab
	components/PlatformCard:
	components/UnstakeSubTab	
	components/WithdrawSubTab
		components/WithdrawTable [TODO: Revisit]
		components/WithdrawColumns
	components/QuickFillAndBalance
	components/Stats
	components/AssetSelector -> AssetDropdown

- portfolio
	index:
	components/Stats
	components/Chart
	components/DefiHoldings
	components/data-table => components/DefiInformation
	... other components for data-table

- leaderboard
	... other components for leaderboard

- eligibility
	... other components for eligibility

-- Common Components
src/components/
- PausedMessageBox
- ThankYouDialog
- MaxedOutDialog
- InfoTooltip (set info icon color with prop and tooltip content as children)

-------------------------
Iteration 2:

1. Add changelog.md and maintain (you can refer "Cleanup" google docs)
2. move all (at least those which are being exported) the interface or types to particular feature type folder (feature/types/index.type.ts) or common type folder (src/types/<relevant_name>.type.ts)
3. even if we need fresh data every 60 secs we should check if user is making any activity or not and then only refetch should be made
4. move dapps store in stores/dapps folder
5. The below contract calls is being used to get the APY, if possible we can combine them into single contract
yearly_mint used only once in snAPYAtom
get_current_total_staking_power used only once in snAPY
get_alpha used only once in snAPY

