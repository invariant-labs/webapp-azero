import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { PayloadType } from '../consts/types'
import { createLoaderKey } from '@store/consts/utils'
import { SnackbarAction, VariantType } from 'notistack'

export interface ISnackbar {
  message: string
  key?: string
  variant: VariantType
  open: boolean
  action?: SnackbarAction
  persist?: boolean
  txid?: string
  isAccount?: boolean
  cancelled?: boolean
}

export interface ISnackbarStore {
  snackbars: ISnackbar[]
}

const defaultStatus: ISnackbarStore = {
  snackbars: []
}
export const snackbarsSliceName = 'snackbars'
const snackbarsSlice = createSlice({
  name: snackbarsSliceName,
  initialState: defaultStatus,
  reducers: {
    add(state, action: PayloadAction<Omit<ISnackbar, 'open'>>) {
      state.snackbars.push({
        key: action.payload.key ? action.payload.key : createLoaderKey(),
        ...action.payload,
        open: true
      })
      return state
    },
    hide(state, action: PayloadAction<string>) {
      const index = state.snackbars.findIndex(snack => snack.key === action.payload)
      if (index === -1) {
        return state
      }
      state.snackbars[index].open = false
      return state
    },
    remove(state, action: PayloadAction<string>) {
      state.snackbars = state.snackbars.filter(snack => snack.key !== action.payload)
      return state
    },
    cancel() {}
  }
})

export const actions = snackbarsSlice.actions
export const reducer = snackbarsSlice.reducer
export type PayloadTypes = PayloadType<typeof actions>
