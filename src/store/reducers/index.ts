import { combineReducers } from 'redux'
import { reducer as snackbarsReducer, snackbarsSliceName } from './snackbars'
import { connectionSliceName, reducer as connectionReducer } from './connection'
import { walletSliceName, reducer as walletReducer } from './wallet'
import { positionsSliceName, reducer as positionsReducer } from './positions'
import { poolsSliceName, reducer as poolsReducer } from './pools'

const combinedReducers = combineReducers({
  [snackbarsSliceName]: snackbarsReducer,
  [connectionSliceName]: connectionReducer,
  [walletSliceName]: walletReducer,
  [positionsSliceName]: positionsReducer,
  [poolsSliceName]: poolsReducer
})

export default combinedReducers
