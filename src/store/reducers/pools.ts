import { Pool, Tick } from '@invariant-labs/a0-sdk/src'
import { createSlice } from '@reduxjs/toolkit'
import { AddressOrPair } from '@polkadot/api/types'
import { Token } from '@store/consts/static'
import { PayloadType } from '@store/consts/types'

export interface PoolWithAddress extends Pool {
  address: AddressOrPair
}

export interface IPoolsStore {
  tokens: Record<string, Token>
  pools: { [key in string]: PoolWithAddress }
  poolTicks: { [key in string]: Tick[] }
  nearestPoolTicksForPair: { [key in string]: Tick[] }
  isLoadingLatestPoolsForTransaction: boolean
  tickMaps: { [key in string]: bigint[] }
  volumeRanges: Record<string, Range[]>
}

export interface UpdatePool {
  address: AddressOrPair
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
  allPools: PoolWithAddress[]
}

export const defaultState: IPoolsStore = {
  tokens: {},
  pools: {},
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
  addresses: string[]
  listType: ListType
}

export interface ListPoolsResponse {
  data: PoolWithAddress[]
  listType: ListType
}

export const poolsSliceName = 'pools'
const poolsSlice = createSlice({
  name: poolsSliceName,
  initialState: defaultState,
  reducers: {
    // addTokens(state, action: PayloadAction<Record<string, Token>>) {
    //   state.tokens = {
    //     ...state.tokens,
    //     ...action.payload
    //   }
    //   return state
    // },
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
    // addPoolsForList(state, action: PayloadAction<ListPoolsResponse>) {
    //   const newData = action.payload.data.reduce(
    //     (acc, pool) => ({
    //       ...acc,
    //       [pool.address.toString()]: pool
    //     }),
    //     {}
    //   )
    //   state.pools = R.merge(state.pools, newData)
    //   return state
    // },
    // updateTicks(state, action: PayloadAction<UpdateTicks>) {
    //   state.poolTicks[action.payload.address][
    //     state.poolTicks[action.payload.address].findIndex(e => e.index === action.payload.index)
    //   ] = action.payload.tick
    // },
    // getPoolData(state, _action: PayloadAction<Pair>) {
    //   state.isLoadingLatestPoolsForTransaction = true
    //   return state
    // },
    // getAllPoolsForPairData(state, _action: PayloadAction<PairTokens>) {
    //   state.isLoadingLatestPoolsForTransaction = true
    //   return state
    // },
    // getPoolsDataForList(_state, _action: PayloadAction<ListPoolsRequest>) {},
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
