import { PoolKey, newPoolKey, sendTx, toSqrtPrice } from '@invariant-labs/a0-sdk'
import { Signer } from '@polkadot/api/types'
import { PayloadAction } from '@reduxjs/toolkit'
import {
  createLoaderKey,
  findPairsByPoolKeys,
  getPools,
  getPoolsByPoolKeys,
  getTokenBalances,
  getTokenDataByAddresses
} from '@store/consts/utils'
import { ListPoolsRequest, PairTokens, actions } from '@store/reducers/pools'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { networkType } from '@store/selectors/connection'
import { tokens } from '@store/selectors/pools'
import { address } from '@store/selectors/wallet'
import { getAlephZeroWallet } from '@utils/web3/wallet'
import { closeSnackbar } from 'notistack'
import { all, call, put, select, spawn, takeEvery, takeLatest } from 'typed-redux-saga'
import { getConnection } from './connection'
import invariantSingleton from '@store/services/invariantSingleton'

export function* fetchPoolsDataForList(action: PayloadAction<ListPoolsRequest>) {
  const walletAddress = yield* select(address)
  const connection = yield* call(getConnection)
  const network = yield* select(networkType)
  const pools = yield* call(getPoolsByPoolKeys, action.payload.poolKeys, connection, network)

  const allTokens = yield* select(tokens)
  const unknownTokens = new Set(
    action.payload.poolKeys.flatMap(({ tokenX, tokenY }) =>
      [tokenX, tokenY].filter(token => !allTokens[token])
    )
  )
  const knownTokens = new Set(
    action.payload.poolKeys.flatMap(({ tokenX, tokenY }) =>
      [tokenX, tokenY].filter(token => allTokens[token])
    )
  )

  const unknownTokensData = yield* call(
    getTokenDataByAddresses,
    [...unknownTokens],
    connection,
    network,
    walletAddress
  )
  const knownTokenBalances = yield* call(
    getTokenBalances,
    [...knownTokens],
    connection,
    network,
    walletAddress
  )
  yield* put(actions.addTokens(unknownTokensData))
  yield* put(actions.updateTokenBalances(knownTokenBalances))

  console.log(yield* select(tokens))

  yield* put(actions.addPoolsForList({ data: pools, listType: action.payload.listType }))
}

export function* handleInitPool(action: PayloadAction<PoolKey>): Generator {
  const loaderKey = createLoaderKey()
  const loaderSigningTx = createLoaderKey()
  try {
    yield put(
      snackbarsActions.add({
        message: 'Creating new pool...',
        variant: 'pending',
        persist: true,
        key: loaderKey
      })
    )

    const { tokenX, tokenY, feeTier } = action.payload

    const api = yield* getConnection()
    const network = yield* select(networkType)
    const walletAddress = yield* select(address)
    const adapter = yield* call(getAlephZeroWallet)

    const invariant = yield* call(
      [invariantSingleton, invariantSingleton.loadInstance],
      api,
      network
    )

    const poolKey = newPoolKey(tokenX, tokenY, feeTier)

    const initSqrtPrice = toSqrtPrice(1n, 0n)

    const tx = yield* call([invariant, invariant.createPoolTx], poolKey, initSqrtPrice)

    yield put(
      snackbarsActions.add({
        message: 'Signing transaction...',
        variant: 'pending',
        persist: true,
        key: loaderSigningTx
      })
    )

    const signedTx = yield* call([tx, tx.signAsync], walletAddress, {
      signer: adapter.signer as Signer
    })

    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))

    const txResult = yield* call(sendTx, signedTx)

    yield put(
      snackbarsActions.add({
        message: 'Pool successfully created',
        variant: 'success',
        persist: false,
        txid: txResult.hash
      })
    )

    closeSnackbar(loaderKey)
    yield put(snackbarsActions.remove(loaderKey))
  } catch (error) {
    console.log(error)
    closeSnackbar(loaderKey)
    yield put(snackbarsActions.remove(loaderKey))
    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))
  }
}

export function* fetchPoolData(action: PayloadAction<PoolKey>): Generator {
  const api = yield* getConnection()
  const network = yield* select(networkType)
  const { feeTier, tokenX, tokenY } = action.payload

  try {
    const invariant = yield* call(
      [invariantSingleton, invariantSingleton.loadInstance],
      api,
      network
    )

    const pool = yield* call([invariant, invariant.getPool], tokenX, tokenY, feeTier)

    if (pool) {
      yield* put(
        actions.addPool({
          ...pool,
          poolKey: action.payload
        })
      )
    } else {
      yield* put(actions.addPool())
    }
  } catch (error) {
    console.log(error)
    yield* put(actions.addPool())
  }
}

export function* fetchAllPoolKeys(): Generator {
  const api = yield* getConnection()
  const network = yield* select(networkType)

  try {
    const invariant = yield* call(
      [invariantSingleton, invariantSingleton.loadInstance],
      api,
      network
    )

    //TODO: in the future handle more than 100 pools
    const pools = yield* call([invariant, invariant.getPoolKeys], 100n, 0n)

    yield* put(actions.setPoolKeys(pools))
  } catch (error) {
    yield* put(actions.setPoolKeys([]))
    console.log(error)
  }
}

export function* fetchAllPoolsForPairData(action: PayloadAction<PairTokens>) {
  const api = yield* call(getConnection)
  const network = yield* select(networkType)
  const invariant = yield* call([invariantSingleton, invariantSingleton.loadInstance], api, network)
  const poolKeys = yield* call([invariant, invariant.getPoolKeys], 100n, 0n)
  const filteredPoolKeys = findPairsByPoolKeys(
    action.payload.first.toString(),
    action.payload.second.toString(),
    poolKeys
  )
  const pools = yield* call(getPools, invariant, filteredPoolKeys)

  yield* put(actions.addPools(pools))
}

export function* getPoolsDataForListHandler(): Generator {
  yield* takeEvery(actions.getPoolsDataForList, fetchPoolsDataForList)
}

export function* initPoolHandler(): Generator {
  yield* takeLatest(actions.initPool, handleInitPool)
}

export function* getPoolDataHandler(): Generator {
  yield* takeLatest(actions.getPoolData, fetchPoolData)
}

export function* getPoolKeysHandler(): Generator {
  yield* takeLatest(actions.getPoolKeys, fetchAllPoolKeys)
}

export function* getAllPoolsForPairDataHandler(): Generator {
  yield* takeLatest(actions.getAllPoolsForPairData, fetchAllPoolsForPairData)
}

export function* poolsSaga(): Generator {
  yield all(
    [
      initPoolHandler,
      getPoolDataHandler,
      getPoolKeysHandler,
      getPoolsDataForListHandler,
      getAllPoolsForPairDataHandler
    ].map(spawn)
  )
}
