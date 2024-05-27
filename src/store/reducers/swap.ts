import {  TESTNET_WAZERO_ADDRESS, TokenAmount } from '@invariant-labs/a0-sdk'
import { AddressOrPair } from '@polkadot/api/types'
import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { PayloadType } from '@store/consts/types'
import { SimulateResult } from '@store/consts/utils'

export interface Swap {
  slippage: bigint
  estimatedPriceAfterSwap: bigint
  poolIndex: number
  tokenFrom: AddressOrPair
  tokenTo: AddressOrPair
  amountIn: TokenAmount
  byAmountIn: boolean
  txid?: string
  inProgress?: boolean
  success?: boolean
  amountOut: TokenAmount
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
    // slippage: fromFee(BigInt(1000)),
    slippage: BigInt(0),
    estimatedPriceAfterSwap: BigInt(0),
    poolIndex: 0,
    tokenFrom: TESTNET_WAZERO_ADDRESS,
    tokenTo: TESTNET_WAZERO_ADDRESS,
    amountIn: BigInt(0),
    byAmountIn: false,
    amountOut: BigInt(0)
  },
  simulateResult: {
    amountOut: 0n,
    fee: 0n,
    priceImpact: 0
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
    setPoolIndex(state, action: PayloadAction<number>) {
      state.swap.poolIndex = action.payload
      return state
    },
    setPair(state, action: PayloadAction<{ tokenFrom: AddressOrPair; tokenTo: AddressOrPair }>) {
      state.swap.tokenFrom = action.payload.tokenFrom
      state.swap.tokenTo = action.payload.tokenTo
      return state
    },
    getSimulateResult(state, action: PayloadAction<Simulate>) {
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
