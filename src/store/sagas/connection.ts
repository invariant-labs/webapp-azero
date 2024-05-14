import { all, call, put, SagaGenerator, select, takeLeading, spawn, delay } from 'typed-redux-saga'
import { actions, Status, PayloadTypes } from '@store/reducers/connection'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { rpcAddress, networkType } from '@store/selectors/connection'
import { PayloadAction } from '@reduxjs/toolkit'
import { ApiPromise } from '@polkadot/api'
import { initPolkadotApi } from '@invariant-labs/a0-sdk/src'

export function* getConnection(): SagaGenerator<ApiPromise> {
  //   const rpc = yield* select(rpcAddress)
  //   const connection = yield* call(getAlephZeroConnection, rpc)
  //   console.log(connection)
  //   console.log(rpc)
  const rpc = yield* select(rpcAddress)
  const network = yield* select(networkType)
  const connection = yield* call(initPolkadotApi, network, rpc)

  return connection
}

export function* initConnection(): Generator {
  try {
    const rpc = yield* select(rpcAddress)
    const network = yield* select(networkType)
    const connection = yield* call(initPolkadotApi, network, rpc)
    // const connection = yield* call(getConnection)
    console.log(connection)
    yield* put(
      snackbarsActions.add({
        message: 'Aleph-Zero network connected.',
        variant: 'success',
        persist: false
      })
    )

    console.log('Aleph-Zero network connected.')
    yield* put(actions.setStatus(Status.Initialized))
  } catch (error) {
    console.log(error)
    yield* put(actions.setStatus(Status.Error))
    yield put(
      snackbarsActions.add({
        message: 'Failed to connect to Aleph-Zero network',
        variant: 'error',
        persist: false
      })
    )
  }
}

export function* handleNetworkChange(action: PayloadAction<PayloadTypes['setNetwork']>): Generator {
  yield* delay(1000)
  window.location.reload()
  yield* put(
    snackbarsActions.add({
      message: `You are on network ${action.payload.networkType}${
        action.payload?.rpcName ? ' (' + action.payload.rpcName + ')' : ''
      }.`,
      variant: 'info',
      persist: false
    })
  )
}

// export function* updateSlot(): Generator {
//   const connection = yield* call(getConnection)
//   const slot = yield* call([connection, connection.getSlot])
//   yield* put(actions.setSlot(slot))
// }

// export function* updateSlotSaga(): Generator {
//   yield takeLeading(actions.updateSlot, updateSlot)
// }

export function* networkChangeSaga(): Generator {
  yield takeLeading(actions.setNetwork, handleNetworkChange)
}
export function* initConnectionSaga(): Generator {
  yield takeLeading(actions.initAlephZeroConnection, initConnection)
}
export function* connectionSaga(): Generator {
  yield* all([networkChangeSaga, initConnectionSaga].map(spawn))
}
