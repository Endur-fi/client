import { gql } from "@apollo/client";
import { Contract, RpcProvider, CairoCustomEnum } from "starknet";
import { pointsApolloClient } from "@/lib/apollo-client";
import { getProvider } from "@/constants";
import erc4626Abi from "@/abi/erc4626.abi.json";
import pragmaOracleAbi from "@/abi/pragma-oracle.abi.json";
import { cacheManager } from "@/lib/cache";

// Token addresses from constants
const STRK_TOKEN_ADDRESS = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
const WBTC_TOKEN_ADDRESS = "0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac";
const SBTC_TOKEN_ADDRESS = "0x0593e034dda23eea82d2ba9a30960ed42cf4a01502cc2351dc9b9881f9931a68";
const LBTC_TOKEN_ADDRESS = "0x036834a40984312f7f7de8d31e3f6305b325389eaeea5b1c0664b2fb936461a4";
const TBTC_TOKEN_ADDRESS = "0x04daa17763b286d1e59b97c283c0b8c949994c361e426a28f743c67bdfe9a32f";

// LST token addresses
const XSTRK_TOKEN_ADDRESS = "0x028d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a";
const XWBTC_TOKEN_ADDRESS = "0x6a567e68c805323525fe1649adb80b03cddf92c23d2629a6779f54192dffc13";
const XLBTC_TOKEN_ADDRESS = "0x7dd3c80de9fcc5545f0cb83678826819c79619ed7992cc06ff81fc67cd2efe0";
const XSBTC_TOKEN_ADDRESS = "0x580f3dc564a7b82f21d40d404b3842d490ae7205e6ac07b1b7af2b4a5183dc9";
const XTBTC_TOKEN_ADDRESS = "0x43a35c1425a0125ef8c171f1a75c6f31ef8648edcc8324b55ce1917db3f9b91";

// Pragma Oracle address
const PRAGMA_ORACLE_ADDRESS = "0x02a85BD616F912537c50A49a4076db02c00b29b2cdc8a197Ce92ed1837fa875B";

export interface PortfolioBalance {
  balance: string;
  balanceInXstrk: string;
}

export interface NativeTokenBalances {
  strk: string;
  wbtc: string;
  sbtc: string;
  lbtc: string;
  tbtc: string;
}

export interface PortfolioData {
  blockNumber: number;
  timestamp: number;
  endur: PortfolioBalance;
  ekubo: PortfolioBalance;
  vesuCollateral: PortfolioBalance;
  vesuVtoken: PortfolioBalance;
  trovesSensei: PortfolioBalance;
  trovesHyper: PortfolioBalance;
  trovesEkubo: PortfolioBalance;
  nostra: PortfolioBalance;
  opus: PortfolioBalance;
}

/**
 * Fetches portfolio balance data for a given address and LST token (uncached)
 * @param userAddress - The user's wallet address
 * @param lstToken - The LST token to query (defaults to 'XSTRK')
 * @returns Promise resolving to PortfolioData
 * @throws Error if the GraphQL query fails
 */
async function getPortfolioBalanceUncached(
  userAddress: string,
  lstToken: string = 'XSTRK'
): Promise<PortfolioData> {
  const { data, error } = await pointsApolloClient.query({
    query: gql`
      query GetPortfolio($userAddress: String!, $lstToken: String!) {
        getPortfolio(userAddress: $userAddress, lstToken: $lstToken) {
          blockNumber
          timestamp
          endur {
            balance
            balanceInXstrk
          }
          ekubo {
            balance
            balanceInXstrk
          }
          vesuCollateral {
            balance
            balanceInXstrk
          }
          vesuVtoken {
            balance
            balanceInXstrk
          }
          trovesSensei {
            balance
            balanceInXstrk
          }
          trovesHyper {
            balance
            balanceInXstrk
          }
          trovesEkubo {
            balance
            balanceInXstrk
          }
          nostra {
            balance
            balanceInXstrk
          }
          opus {
            balance
            balanceInXstrk
          }
        }
      }
    `,
    variables: {
      userAddress,
      lstToken,
    },
    errorPolicy: 'all',
  });

  if (error) {
    throw new Error(`GraphQL query error: ${JSON.stringify(error)}`);
  }

  return data.getPortfolio;
}

/**
 * Fetches portfolio balance data for all LST tokens (XSTRK, XWBTC, XLBTC, XSBTC, XTBTC) for a given address (uncached)
 * @param userAddress - The user's wallet address
 * @returns Promise resolving to a record mapping LST token names to their PortfolioData
 */
async function getAllLstTokenBalancesUncached(
  userAddress: string
): Promise<Record<string, PortfolioData>> {
  const lstTokens = ['XSTRK', 'XWBTC', 'XLBTC', 'XSBTC', 'XTBTC'];

  // Fetch all portfolio balances in parallel
  const portfolioDataPromises = lstTokens.map((lstToken) =>
    getPortfolioBalanceUncached(userAddress, lstToken).catch((error) => {
      console.error(`Error fetching portfolio balance for ${lstToken}:`, error);
      // Return a zero portfolio data structure on error
      return {
        blockNumber: 0,
        timestamp: 0,
        endur: { balance: '0', balanceInXstrk: '0' },
        ekubo: { balance: '0', balanceInXstrk: '0' },
        vesuCollateral: { balance: '0', balanceInXstrk: '0' },
        vesuVtoken: { balance: '0', balanceInXstrk: '0' },
        trovesSensei: { balance: '0', balanceInXstrk: '0' },
        trovesHyper: { balance: '0', balanceInXstrk: '0' },
        trovesEkubo: { balance: '0', balanceInXstrk: '0' },
        nostra: { balance: '0', balanceInXstrk: '0' },
        opus: { balance: '0', balanceInXstrk: '0' },
      } as PortfolioData;
    })
  );

  const portfolioDataArray = await Promise.all(portfolioDataPromises);

  // Create a record mapping LST token to portfolio data
  const result: Record<string, PortfolioData> = {};
  lstTokens.forEach((lstToken, index) => {
    result[lstToken] = portfolioDataArray[index];
  });

  return result;
}

/**
 * Fetches native token balances (STRK, WBTC, SBTC, LBTC, TBTC) for a given address (uncached)
 * @param userAddress - The user's wallet address
 * @returns Promise resolving to NativeTokenBalances
 */
async function getNativeTokenBalancesUncached(
  userAddress: string
): Promise<NativeTokenBalances> {
  try {
    // Get all token balances (STRK and BTC tokens are all ERC20 - use balance_of)
    const [strkBalance, wbtcBalance, sbtcBalance, lbtcBalance, tbtcBalance] = await Promise.all([
      getTokenBalance(userAddress, STRK_TOKEN_ADDRESS),
      getTokenBalance(userAddress, WBTC_TOKEN_ADDRESS),
      getTokenBalance(userAddress, SBTC_TOKEN_ADDRESS),
      getTokenBalance(userAddress, LBTC_TOKEN_ADDRESS),
      getTokenBalance(userAddress, TBTC_TOKEN_ADDRESS),
    ]);

    return {
      strk: strkBalance,
      wbtc: wbtcBalance,
      sbtc: sbtcBalance,
      lbtc: lbtcBalance,
      tbtc: tbtcBalance,
    };
  } catch (error) {
    console.error('Error fetching native token balances:', error);
    // Return zero balances on error
    return {
      strk: '0',
      wbtc: '0',
      sbtc: '0',
      lbtc: '0',
      tbtc: '0',
    };
  }
}

/**
 * Helper function to get ERC20 token balance
 * @param userAddress - The user's wallet address
 * @param tokenAddress - The token contract address
 * @returns Promise resolving to balance as string
 */
async function getTokenBalance(
  userAddress: string,
  tokenAddress: string
): Promise<string> {
  try {
    const contract = new Contract({
      abi: erc4626Abi,
      address: tokenAddress,
      providerOrAccount: getProvider(),
    });

    const result = await contract.call("balance_of", [userAddress]);
    
    // Handle both u256 and felt252 return types
    if (typeof result === 'bigint') {
      return result.toString();
    } else if (result && typeof result === 'object') { // no need
      // Handle u256 struct { low, high }
      if ('low' in result && 'high' in result) {
        const low = BigInt(result.low || 0);
        const high = BigInt(result.high || 0);
        const twoTo128 = BigInt('340282366920938463463374607431768211456'); // 2^128
        return (high * twoTo128 + low).toString();
      }
      // Handle direct value
      if ('value' in result) {
        return result.value.toString();
      }
    }
    
    return '0';
  } catch (error) {
    console.error(`Error fetching token balance for ${tokenAddress}:`, error);
    return '0';
  }
}

/**
 * Get price data from Pragma Oracle
 * @param pairId - Trading pair ID (e.g., 'STRK/USD', 'BTC/USD')
 * @param provider - RPC provider
 * @returns Promise resolving to {price, decimals}
 */
async function getPriceFromOracle(
  pairId: string,
  provider?: RpcProvider
): Promise<{ price: bigint; decimals: bigint }> {
  if (!provider) {
    provider = getProvider();
  }

  const contract = new Contract({
    abi: pragmaOracleAbi,
    address: PRAGMA_ORACLE_ADDRESS,
    providerOrAccount: provider,
  });

  const data = new CairoCustomEnum({ SpotEntry: pairId });

  const result = await contract.call('get_data_median', [data], {
    blockIdentifier: 'latest',
  });

  if (!result || typeof result !== 'object') {
    throw new Error(`Price data not found for ${pairId}`);
  }

  if (!('price' in result) || !('decimals' in result)) {
    throw new Error(`Price or decimals not found for ${pairId}`);
  }

  return {
    price: BigInt(result.price.toString()),
    decimals: BigInt(result.decimals.toString()),
  };
}

/**
 * Get USD conversion rates for tokens
 * Returns rates as numbers (price in USD)
 */
async function getUSDConversionRatesUncached(): Promise<{
  strk: number;
  btc: number;
  xstrk: number;
  xwbtc: number;
  xlbtc: number;
  xsbtc: number;
  xtbtc: number;
}> {
  const provider = getProvider();

  // Get base prices from Oracle
  const [strkPrice, btcPrice] = await Promise.all([
    getPriceFromOracle('STRK/USD', provider),
    getPriceFromOracle('BTC/USD', provider),
  ]);

  // Calculate USD rates for base tokens
  const strkRate = Number(strkPrice.price) / 10 ** Number(strkPrice.decimals);
  const btcRate = Number(btcPrice.price) / 10 ** Number(btcPrice.decimals);

  // For LST tokens, we need to get total_assets and total_supply to calculate exchange rate
  // Then multiply by base token rate
  const [xstrkRate, xwbtcRate, xlbtcRate, xsbtcRate, xtbtcRate] = await Promise.all([
    calculateLSTRate(XSTRK_TOKEN_ADDRESS, strkRate, provider),
    calculateLSTRate(XWBTC_TOKEN_ADDRESS, btcRate, provider),
    calculateLSTRate(XLBTC_TOKEN_ADDRESS, btcRate, provider),
    calculateLSTRate(XSBTC_TOKEN_ADDRESS, btcRate, provider),
    calculateLSTRate(XTBTC_TOKEN_ADDRESS, btcRate, provider),
  ]);

  return {
    strk: strkRate,
    btc: btcRate,
    xstrk: xstrkRate,
    xwbtc: xwbtcRate,
    xlbtc: xlbtcRate,
    xsbtc: xsbtcRate,
    xtbtc: xtbtcRate,
  };
}

/**
 * Calculate LST token USD rate
 * Formula: (total_assets / total_supply) * base_token_rate
 */
async function calculateLSTRate(
  lstAddress: string,
  baseTokenRate: number,
  provider: RpcProvider
): Promise<number> {
  try {
    const contract = new Contract({
      abi: erc4626Abi,
      address: lstAddress,
      providerOrAccount: provider,
    });

    const [totalAssets, totalSupply] = await Promise.all([
      contract.call('total_assets', [], { blockIdentifier: 'latest' }),
      contract.call('total_supply', [], { blockIdentifier: 'latest' }),
    ]);

    const assets = BigInt(totalAssets.toString());
    const supply = BigInt(totalSupply.toString());

    if (supply === BigInt(0)) {
      return 0;
    }

    // Calculate exchange rate and multiply by base token rate
    const exchangeRate = Number(assets) / Number(supply);
    return exchangeRate * baseTokenRate;
  } catch (error) {
    console.error(`Error calculating LST rate for ${lstAddress}:`, error);
    return 0;
  }
}

// /**
//  * Get USD conversion rates for tokens (cached version)
//  * Cache TTL: 3 minutes
//  */
// export const getUSDConversionRates = cacheManager.createCachedFunction(
//   'usdConversionRates',
//   getUSDConversionRatesUncached,
//   3 * 60 * 1000 // 3 minutes
// );

// /**
//  * Fetches portfolio balance data for a given address and LST token (cached)
//  * Cache TTL: 3 minutes
//  */
// export const getPortfolioBalance = cacheManager.createCachedFunction(
//   'portfolioBalance',
//   getPortfolioBalanceUncached,
//   3 * 60 * 1000 // 3 minutes
// );

// /**
//  * Fetches portfolio balance data for all LST tokens (cached)
//  * Cache TTL: 3 minutes
//  */
// export const getAllLstTokenBalances = cacheManager.createCachedFunction(
//   'allLstTokenBalances',
//   getAllLstTokenBalancesUncached,
//   3 * 60 * 1000 // 3 minutes
// );

// /**
//  * Fetches native token balances (cached)
//  * Cache TTL: 3 minutes
//  */
// export const getNativeTokenBalances = cacheManager.createCachedFunction(
//   'nativeTokenBalances',
//   getNativeTokenBalancesUncached,
//   3 * 60 * 1000 // 3 minutes
// );

export const getUSDConversionRates = getUSDConversionRatesUncached;
export const getPortfolioBalance = getPortfolioBalanceUncached;
export const getAllLstTokenBalances = getAllLstTokenBalancesUncached;
export const getNativeTokenBalances = getNativeTokenBalancesUncached;
