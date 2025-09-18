import { RECEPIEINT_FEE_ADDRESS } from "@/constants";
import { Quote, QuoteRequest, fetchQuotes, executeSwap } from "@avnu/avnu-sdk";
import { AccountInterface } from "starknet";
import QuickLRU from "quick-lru";

const quoteCache = new QuickLRU<string, Quote[]>({
  maxSize: 1000,
  maxAge: 5000,
});

export async function getAvnuQuotes(
  amount: string,
  takerAddress: string,
  lstAddress: string,
  underlyingTokenAddress: string,
  decimals: number,
): Promise<Quote[]> {
  const cacheKey = `${amount}-${takerAddress}`;

  const cachedQuotes = quoteCache.get(cacheKey);
  if (cachedQuotes) {
    return cachedQuotes;
  }

  try {
    const params: QuoteRequest = {
      sellTokenAddress: lstAddress,
      buyTokenAddress: underlyingTokenAddress,
      sellAmount: BigInt(Math.floor(Number(amount) * 10 ** decimals)),
      takerAddress,
      size: 1,
      integratorFees: BigInt(3),
      integratorFeeRecipient: RECEPIEINT_FEE_ADDRESS,
      integratorName: "Endur",
    };

    const quotes = await fetchQuotes(params);
    console.log("Fetched Avnu quotes:", quotes);
    quoteCache.set(cacheKey, quotes);
    return quotes;
  } catch (error) {
    console.error("Error fetching Avnu quotes:", error);
    return [];
  }
}

export async function executeAvnuSwap(
  account: AccountInterface,
  quote: Quote,
  onSuccess?: () => void,
  onError?: (error: Error) => void,
) {
  try {
    const response = await executeSwap(account, quote);
    onSuccess?.();
    return response;
  } catch (error) {
    console.error("Error executing Avnu swap:", error);
    onError?.(error as Error);
    throw error;
  }
}
