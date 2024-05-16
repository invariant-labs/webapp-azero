import { call, put, takeEvery, take, select, all, spawn, takeLatest } from 'typed-redux-saga'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { PayloadAction } from '@reduxjs/toolkit'
import {
  ClosePositionData,
  GetCurrentTicksData,
  InitPositionData,
  actions
} from '@store/reducers/positions'
import { actions as poolActions } from '@store/reducers/pools'
import { createLoaderKey } from '@store/consts/utils'
import { closeSnackbar } from 'notistack'
import {
  Invariant,
  Keyring,
  PSP22,
  TESTNET_INVARIANT_ADDRESS,
  getLiquidityByX,
  getLiquidityByY,
  newPoolKey,
  sendTx,
  toSqrtPrice
} from '@invariant-labs/a0-sdk'
import { getConnection } from './connection'
import { networkType } from '@store/selectors/connection'
import { address } from '@store/selectors/wallet'
import { getAlephZeroWallet } from '@utils/web3/wallet'
import { INVARIANT_LOAD_CONFIG } from '@store/consts/static'
import { Signer } from '@polkadot/api/types'
import { fetchAllPoolKeys } from './pools'

function* handleInitPositionAndPool(action: PayloadAction<InitPositionData>): Generator {
  const loaderCreatePosition = createLoaderKey()
  const loaderSigningTx = createLoaderKey()

  const {
    liquidityDelta,
    lowerTick,
    poolKeyData,
    slippageTolerance,
    spotSqrtPrice,
    upperTick,
    tokenXAmount,
    tokenYAmount
  } = action.payload

  const { tokenX, tokenY, feeTier } = poolKeyData

  const poolKey = newPoolKey(tokenX, tokenY, feeTier)

  try {
    yield put(
      snackbarsActions.add({
        message: 'Creating position',
        variant: 'pending',
        persist: true,
        key: loaderCreatePosition
      })
    )

    const api = yield* getConnection()
    const network = yield* select(networkType)
    const walletAddress = yield* select(address)
    const adapter = yield* call(getAlephZeroWallet)

    const psp22 = yield* call(PSP22.load, api, network, walletAddress, {
      storageDepositLimit: 10000000000,
      refTime: 10000000000,
      proofSize: 10000000000
    })

    yield* call([psp22, psp22.setContractAddress], tokenX)
    const XTokenTx = yield* call([psp22, psp22.approveTx], walletAddress, tokenXAmount)

    yield* call([psp22, psp22.setContractAddress], tokenY)
    const YTokenTx = yield* call([psp22, psp22.approveTx], walletAddress, tokenYAmount)

    const signedXTokenTx = yield* call([XTokenTx, XTokenTx.signAsync], walletAddress, {
      signer: adapter.signer as Signer
    })
    const TxXResult = yield* call(sendTx, signedXTokenTx)

    const signedYTokenTx = yield* call([YTokenTx, YTokenTx.signAsync], walletAddress, {
      signer: adapter.signer as Signer
    })

    const TxYResult = yield* call(sendTx, signedYTokenTx)
    console.log(TxXResult.hash)
    console.log(TxYResult.hash)

    const invariant = yield* call(
      [Invariant, Invariant.load],
      api,
      network,
      TESTNET_INVARIANT_ADDRESS,
      { storageDepositLimit: 10000000000000, refTime: 100000000000, proofSize: 100000000000 }
    )

    const initSqrtPrice = toSqrtPrice(1n, 0n)

    const createPoolTx = yield* call([invariant, invariant.createPoolTx], poolKey, initSqrtPrice)

    yield put(
      snackbarsActions.add({
        message: 'Signing transaction...',
        variant: 'pending',
        persist: true,
        key: loaderSigningTx
      })
    )

    const signedCreatePoolTx = yield* call([createPoolTx, createPoolTx.signAsync], walletAddress, {
      signer: adapter.signer as Signer
    })

    const createPoolResultTx = yield* call(sendTx, signedCreatePoolTx)

    console.log(createPoolResultTx)

    //update pool keys
    yield* call(fetchAllPoolKeys)

    const tx = yield* call(
      [invariant, invariant.createPositionTx],
      poolKey,
      lowerTick,
      upperTick,
      liquidityDelta,
      spotSqrtPrice,
      slippageTolerance
    )
    console.log(tx)

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

    const txResult = yield* call(sendTx, signedTx)

    console.log(txResult)

    yield put(
      snackbarsActions.add({
        message: 'Position successfully created',
        variant: 'success',
        persist: false,
        txid: txResult.hash
      })
    )

    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))
    closeSnackbar(loaderCreatePosition)
    yield put(snackbarsActions.remove(loaderCreatePosition))
  } catch (error) {
    console.log(error)

    yield put(actions.setInitPositionSuccess(false))

    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))
    closeSnackbar(loaderCreatePosition)
    yield put(snackbarsActions.remove(loaderCreatePosition))

    yield put(
      snackbarsActions.add({
        message: 'Failed to send. Please try again.',
        variant: 'error',
        persist: false
      })
    )
  }
}

export function* handleInitPosition(action: PayloadAction<InitPositionData>): Generator {
  const loaderCreatePosition = createLoaderKey()
  const loaderSigningTx = createLoaderKey()

  const { poolKeyData, initPool } = action.payload

  // console.log(liquidityDelta)
  // console.log(lowerTick)
  // console.log(poolKeyData)
  // console.log(slippageTolerance)
  // console.log(spotSqrtPrice)
  // console.log(upperTick)
  // console.log(tokenXAmount)
  // console.log(tokenYAmount)
  // console.log(initPool)
  const tokenXAmount = 1200n
  const lowerTick = -10n
  const upperTick = 10n
  const spotSqrtPrice = toSqrtPrice(1n, 0n)
  const slippageTolerance = 0n

  const { amount: tokenYAmount, l: positionLiquidity } = getLiquidityByX(
    tokenXAmount,
    lowerTick,
    upperTick,
    toSqrtPrice(1n, 0n),
    true
  )
  console.log(tokenYAmount)
  console.log(positionLiquidity)
  const liquidityDelta = positionLiquidity
  const { tokenX, tokenY, feeTier } = poolKeyData

  const poolKey = newPoolKey(tokenX, tokenY, feeTier)
  console.log(initPool)
  if (initPool) {
    // return yield* call(handleInitPositionAndPool, action)

    return yield* put(poolActions.initPool(poolKey))
  }

  try {
    yield put(
      snackbarsActions.add({
        message: 'Creating position',
        variant: 'pending',
        persist: true,
        key: loaderCreatePosition
      })
    )

    const api = yield* getConnection()
    const network = yield* select(networkType)
    const walletAddress = yield* select(address)
    const adapter = yield* call(getAlephZeroWallet)

    const psp22 = yield* call(PSP22.load, api, network, tokenX, {
      storageDepositLimit: 10000000000,
      refTime: 10000000000,
      proofSize: 10000000000
    })

    yield* call([psp22, psp22.setContractAddress], tokenX)
    const XTokenTx = yield* call([psp22, psp22.approveTx], walletAddress, tokenXAmount)

    const signedXTokenTx = yield* call([XTokenTx, XTokenTx.signAsync], walletAddress, {
      signer: adapter.signer as Signer
    })
    const TxXResult = yield* call(sendTx, signedXTokenTx)

    yield* call([psp22, psp22.setContractAddress], tokenY)
    const YTokenTx = yield* call([psp22, psp22.approveTx], walletAddress, tokenYAmount)

    const signedYTokenTx = yield* call([YTokenTx, YTokenTx.signAsync], walletAddress, {
      signer: adapter.signer as Signer
    })

    const TxYResult = yield* call(sendTx, signedYTokenTx)
    console.log(TxXResult.hash)
    console.log(TxYResult.hash)

    const invariant = yield* call(
      [Invariant, Invariant.load],
      api,
      network,
      TESTNET_INVARIANT_ADDRESS,
      { storageDepositLimit: 10000000000000, refTime: 100000000000, proofSize: 100000000000 }
    )

    console.log(invariant)
    console.log(poolKey)
    console.log(lowerTick)
    console.log(upperTick)
    console.log(liquidityDelta)
    console.log(spotSqrtPrice)
    console.log(slippageTolerance)
    const positionLiquidity = 1000000n
    const tx = yield* call(
      [invariant, invariant.createPositionTx],
      poolKey,
      lowerTick,
      upperTick,
      positionLiquidity,
      spotSqrtPrice,
      slippageTolerance
    )

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
    console.log(signedTx.hash.toHex())
    const txResult = yield* call(sendTx, signedTx)

    console.log(txResult)

    yield put(
      snackbarsActions.add({
        message: 'Position successfully created',
        variant: 'success',
        persist: false,
        txid: txResult.hash
      })
    )

    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))
    closeSnackbar(loaderCreatePosition)
    yield put(snackbarsActions.remove(loaderCreatePosition))
  } catch (error) {
    console.log(error)

    yield put(actions.setInitPositionSuccess(false))

    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))
    closeSnackbar(loaderCreatePosition)
    yield put(snackbarsActions.remove(loaderCreatePosition))

    yield put(
      snackbarsActions.add({
        message: 'Failed to send. Please try again.',
        variant: 'error',
        persist: false
      })
    )
  }
}

export function* handleGetCurrentPlotTicks(action: PayloadAction<GetCurrentTicksData>): Generator {}

export function* handleGetPositionsList() {}

export function* handleClaimFee(action: PayloadAction<number>) {}

export function* handleClosePosition(action: PayloadAction<ClosePositionData>) {}

export function* handleGetSinglePosition(action: PayloadAction<number>) {}

export function* handleGetCurrentPositionRangeTicks(action: PayloadAction<string>) {}

export function* initPositionHandler(): Generator {
  yield* takeEvery(actions.initPosition, handleInitPosition)
}
export function* getCurrentPlotTicksHandler(): Generator {
  yield* takeLatest(actions.getCurrentPlotTicks, handleGetCurrentPlotTicks)
}
export function* getPositionsListHandler(): Generator {
  yield* takeLatest(actions.getPositionsList, handleGetPositionsList)
}
export function* claimFeeHandler(): Generator {
  yield* takeEvery(actions.claimFee, handleClaimFee)
}
export function* closePositionHandler(): Generator {
  yield* takeEvery(actions.closePosition, handleClosePosition)
}
export function* getSinglePositionHandler(): Generator {
  yield* takeEvery(actions.getSinglePosition, handleGetSinglePosition)
}
export function* getCurrentPositionRangeTicksHandler(): Generator {
  yield* takeEvery(actions.getCurrentPositionRangeTicks, handleGetCurrentPositionRangeTicks)
}

export function* positionsSaga(): Generator {
  yield all(
    [
      initPositionHandler,
      getCurrentPlotTicksHandler,
      getPositionsListHandler,
      claimFeeHandler,
      closePositionHandler,
      getSinglePositionHandler,
      getCurrentPositionRangeTicksHandler
    ].map(spawn)
  )
}
