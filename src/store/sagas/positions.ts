import { Invariant, TESTNET_INVARIANT_ADDRESS } from '@invariant-labs/a0-sdk'
import { GuardPredicate } from '@redux-saga/types'
import { PayloadAction } from '@reduxjs/toolkit'
import { ListPoolsResponse, ListType, actions as poolsActions } from '@store/reducers/pools'
import { actions } from '@store/reducers/positions'
import { network } from '@store/selectors/connection'
import { address } from '@store/selectors/wallet'
import { all, call, put, select, spawn, take, takeLatest } from 'typed-redux-saga'
import { getConnection } from './connection'

export function* handleGetPositionsList() {
  try {
    const connection = yield* getConnection()
    const networkType = yield* select(network)
    const invariant = yield* call(
      Invariant.load,
      connection,
      networkType,
      TESTNET_INVARIANT_ADDRESS,
      {
        storageDepositLimit: 10000000000,
        refTime: 10000000000,
        proofSize: 10000000000
      }
    )
    const walletAddress = yield* select(address)

    const positions = yield* call([invariant, invariant.getPositions], walletAddress)

    const pools = new Set(positions.map(position => position.poolKey))

    yield* put(
      poolsActions.getPoolsDataForList({
        poolKeys: Array.from(pools),
        listType: ListType.POSITIONS
      })
    )

    const pattern: GuardPredicate<PayloadAction<ListPoolsResponse>> = (
      action
    ): action is PayloadAction<ListPoolsResponse> => {
      return (
        typeof action?.payload?.listType !== 'undefined' &&
        action.payload.listType === ListType.POSITIONS
      )
    }

    yield* take(pattern)

    yield* put(actions.setPositionsList(positions))
  } catch (e) {
    yield* put(actions.setPositionsList([]))
  }
}

export function* getPositionsListHandler(): Generator {
  yield* takeLatest(actions.getPositionsList, handleGetPositionsList)
}

export function* positionsSaga(): Generator {
  yield all([getPositionsListHandler].map(spawn))
}
