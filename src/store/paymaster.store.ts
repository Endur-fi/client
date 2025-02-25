import { atom } from 'jotai'
import { GasTokenPrice, GaslessCompatibility, PaymasterReward } from '@avnu/gasless-sdk'

interface PaymasterState {
  loading: boolean
  gasTokenPrices: GasTokenPrice[]
  selectedGasToken: GasTokenPrice | null
  compatibility: GaslessCompatibility | null
  rewards: PaymasterReward[]
  error: string | null
  isApiAvailable: boolean
  estimatedGasFees: bigint
}

const initialState: PaymasterState = {
  loading: false,
  gasTokenPrices: [],
  selectedGasToken: null,
  compatibility: null,
  rewards: [],
  error: null,
  isApiAvailable: true,
  estimatedGasFees: BigInt(0)
}

export const paymasterAtom = atom<PaymasterState>(initialState)