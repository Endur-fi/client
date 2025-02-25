import { useCallback, useEffect, useState } from 'react';
import { useAccount, useProvider } from '@starknet-react/core';
import {
  executeCalls,
  fetchAccountCompatibility,
  fetchAccountsRewards,
  fetchGasTokenPrices,
  GaslessCompatibility,
  GaslessOptions,
  GasTokenPrice,
  getGasFeesInGasToken,
  PaymasterReward,
} from '@avnu/gasless-sdk';
import { AccountInterface, AccountInvocationItem, Call, EstimateFee, TransactionType } from 'starknet';
import { toast } from '@/hooks/use-toast';
import { TOKENS } from '@/constants';

const AVNU_BASE_URL = process.env.NEXT_PUBLIC_AVNU_API_URL || 'https://sepolia.api.avnu.fi';

export function useAvnuPaymaster() {
  const { address, account } = useAccount();
  const { provider } = useProvider();
  const [loading, setLoading] = useState(false);
  const [gasTokenPrices, setGasTokenPrices] = useState<GasTokenPrice[]>([]);
  const [selectedGasToken, setSelectedGasToken] = useState<GasTokenPrice | null>(null);
  const [compatibility, setCompatibility] = useState<GaslessCompatibility | null>(null);
  const [rewards, setRewards] = useState<PaymasterReward[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isApiAvailable, setIsApiAvailable] = useState(true);
  const [currentEstimatedFees, setCurrentEstimatedFees] = useState<bigint>(BigInt(0));
  const [toastShown, setToastShown] = useState(false);

  const options: GaslessOptions = {
    baseUrl: AVNU_BASE_URL,
  };

  const checkApiAvailability = useCallback(async () => {
    try {
      const response = await fetch(`${AVNU_BASE_URL}/paymaster/v1/status`);
      setIsApiAvailable(response.ok);
      return response.ok;
    } catch (err) {
      console.error('Avnu API unavailable:', err);
      setIsApiAvailable(false);
      return false;
    }
  }, []);

  useEffect(() => {
    if (!address) return;

    const initializePaymaster = async () => {
      const isAvailable = await checkApiAvailability();
      if (!isAvailable && !toastShown) {
        toast({
          title: "Paymaster Service Unavailable",
          description: "Using regular transaction method",
          variant: "destructive",
        });
        setToastShown(true);
        return;
      }

      try {
        const [compatibilityResult, rewardsResult, pricesResult] = await Promise.all([
          fetchAccountCompatibility(address, options),
          fetchAccountsRewards(address, options),
          fetchGasTokenPrices(options),
        ]);

        setCompatibility(compatibilityResult);
        setRewards(rewardsResult);

        // Map gasTokenPrices to include the symbol property
        const updatedGasTokenPrices = pricesResult.map((token) => {
          const tokenInfo = TOKENS.find((t) => t.address === token.tokenAddress);
          return {
            ...token,
            symbol: tokenInfo?.symbol || "UNKNOWN",
            priceInUSD: token.priceInUSD || 0,
          };
        });

        setGasTokenPrices(updatedGasTokenPrices);
        console.log("Gas Token Prices:", updatedGasTokenPrices);

        // Set the default gas token to STRK if available, otherwise ETH
        const defaultGasToken =
          updatedGasTokenPrices.find((t) => t.symbol === "STRK") || updatedGasTokenPrices[0];
        setSelectedGasToken(defaultGasToken);
        console.log("Selected Gas Token (Default):", defaultGasToken);
      } catch (err) {
        console.error("Failed to initialize paymaster:", err);
        setError("Failed to initialize paymaster services");
        setIsApiAvailable(false);
      }
    };

    initializePaymaster();
  }, [address, checkApiAvailability, options, toastShown]);

  const estimateGasFees = useCallback(async (calls: Call[]): Promise<bigint> => {
    if (!account || !provider || !selectedGasToken) return BigInt(0);
    
    try {
      const invocations: AccountInvocationItem[] = calls.map(call => ({
        type: TransactionType.INVOKE,
        calldata: call.calldata,
        contractAddress: call.contractAddress,
        entrypoint: call.entrypoint,
        nonce: 0,
        maxFee: 0,
        version: 1,
      }));
      
      const estimationResult = await provider.getEstimateFeeBulk(invocations, {
        blockIdentifier: 'pending'
      });

      if (!estimationResult?.length) {
        throw new Error('Failed to estimate fees');
      }

      const overallFee = estimationResult.reduce((acc, fee) => {
        const feeBigInt = BigInt(fee.overall_fee || 0);
        return acc + feeBigInt;
      }, BigInt(0));
      
      if (overallFee <= BigInt(0)) {
        throw new Error('Invalid fee estimation');
      }

      if (!compatibility) {
        setCurrentEstimatedFees(overallFee);
        return overallFee;
      }

      const gasFeesWithMargin = (overallFee * BigInt(110)) / BigInt(100);

      const gasFeesInToken = getGasFeesInGasToken(
        gasFeesWithMargin,
        selectedGasToken,
        BigInt(estimationResult[0]?.gas_price || 0),
        BigInt(estimationResult[0]?.data_gas_price || 0),
        compatibility.gasConsumedOverhead,
        compatibility.dataGasConsumedOverhead
      );

      if (gasFeesInToken <= BigInt(0)) {
        throw new Error('Invalid gas token conversion');
      }

      setCurrentEstimatedFees(gasFeesInToken);
      return gasFeesInToken;
    } catch (error) {
      console.error('Error estimating gas fees:', error);
      const fallbackFee = BigInt('1000000000000000'); 
      setCurrentEstimatedFees(fallbackFee);
      return fallbackFee;
    }
  }, [account, provider, selectedGasToken, compatibility]);

  const executeTransaction = useCallback(async (calls: Call[]) => {
    if (!account || !selectedGasToken) {
      setError('Account or gas token not selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const maxGasTokenAmount = await estimateGasFees(calls);

      if (!isApiAvailable) {
        const response = await account.execute(calls);
        setLoading(false);
        return response;
      }

      const response = await executeCalls(
        account as AccountInterface,
        calls,
        {
          gasTokenAddress: selectedGasToken.tokenAddress,
          maxGasTokenAmount,
        },
        options
      );

      setLoading(false);
      return response;
    } catch (err) {
      setError('Failed to execute transaction');
      setLoading(false);
      throw err;
    }
  }, [account, selectedGasToken, estimateGasFees, isApiAvailable, options]);

  return {
    loading,
    gasTokenPrices,
    selectedGasToken,
    setSelectedGasToken,
    compatibility,
    rewards,
    error,
    executeTransaction,
    estimatedGasFees: currentEstimatedFees,
    isApiAvailable
  };
}