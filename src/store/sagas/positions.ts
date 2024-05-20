import { Invariant, PoolKey, TESTNET_INVARIANT_ADDRESS } from '@invariant-labs/a0-sdk'
import { DEFAULT_CONTRACT_OPTIONS } from '@store/consts/static'
import { poolKeyToString } from '@store/consts/utils'
import { ListType, actions as poolsActions } from '@store/reducers/pools'
import { actions } from '@store/reducers/positions'
import { networkType } from '@store/selectors/connection'
import { address } from '@store/selectors/wallet'
import { all, call, put, select, spawn, takeLatest } from 'typed-redux-saga'
import { getConnection } from './connection'

export function* handleGetPositionsList() {
  try {
    const connection = yield* getConnection()
    const network = yield* select(networkType)
    const invariant = yield* call(
      Invariant.load,
      connection,
      network,
      TESTNET_INVARIANT_ADDRESS,
      DEFAULT_CONTRACT_OPTIONS
    )
    const walletAddress = yield* select(address)

    const positions = yield* call([invariant, invariant.getPositions], walletAddress)

    const pools: PoolKey[] = []
    const poolSet: Set<string> = new Set()
    for (let i = 0; i < positions.length; i++) {
      const poolKeyString = poolKeyToString(positions[i].poolKey)

      if (!poolSet.has(poolKeyString)) {
        poolSet.add(poolKeyString)
        pools.push(positions[i].poolKey)
      }
    }

    yield* put(
      poolsActions.getPoolsDataForList({
        poolKeys: Array.from(pools),
        listType: ListType.POSITIONS
      })
    )

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
