import { Invariant, PoolKey, TESTNET_INVARIANT_ADDRESS } from '@invariant-labs/a0-sdk'
import { GuardPredicate } from '@redux-saga/types'
import { PayloadAction } from '@reduxjs/toolkit'
import { ListPoolsResponse, ListType, actions as poolsActions } from '@store/reducers/pools'
import { actions } from '@store/reducers/positions'
import { networkType } from '@store/selectors/connection'
import { address } from '@store/selectors/wallet'
import { all, call, put, select, spawn, take, takeEvery, takeLatest } from 'typed-redux-saga'
import { getConnection } from './connection'

export function* handleGetPositionsList() {
  try {
    const connection = yield* getConnection()
    const network = yield* select(networkType)
    const invariant = yield* call(Invariant.load, connection, network, TESTNET_INVARIANT_ADDRESS, {
      storageDepositLimit: 10000000000,
      refTime: 10000000000,
      proofSize: 10000000000
    })
    const walletAddress = yield* select(address)

    const positions = yield* call([invariant, invariant.getPositions], walletAddress)

    const pools: PoolKey[] = []
    for (let i = 0; i < positions.length; i++) {
      let found = false

      for (let j = 0; j < pools.length; j++) {
        if (JSON.stringify(positions[i].poolKey) === JSON.stringify(pools[j])) {
          found = true
        }
      }

      if (!found) {
        pools.push(positions[i].poolKey)
      }
    }

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

export function* handleGetCurrentPositionRangeTicks(action: PayloadAction<bigint>) {
  const walletAddress = yield* select(address)
  const connection = yield* getConnection()
  const network = yield* select(networkType)
  const invariant = yield* call(Invariant.load, connection, network, TESTNET_INVARIANT_ADDRESS, {
    storageDepositLimit: 10000000000,
    refTime: 10000000000,
    proofSize: 10000000000
  })

  const position = yield* call([invariant, invariant.getPosition], walletAddress, 0n)

  const lowerTick = yield* call(
    [invariant, invariant.getTick],
    position.poolKey,
    position.lowerTickIndex
  )
  const upperTick = yield* call(
    [invariant, invariant.getTick],
    position.poolKey,
    position.upperTickIndex
  )

  yield put(
    actions.setCurrentPositionRangeTicks({
      lowerTick,
      upperTick
    })
  )
}

export function* getPositionsListHandler(): Generator {
  yield* takeLatest(actions.getPositionsList, handleGetPositionsList)
}

export function* getCurrentPositionRangeTicksHandler(): Generator {
  yield* takeEvery(actions.getCurrentPositionRangeTicks, handleGetCurrentPositionRangeTicks)
}

export function* positionsSaga(): Generator {
  yield all([getPositionsListHandler, getCurrentPositionRangeTicksHandler].map(spawn))
}
