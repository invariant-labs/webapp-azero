import { Network, PoolKey } from '@invariant-labs/a0-sdk'
import { ActionCreatorWithPayload } from '@reduxjs/toolkit'
import { SwapError } from '@store/sagas/swap'

interface ActionsBasicType {
  [k: string]: ActionCreatorWithPayload<any>
}

export type PayloadType<actions extends ActionsBasicType> = {
  [k in keyof actions]: Parameters<actions[k]>[0]
}

export interface ISelectNetwork {
  networkType: Network
  rpc: string
  rpcName?: string
}

export interface PrefixConfig {
  B?: number
  M?: number
  K?: number
}

export type CoinGeckoAPIData = CoinGeckoAPIPriceData[]

export type CoinGeckoAPIPriceData = {
  id: string
  current_price: number
  price_change_percentage_24h: number
}

export type SimulateResult = {
  poolKey: PoolKey | null
  amountOut: bigint
  priceImpact: number
  targetSqrtPrice: bigint
  fee: bigint
  errors: SwapError[]
}

export interface FormatNumberThreshold {
  value: number
  decimals: number
  divider?: number
}

export type PositionOpeningMethod = 'range' | 'concentration'

export interface TokenPriceData {
  price: number
}

export interface Token {
  symbol: string
  address: string
  decimals: bigint
  name: string
  logoURI: string
  balance?: bigint
  coingeckoId?: string
  isUnknown?: boolean
}

export interface BestTier {
  tokenX: string
  tokenY: string
  bestTierIndex: number
}

export interface ISelectChain {
  name: Chain
  address: string
}

export enum Chain {
  Solana = 'Solana',
  AlephZero = 'Aleph Zero',
  Eclipse = 'Eclipse',
  Vara = 'Vara'
}

export interface SnapshotValueData {
  tokenBNFromBeginning: string
  usdValue24: number
}

export interface PoolSnapshot {
  timestamp: number
  volumeX: SnapshotValueData
  volumeY: SnapshotValueData
  liquidityX: SnapshotValueData
  liquidityY: SnapshotValueData
  feeX: SnapshotValueData
  feeY: SnapshotValueData
}

export interface FullSnap {
  volume24: {
    value: number
    change: number
  }
  tvl24: {
    value: number
    change: number
  }
  fees24: {
    value: number
    change: number
  }
  tokensData: TokenStatsDataWithString[]
  poolsData: PoolStatsDataWithString[]
  volumePlot: TimeData[]
  liquidityPlot: TimeData[]
}

export interface TokenStatsDataWithString {
  address: string
  price: number
  volume24: number
  tvl: number
}

export interface TimeData {
  timestamp: number
  value: number
}

export interface PoolStatsDataWithString {
  poolAddress: string
  tokenX: string
  tokenY: string
  fee: number
  volume24: number
  tvl: number
  apy: number
}
