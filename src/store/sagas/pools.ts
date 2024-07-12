import { PoolKey, newPoolKey, sendTx, toSqrtPrice } from '@invariant-labs/a0-sdk'
import { Signer } from '@polkadot/api/types'
import { PayloadAction } from '@reduxjs/toolkit'
import {
  createLoaderKey,
  findPairs,
  getPoolsByPoolKeys,
  getTokenBalances,
  getTokenDataByAddresses
} from '@store/consts/utils'
import {
  FetchTicksAndTickMaps,
  ListPoolsRequest,
  PairTokens,
  PoolWithPoolKey,
  actions
} from '@store/reducers/pools'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { actions as walletActions } from '@store/reducers/wallet'
import { tokens } from '@store/selectors/pools'
import { address } from '@store/selectors/wallet'
import { getAlephZeroWallet } from '@utils/web3/wallet'
import { closeSnackbar } from 'notistack'
import { all, call, put, select, spawn, takeEvery, takeLatest } from 'typed-redux-saga'
import { MAX_POOL_KEYS_RETURNED } from '@invariant-labs/a0-sdk/target/consts'
import { getInvariant, getPSP22 } from './connection'

export function* fetchPoolsDataForList(action: PayloadAction<ListPoolsRequest>) {
  const walletAddress = yield* select(address)
  const invariant = yield* getInvariant()
  const pools = yield* call(getPoolsByPoolKeys, invariant, action.payload.poolKeys)
  const psp22 = yield* getPSP22()

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
    psp22,
    walletAddress
  )
  const knownTokenBalances = yield* call(getTokenBalances, [...knownTokens], psp22, walletAddress)

  yield* put(walletActions.getBalances(Object.keys(unknownTokensData)))
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

    const walletAddress = yield* select(address)
    const adapter = yield* call(getAlephZeroWallet)
    const invariant = yield* getInvariant()

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
  const { feeTier, tokenX, tokenY } = action.payload

  try {
    const invariant = yield* getInvariant()

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
  try {
    const invariant = yield* getInvariant()

    const [poolKeys, poolKeysCount] = yield* call(
      [invariant, invariant.getPoolKeys],
      MAX_POOL_KEYS_RETURNED,
      0n
    )

    const promises: Promise<[PoolKey[], bigint]>[] = []
    for (let i = 1; i < Math.ceil(Number(poolKeysCount) / 220); i++) {
      promises.push(invariant.getPoolKeys(MAX_POOL_KEYS_RETURNED, BigInt(i) * 220n))
    }

    const poolKeysEntries = yield* call(promises => Promise.all(promises), promises)

    yield* put(
      actions.setPoolKeys([...poolKeys, ...poolKeysEntries.map(([poolKeys]) => poolKeys).flat(1)])
    )
  } catch (error) {
    yield* put(actions.setPoolKeys([]))
    console.log(error)
  }
}

export function* fetchAllPoolsForPairData(action: PayloadAction<PairTokens>) {
  const invariant = yield* getInvariant()

  const token0 = action.payload.first.toString()
  const token1 = action.payload.second.toString()
  const poolPairs = yield* call([invariant, invariant.getAllPoolsForPair], token0, token1)
  const poolsWithPoolKey: PoolWithPoolKey[] = poolPairs.map(([feeTier, pool]) => {
    return { poolKey: newPoolKey(token0, token1, feeTier), ...pool }
  })

  yield* put(actions.addPools(poolsWithPoolKey))
}

export function* fetchTicksAndTickMaps(action: PayloadAction<FetchTicksAndTickMaps>) {
  const { tokenFrom, tokenTo, allPools } = action.payload

  try {
    const invariant = yield* getInvariant()
    const pools = findPairs(tokenFrom.toString(), tokenTo.toString(), allPools)

    const tickmapCalls = pools.map(pool =>
      call([invariant, invariant.getFullTickmap], pool.poolKey)
    )
    const allTickMaps = yield* all(tickmapCalls)

    for (const [index, pool] of pools.entries()) {
      yield* put(
        actions.setTickMaps({
          poolKey: pool.poolKey,
          tickMapStructure: allTickMaps[index]
        })
      )
    }

    const allTicksCalls = pools.map((pool, index) =>
      call([invariant, invariant.getAllLiquidityTicks], pool.poolKey, allTickMaps[index])
    )
    const allTicks = yield* all(allTicksCalls)

    for (const [index, pool] of pools.entries()) {
      yield* put(actions.setTicks({ poolKey: pool.poolKey, tickStructure: allTicks[index] }))
    }

    yield* put(actions.stopIsLoadingTicksAndTickMaps())
  } catch (error) {
    console.log(error)
  }
}

export function* fetchTokens(poolsWithPoolKeys: PoolWithPoolKey[]) {
  const walletAddress = yield* select(address)
  const allTokens = yield* select(tokens)
  const psp22 = yield* getPSP22()

  const unknownTokens = new Set(
    poolsWithPoolKeys.flatMap(({ poolKey: { tokenX, tokenY } }) =>
      [tokenX, tokenY].filter(token => !allTokens[token])
    )
  )
  const knownTokens = new Set(
    poolsWithPoolKeys.flatMap(({ poolKey: { tokenX, tokenY } }) =>
      [tokenX, tokenY].filter(token => allTokens[token])
    )
  )

  const unknownTokensData = yield* call(
    getTokenDataByAddresses,
    [...unknownTokens],
    psp22,
    walletAddress
  )
  const knownTokenBalances = yield* call(getTokenBalances, [...knownTokens], psp22, walletAddress)

  yield* put(walletActions.getBalances(Object.keys(unknownTokensData)))
  yield* put(actions.addTokens(unknownTokensData))
  yield* put(actions.updateTokenBalances(knownTokenBalances))
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

export function* getTicksAndTickMapsHandler(): Generator {
  yield* takeEvery(actions.getTicksAndTickMaps, fetchTicksAndTickMaps)
}

export function* poolsSaga(): Generator {
  yield all(
    [
      initPoolHandler,
      getPoolDataHandler,
      getPoolKeysHandler,
      getPoolsDataForListHandler,
      getAllPoolsForPairDataHandler,
      getTicksAndTickMapsHandler
    ].map(spawn)
  )
}
