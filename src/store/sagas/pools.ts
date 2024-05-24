import {
  Invariant,
  PoolKey,
  TESTNET_INVARIANT_ADDRESS,
  newPoolKey,
  sendTx,
  toSqrtPrice
} from '@invariant-labs/a0-sdk'
import { Signer } from '@polkadot/api/types'
import { PayloadAction } from '@reduxjs/toolkit'
import { DEFAULT_INVARIANT_OPTIONS } from '@store/consts/static'
import {
  createLoaderKey,
  getPoolsByPoolKeys,
  getTokenBalances,
  getTokenDataByAddresses
} from '@store/consts/utils'
import { ListPoolsRequest, actions } from '@store/reducers/pools'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { networkType } from '@store/selectors/connection'
import { tokens } from '@store/selectors/pools'
import { address } from '@store/selectors/wallet'
import { getAlephZeroWallet } from '@utils/web3/wallet'
import { closeSnackbar } from 'notistack'
import { all, call, put, select, spawn, takeEvery, takeLatest } from 'typed-redux-saga'
import { getConnection } from './connection'

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

//TODO check can it be deleted
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
      [Invariant, Invariant.load],
      api,
      network,
      TESTNET_INVARIANT_ADDRESS,
      DEFAULT_INVARIANT_OPTIONS
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

export function* getPoolsDataForListHandler(): Generator {
  yield* takeEvery(actions.getPoolsDataForList, fetchPoolsDataForList)
}

export function* fetchPoolData(action: PayloadAction<PoolKey>): Generator {
  const api = yield* getConnection()
  const network = yield* select(networkType)
  const { feeTier, tokenX, tokenY } = action.payload

  try {
    const invariant = yield* call(
      [Invariant, Invariant.load],
      api,
      network,
      TESTNET_INVARIANT_ADDRESS,
      DEFAULT_INVARIANT_OPTIONS
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
      [Invariant, Invariant.load],
      api,
      network,
      TESTNET_INVARIANT_ADDRESS,
      DEFAULT_INVARIANT_OPTIONS
    )

    //TODO: in the future handle more than 100 pools
    const pools = yield* call([invariant, invariant.getPoolKeys], 100n, 0n)

    yield* put(actions.setPoolKeys(pools))
  } catch (error) {
    yield* put(actions.setPoolKeys([]))
    console.log(error)
  }
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

export function* poolsSaga(): Generator {
  yield all(
    [initPoolHandler, getPoolDataHandler, getPoolKeysHandler, getPoolsDataForListHandler].map(spawn)
  )
}
