import { TokenAmount } from '@invariant-labs/a0-sdk'
import { AddressOrPair } from '@polkadot/api-base/types'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { PayloadType } from '@store/consts/types'

export enum Status {
  Uninitialized = 'uninitialized',
  Init = 'init',
  Error = 'error',
  Initialized = 'initalized'
}

export interface ITokenAccount {
  address: AddressOrPair
  balance: TokenAmount
  decimal: number
}
// export interface ITokenData {
//   programId: string
//   mintAuthority: string | null
//   freezeAuthority: string | null
//   supply: number
//   decimals: number
// }
// export interface ITransaction {
//   recipient: string
//   amount: number
//   txid: string
//   sending: boolean
//   token?: PublicKey
//   error?: string
// }
export interface IAlephZeroWallet {
  status: Status
  address: string
  balance: TokenAmount
  accounts: { [key in string]: ITokenAccount }
  balanceLoading: boolean
}

export const defaultState: IAlephZeroWallet = {
  status: Status.Uninitialized,
  address: '',
  balance: BigInt(0),
  accounts: {},
  balanceLoading: false
}
export const walletSliceName = 'wallet'
const walletSlice = createSlice({
  name: walletSliceName,
  initialState: defaultState,
  reducers: {
    resetState() {
      return defaultState
    },
    initWallet(state) {
      return state
    },
    setAddress(state, action: PayloadAction<string>) {
      state.address = action.payload
      return state
    },
    setStatus(state, action: PayloadAction<Status>) {
      state.status = action.payload
      return state
    },
    setBalance(state, action: PayloadAction<TokenAmount>) {
      state.balance = action.payload
      return state
    },
    getBalance(state) {
      return state
    },
    setIsBalanceLoading(state, action: PayloadAction<boolean>) {
      action.payload ? (state.balanceLoading = true) : (state.balanceLoading = false)
      return state
    },
    initTestTransaction(
      state,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _action: PayloadAction<{ receiverAddress: AddressOrPair; amount: number }>
    ) {
      return state
    },
    // addTokenAccount(state, action: PayloadAction<ITokenAccount>) {
    //   state.accounts[action.payload.programId.toString()] = action.payload
    //   return state
    // },
    // addTokenAccounts(state, action: PayloadAction<ITokenAccount[]>) {
    //   action.payload.forEach(account => {
    //     state.accounts[account.programId.toString()] = account
    //   })
    //   return state
    // },
    setTokenAccount(state, action: PayloadAction<ITokenAccount>) {
      state.accounts[action.payload.address.toString()] = action.payload
      return state
    },
    // Triggers rescan for tokens that we control
    rescanTokens() {},
    airdrop() {},
    connect() {},
    disconnect() {}
  }
})

export const actions = walletSlice.actions
export const reducer = walletSlice.reducer
export type PayloadTypes = PayloadType<typeof actions>
