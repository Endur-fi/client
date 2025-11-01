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
   // did not understand above points, we hv dynamic routing for respective token pages, so why would we have to pass some variant or maybe im missing something here: DOUBT:HEMANT

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
3. move dapps store in stores/dapps folder

--------------------------
Iteration 3:
Note:

1. when you are moving any function or variable make sure to change the import path wherever it is used
2. Do not remove comments which have FUTURE_SCOPE mentioned. If that particular thing is moved to different file then move the comment together

-- general

1. instead of media query approach for isMobile, you can use react-device-detect library or any other similar lib. Specially for device based logic like wallet connection.

-- Use case specific folder:

1. lib -> shared modules and setup logic
2. utils -> Generic, pure helper functions which do not depends on anything external
3. services -> Business logic or Application or domain-specific logic
4. constants -> pure constant and static variables

-- Constants

1. remove any constant or function in constant/index.ts which are not necessary
2. group the constant with a group heading as a comment [optional] [refer Utils/common.utils.ts]
3. if constants for dapps relevant constant is more, make a separate file for those constants

-- Utils

1. create three files utils/common.utils.ts, utils/lst.utils.ts and utils/blockchain.utils.ts
2. in common file, group the different types of utils with comment [Done] -> just changing the import path is remaining
3. delete lib/utils.ts

-- Services

1. refactor code of wallet.ts [Done] - Review it once.

-- RPC calls optimisation:

1. disable refetchOnMount, refetchOnWindowFocus for dapps query [Done]. - Similarly check for other queries where we can disable any of these two flags. [Neel's Task]
