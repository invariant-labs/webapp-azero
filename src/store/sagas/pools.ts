import { PayloadAction } from '@reduxjs/toolkit'
import { getFullNewTokensData, getPoolsFromPoolKeys } from '@store/consts/utils'
import { ListPoolsRequest, actions } from '@store/reducers/pools'
import { network } from '@store/selectors/connection'
import { tokens } from '@store/selectors/pools'
import { all, call, put, select, spawn, takeEvery } from 'typed-redux-saga'
import { getConnection } from './connection'

export function* fetchPoolsDataForList(action: PayloadAction<ListPoolsRequest>) {
  const connection = yield* call(getConnection)
  const networkType = yield* select(network)
  const newPools = yield* call(
    getPoolsFromPoolKeys,
    action.payload.poolKeys,
    connection,
    networkType
  )

  const allTokens = yield* select(tokens)
  const unknownTokens = new Set<string>()

  action.payload.poolKeys.forEach(poolKey => {
    if (!allTokens[poolKey.tokenX]) {
      unknownTokens.add(poolKey.tokenX)
    }

    if (!allTokens[poolKey.tokenY]) {
      unknownTokens.add(poolKey.tokenY)
    }
  })

  const newTokens = yield* call(getFullNewTokensData, [...unknownTokens], connection, networkType)
  yield* put(actions.addTokens(newTokens))

  yield* put(actions.addPoolsForList({ data: newPools, listType: action.payload.listType }))
}

export function* getPoolsDataForListHandler(): Generator {
  yield* takeEvery(actions.getPoolsDataForList, fetchPoolsDataForList)
}

export function* poolsSaga(): Generator {
  yield all([getPoolsDataForListHandler].map(spawn))
}
