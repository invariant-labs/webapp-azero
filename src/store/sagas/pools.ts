import { call, put, all, spawn, takeEvery, takeLatest, select } from 'typed-redux-saga'
import { getWallet, sleep } from './wallet'
import { PayloadAction } from '@reduxjs/toolkit'
import { actions } from '@store/reducers/pools'
import { getConnection } from './connection'
import { networkType } from '@store/selectors/connection'
import { address } from '@store/selectors/wallet'
import { Keyring } from '@polkadot/api'
import {
  Invariant,
  Network,
  newPoolKey,
  priceToSqrtPrice,
  toPrice,
  PSP22,
  FeeTier,
  newFeeTier,
  toPercentage,
  sendTx,
  TESTNET_INVARIANT_ADDRESS
} from '@invariant-labs/a0-sdk'
import { TokenList } from '@store/consts/static'
import { createLoaderKey } from '@store/consts/utils'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { closeSnackbar } from 'notistack'
import { getAlephZeroWallet } from '@utils/web3/wallet'
import { sign } from 'crypto'
import { Signer } from '@polkadot/api/types'

export function* handleInitPool(action: PayloadAction<FeeTier>) {
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

    const feeTier = action.payload

    const api = yield* getConnection()
    const network = yield* select(networkType)
    const walletAddress = yield* select(address)
    const adapter = yield* call(getAlephZeroWallet)

    const invariant = yield* call(
      [Invariant, Invariant.load],
      api,
      network,
      TESTNET_INVARIANT_ADDRESS
    )

    const poolKey = newPoolKey(TokenList.BTC, TokenList.ETH, feeTier)

    const price = toPrice(1n, 2n)
    const initSqrtPrice = priceToSqrtPrice(price)

    const tx = yield* call([invariant, invariant.createPoolTx], poolKey, initSqrtPrice)

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

export function* initPoolHandler(): Generator {
  yield* takeEvery(actions.initPool, handleInitPool)
}

export function* poolsSaga(): Generator {
  yield all([initPoolHandler].map(spawn))
}
