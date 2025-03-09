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
  SEPOLIA_BASE_URL,
  BASE_URL,
} from '@avnu/gasless-sdk';
import { Account, AccountInterface, AccountInvocationItem, Call, EstimateFee, EstimateFeeResponse, Invocation, RpcProvider, stark, transaction, TransactionType } from 'starknet';
import { toast } from '@/hooks/use-toast';
import { getProvider, isMainnet } from '@/constants';
import { atom } from 'jotai';
import { get } from 'http';
import { providerAtom, userAddressAtom } from '@/store/common.store';
import { atomWithQuery } from 'jotai-tanstack-query';
import { standariseAddress } from '@/lib/utils';

const AVNU_BASE_URL = isMainnet() ? BASE_URL : SEPOLIA_BASE_URL;

export interface TokenMetadata {
  symbol: string;
  address: string;
  logoUri: string;
  name: string;
  balance: number;
}

export type GasTokenWithBalance = GasTokenPrice & TokenMetadata;

export class AvnuPaymaster {
  address: string | undefined;
  provider: RpcProvider | undefined;

  avnuOptions: GaslessOptions = {
    baseUrl: AVNU_BASE_URL,
  };

  accountCompatibility: GaslessCompatibility | undefined;
  gasTokenPrices: GasTokenPrice[] = [];
  selectedGasToken: GasTokenWithBalance | null = null;

  constructor(address: string, provider: RpcProvider) {
    this.address = address;
    this.provider = provider;
  }

  static dummy() {
    return new AvnuPaymaster('0x0', getProvider());
  }

  changeAdress(address: string) {
    this.address = address;
  }

  changeProvider(provider: RpcProvider) {
    this.provider = provider;
  }

  setSelectedGasToken(token: GasTokenWithBalance) {
    this.selectedGasToken = token;
  }
  
  async isAvnuAPIAvailable() {
    try {
      const response = await fetch(`${AVNU_BASE_URL}/paymaster/v1/status`);
      return response.ok;
    } catch (err) {
      console.error('Avnu API unavailable:', err);
      return false;
    }
  }

  async loadGasTokens() {
    if (!this.address) return [];
    if (!(await this.isAvnuAPIAvailable())) return [];

    const [compatibilityResult, rewardsResult, pricesResult] = await Promise.all([
      fetchAccountCompatibility(this.address, this.avnuOptions),
      fetchAccountsRewards(this.address, this.avnuOptions),
      fetchGasTokenPrices(this.avnuOptions),
    ]);

    this.accountCompatibility = compatibilityResult;
    // setRewards(rewardsResult);

    // set gas tokens
    this.gasTokenPrices = pricesResult;
  }

  async estimateGasFees(feeEstimateETH: EstimateFeeResponse) {
    if (!this.address || !this.provider || !this.selectedGasToken) return BigInt(0);
    if (!(await this.isAvnuAPIAvailable())) return BigInt(0);
    
    try {
      // const contractVersion = await this.provider.getContractVersion(account.address);
      // const nonce = await this.provider.getNonceForAddress(account.address);
      // const details = stark.v3Details({ skipValidate: true });
      // const invocation = {
      //   ...details,
      //   contractAddress: account.address,
      //   calldata: transaction.getExecuteCalldata(calls, contractVersion.cairo),
      //   signature: [],
      // };
      
      // const invocation: Invocation = { 
      //   ...details,
      //   contractAddress: account.address,
      //   calldata: transaction.getExecuteCalldata(calls, contractVersion.cairo),
      //   signature: [],
      // };
      
      // console.log('estimateGasFees invocations:', invocation, nonce, details);
      // this.provider.getInvokeEstimateFee()
      // const estimationResult = await this.provider.getInvokeEstimateFee(invocation, { ...details, nonce, version: 1 }, 'pending', true);
      // console.log('estimateGasFees estimationResult:', estimationResult);

      const overallFee = feeEstimateETH.overall_fee;
      
      if (overallFee <= BigInt(0)) {
        throw new Error('Invalid fee estimation');
      }

      if (!this.accountCompatibility) {
        // setCurrentEstimatedFees(overallFee);
        return overallFee;
      }

      const gasFeesWithMargin = (overallFee * BigInt(110)) / BigInt(100);

      const gasFeesInToken = getGasFeesInGasToken(
        gasFeesWithMargin,
        this.selectedGasToken,
        BigInt(feeEstimateETH.gas_price || 0),
        BigInt(feeEstimateETH.data_gas_consumed || 0),
        this.accountCompatibility.gasConsumedOverhead,
        this.accountCompatibility.dataGasConsumedOverhead
      );

      if (gasFeesInToken <= BigInt(0)) {
        throw new Error('Invalid gas token conversion');
      }

      // setCurrentEstimatedFees(gasFeesInToken);
      return gasFeesInToken;
    } catch (error) {
      console.error('Error estimating gas fees:', error);
      const fallbackFee = BigInt('1000000000000000'); 
      // setCurrentEstimatedFees(fallbackFee);
      return fallbackFee;
    }
  }

  async executeTransaction(account: AccountInterface, calls: Call[], feeEstimateETH: EstimateFeeResponse, options?: GaslessOptions) {
    if (!this.address || !this.provider || !this.selectedGasToken) {
      return;
    }

    if (standariseAddress(account.address) != standariseAddress(this.address)) {
      console.error('Account address does not match paymaster address');
      return;
    }

    if (!(await this.isAvnuAPIAvailable()) || !this.accountCompatibility?.isCompatible) {
      // todo handle this case
      console.error('Avnu API unavailable or account not compatible');
      const response = await account.execute(calls);
      return response;
    }

    try {
      const maxGasTokenAmount = await this.estimateGasFees(feeEstimateETH);
      console.log('executeTransaction maxGasTokenAmount:', maxGasTokenAmount, this.selectedGasToken, calls);
      const response = await executeCalls(
        account as AccountInterface,
        calls,
        {
          gasTokenAddress: this.selectedGasToken.tokenAddress,
          maxGasTokenAmount,
        },
        // options
      );
      console.log('executeTransaction response:', response);
      return response;
    } catch (err) {
      console.error('Error V3 tx, sending normal:', err);
      try {
        const response = await account.execute(calls);
        console.log('executeTransaction response:', response);
        return response;
      } catch (error) {
        console.error('Error executing transaction:', error);
        throw error;
      }
    }
  }
}

const avnuPaymasterQueryAtom = atomWithQuery((get) => {
  return {
    queryKey: ['avnu-paymaster', get(userAddressAtom), get(providerAtom)],
    queryFn: async () => {
      const address = get(userAddressAtom);
      const provider = get(providerAtom);
      if (!address || !provider) {
        return null;
      }

      // const existingPaymaster = get(avnuPaymasterAtom);

      const paymaster = new AvnuPaymaster(address, provider);
      await paymaster.loadGasTokens();
      // if (existingPaymaster.selectedGasToken) {
      //   paymaster.setSelectedGasToken(existingPaymaster.selectedGasToken);
      // }

      return paymaster;
    },
  }
})

export const avnuPaymasterAtom = atom((get) => {
  const query = get(avnuPaymasterQueryAtom);
  return query.data || AvnuPaymaster.dummy();
})