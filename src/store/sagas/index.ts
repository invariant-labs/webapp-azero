import { all, spawn } from '@redux-saga/core/effects'
import { connectionSaga } from './connection'
import { walletSaga } from './wallet'
import { poolsSaga } from './pools'
import { positionsSaga } from './positions'

function* rootSaga(): Generator {
  yield all([connectionSaga, walletSaga, poolsSaga, positionsSaga].map(spawn))
}
export default rootSaga
