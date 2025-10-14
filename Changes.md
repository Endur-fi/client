General:
1. keep code grouped in a file as in all the states together, functions together - meaning if there is a function group nothing should be there between two function. -applies to stores, component, services, utils, hooks
2. Every significant function should have a comment explaining what the function is doing in brief


--routes:
// keep support for old routes - configure in next.config
token=[strk, btc]
/:token?variant=:variant
/:token/defi
/:token/portfolio
/leaderboard

-- feature based folders: we will refactor the code in single function component first and later we will think about separating the hooks and utils

src/features/
- staking
	index:
		1. current token and variant will be passed as a query param
		2. handle the current token tab from the query param with the help of token object constant.
		2. There should be a dashboard or landing page before Tabs.
		3. It will have <TokenTabs> and all the things which will be present on the dashboard.

	component/TokenTabs:
	component/TokenTab:
	component/StakeSubTab
	component/PlatformCard:
	component/UnstakeSubTab	
	component/WithdrawSubTab
		component/WithdrawTable [TODO: Revisit]
		component/WithdrawColumns
	component/QuickFillAndBalance
	component/Stats
	component/AssetSelector -> AssetDropdown

- portfolio
	index:
	component/Stats
	component/Chart
	component/DefiHoldings
	component/data-table => component/DefiInformation
	... other components for data-table

- leaderboard
	...

- eligibility
	...

-- Common Components
src/components/
- PausedMessageBox
- ThankYouDialog
- MaxedOutDialog
- InfoTooltip (set info icon color with prop and tooltip content as children)

State management:
1