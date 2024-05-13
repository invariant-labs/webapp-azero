import { call, put, all, spawn, takeEvery, select, takeLatest } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { actions } from '@store/reducers/pools'
import { getConnection } from './connection'
import { networkType } from '@store/selectors/connection'
import { address } from '@store/selectors/wallet'
import {
  Invariant,
  newPoolKey,
  priceToSqrtPrice,
  toPrice,
  sendTx,
  TESTNET_INVARIANT_ADDRESS,
  PoolKey
} from '@invariant-labs/a0-sdk'

import { createLoaderKey } from '@store/consts/utils'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { closeSnackbar } from 'notistack'
import { getAlephZeroWallet } from '@utils/web3/wallet'
import { Signer } from '@polkadot/api/types'
import { signAndSend } from './wallet'

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
        storageDepositLimit: 10000000000,
        refTime: 10000000000,
        proofSize: 10000000000
      }
    )

    const poolKey = newPoolKey(tokenX, tokenY, feeTier)

    const price = toPrice(1n, 0n)
    const initSqrtPrice = priceToSqrtPrice(price)

    const tx = yield* call([invariant, invariant.createPoolTx], poolKey, initSqrtPrice)

    // const id = call(signAndSend, adapter, tx, walletAddress)
    // console.log(id)
    const signedTx = yield* call([tx, tx.signAsync], walletAddress, {
      signer: adapter.signer as Signer
    })

    console.log(signedTx)

    const txResult = yield* call(sendTx, signedTx)

    console.log(txResult)

    // const pools = yield* call([invariant, invariant.getPools], walletAddress, 10n, 20n)
    // console.log(pools)

    yield put(
      snackbarsActions.add({
        message: 'Pool successfully created',
        variant: 'success',
        persist: false
        // txid: tx.
      })
    )

    closeSnackbar(loaderKey)
    yield put(snackbarsActions.remove(loaderKey))
  } catch (error) {
    console.log(error)
    closeSnackbar(loaderKey)
    yield put(snackbarsActions.remove(loaderKey))
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

export function* initPoolHandler(): Generator {
  yield* takeLatest(actions.initPool, handleInitPool)
}

export function* fetchFeeTiersHandler(): Generator {
  yield* takeLatest(actions.getFeeTiers, fetchFeeTiers)
}

export function* poolsSaga(): Generator {
  yield all([initPoolHandler, fetchFeeTiersHandler].map(spawn))
}
