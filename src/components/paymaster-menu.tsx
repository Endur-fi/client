"use client"

import { useState, useEffect, use, useMemo } from 'react';
import { useAccount, useProvider } from "@starknet-react/core";
import { Contract } from "starknet";
import { Fuel } from 'lucide-react';
import Image from "next/image";
import { cn, formatNumberWithCommas, retry, standariseAddress } from "@/lib/utils";
import { formatUnits } from "ethers";
import { avnuPaymasterAtom, GasTokenWithBalance } from '@/hooks/use-avnu-paymaster';
import { ETH_TOKEN, getProvider, isMainnet, STRK_TOKEN } from '@/constants';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from '@/hooks/use-toast';
import { GasTokenPrice } from '@avnu/gasless-sdk';
import ERC4626Abi from '@/abi/erc4626.abi.json';
import { set } from 'react-hook-form';
import { useAtom, useAtomValue } from 'jotai';

async function getTokenBalance(tokenAddress: string, accountAddress: string): Promise<bigint> {
  try {
    const contract = new Contract(ERC4626Abi, tokenAddress, getProvider());
    const response = await contract.balanceOf(accountAddress);
    return BigInt(response);
  } catch (error) {
    console.error(`Error fetching balance for token ${tokenAddress}:`, error);
    return BigInt(0);
  }
}

const TokenSelector = ({ isMobile }: { isMobile?: boolean }) => {
  const [loading, setLoading] = useState(true);
  const { address } = useAccount();
  const paymaster= useAtomValue(avnuPaymasterAtom);

  const [tokens, setTokens] = useState<GasTokenWithBalance[]>([]);
  const [selectedToken, setSelectedToken] = useState<GasTokenWithBalance | null>(null);

  // Prefer xSTRK > STRK > ETH > First available token
  function getDefaultToken(availableTokens: GasTokenWithBalance[]): GasTokenWithBalance | null {
    // Check for xSTRK with positive balance
    // const xSTRK = availableTokens.find((t) => t.symbol === "xSTRK" && t.balance && t.balance > 0);
    // if (xSTRK) return xSTRK;

    // Check for STRK with positive balance
    const STRK = availableTokens.find((t) => standariseAddress(t.tokenAddress) === STRK_TOKEN && t.balance && t.balance > 0);
    if (STRK) return STRK;

    // Check for ETH with positive balance
    const ETH = availableTokens.find((t) => standariseAddress(t.tokenAddress) == ETH_TOKEN && t.balance && t.balance > 0);
    if (ETH) return ETH;

    // Fallback to the first available token
    return availableTokens[0] || null;
  }

  useEffect(() => {
    const loadBalances = async () => {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        // fetch balances
        const tokensWithBalances = await Promise.all(
          paymaster.gasTokenPrices.map(async (token) => {
            const balance = await retry(getTokenBalance, [token.tokenAddress, address]);
            return {
              ...token,
              balance: Number(formatUnits(balance, token.decimals)),
            };
          })
        );

        const result = await fetch("/api/tokens");
        const metadata = (await result.json()).content;

        const sortedTokens = tokensWithBalances.sort((a, b) => (b.balance || 0) - (a.balance || 0));
        const tokensWithMetadata = sortedTokens.map((t) => {
          const tokenMetadata = metadata.find((m: any) => standariseAddress(m.address) === standariseAddress(t.tokenAddress));
          return {
            ...t,
            ...tokenMetadata,
          };
        });
        setTokens(tokensWithMetadata);
        console.log("Tokens with Balances:", sortedTokens);

        // Set default token if none is selected
        if (!paymaster.selectedGasToken) {
          const defaultToken = getDefaultToken(tokensWithMetadata);
          if (defaultToken)
            paymaster.setSelectedGasToken(defaultToken);
          setSelectedToken(defaultToken);
          console.log("Selected Token (Default):", defaultToken);
        }
      } catch (error) {
        console.error("Error loading balances:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBalances();
  }, [address, paymaster]);

  if (!address || !isMainnet() || !selectedToken || isMobile) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex h-10 items-center justify-center gap-2 rounded-lg border border-[#ECECED80] bg-[#AACBC433] px-3 text-sm font-bold",
            { "h-[34px]": isMobile }
          )}
        >
          {selectedToken ? (
            <>
              <div className="flex items-center gap-2">
                <Image
                  src={selectedToken.logoUri || ''}
                  alt={selectedToken.symbol || 'Token icon'}
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
                <span>
                  {selectedToken.balance.toFixed(4)} {selectedToken.symbol}
                </span>
              </div>
              <Fuel className="w-4 h-4" />
            </>
          ) : (
            <span>Select Token</span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="max-w-sm p-0 overflow-hidden bg-gradient-to-b from-[#AACBC433] to-white">
        <div className="divide-y divide-[#AACBC480]">
          {loading ? (
            <p className="p-4">Loading tokens...</p>
          ) : (
            // max 10 tokens
            tokens.filter((t) => t.balance > 0).slice(0, 10).map((token) => (
              <DropdownMenuItem
                key={token.address}
                className={cn(
                  "flex items-center w-full px-6 py-4 transition focus:outline-none gap-5",
                  token.balance && token.balance > 0
                    ? "hover:bg-[#AACBC433] focus:bg-[#AACBC433] cursor-pointer"
                    : "opacity-30 cursor-not-allowed"
                )}
                onClick={() => {
                  if (token.balance && token.balance > 0) {
                    const gasToken = paymaster.gasTokenPrices.find((t) => standariseAddress(t.tokenAddress) === standariseAddress(token.address));
                    if (gasToken) {
                      paymaster.setSelectedGasToken(token);
                      setSelectedToken(token);
                    } else {
                      toast({
                        title: "Gas Token Unavailable",
                        description: "Please select a different token",
                        variant: "pending",
                      })
                    }
                  }
                }}
                disabled={!token.balance || token.balance === 0}
              >
                <div className="flex items-center flex-1 gap-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#AACBC433]">
                    <Image
                      src={token.logoUri}
                      alt={`${token.symbol} icon`}
                      width={24}
                      height={24}
                      className="w-6 h-6"
                    />
                  </div>
                  <span className="text-base font-medium text-[#03624C]">
                    {token.symbol}
                  </span>
                </div>
                <span className="text-base tabular-nums">
                  {formatNumberWithCommas(Number(token.balance?.toFixed(4)) ?? 0, 4)}
                </span>
              </DropdownMenuItem>
            ))
          )}
          <p className='px-4 py-2 text-[13px] opacity-50'>Zero balance tokens are hidden</p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TokenSelector;