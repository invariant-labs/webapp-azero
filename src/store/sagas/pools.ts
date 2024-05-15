import {
  Invariant,
  PoolKey,
  TESTNET_INVARIANT_ADDRESS,
  newPoolKey,
  sendTx,
  toPrice,
  toSqrtPrice
} from '@invariant-labs/a0-sdk'
import { Signer } from '@polkadot/api/types'
import { PayloadAction } from '@reduxjs/toolkit'
import { createLoaderKey, getFullNewTokensData, getPoolsFromPoolKeys } from '@store/consts/utils'
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
  const connection = yield* call(getConnection)
  const network = yield* select(networkType)
  const newPools = yield* call(getPoolsFromPoolKeys, action.payload.poolKeys, connection, network)

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

  const newTokens = yield* call(getFullNewTokensData, [...unknownTokens], connection, network)
  yield* put(actions.addTokens(newTokens))

  yield* put(actions.addPoolsForList({ data: newPools, listType: action.payload.listType }))
}

export function* handleInitPool(action: PayloadAction<PoolKey>) {
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
      {
        storageDepositLimit: 100000000000,
        refTime: 100000000000,
        proofSize: 100000000000
      }
    )

    const poolKey = newPoolKey(tokenX, tokenY, feeTier)

    const price = toPrice(1n, 0n)
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

export function* fetchFeeTiers() {
  console.log('test')
  try {
    const api = yield* getConnection()
    const network = yield* select(networkType)
    const walletAddress = yield* select(address)

    const invariant = yield* call(
      [Invariant, Invariant.load],
      api,
      network,
      TESTNET_INVARIANT_ADDRESS,
      {
        storageDepositLimit: 10000000000,
        refTime: 10000000000,
        proofSize: 10000000000
      }
    )

    const feeTiers = yield* call([invariant, invariant.getFeeTiers], walletAddress)
    console.log(feeTiers)
    yield put(actions.setFeeTiers(feeTiers))
  } catch (error) {
    console.log(error)
  }
}

export function* getPoolsDataForListHandler(): Generator {
  yield* takeEvery(actions.getPoolsDataForList, fetchPoolsDataForList)
}

export function* initPoolHandler(): Generator {
  yield* takeLatest(actions.initPool, handleInitPool)
}

export function* fetchFeeTiersHandler(): Generator {
  yield* takeLatest(actions.getFeeTiers, fetchFeeTiers)
}

export function* poolsSaga(): Generator {
  yield all([initPoolHandler, fetchFeeTiersHandler, fetchPoolsDataForList].map(spawn))
}
