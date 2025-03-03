[
    {
      "type": "impl",
      "name": "SingletonImpl",
      "interface_name": "vesu::singleton::ISingleton"
    },
    {
      "type": "struct",
      "name": "core::integer::u256",
      "members": [
        {
          "name": "low",
          "type": "core::integer::u128"
        },
        {
          "name": "high",
          "type": "core::integer::u128"
        }
      ]
    },
    {
      "type": "enum",
      "name": "core::bool",
      "variants": [
        {
          "name": "False",
          "type": "()"
        },
        {
          "name": "True",
          "type": "()"
        }
      ]
    },
    {
      "type": "struct",
      "name": "vesu::data_model::AssetConfig",
      "members": [
        {
          "name": "total_collateral_shares",
          "type": "core::integer::u256"
        },
        {
          "name": "total_nominal_debt",
          "type": "core::integer::u256"
        },
        {
          "name": "reserve",
          "type": "core::integer::u256"
        },
        {
          "name": "max_utilization",
          "type": "core::integer::u256"
        },
        {
          "name": "floor",
          "type": "core::integer::u256"
        },
        {
          "name": "scale",
          "type": "core::integer::u256"
        },
        {
          "name": "is_legacy",
          "type": "core::bool"
        },
        {
          "name": "last_updated",
          "type": "core::integer::u64"
        },
        {
          "name": "last_rate_accumulator",
          "type": "core::integer::u256"
        },
        {
          "name": "last_full_utilization_rate",
          "type": "core::integer::u256"
        },
        {
          "name": "fee_rate",
          "type": "core::integer::u256"
        }
      ]
    },
    {
      "type": "struct",
      "name": "vesu::data_model::LTVConfig",
      "members": [
        {
          "name": "max_ltv",
          "type": "core::integer::u64"
        }
      ]
    },
    {
      "type": "struct",
      "name": "vesu::data_model::Position",
      "members": [
        {
          "name": "collateral_shares",
          "type": "core::integer::u256"
        },
        {
          "name": "nominal_debt",
          "type": "core::integer::u256"
        }
      ]
    },
    {
      "type": "struct",
      "name": "alexandria_math::i257::i257",
      "members": [
        {
          "name": "abs",
          "type": "core::integer::u256"
        },
        {
          "name": "is_negative",
          "type": "core::bool"
        }
      ]
    },
    {
      "type": "enum",
      "name": "vesu::data_model::AmountType",
      "variants": [
        {
          "name": "Delta",
          "type": "()"
        },
        {
          "name": "Target",
          "type": "()"
        }
      ]
    },
    {
      "type": "enum",
      "name": "vesu::data_model::AmountDenomination",
      "variants": [
        {
          "name": "Native",
          "type": "()"
        },
        {
          "name": "Assets",
          "type": "()"
        }
      ]
    },
    {
      "type": "struct",
      "name": "vesu::data_model::Amount",
      "members": [
        {
          "name": "amount_type",
          "type": "vesu::data_model::AmountType"
        },
        {
          "name": "denomination",
          "type": "vesu::data_model::AmountDenomination"
        },
        {
          "name": "value",
          "type": "alexandria_math::i257::i257"
        }
      ]
    },
    {
      "type": "struct",
      "name": "vesu::data_model::AssetPrice",
      "members": [
        {
          "name": "value",
          "type": "core::integer::u256"
        },
        {
          "name": "is_valid",
          "type": "core::bool"
        }
      ]
    },
    {
      "type": "struct",
      "name": "vesu::data_model::Context",
      "members": [
        {
          "name": "pool_id",
          "type": "core::felt252"
        },
        {
          "name": "extension",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "collateral_asset",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "debt_asset",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "collateral_asset_config",
          "type": "vesu::data_model::AssetConfig"
        },
        {
          "name": "debt_asset_config",
          "type": "vesu::data_model::AssetConfig"
        },
        {
          "name": "collateral_asset_price",
          "type": "vesu::data_model::AssetPrice"
        },
        {
          "name": "debt_asset_price",
          "type": "vesu::data_model::AssetPrice"
        },
        {
          "name": "collateral_asset_fee_shares",
          "type": "core::integer::u256"
        },
        {
          "name": "debt_asset_fee_shares",
          "type": "core::integer::u256"
        },
        {
          "name": "max_ltv",
          "type": "core::integer::u64"
        },
        {
          "name": "user",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "position",
          "type": "vesu::data_model::Position"
        }
      ]
    },
    {
      "type": "struct",
      "name": "vesu::data_model::AssetParams",
      "members": [
        {
          "name": "asset",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "floor",
          "type": "core::integer::u256"
        },
        {
          "name": "initial_rate_accumulator",
          "type": "core::integer::u256"
        },
        {
          "name": "initial_full_utilization_rate",
          "type": "core::integer::u256"
        },
        {
          "name": "max_utilization",
          "type": "core::integer::u256"
        },
        {
          "name": "is_legacy",
          "type": "core::bool"
        },
        {
          "name": "fee_rate",
          "type": "core::integer::u256"
        }
      ]
    },
    {
      "type": "struct",
      "name": "core::array::Span::<vesu::data_model::AssetParams>",
      "members": [
        {
          "name": "snapshot",
          "type": "@core::array::Array::<vesu::data_model::AssetParams>"
        }
      ]
    },
    {
      "type": "struct",
      "name": "vesu::data_model::LTVParams",
      "members": [
        {
          "name": "collateral_asset_index",
          "type": "core::integer::u32"
        },
        {
          "name": "debt_asset_index",
          "type": "core::integer::u32"
        },
        {
          "name": "max_ltv",
          "type": "core::integer::u64"
        }
      ]
    },
    {
      "type": "struct",
      "name": "core::array::Span::<vesu::data_model::LTVParams>",
      "members": [
        {
          "name": "snapshot",
          "type": "@core::array::Array::<vesu::data_model::LTVParams>"
        }
      ]
    },
    {
      "type": "struct",
      "name": "core::array::Span::<core::felt252>",
      "members": [
        {
          "name": "snapshot",
          "type": "@core::array::Array::<core::felt252>"
        }
      ]
    },
    {
      "type": "struct",
      "name": "vesu::data_model::ModifyPositionParams",
      "members": [
        {
          "name": "pool_id",
          "type": "core::felt252"
        },
        {
          "name": "collateral_asset",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "debt_asset",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "user",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "collateral",
          "type": "vesu::data_model::Amount"
        },
        {
          "name": "debt",
          "type": "vesu::data_model::Amount"
        },
        {
          "name": "data",
          "type": "core::array::Span::<core::felt252>"
        }
      ]
    },
    {
      "type": "struct",
      "name": "vesu::data_model::UpdatePositionResponse",
      "members": [
        {
          "name": "collateral_delta",
          "type": "alexandria_math::i257::i257"
        },
        {
          "name": "collateral_shares_delta",
          "type": "alexandria_math::i257::i257"
        },
        {
          "name": "debt_delta",
          "type": "alexandria_math::i257::i257"
        },
        {
          "name": "nominal_debt_delta",
          "type": "alexandria_math::i257::i257"
        },
        {
          "name": "bad_debt",
          "type": "core::integer::u256"
        }
      ]
    },
    {
      "type": "struct",
      "name": "vesu::data_model::UnsignedAmount",
      "members": [
        {
          "name": "amount_type",
          "type": "vesu::data_model::AmountType"
        },
        {
          "name": "denomination",
          "type": "vesu::data_model::AmountDenomination"
        },
        {
          "name": "value",
          "type": "core::integer::u256"
        }
      ]
    },
    {
      "type": "struct",
      "name": "vesu::data_model::TransferPositionParams",
      "members": [
        {
          "name": "pool_id",
          "type": "core::felt252"
        },
        {
          "name": "from_collateral_asset",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "from_debt_asset",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "to_collateral_asset",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "to_debt_asset",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "from_user",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "to_user",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "collateral",
          "type": "vesu::data_model::UnsignedAmount"
        },
        {
          "name": "debt",
          "type": "vesu::data_model::UnsignedAmount"
        },
        {
          "name": "from_data",
          "type": "core::array::Span::<core::felt252>"
        },
        {
          "name": "to_data",
          "type": "core::array::Span::<core::felt252>"
        }
      ]
    },
    {
      "type": "struct",
      "name": "vesu::data_model::LiquidatePositionParams",
      "members": [
        {
          "name": "pool_id",
          "type": "core::felt252"
        },
        {
          "name": "collateral_asset",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "debt_asset",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "user",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "receive_as_shares",
          "type": "core::bool"
        },
        {
          "name": "data",
          "type": "core::array::Span::<core::felt252>"
        }
      ]
    },
    {
      "type": "interface",
      "name": "vesu::singleton::ISingleton",
      "items": [
        {
          "type": "function",
          "name": "creator_nonce",
          "inputs": [
            {
              "name": "creator",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "core::felt252"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "extension",
          "inputs": [
            {
              "name": "pool_id",
              "type": "core::felt252"
            }
          ],
          "outputs": [
            {
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "asset_config_unsafe",
          "inputs": [
            {
              "name": "pool_id",
              "type": "core::felt252"
            },
            {
              "name": "asset",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "(vesu::data_model::AssetConfig, core::integer::u256)"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "asset_config",
          "inputs": [
            {
              "name": "pool_id",
              "type": "core::felt252"
            },
            {
              "name": "asset",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "(vesu::data_model::AssetConfig, core::integer::u256)"
            }
          ],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "ltv_config",
          "inputs": [
            {
              "name": "pool_id",
              "type": "core::felt252"
            },
            {
              "name": "collateral_asset",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "debt_asset",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "vesu::data_model::LTVConfig"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "position_unsafe",
          "inputs": [
            {
              "name": "pool_id",
              "type": "core::felt252"
            },
            {
              "name": "collateral_asset",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "debt_asset",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "user",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "(vesu::data_model::Position, core::integer::u256, core::integer::u256)"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "position",
          "inputs": [
            {
              "name": "pool_id",
              "type": "core::felt252"
            },
            {
              "name": "collateral_asset",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "debt_asset",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "user",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "(vesu::data_model::Position, core::integer::u256, core::integer::u256)"
            }
          ],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "check_collateralization_unsafe",
          "inputs": [
            {
              "name": "pool_id",
              "type": "core::felt252"
            },
            {
              "name": "collateral_asset",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "debt_asset",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "user",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "(core::bool, core::integer::u256, core::integer::u256)"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "check_collateralization",
          "inputs": [
            {
              "name": "pool_id",
              "type": "core::felt252"
            },
            {
              "name": "collateral_asset",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "debt_asset",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "user",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "(core::bool, core::integer::u256, core::integer::u256)"
            }
          ],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "rate_accumulator_unsafe",
          "inputs": [
            {
              "name": "pool_id",
              "type": "core::felt252"
            },
            {
              "name": "asset",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "rate_accumulator",
          "inputs": [
            {
              "name": "pool_id",
              "type": "core::felt252"
            },
            {
              "name": "asset",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "utilization_unsafe",
          "inputs": [
            {
              "name": "pool_id",
              "type": "core::felt252"
            },
            {
              "name": "asset",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "utilization",
          "inputs": [
            {
              "name": "pool_id",
              "type": "core::felt252"
            },
            {
              "name": "asset",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "delegation",
          "inputs": [
            {
              "name": "pool_id",
              "type": "core::felt252"
            },
            {
              "name": "delegator",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "delegatee",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "core::bool"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "calculate_pool_id",
          "inputs": [
            {
              "name": "caller_address",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "nonce",
              "type": "core::felt252"
            }
          ],
          "outputs": [
            {
              "type": "core::felt252"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "calculate_debt",
          "inputs": [
            {
              "name": "nominal_debt",
              "type": "alexandria_math::i257::i257"
            },
            {
              "name": "rate_accumulator",
              "type": "core::integer::u256"
            },
            {
              "name": "asset_scale",
              "type": "core::integer::u256"
            }
          ],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "calculate_nominal_debt",
          "inputs": [
            {
              "name": "debt",
              "type": "alexandria_math::i257::i257"
            },
            {
              "name": "rate_accumulator",
              "type": "core::integer::u256"
            },
            {
              "name": "asset_scale",
              "type": "core::integer::u256"
            }
          ],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "calculate_collateral_shares_unsafe",
          "inputs": [
            {
              "name": "pool_id",
              "type": "core::felt252"
            },
            {
              "name": "asset",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "collateral",
              "type": "alexandria_math::i257::i257"
            }
          ],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "calculate_collateral_shares",
          "inputs": [
            {
              "name": "pool_id",
              "type": "core::felt252"
            },
            {
              "name": "asset",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "collateral",
              "type": "alexandria_math::i257::i257"
            }
          ],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "calculate_collateral_unsafe",
          "inputs": [
            {
              "name": "pool_id",
              "type": "core::felt252"
            },
            {
              "name": "asset",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "collateral_shares",
              "type": "alexandria_math::i257::i257"
            }
          ],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "calculate_collateral",
          "inputs": [
            {
              "name": "pool_id",
              "type": "core::felt252"
            },
            {
              "name": "asset",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "collateral_shares",
              "type": "alexandria_math::i257::i257"
            }
          ],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "deconstruct_collateral_amount_unsafe",
          "inputs": [
            {
              "name": "pool_id",
              "type": "core::felt252"
            },
            {
              "name": "collateral_asset",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "debt_asset",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "user",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "collateral",
              "type": "vesu::data_model::Amount"
            }
          ],
          "outputs": [
            {
              "type": "(alexandria_math::i257::i257, alexandria_math::i257::i257)"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "deconstruct_collateral_amount",
          "inputs": [
            {
              "name": "pool_id",
              "type": "core::felt252"
            },
            {
              "name": "collateral_asset",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "debt_asset",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "user",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "collateral",
              "type": "vesu::data_model::Amount"
            }
          ],
          "outputs": [
            {
              "type": "(alexandria_math::i257::i257, alexandria_math::i257::i257)"
            }
          ],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "deconstruct_debt_amount_unsafe",
          "inputs": [
            {
              "name": "pool_id",
              "type": "core::felt252"
            },
            {
              "name": "collateral_asset",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "debt_asset",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "user",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "debt",
              "type": "vesu::data_model::Amount"
            }
          ],
          "outputs": [
            {
              "type": "(alexandria_math::i257::i257, alexandria_math::i257::i257)"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "deconstruct_debt_amount",
          "inputs": [
            {
              "name": "pool_id",
              "type": "core::felt252"
            },
            {
              "name": "collateral_asset",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "debt_asset",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "user",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "debt",
              "type": "vesu::data_model::Amount"
            }
          ],
          "outputs": [
            {
              "type": "(alexandria_math::i257::i257, alexandria_math::i257::i257)"
            }
          ],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "context_unsafe",
          "inputs": [
            {
              "name": "pool_id",
              "type": "core::felt252"
            },
            {
              "name": "collateral_asset",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "debt_asset",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "user",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "vesu::data_model::Context"
            }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "context",
          "inputs": [
            {
              "name": "pool_id",
              "type": "core::felt252"
            },
            {
              "name": "collateral_asset",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "debt_asset",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "user",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "vesu::data_model::Context"
            }
          ],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "create_pool",
          "inputs": [
            {
              "name": "asset_params",
              "type": "core::array::Span::<vesu::data_model::AssetParams>"
            },
            {
              "name": "ltv_params",
              "type": "core::array::Span::<vesu::data_model::LTVParams>"
            },
            {
              "name": "extension",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "core::felt252"
            }
          ],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "modify_position",
          "inputs": [
            {
              "name": "params",
              "type": "vesu::data_model::ModifyPositionParams"
            }
          ],
          "outputs": [
            {
              "type": "vesu::data_model::UpdatePositionResponse"
            }
          ],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "transfer_position",
          "inputs": [
            {
              "name": "params",
              "type": "vesu::data_model::TransferPositionParams"
            }
          ],
          "outputs": [],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "liquidate_position",
          "inputs": [
            {
              "name": "params",
              "type": "vesu::data_model::LiquidatePositionParams"
            }
          ],
          "outputs": [
            {
              "type": "vesu::data_model::UpdatePositionResponse"
            }
          ],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "flash_loan",
          "inputs": [
            {
              "name": "receiver",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "asset",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "amount",
              "type": "core::integer::u256"
            },
            {
              "name": "is_legacy",
              "type": "core::bool"
            },
            {
              "name": "data",
              "type": "core::array::Span::<core::felt252>"
            }
          ],
          "outputs": [],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "modify_delegation",
          "inputs": [
            {
              "name": "pool_id",
              "type": "core::felt252"
            },
            {
              "name": "delegatee",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "delegation",
              "type": "core::bool"
            }
          ],
          "outputs": [],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "donate_to_reserve",
          "inputs": [
            {
              "name": "pool_id",
              "type": "core::felt252"
            },
            {
              "name": "asset",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "amount",
              "type": "core::integer::u256"
            }
          ],
          "outputs": [],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "retrieve_from_reserve",
          "inputs": [
            {
              "name": "pool_id",
              "type": "core::felt252"
            },
            {
              "name": "asset",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "receiver",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "amount",
              "type": "core::integer::u256"
            }
          ],
          "outputs": [],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "set_asset_config",
          "inputs": [
            {
              "name": "pool_id",
              "type": "core::felt252"
            },
            {
              "name": "params",
              "type": "vesu::data_model::AssetParams"
            }
          ],
          "outputs": [],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "set_ltv_config",
          "inputs": [
            {
              "name": "pool_id",
              "type": "core::felt252"
            },
            {
              "name": "collateral_asset",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "debt_asset",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "ltv_config",
              "type": "vesu::data_model::LTVConfig"
            }
          ],
          "outputs": [],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "set_asset_parameter",
          "inputs": [
            {
              "name": "pool_id",
              "type": "core::felt252"
            },
            {
              "name": "asset",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "parameter",
              "type": "core::felt252"
            },
            {
              "name": "value",
              "type": "core::integer::u256"
            }
          ],
          "outputs": [],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "set_extension",
          "inputs": [
            {
              "name": "pool_id",
              "type": "core::felt252"
            },
            {
              "name": "extension",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "claim_fee_shares",
          "inputs": [
            {
              "name": "pool_id",
              "type": "core::felt252"
            },
            {
              "name": "asset",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [],
          "state_mutability": "external"
        }
      ]
    },
    {
      "type": "event",
      "name": "vesu::singleton::Singleton::CreatePool",
      "kind": "struct",
      "members": [
        {
          "name": "pool_id",
          "type": "core::felt252",
          "kind": "key"
        },
        {
          "name": "extension",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "creator",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        }
      ]
    },
    {
      "type": "event",
      "name": "vesu::singleton::Singleton::ModifyPosition",
      "kind": "struct",
      "members": [
        {
          "name": "pool_id",
          "type": "core::felt252",
          "kind": "key"
        },
        {
          "name": "collateral_asset",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "debt_asset",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "user",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "collateral_delta",
          "type": "alexandria_math::i257::i257",
          "kind": "data"
        },
        {
          "name": "collateral_shares_delta",
          "type": "alexandria_math::i257::i257",
          "kind": "data"
        },
        {
          "name": "debt_delta",
          "type": "alexandria_math::i257::i257",
          "kind": "data"
        },
        {
          "name": "nominal_debt_delta",
          "type": "alexandria_math::i257::i257",
          "kind": "data"
        }
      ]
    },
    {
      "type": "event",
      "name": "vesu::singleton::Singleton::TransferPosition",
      "kind": "struct",
      "members": [
        {
          "name": "pool_id",
          "type": "core::felt252",
          "kind": "key"
        },
        {
          "name": "from_collateral_asset",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "from_debt_asset",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "to_collateral_asset",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "to_debt_asset",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "from_user",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "to_user",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        }
      ]
    },
    {
      "type": "event",
      "name": "vesu::singleton::Singleton::LiquidatePosition",
      "kind": "struct",
      "members": [
        {
          "name": "pool_id",
          "type": "core::felt252",
          "kind": "key"
        },
        {
          "name": "collateral_asset",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "debt_asset",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "user",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "liquidator",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "collateral_delta",
          "type": "alexandria_math::i257::i257",
          "kind": "data"
        },
        {
          "name": "collateral_shares_delta",
          "type": "alexandria_math::i257::i257",
          "kind": "data"
        },
        {
          "name": "debt_delta",
          "type": "alexandria_math::i257::i257",
          "kind": "data"
        },
        {
          "name": "nominal_debt_delta",
          "type": "alexandria_math::i257::i257",
          "kind": "data"
        },
        {
          "name": "bad_debt",
          "type": "core::integer::u256",
          "kind": "data"
        }
      ]
    },
    {
      "type": "event",
      "name": "vesu::singleton::Singleton::AccrueFees",
      "kind": "struct",
      "members": [
        {
          "name": "pool_id",
          "type": "core::felt252",
          "kind": "key"
        },
        {
          "name": "asset",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "recipient",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "fee_shares",
          "type": "core::integer::u256",
          "kind": "data"
        }
      ]
    },
    {
      "type": "event",
      "name": "vesu::singleton::Singleton::UpdateContext",
      "kind": "struct",
      "members": [
        {
          "name": "pool_id",
          "type": "core::felt252",
          "kind": "key"
        },
        {
          "name": "collateral_asset",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "debt_asset",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "collateral_asset_config",
          "type": "vesu::data_model::AssetConfig",
          "kind": "data"
        },
        {
          "name": "debt_asset_config",
          "type": "vesu::data_model::AssetConfig",
          "kind": "data"
        },
        {
          "name": "collateral_asset_price",
          "type": "vesu::data_model::AssetPrice",
          "kind": "data"
        },
        {
          "name": "debt_asset_price",
          "type": "vesu::data_model::AssetPrice",
          "kind": "data"
        }
      ]
    },
    {
      "type": "event",
      "name": "vesu::singleton::Singleton::Flashloan",
      "kind": "struct",
      "members": [
        {
          "name": "sender",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "receiver",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "asset",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "amount",
          "type": "core::integer::u256",
          "kind": "data"
        }
      ]
    },
    {
      "type": "event",
      "name": "vesu::singleton::Singleton::ModifyDelegation",
      "kind": "struct",
      "members": [
        {
          "name": "pool_id",
          "type": "core::felt252",
          "kind": "key"
        },
        {
          "name": "delegator",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "delegatee",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "delegation",
          "type": "core::bool",
          "kind": "data"
        }
      ]
    },
    {
      "type": "event",
      "name": "vesu::singleton::Singleton::Donate",
      "kind": "struct",
      "members": [
        {
          "name": "pool_id",
          "type": "core::felt252",
          "kind": "key"
        },
        {
          "name": "asset",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "amount",
          "type": "core::integer::u256",
          "kind": "data"
        }
      ]
    },
    {
      "type": "event",
      "name": "vesu::singleton::Singleton::RetrieveReserve",
      "kind": "struct",
      "members": [
        {
          "name": "pool_id",
          "type": "core::felt252",
          "kind": "key"
        },
        {
          "name": "asset",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "receiver",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        }
      ]
    },
    {
      "type": "event",
      "name": "vesu::singleton::Singleton::SetLTVConfig",
      "kind": "struct",
      "members": [
        {
          "name": "pool_id",
          "type": "core::felt252",
          "kind": "key"
        },
        {
          "name": "collateral_asset",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "debt_asset",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "ltv_config",
          "type": "vesu::data_model::LTVConfig",
          "kind": "data"
        }
      ]
    },
    {
      "type": "event",
      "name": "vesu::singleton::Singleton::SetAssetConfig",
      "kind": "struct",
      "members": [
        {
          "name": "pool_id",
          "type": "core::felt252",
          "kind": "key"
        },
        {
          "name": "asset",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        }
      ]
    },
    {
      "type": "event",
      "name": "vesu::singleton::Singleton::SetAssetParameter",
      "kind": "struct",
      "members": [
        {
          "name": "pool_id",
          "type": "core::felt252",
          "kind": "key"
        },
        {
          "name": "asset",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        {
          "name": "parameter",
          "type": "core::felt252",
          "kind": "key"
        },
        {
          "name": "value",
          "type": "core::integer::u256",
          "kind": "data"
        }
      ]
    },
    {
      "type": "event",
      "name": "vesu::singleton::Singleton::SetExtension",
      "kind": "struct",
      "members": [
        {
          "name": "pool_id",
          "type": "core::felt252",
          "kind": "key"
        },
        {
          "name": "extension",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        }
      ]
    },
    {
      "type": "event",
      "name": "vesu::singleton::Singleton::Event",
      "kind": "enum",
      "variants": [
        {
          "name": "CreatePool",
          "type": "vesu::singleton::Singleton::CreatePool",
          "kind": "nested"
        },
        {
          "name": "ModifyPosition",
          "type": "vesu::singleton::Singleton::ModifyPosition",
          "kind": "nested"
        },
        {
          "name": "TransferPosition",
          "type": "vesu::singleton::Singleton::TransferPosition",
          "kind": "nested"
        },
        {
          "name": "LiquidatePosition",
          "type": "vesu::singleton::Singleton::LiquidatePosition",
          "kind": "nested"
        },
        {
          "name": "AccrueFees",
          "type": "vesu::singleton::Singleton::AccrueFees",
          "kind": "nested"
        },
        {
          "name": "UpdateContext",
          "type": "vesu::singleton::Singleton::UpdateContext",
          "kind": "nested"
        },
        {
          "name": "Flashloan",
          "type": "vesu::singleton::Singleton::Flashloan",
          "kind": "nested"
        },
        {
          "name": "ModifyDelegation",
          "type": "vesu::singleton::Singleton::ModifyDelegation",
          "kind": "nested"
        },
        {
          "name": "Donate",
          "type": "vesu::singleton::Singleton::Donate",
          "kind": "nested"
        },
        {
          "name": "RetrieveReserve",
          "type": "vesu::singleton::Singleton::RetrieveReserve",
          "kind": "nested"
        },
        {
          "name": "SetLTVConfig",
          "type": "vesu::singleton::Singleton::SetLTVConfig",
          "kind": "nested"
        },
        {
          "name": "SetAssetConfig",
          "type": "vesu::singleton::Singleton::SetAssetConfig",
          "kind": "nested"
        },
        {
          "name": "SetAssetParameter",
          "type": "vesu::singleton::Singleton::SetAssetParameter",
          "kind": "nested"
        },
        {
          "name": "SetExtension",
          "type": "vesu::singleton::Singleton::SetExtension",
          "kind": "nested"
        }
      ]
    }
  ]