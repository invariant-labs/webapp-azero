import { PoolKey } from '@invariant-labs/a0-sdk'
import { AddressOrPair } from '@polkadot/api/types'
import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { PayloadType } from '@store/consts/types'
import { SimulateResult } from '@store/consts/utils'

export interface Swap {
  poolKey: PoolKey | null
  slippage: bigint
  estimatedPriceAfterSwap: bigint
  tokenFrom: AddressOrPair
  tokenTo: AddressOrPair
  amountIn: bigint
  byAmountIn: boolean
  txid?: string
  inProgress?: boolean
  success?: boolean
  amountOut: bigint
}

export interface Simulate {
  fromToken: AddressOrPair
  toToken: AddressOrPair
  amount: bigint
  byAmountIn: boolean
}

export interface ISwapStore {
  swap: Swap
  simulateResult: SimulateResult
}

export const defaultState: ISwapStore = {
  swap: {
    poolKey: null,
    slippage: 0n,
    estimatedPriceAfterSwap: 0n,
    tokenFrom: '',
    tokenTo: '',
    amountIn: 0n,
    byAmountIn: false,
    amountOut: 0n
  },
  simulateResult: {
    poolKey: null,
    amountOut: 0n,
    priceImpact: 0,
    targetSqrtPrice: 0n,
    errors: []
  }
}

export const swapSliceName = 'swap'
const swapSlice = createSlice({
  name: swapSliceName,
  initialState: defaultState,
  reducers: {
    swap(state, action: PayloadAction<Omit<Swap, 'txid'>>) {
      state.swap = {
        ...action.payload,
        inProgress: true
      }
      return state
    },
    setSwapSuccess(state, action: PayloadAction<boolean>) {
      state.swap.inProgress = false
      state.swap.success = action.payload
      return state
    },
    setPair(state, action: PayloadAction<{ tokenFrom: AddressOrPair; tokenTo: AddressOrPair }>) {
      state.swap.tokenFrom = action.payload.tokenFrom
      state.swap.tokenTo = action.payload.tokenTo
      return state
    },
    getSimulateResult(state, _action: PayloadAction<Simulate>) {
      return state
    },
    setSimulateResult(state, action: PayloadAction<SimulateResult>) {
      state.simulateResult = action.payload
      return state
    }
  }
})

export const actions = swapSlice.actions
export const reducer = swapSlice.reducer
export type PayloadTypes = PayloadType<typeof actions>
