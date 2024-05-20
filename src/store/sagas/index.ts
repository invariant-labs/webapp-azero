import { all, spawn } from '@redux-saga/core/effects'
import { connectionSaga } from './connection'
import { poolsSaga } from './pools'
import { positionsSaga } from './positions'
import { walletSaga } from './wallet'

function* rootSaga(): Generator {
  yield all([connectionSaga, walletSaga, positionsSaga, poolsSaga].map(spawn))
}
export default rootSaga
