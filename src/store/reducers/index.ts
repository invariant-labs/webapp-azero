import { combineReducers } from 'redux'
import { reducer as snackbarsReducer, snackbarsSliceName } from './snackbars'

const combinedReducers = combineReducers({
  [snackbarsSliceName]: snackbarsReducer
})

export default combinedReducers
