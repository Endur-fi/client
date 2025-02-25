"use client"

import { useState, useEffect } from 'react';
import { useAccount, useProvider } from "@starknet-react/core";
import { Contract } from "starknet";
import { Fuel } from 'lucide-react';
import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatUnits } from "ethers";
import { useAvnuPaymaster } from '@/hooks/use-avnu-paymaster';
import { ERC20_ABI, Token, TOKENS } from '@/constants';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const TokenSelector = ({ isMobile }: { isMobile?: boolean }) => {
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const { address } = useAccount();
  const { provider } = useProvider();
  const { gasTokenPrices, setSelectedGasToken, selectedGasToken } = useAvnuPaymaster();

  async function getTokenBalance(tokenAddress: string, accountAddress: string): Promise<bigint> {
    try {
      const contract = new Contract(ERC20_ABI, tokenAddress, provider);
      const response = await contract.balanceOf(accountAddress);
      const balance = typeof response === "string" ? response : response.balance?.low?.toString() || "0";
      return BigInt(balance);
    } catch (error) {
      console.error(`Error fetching balance for token ${tokenAddress}:`, error);
      return BigInt(0);
    }
  }

  function getDefaultToken(availableTokens: Token[]): Token | null {
    // Check for xSTRK with positive balance
    const xSTRK = availableTokens.find((t) => t.symbol === "xSTRK" && t.balance && t.balance > 0);
    if (xSTRK) return xSTRK;

    // Check for STRK with positive balance
    const STRK = availableTokens.find((t) => t.symbol === "STRK" && t.balance && t.balance > 0);
    if (STRK) return STRK;

    // Check for ETH with positive balance
    const ETH = availableTokens.find((t) => t.symbol === "ETH" && t.balance && t.balance > 0);
    if (ETH) return ETH;

    // Fallback to the first available token
    return availableTokens[0] || null;
  }

  useEffect(() => {
    const loadBalances = async () => {
      if (!address || !provider) {
        setLoading(false);
        return;
      }

      try {
        const tokensWithBalances = await Promise.all(
          TOKENS.map(async (token) => {
            const balance = await getTokenBalance(token.address, address);
            return {
              ...token,
              balance: Number(formatUnits(balance, token.decimals)),
            };
          })
        );

        const sortedTokens = tokensWithBalances.sort((a, b) => (b.balance || 0) - (a.balance || 0));
        setTokens(sortedTokens);
        console.log("Tokens with Balances:", sortedTokens);

        const defaultToken = getDefaultToken(sortedTokens);
        setSelectedToken(defaultToken);
        console.log("Selected Token (Default):", defaultToken);
      } catch (error) {
        console.error("Error loading balances:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBalances();
  }, [address, provider]);

  if (!address) {
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
                  src={selectedToken.logoUrl}
                  alt={selectedToken.symbol}
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
                <span>
                  {selectedToken.balance?.toFixed(4)} {selectedToken.symbol}
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
            tokens.map((token) => (
              <DropdownMenuItem
                key={token.address}
                className={cn(
                  "flex items-center w-full px-6 py-4 transition focus:outline-none",
                  token.balance && token.balance > 0
                    ? "hover:bg-[#AACBC433] focus:bg-[#AACBC433]"
                    : "opacity-50 cursor-not-allowed"
                )}
                onClick={() => {
                  if (token.balance && token.balance > 0) {
                    const gasToken = gasTokenPrices.find((t) => t.tokenAddress === token.address);
                    if (gasToken) {
                      setSelectedGasToken(gasToken);
                      setSelectedToken(token);
                      console.log("Selected Gas Token:", gasToken);
                      console.log("Selected Token:", token);
                    }
                  }
                }}
                disabled={!token.balance || token.balance === 0}
              >
                <div className="flex items-center flex-1 gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#AACBC433]">
                    <Image
                      src={token.logoUrl}
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
                  {token.balance?.toFixed(4) ?? "0.0000"}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TokenSelector;