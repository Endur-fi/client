import { atom } from 'jotai';
import { atomWithQuery } from 'jotai-tanstack-query';

// Constants
const XSTRK_TOKEN = '0x28d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a';
const STRK_TOKEN = '0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';
const QUOTE_REFRESH_INTERVAL = 10000; // 10 seconds

// Types
interface EkuboQuote {
  total_calculated: string;
  price_impact: number;
  splits: Array<{
    amount_specified: string;
    amount_calculated: string;
    route: Array<{
      pool_key: {
        token0: string;
        token1: string;
        fee: string;
        tick_spacing: number;
        extension: string;
      };
      sqrt_ratio_limit: string;
      skip_ahead: number;
    }>;
  }>;
}

interface AvnuQuote {
  quotes: Array<{
    sellAmount: string;
    buyAmount: string;
    // ... other fields as needed
  }>;
}

interface DexRate {
  dex: 'ekubo' | 'avnu';
  rate: number;
  timestamp: number;
}

// Format amount utility
const formatAmountForQuery = (amount: string) => {
  try {
    const amountInWei = BigInt(Math.floor(Number(amount) * 1e18));
    return {
      decimal: amountInWei.toString(),
      hex: `0x${amountInWei.toString(16)}`,
    };
  } catch (error) {
    console.error('Error formatting amount:', error);
    return null;
  }
};

// Fetch functions
const fetchEkuboRate = async (amount: string): Promise<number> => {
  const formattedAmount = formatAmountForQuery(amount);
  if (!formattedAmount) return 0;

  try {
    const response = await fetch(`https://quoter-mainnet-api.ekubo.org/${formattedAmount.decimal}/${XSTRK_TOKEN}/${STRK_TOKEN}`);

    if (!response.ok) throw new Error('Ekubo API error');

    const data = await response.json();
    const inputAmount = BigInt(data.splits[0].amount_specified);
    const outputAmount = BigInt(data.splits[0].amount_calculated);
    
    return Number(outputAmount) / Number(inputAmount);
  } catch (error) {
    console.error('Ekubo fetch error:', error);
    return 0;
  }
};

const fetchAvnuRate = async (amount: string): Promise<number> => {
  const formattedAmount = formatAmountForQuery(amount);
  if (!formattedAmount) return 0;

  try {
    const response = await fetch(
      `https://starknet.api.avnu.fi/internal/swap/quotes-with-prices?` +
      `sellTokenAddress=${XSTRK_TOKEN}&` +
      `buyTokenAddress=${STRK_TOKEN}&` +
      `sellAmount=${formattedAmount.hex}`
    );

    if (!response.ok) throw new Error('AVNU API error');

    const data = await response.json();
    if (data.quotes.length === 0) return 0;

    const quote = data.quotes[0];
    const sellAmount = BigInt(quote.sellAmount);
    const buyAmount = BigInt(quote.buyAmount);
    
    return Number(buyAmount) / Number(sellAmount);
  } catch (error) {
    console.error('AVNU fetch error:', error);
    return 0;
  }
};

// Fetch both rates with timestamp
const fetchDEXRates = async (amount: string): Promise<DexRate[]> => {
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return [];
  }

  const timestamp = Date.now();
  const [ekuboRate, avnuRate] = await Promise.all([
    fetchEkuboRate(amount),
    fetchAvnuRate(amount)
  ]);

  const rates: DexRate[] = [
    { dex: 'ekubo' as const, rate: ekuboRate, timestamp },
    { dex: 'avnu' as const, rate: avnuRate, timestamp }
  ];

  return rates
    .filter(quote => quote.rate > 0)
    .sort((a, b) => b.rate - a.rate);
};

// Atoms
export const amountAtom = atom<string>('');

export const dexRatesQueryAtom = atomWithQuery((get) => ({
  queryKey: ['dexRates', get(amountAtom)],
  queryFn: () => fetchDEXRates(get(amountAtom)),
  refetchInterval: QUOTE_REFRESH_INTERVAL,
  enabled: Boolean(get(amountAtom)) && Number(get(amountAtom)) > 0,
}));

export const dexRatesAtom = atom((get) => {
  const { data, error, isLoading } = get(dexRatesQueryAtom);
  return {
    rates: data ?? [],
    error,
    isLoading,
  };
});