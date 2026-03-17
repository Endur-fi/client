export const AnalyticsEvents = {
  // From eventNames in utils.ts
  STAKE_CLICK: "stake_click",
  STAKE_TX_INIT: "stake_transaction_init",
  STAKE_TX_SUCCESSFUL: "stake_transaction_successful",
  STAKE_TX_REJECTED: "stake_transaction_rejected",
  UNSTAKE_CLICK: "unstake_click",
  UNSTAKE_TX_INIT: "unstake_transaction_init",
  UNSTAKE_TX_SUCCESSFUL: "unstake_transaction_successful",
  UNSTAKE_TX_REJECTED: "unstake_transaction_rejected",
  OPPORTUNITIES: "opportunities",

  // Existing string literals used directly
  PAGE_VIEW: "page_view",
  OPEN_PORTFOLIO: "Open Portfolio",
  NOSTRA_HAS_STRK: "Has Nostra STRK",
  NOSTRA_INIT_MIGRATE: "Init Nostra migrate",
  NOSTRA_INIT_TX_MIGRATE: "Init Tx Nostra migrate",
  NOSTRA_ERROR_MIGRATE: "Error Nostra migrate",
  NOSTRA_COMPLETED_MIGRATE: "Completed Nostra migrate",
  NOSTRA_CLICK_MIGRATE: "Click Migrate Nostra STRK",

  // Rewards events (used under /rewards/*)
  REWARDS_ELIGIBILITY_CHECK_CLICKED: "rewards_eligibility_check_clicked",
  REWARDS_ELIGIBILITY_RESULT: "rewards_eligibility_result",
  REWARDS_EMAIL_SUBSCRIPTION: "rewards_email_subscription", //it's not rewards subscription, but as it is on rewards page
  REWARDS_EMAIL_SKIP_CLICKED: "rewards_email_skip_clicked",
  REWARDS_TWITTER_FOLLOW_CLICKED: "rewards_twitter_follow_clicked",
  REWARDS_TWITTER_FOLLOW_SKIPPED: "rewards_twitter_follow_skipped",
  REWARDS_CLICKED_CLAIM_REWARDS: "rewards_clicked_claim_rewards",

  // VIP experiences
  VIP_STATUS_RESOLVED: "vip_status_resolved", // fires once per wallet when VIP data loads
  VIP_NAVBAR_CHIP_VIEW: "vip_navbar_chip_view",
  VIP_NAVBAR_CHIP_CLICK: "vip_navbar_chip_click",
  VIP_CARD_SCHEDULE_CALL_CLICK: "vip_card_schedule_call_click",
  VIP_CARD_TELEGRAM_CLICK: "vip_card_telegram_click",

  // Navigation & tabs
  MAIN_TAB_CHANGE: "main_tab_change", // STRK vs BTC
  SUB_TAB_CHANGE: "sub_tab_change", // stake / unstake / withdraw
  SIDEBAR_NAV_CLICK: "sidebar_nav_click",
  FOOTER_NAV_CLICK: "footer_nav_click",
  MOBILE_NAV_TOGGLE: "mobile_nav_toggle",
  MOBILE_NAV_CLICK: "mobile_nav_click",
  SIDEBAR_FOOTER_LINK_CLICK: "sidebar_footer_link_click",

  // Withdraw log
  WITHDRAW_LOG_VIEW: "withdraw_log_view",

  // Rewards UI
  REWARDS_TAB_CHANGE: "rewards_tab_change",
  REWARDS_SEASON_CHANGE: "rewards_season_change",
  REWARDS_BANNER_VIEW_DETAILS_CLICK: "rewards_banner_view_details_click",
  REWARDS_DOCS_LINK_CLICK: "rewards_docs_link_click",
  REWARDS_LEADERBOARD_TAB_CHANGE: "rewards_leaderboard_tab_change",

  // Portfolio filters & interactions
  PORTFOLIO_TIME_RANGE_CHANGE: "portfolio_time_range_change",
  PORTFOLIO_CHART_RANGE_CHANGE: "portfolio_chart_range_change",

  // FAQ & info
  FAQ_ITEM_TOGGLE: "faq_item_toggle",
  SEASON_CARD_LEARN_MORE_CLICK: "season_card_learn_more_click",
  STAKING_REWARDS_INFO_CLICK: "staking_rewards_info_click",
  SEASON_POINTS_TOOLTIP_OPEN: "season_points_tooltip_open",

  // Native staking dialog
  NATIVE_STAKING_DIALOG_STAY_CLICK: "native_staking_dialog_stay_click",
  NATIVE_STAKING_DIALOG_CONTINUE_CLICK:
    "native_staking_dialog_continue_click",

  // Sidebar pin
  SIDEBAR_PIN_TOGGLE: "sidebar_pin_toggle",

  // Wallet actions
  WALLET_CONNECT_CLICK: "wallet_connect_click",
  WALLET_DISCONNECT_CLICK: "wallet_disconnect_click",
  WALLET_ADDRESS_COPIED: "wallet_address_copied",

  // Unstake flow
  UNSTAKE_METHOD_CHANGE: "unstake_method_change",
  QUICK_AMOUNT_SELECT: "quick_amount_select", // shared for stake & unstake; use `context` prop

  // DeFi page interactions
  DEFI_TAB_CHANGE: "defi_tab_change",
  DEFI_ASSET_FILTER_CHANGE: "defi_asset_filter_change",
  DEFI_PROTOCOL_FILTER_CHANGE: "defi_protocol_filter_change",
  DEFI_STABLES_TOGGLE: "defi_stables_toggle",
  DEFI_DISCLAIMER_CONTINUE: "defi_disclaimer_continue",

  // Asset selector (BTC variant)
  BTC_ASSET_SELECT: "btc_asset_select",

  // Stake interactions
  STAKE_EARN_COLLAPSIBLE_TOGGLE: "stake_earn_collapsible_toggle",
  STAKE_PLATFORM_SELECT: "stake_platform_select",
  STAKE_TWITTER_SHARE_CLICK: "stake_twitter_share_click",

  // Rewards post-claim interactions
  REWARDS_CLAIM_TWITTER_SHARE_CLICK: "rewards_claim_twitter_share_click",
  REWARDS_MODAL_CLOSE: "rewards_modal_close",
  REWARDS_SEASON_LEARN_MORE_CLICK: "rewards_season_learn_more_click",

  // Table pagination
  REWARDS_TABLE_PAGINATION: "rewards_table_pagination",
  PORTFOLIO_TABLE_PAGINATION: "portfolio_table_pagination",
  REWARDS_TABLE_SEARCH: "rewards_table_search",

  // Tabs / onboarding
  WAITLIST_EMAIL_SUBMIT: "waitlist_email_submit",
  WAITLIST_EMAIL_SUCCESS: "waitlist_email_success",
  AUDITED_LINK_CLICK: "audited_link_click",

  // Rewards claim success (on-chain TX confirmed)
  REWARDS_CLAIM_TX_SUCCESS: "rewards_claim_tx_success",

} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

