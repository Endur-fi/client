// Holdings service using the Endur SDK
import { EndurSDK, ProtocolType } from '@endur/sdk';
import { BlockIdentifier, RpcProvider } from 'starknet';
import MyNumber from '@/lib/MyNumber';
import { getProvider, STRK_DECIMALS } from '@/constants';

// Singleton instance of the SDK (unused for now)
// let sdkInstance: EndurSDK | null = null;

export interface HoldingsData {
  xSTRKAmount: MyNumber;
  STRKAmount: MyNumber;
}

export interface ProtocolHoldings {
  lst: HoldingsData;
  ekubo: HoldingsData;
  nostra: HoldingsData;
  opus: HoldingsData;
  strkfarm: HoldingsData;
  vesu: HoldingsData;
  total: HoldingsData;
}

class HoldingsService {
  private sdk: EndurSDK;
  private provider = getProvider();

  constructor() {
    this.sdk = new EndurSDK({
      config: {
        network: 'mainnet',
        timeout: 30000,
      },
      provider: getProvider() as any
    });
  }

  /**
   * Sets the provider for the SDK
   */
  setProvider(provider: RpcProvider): void {
    this.provider = provider;
    this.sdk.setProvider(provider as any);
  }

  /**
   * Gets holdings for a specific protocol
   */
  async getProtocolHoldings(
    address: string,
    protocol: ProtocolType,
    blockNumber?: BlockIdentifier
  ): Promise<HoldingsData> {
    if (!this.provider) {
      throw new Error('Provider not set');
    }

    try {
      const response = await this.sdk.holdings.getProtocolHoldings(protocol, {
        address,
        provider: this.provider,
        blockNumber,
      });

      if (response.success && response.data) {
        return {
          xSTRKAmount: new MyNumber(response.data.xSTRKAmount, STRK_DECIMALS),
          STRKAmount: new MyNumber(response.data.STRKAmount, STRK_DECIMALS),
        };
      }

      return {
        xSTRKAmount: MyNumber.fromZero(),
        STRKAmount: MyNumber.fromZero(),
      };
    } catch (error) {
      console.error(`Error fetching ${protocol} holdings:`, error);
      return {
        xSTRKAmount: MyNumber.fromZero(),
        STRKAmount: MyNumber.fromZero(),
      };
    }
  }

  /**
   * Gets all protocol holdings for an address
   */
  async getAllProtocolHoldings(
    address: string,
    blockNumber?: number | 'latest' | 'pending'
  ): Promise<ProtocolHoldings> {
    if (!this.provider) {
      throw new Error('Provider not set');
    }

    try {
      const response = await this.sdk.holdings.getMultiProtocolHoldings({
        address,
        provider: this.provider,
        blockNumber,
      });

      const protocolHoldings: ProtocolHoldings = {
        lst: {
          xSTRKAmount: MyNumber.fromZero(),
          STRKAmount: MyNumber.fromZero(),
        },
        ekubo: {
          xSTRKAmount: MyNumber.fromZero(),
          STRKAmount: MyNumber.fromZero(),
        },
        nostra: {
          xSTRKAmount: MyNumber.fromZero(),
          STRKAmount: MyNumber.fromZero(),
        },
        opus: {
          xSTRKAmount: MyNumber.fromZero(),
          STRKAmount: MyNumber.fromZero(),
        },
        strkfarm: {
          xSTRKAmount: MyNumber.fromZero(),
          STRKAmount: MyNumber.fromZero(),
        },
        vesu: {
          xSTRKAmount: MyNumber.fromZero(),
          STRKAmount: MyNumber.fromZero(),
        },
        total: {
          xSTRKAmount: MyNumber.fromZero(),
          STRKAmount: MyNumber.fromZero(),
        },
      };

      // Map SDK response to our format
      Object.entries(response.byProtocol).forEach(([protocol, holdings]) => {
        if (protocol in protocolHoldings) {
          protocolHoldings[protocol as keyof Omit<ProtocolHoldings, 'total'>] = {
            xSTRKAmount: new MyNumber(holdings.xSTRKAmount, STRK_DECIMALS),
            STRKAmount: new MyNumber(holdings.STRKAmount, STRK_DECIMALS),
          };
        }
      });

      // Set total
      protocolHoldings.total = {
        xSTRKAmount: new MyNumber(response.total.xSTRKAmount, STRK_DECIMALS),
        STRKAmount: new MyNumber(response.total.STRKAmount, STRK_DECIMALS),
      };

      return protocolHoldings;
    } catch (error) {
      console.error('Error fetching all protocol holdings:', error);
      return {
        lst: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
        ekubo: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
        nostra: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
        opus: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
        strkfarm: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
        vesu: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
        total: { xSTRKAmount: MyNumber.fromZero(), STRKAmount: MyNumber.fromZero() },
      };
    }
  }

  /**
   * Gets LST-specific data
   */
  async getLSTData(blockNumber?: number | 'latest' | 'pending') {
    if (!this.provider) {
      throw new Error('Provider not set');
    }

    try {
      const lstService = this.sdk.holdings.getProtocolService('lst');
      
      const [totalAssets, totalSupply, exchangeRate] = await Promise.all([
        lstService.getTotalAssets(blockNumber),
        lstService.getTotalSupply(blockNumber),
        lstService.getExchangeRate(blockNumber),
      ]);

      return {
        totalAssets: new MyNumber(totalAssets, STRK_DECIMALS),
        totalSupply: new MyNumber(totalSupply, STRK_DECIMALS),
        exchangeRate: new MyNumber(exchangeRate, STRK_DECIMALS),
      };
    } catch (error) {
      console.error('Error fetching LST data:', error, {
        blockNumber
      });
      return {
        totalAssets: MyNumber.fromZero(),
        totalSupply: MyNumber.fromZero(),
        exchangeRate: MyNumber.fromZero(),
      };
    }
  }

  /**
   * Converts xSTRK to STRK using current exchange rate
   */
  async convertXSTRKToSTRK(
    xSTRKAmount: string,
    blockNumber?: number | 'latest' | 'pending'
  ): Promise<MyNumber> {
    if (!this.provider) {
      throw new Error('Provider not set');
    }

    try {
      const lstService = this.sdk.holdings.getProtocolService('lst');
      const strkAmount = await lstService.convertXSTRKToSTRK(xSTRKAmount, blockNumber);
      return new MyNumber(strkAmount, STRK_DECIMALS);
    } catch (error) {
      console.error('Error converting xSTRK to STRK:', error);
      return MyNumber.fromZero();
    }
  }
}

// Export singleton instance
export const holdingsService = new HoldingsService();

// Export the class for testing
export { HoldingsService }; 