import { all, call, put, SagaGenerator, select, takeLeading, spawn, delay } from 'typed-redux-saga'
import { actions, Status, PayloadTypes } from '@store/reducers/connection'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import {
  rpcAddress,
  networkType,
  invariantAddress,
  wrappedAZEROAddress
} from '@store/selectors/connection'
import { PayloadAction } from '@reduxjs/toolkit'
import { ApiPromise } from '@polkadot/api'
import apiSingleton from '@store/services/apiSingleton'
import invariantSingleton from '@store/services/invariantSingleton'
import { Invariant, PSP22, WrappedAZERO } from '@invariant-labs/a0-sdk'
import SingletonPSP22 from '@store/services/psp22Singleton'
import SingletonWrappedAZERO from '@store/services/wrappedAZEROSingleton'

export function* getApi(): SagaGenerator<ApiPromise> {
  let api = yield* call([apiSingleton, apiSingleton.getInstance])

  if (!api) {
    const network = yield* select(networkType)
    const rpc = yield* select(rpcAddress)
    api = yield* call([apiSingleton, apiSingleton.loadInstance], network, rpc)
  }

  return api
}

export function* getInvariant(): SagaGenerator<Invariant> {
  let invariant = yield* call([invariantSingleton, invariantSingleton.getInstance])

  if (!invariant) {
    const api = yield* call(getApi)
    const network = yield* select(networkType)
    const invariantAddr = yield* select(invariantAddress)
    invariant = yield* call(
      [invariantSingleton, invariantSingleton.loadInstance],
      api,
      network,
      invariantAddr
    )
  }

  return invariant
}

export function* getPSP22(): SagaGenerator<PSP22> {
  let psp22 = yield* call([SingletonPSP22, SingletonPSP22.getInstance])

  if (!psp22) {
    const api = yield* call(getApi)
    const network = yield* select(networkType)
    psp22 = yield* call([SingletonPSP22, SingletonPSP22.loadInstance], api, network)
  }

  return psp22
}

export function* getWrappedAZERO(): SagaGenerator<WrappedAZERO> {
  let wrappedAZERO = yield* call([SingletonWrappedAZERO, SingletonWrappedAZERO.getInstance])

  if (!wrappedAZERO) {
    const api = yield* call(getApi)
    const network = yield* select(networkType)
    const wrappedAZEROAddr = yield* select(wrappedAZEROAddress)
    wrappedAZERO = yield* call(
      [SingletonWrappedAZERO, SingletonWrappedAZERO.loadInstance],
      api,
      network,
      wrappedAZEROAddr
    )
  }

  return wrappedAZERO
}

export function* initConnection(): Generator {
  try {
    yield* getApi()

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

  yield* getApi()

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

export function* networkChangeSaga(): Generator {
  yield takeLeading(actions.setNetwork, handleNetworkChange)
}
export function* initConnectionSaga(): Generator {
  yield takeLeading(actions.initAlephZeroConnection, initConnection)
}
export function* connectionSaga(): Generator {
  yield* all([networkChangeSaga, initConnectionSaga].map(spawn))
}
