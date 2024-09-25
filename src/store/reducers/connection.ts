import { Network, INVARIANT_ADDRESS, WAZERO_ADDRESS } from '@invariant-labs/a0-sdk'
import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { RPC } from '@store/consts/static'
import { PayloadType } from '@store/consts/types'

export enum Status {
  Uninitialized = 'uninitialized',
  Init = 'init',
  Error = 'error',
  Initialized = 'initalized'
}
export interface IAlephZeroConnectionStore {
  status: Status
  message: string
  networkType: Network
  blockNumber: number
  rpcAddress: string
  invariantAddress: string
  wrappedAZEROAddress: string
}

const network =
  Network[localStorage.getItem('INVARIANT_NETWORK_AlephZero') as keyof typeof Network] ??
  Network.Testnet

export const defaultState: IAlephZeroConnectionStore = {
  status: Status.Uninitialized,
  message: '',
  networkType: network,
  blockNumber: 0,
  rpcAddress: localStorage.getItem(`INVARIANT_RPC_AlephZero_${network}`) ?? RPC.TEST,
  invariantAddress: INVARIANT_ADDRESS[network],
  wrappedAZEROAddress: WAZERO_ADDRESS[network]
}
export const connectionSliceName = 'connection'
const connectionSlice = createSlice({
  name: connectionSliceName,
  initialState: defaultState,
  reducers: {
    initAlephZeroConnection(state) {
      state.status = Status.Init
      return state
    },
    setStatus(state, action: PayloadAction<Status>) {
      state.status = action.payload
      return state
    },
    setMessage(state, action: PayloadAction<string>) {
      state.message = action.payload
      return state
    },
    setNetwork(state, action: PayloadAction<Network>) {
      state.networkType = action.payload
      state.invariantAddress = INVARIANT_ADDRESS[action.payload]
      state.wrappedAZEROAddress = WAZERO_ADDRESS[action.payload]
      return state
    },
    updateSlot(state) {
      return state
    },
    setSlot(state, action: PayloadAction<number>) {
      state.blockNumber = action.payload
      return state
    },
    setRPCAddress(state, action: PayloadAction<string>) {
      state.rpcAddress = action.payload
      return state
    }
  }
})

export const actions = connectionSlice.actions
export const reducer = connectionSlice.reducer
export type PayloadTypes = PayloadType<typeof actions>
