import {
  BTC_ADDRESS,
  ETH_ADDRESS,
  FeeTier,
  LiquidityTick,
  Network,
  Pool,
  PoolKey,
  Tick,
  Tickmap,
  USDC_ADDRESS,
  WAZERO_ADDRESS
} from '@invariant-labs/a0-sdk'
import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import {
  MAINNET_AZERO,
  MAINNET_BTC,
  MAINNET_ETH,
  MAINNET_USDC,
  TESTNET_AZERO,
  TESTNET_BTC,
  TESTNET_ETH,
  TESTNET_USDC
} from '@store/consts/static'
import { PayloadType, Token } from '@store/consts/types'
import { poolKeyToString } from '@utils/utils'

import * as R from 'remeda'

export interface PoolWithPoolKey extends Pool {
  poolKey: PoolKey
}

export interface IndexedFeeTier {
  tier: FeeTier
  primaryIndex: number
}

export interface IPoolsStore {
  tokens: Record<string, Token>
  pools: { [key in string]: PoolWithPoolKey }
  poolKeys: { [key in string]: PoolKey }
  poolTicks: { [key in string]: LiquidityTick[] }
  nearestPoolTicksForPair: { [key in string]: Tick[] }
  isLoadingLatestPoolsForTransaction: boolean
  isLoadingTicksAndTickMaps: boolean
  isLoadingPoolKeys: boolean
  isLoadingTokens: boolean
  isLoadingTokensError: boolean
  tickMaps: { [key in string]: string }
}

export interface UpdatePool {
  poolKey: PoolKey
  poolStructure: Pool
}

export interface updateTickMaps {
  poolKey: PoolKey
  tickMapStructure: Tickmap
}

export interface UpdateTick {
  poolKey: PoolKey
  tickStructure: LiquidityTick[]
}
export interface DeleteTick {
  address: string
  index: number
}
export interface UpdateTicks extends DeleteTick {
  tick: Tick
}

export interface UpdateTickmap {
  address: string
  bitmap: number[]
}

export interface FetchTicksAndTickMaps {
  tokenFrom: string
  tokenTo: string
  allPools: PoolWithPoolKey[]
}

const network =
  Network[localStorage.getItem('INVARIANT_NETWORK_AlephZero') as keyof typeof Network] ??
  Network.Testnet

export const defaultState: IPoolsStore = {
  tokens:
    network === Network.Mainnet
      ? {
          [BTC_ADDRESS[Network.Mainnet]]: MAINNET_BTC,
          [ETH_ADDRESS[Network.Mainnet]]: MAINNET_ETH,
          [USDC_ADDRESS[Network.Mainnet]]: MAINNET_USDC,
          [WAZERO_ADDRESS[Network.Mainnet]]: MAINNET_AZERO
        }
      : {
          [BTC_ADDRESS[Network.Testnet]]: TESTNET_BTC,
          [ETH_ADDRESS[Network.Testnet]]: TESTNET_ETH,
          [USDC_ADDRESS[Network.Testnet]]: TESTNET_USDC,
          [WAZERO_ADDRESS[Network.Testnet]]: TESTNET_AZERO
        },
  pools: {},
  poolKeys: {},
  poolTicks: {},
  nearestPoolTicksForPair: {},
  isLoadingLatestPoolsForTransaction: false,
  isLoadingTicksAndTickMaps: false,
  isLoadingPoolKeys: true,
  isLoadingTokens: true,
  isLoadingTokensError: false,
  tickMaps: {}
}

export interface PairTokens {
  first: string
  second: string
}

export enum ListType {
  POSITIONS,
  FARMS
}

export interface ListPoolsRequest {
  poolKeys: PoolKey[]
  listType: ListType
}

export interface ListPoolsResponse {
  data: PoolWithPoolKey[]
  listType: ListType
}

export const poolsSliceName = 'pools'
const poolsSlice = createSlice({
  name: poolsSliceName,
  initialState: defaultState,
  reducers: {
    addTokens(state, action: PayloadAction<Record<string, Token>>) {
      state.tokens = {
        ...state.tokens,
        ...action.payload
      }
      state.isLoadingTokens = false
      return state
    },
    updateTokenBalances(state, action: PayloadAction<[string, bigint][]>) {
      action.payload.map(pair => {
        state.tokens[pair[0]] = {
          ...state.tokens[pair[0]],
          balance: pair[1]
        }
      })
      return state
    },
    setPoolKeys(state, action: PayloadAction<PoolKey[]>) {
      state.isLoadingPoolKeys = false
      action.payload.map(poolKey => {
        const keyStringified = poolKeyToString(poolKey)
        state.poolKeys[keyStringified] = poolKey
      })
      return state
    },
    getPoolKeys(state) {
      state.isLoadingPoolKeys = true
      return state
    },
    addPool(state, action: PayloadAction<PoolWithPoolKey | undefined>) {
      if (action.payload) {
        const { poolKey } = action.payload
        const keyStringified = poolKeyToString(poolKey)

        state.pools[keyStringified] = action.payload
      }

      state.isLoadingLatestPoolsForTransaction = false
      return state
    },
    getPoolData(state, _action: PayloadAction<PoolKey>) {
      state.isLoadingLatestPoolsForTransaction = true
      return state
    },
    setTickMaps(state, action: PayloadAction<updateTickMaps>) {
      state.tickMaps[poolKeyToString(action.payload.poolKey)] = JSON.stringify(
        Array.from(action.payload.tickMapStructure.bitmap.entries()).map(([key, value]) => [
          key.toString(),
          value.toString()
        ])
      )
      return state
    },
    stopIsLoadingTicksAndTickMaps(state) {
      state.isLoadingTicksAndTickMaps = false
    },
    setTicks(state, action: PayloadAction<UpdateTick>) {
      state.poolTicks[poolKeyToString(action.payload.poolKey)] = action.payload.tickStructure
      return state
    },
    addPools(state, action: PayloadAction<PoolWithPoolKey[]>) {
      const newData = action.payload.reduce(
        (acc, pool) => ({
          ...acc,
          [poolKeyToString(pool.poolKey)]: pool
        }),
        {}
      )
      state.pools = R.merge(state.pools, newData)
      state.isLoadingLatestPoolsForTransaction = false
      return state
    },
    addPoolsForList(state, action: PayloadAction<ListPoolsResponse>) {
      const newData = action.payload.data.reduce(
        (acc, pool) => ({
          ...acc,
          [poolKeyToString(pool.poolKey)]: pool
        }),
        {}
      )
      state.pools = R.merge(state.pools, newData)
      return state
    },
    getAllPoolsForPairData(state, _action: PayloadAction<PairTokens>) {
      state.isLoadingLatestPoolsForTransaction = true
      return state
    },
    getTicksAndTickMaps(state, _action: PayloadAction<FetchTicksAndTickMaps>) {
      state.isLoadingTicksAndTickMaps = true
      return state
    },
    getTokens(state, _action: PayloadAction<string[]>) {
      state.isLoadingTokens = true
      return state
    },
    setTokensError(state, action: PayloadAction<boolean>) {
      state.isLoadingTokensError = action.payload
      return state
    }
  }
})

export const actions = poolsSlice.actions
export const reducer = poolsSlice.reducer
export type PayloadTypes = PayloadType<typeof actions>
