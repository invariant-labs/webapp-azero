import { combineReducers } from 'redux'
import { reducer as snackbarsReducer, snackbarsSliceName } from './snackbars'
import { connectionSliceName, reducer as connectionReducer } from './connection'
import { walletSliceName, reducer as walletReducer } from './wallet'

const combinedReducers = combineReducers({
  [snackbarsSliceName]: snackbarsReducer,
  [connectionSliceName]: connectionReducer,
  [walletSliceName]: walletReducer
})

export default combinedReducers
