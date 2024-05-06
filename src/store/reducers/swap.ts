import { Percentage, TESTNET_WAZERO_ADDRESS, TokenAmount } from '@invariant-labs/a0-sdk/src'
import { AddressOrPair } from '@polkadot/api/types'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { PayloadType } from '@store/consts/types'

export interface Swap {
  slippage: Percentage
  estimatedPriceAfterSwap: Percentage
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
  simulatePrice: TokenAmount
  fromToken: AddressOrPair
  toToken: AddressOrPair
  amount: TokenAmount
  success: boolean
  txid?: string
  inProgress?: boolean
}

export interface ISwapStore {
  swap: Swap
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
    }
  }
})

export const actions = swapSlice.actions
export const reducer = swapSlice.reducer
export type PayloadTypes = PayloadType<typeof actions>
