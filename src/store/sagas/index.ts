import { all, spawn } from '@redux-saga/core/effects'

function* rootSaga(): Generator {
  yield all([].map(spawn))
}
export default rootSaga
