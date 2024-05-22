import {
  FeeTier,
  Pool,
  PoolKey,
  TESTNET_BTC_ADDRESS,
  TESTNET_ETH_ADDRESS,
  TESTNET_USDC_ADDRESS,
  Tick
} from '@invariant-labs/a0-sdk'
import { AddressOrPair } from '@polkadot/api/types'
import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { BTC, ETH, Token, USDC } from '@store/consts/static'
import { PayloadType } from '@store/consts/types'
import { poolKeyToString } from '@store/consts/utils'

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
  poolTicks: { [key in string]: Tick[] }
  nearestPoolTicksForPair: { [key in string]: Tick[] }
  isLoadingLatestPoolsForTransaction: boolean
  tickMaps: { [key in string]: bigint[] }
  volumeRanges: Record<string, Range[]>
}

export interface UpdatePool {
  poolKey: PoolKey
  poolStructure: Pool
}

export interface updateTickMaps {
  index: string
  tickMapStructure: bigint[]
}

export interface UpdateTick {
  index: string
  tickStructure: Tick[]
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
  tokenFrom: AddressOrPair
  tokenTo: AddressOrPair
  allPools: PoolWithPoolKey[]
}

export const defaultState: IPoolsStore = {
  tokens: { [TESTNET_BTC_ADDRESS]: BTC, [TESTNET_ETH_ADDRESS]: ETH, [TESTNET_USDC_ADDRESS]: USDC },
  pools: {},
  poolKeys: {},
  poolTicks: {},
  nearestPoolTicksForPair: {},
  isLoadingLatestPoolsForTransaction: false,
  tickMaps: {},
  volumeRanges: {}
}

export interface PairTokens {
  first: AddressOrPair
  second: AddressOrPair
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
    initPool(state, _action: PayloadAction<PoolKey>) {
      return state
    },
    addTokens(state, action: PayloadAction<Record<string, Token>>) {
      state.tokens = {
        ...state.tokens,
        ...action.payload
      }
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
      action.payload.map(poolKey => {
        const keyStringified = poolKeyToString(poolKey)
        state.poolKeys[keyStringified] = poolKey
      })
      return state
    },
    getPoolKeys(state) {
      return state
    },
    addPool(state, action: PayloadAction<PoolWithPoolKey | undefined>) {
      if (action.payload) {
        const { poolKey } = action.payload
        const keyStringified = poolKeyToString(poolKey)

        // Check if a pool with the same PoolKey already exists
        if (!state.pools[keyStringified]) {
          // If the pool does not exist, add it to the pools object
          state.pools[keyStringified] = action.payload
        }
      }

      // TODO add new pool, but not repeat existing ones
      state.isLoadingLatestPoolsForTransaction = false
      return state
    },
    getPoolData(state, _action: PayloadAction<PoolKey>) {
      state.isLoadingLatestPoolsForTransaction = true
      return state
    },
    // setVolumeRanges(state, action: PayloadAction<Record<string, Range[]>>) {
    //   state.volumeRanges = action.payload
    //   return state
    // },
    // setPools(state, action: PayloadAction<{ [key in string]: PoolWithAddress }>) {
    //   state.pools = action.payload
    //   return state
    // },
    // setTickMaps(state, action: PayloadAction<updateTickMaps>) {
    //   state.tickMaps[action.payload.index] = action.payload.tickMapStructure
    // },
    // setTicks(state, action: PayloadAction<UpdateTick>) {
    //   state.poolTicks[action.payload.index] = action.payload.tickStructure
    //   return state
    // },
    // updatePool(state, action: PayloadAction<UpdatePool>) {
    //   state.pools[action.payload.address.toString()] = {
    //     address: state.pools[action.payload.address.toString()].address,
    //     ...action.payload.poolStructure
    //   }
    //   return state
    // },
    // addPools(state, action: PayloadAction<PoolWithAddress[]>) {
    //   const newData = action.payload.reduce(
    //     (acc, pool) => ({
    //       ...acc,
    //       [pool.address.toString()]: pool
    //     }),
    //     {}
    //   )
    //   state.pools = R.merge(state.pools, newData)
    //   state.isLoadingLatestPoolsForTransaction = false
    //   return state
    // },
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
    // updateTicks(state, action: PayloadAction<UpdateTicks>) {
    //   state.poolTicks[action.payload.address][
    //     state.poolTicks[action.payload.address].findIndex(e => e.index === action.payload.index)
    //   ] = action.payload.tick
    // },

    // getAllPoolsForPairData(state, _action: PayloadAction<PairTokens>) {
    //   state.isLoadingLatestPoolsForTransaction = true
    //   return state
    // },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getPoolsDataForList(_state, _action: PayloadAction<ListPoolsRequest>) {}
    // deleteTick(state, action: PayloadAction<DeleteTick>) {
    //   state.poolTicks[action.payload.address].splice(action.payload.index, 1)
    // },
    // updateTickmap(state, action: PayloadAction<UpdateTickmap>) {
    //   state.tickMaps[action.payload.address].bitmap = action.payload.bitmap
    // },
    // getTicksAndTickMaps(_state, _action: PayloadAction<FetchTicksAndTickMaps>) {
    //   return _state
    // },
    // addTicksToArray(state, action: PayloadAction<UpdateTick>) {
    //   const { index, tickStructure } = action.payload
    //   if (!state.poolTicks[index]) {
    //     state.poolTicks[index] = []
    //   }
    //   state.poolTicks[index] = [...state.poolTicks[index], ...tickStructure]
    // },
    // setNearestTicksForPair(state, action: PayloadAction<UpdateTick>) {
    //   state.nearestPoolTicksForPair[action.payload.index] = action.payload.tickStructure
    //   return state
    // },
    // getNearestTicksForPair(_state, _action: PayloadAction<FetchTicksAndTickMaps>) {}
  }
})

export const actions = poolsSlice.actions
export const reducer = poolsSlice.reducer
export type PayloadTypes = PayloadType<typeof actions>
