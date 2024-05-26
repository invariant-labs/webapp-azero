import { all, spawn } from '@redux-saga/core/effects'
import { connectionSaga } from './connection'
import { poolsSaga } from './pools'
import { positionsSaga } from './positions'
import { swapSaga } from './swap'
import { walletSaga } from './wallet'

function* rootSaga(): Generator {
  yield all([connectionSaga, walletSaga, poolsSaga, positionsSaga, swapSaga].map(spawn))
}
export default rootSaga
