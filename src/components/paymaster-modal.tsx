"use client"

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAccount, useProvider } from "@starknet-react/core";
import { Contract } from "starknet";
import { Fuel } from 'lucide-react';
import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatUnits } from "ethers";
import { useAvnuPaymaster } from '@/hooks/use-avnu-paymaster';

interface Token {
  symbol: string;
  address: string;
  logoUrl: string;
  decimals: number;
  balance?: number;
}

const TOKENS: Token[] = [
  { symbol: 'ETH', address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7', logoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', decimals: 18 },
  { symbol: 'STRK', address: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d', logoUrl: 'https://assets.coingecko.com/coins/images/26433/standard/starknet.png', decimals: 18 },
  { symbol: 'xSTRK', address: '0x0000000000000000000000000000000000000000000000000000000000000001', logoUrl: 'http://endur.fi/logo.svg', decimals: 18 },
  { symbol: 'USDT', address: '0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8', logoUrl: 'https://assets.coingecko.com/coins/images/325/small/Tether.png', decimals: 6 },
  { symbol: 'USDC', address: '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8', logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png', decimals: 6 },
  { symbol: 'DAI', address: '0x00da114221cb83fa859dbdb4c44beeaa0bb37c7537ad5ae66fe5e0efd20e6eb3', logoUrl: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png', decimals: 18 }
];

const ERC20_ABI = [
  {
    members: [
      { name: "low", offset: 0, type: "felt" },
      { name: "high", offset: 1, type: "felt" }
    ],
    name: "Uint256",
    size: 2,
    type: "struct"
  },
  {
    inputs: [{ name: "account", type: "felt" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "Uint256" }],
    stateMutability: "view",
    type: "function"
  }
];

const TokenSelector = ({ isMobile }: { isMobile?: boolean }) => {
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { address } = useAccount();
  const { provider } = useProvider();
  const { gasTokenPrices, setSelectedGasToken } = useAvnuPaymaster();

  async function getTokenBalance(tokenAddress: string, accountAddress: string): Promise<bigint> {
    try {
      const contract = new Contract(ERC20_ABI, tokenAddress, provider);
      const response = await contract.balanceOf(accountAddress);
      const balance = typeof response === 'string' ? response : response.balance?.low?.toString() || '0';
      return BigInt(balance);
    } catch (error) {
      console.error(`Error fetching balance for token ${tokenAddress}:`, error);
      return BigInt(0);
    }
  }

  function getDefaultToken(availableTokens: Token[]): Token | null {
    // Check for xSTRK with positive balance
    const xSTRK = availableTokens.find(t => t.symbol === 'xSTRK' && t.balance && t.balance > 0);
    if (xSTRK) return xSTRK;

    // Check other tokens in priority order
    const priorityOrder = ['ETH', 'STRK', 'USDT', 'USDC', 'DAI'];
    for (const symbol of priorityOrder) {
      const priorityToken = availableTokens.find(t => t.symbol === symbol && t.balance && t.balance > 0);
      if (priorityToken) return priorityToken;
    }
    
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
              balance: Number(formatUnits(balance, token.decimals))
            };
          })
        );

        const sortedTokens = tokensWithBalances.sort((a, b) => (b.balance || 0) - (a.balance || 0));
        setTokens(sortedTokens);
        const defaultToken = getDefaultToken(sortedTokens);
        setSelectedToken(defaultToken);
      } catch (error) {
        console.error('Error loading balances:', error);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className={cn(
          "flex h-10 items-center justify-center gap-2 rounded-lg border border-[#ECECED80] bg-[#AACBC433] px-3 text-sm font-bold",
          { "h-[34px]": isMobile }
        )}>
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
      </DialogTrigger>
      
      <DialogContent className="max-w-sm p-0 overflow-hidden bg-gradient-to-b from-[#AACBC433] to-white">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl leading-tight font-normal">
            Pay network fees with a token of your choice
          </DialogTitle>
          <p className="text-lg font-bold">Wallet Default</p>
        </DialogHeader>

        <ScrollArea className="max-h-[300px] overflow-y-auto">
          <div className="divide-y divide-[#AACBC480]">
            {loading ? (
              <p className="p-4">Loading tokens...</p>
            ) : (
              tokens.map((token) => (
                <button
                  key={token.address}
                  className={cn(
                    "flex items-center w-full px-6 py-4 transition focus:outline-none",
                    token.balance && token.balance > 0
                      ? "hover:bg-[#AACBC433] focus:bg-[#AACBC433]"
                      : "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => {
                    if (token.balance && token.balance > 0) {
                      const gasToken = gasTokenPrices.find(t => t.tokenAddress === token.address);
                      console.error({gasTokenPrices})
                      if (gasToken) {
                        setSelectedGasToken(gasToken);
                        setSelectedToken(token);
                        setOpen(false);
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
                    {token.balance?.toFixed(4) ?? '0.0000'}
                  </span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TokenSelector;