import {
  Invariant,
  PSP22,
  PoolKey,
  TESTNET_INVARIANT_ADDRESS,
  TESTNET_WAZERO_ADDRESS,
  WrappedAZERO,
  sendTx
} from '@invariant-labs/a0-sdk'
import { calculateTokenAmountsWithSlippage } from '@invariant-labs/a0-sdk/src/utils'
import { Signer } from '@polkadot/api/types'
import { PayloadAction } from '@reduxjs/toolkit'
import {
  DEFAULT_INVARIANT_OPTIONS,
  DEFAULT_PSP22_OPTIONS,
  DEFAULT_WAZERO_OPTIONS,
  U128MAX
} from '@store/consts/static'
import { createLoaderKey, poolKeyToString } from '@store/consts/utils'
import { ListType, actions as poolsActions } from '@store/reducers/pools'
import { ClosePositionData, InitPositionData, actions } from '@store/reducers/positions'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { actions as walletActions } from '@store/reducers/wallet'
import { networkType } from '@store/selectors/connection'
import { address } from '@store/selectors/wallet'
import { getAlephZeroWallet } from '@utils/web3/wallet'
import { closeSnackbar } from 'notistack'
import { all, call, put, select, spawn, takeEvery, takeLatest } from 'typed-redux-saga'
import { getConnection } from './connection'
import { fetchAllPoolKeys } from './pools'

function* handleInitPosition(action: PayloadAction<InitPositionData>): Generator {
  const loaderCreatePosition = createLoaderKey()

  const {
    poolKeyData,
    lowerTick,
    upperTick,
    spotSqrtPrice,
    tokenXAmount,
    tokenYAmount,
    liquidityDelta,
    initPool,
    slippageTolerance
  } = action.payload

  const { tokenX, tokenY, feeTier } = poolKeyData

  if (
    (tokenX === TESTNET_WAZERO_ADDRESS && tokenXAmount !== 0n) ||
    (tokenY === TESTNET_WAZERO_ADDRESS && tokenYAmount !== 0n)
  ) {
    return yield* call(handleInitPositionWithAZERO, action)
  }

  try {
    yield put(
      snackbarsActions.add({
        message: 'Creating position...',
        variant: 'pending',
        persist: true,
        key: loaderCreatePosition
      })
    )

    const api = yield* getConnection()
    const network = yield* select(networkType)
    const walletAddress = yield* select(address)
    const adapter = yield* call(getAlephZeroWallet)

    const txs = []

    const psp22 = yield* call(PSP22.load, api, network, DEFAULT_PSP22_OPTIONS)

    const [xAmountWithSlippage, yAmountWithSlippage] = calculateTokenAmountsWithSlippage(
      feeTier.tickSpacing,
      spotSqrtPrice,
      liquidityDelta,
      lowerTick,
      upperTick,
      slippageTolerance,
      true
    )

    const XTokenTx = yield* call(
      [psp22, psp22.approveTx],
      TESTNET_INVARIANT_ADDRESS,
      xAmountWithSlippage,
      tokenX
    )
    txs.push(XTokenTx)

    const YTokenTx = yield* call(
      [psp22, psp22.approveTx],
      TESTNET_INVARIANT_ADDRESS,
      yAmountWithSlippage,
      tokenY
    )
    txs.push(YTokenTx)

    const invariant = yield* call(
      [Invariant, Invariant.load],
      api,
      network,
      TESTNET_INVARIANT_ADDRESS,
      DEFAULT_INVARIANT_OPTIONS
    )

    if (initPool) {
      const createPoolTx = yield* call(
        [invariant, invariant.createPoolTx],
        poolKeyData,
        spotSqrtPrice
      )
      txs.push(createPoolTx)

      yield* call(fetchAllPoolKeys)
    }

    const tx = yield* call(
      [invariant, invariant.createPositionTx],
      poolKeyData,
      lowerTick,
      upperTick,
      liquidityDelta,
      spotSqrtPrice,
      slippageTolerance
    )
    txs.push(tx)

    const batchedTx = api.tx.utility.batchAll(txs)
    const signedBatchedTx = yield* call([batchedTx, batchedTx.signAsync], walletAddress, {
      signer: adapter.signer as Signer
    })
    const txResult = yield* call(sendTx, signedBatchedTx)

    yield* put(actions.setInitPositionSuccess(true))

    yield put(
      snackbarsActions.add({
        message: 'Position successfully created',
        variant: 'success',
        persist: false,
        txid: txResult.hash
      })
    )

    closeSnackbar(loaderCreatePosition)
    yield put(snackbarsActions.remove(loaderCreatePosition))
  } catch (error) {
    console.log(error)

    yield* put(actions.setInitPositionSuccess(false))
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

function* handleInitPositionWithAZERO(action: PayloadAction<InitPositionData>): Generator {
  const loaderCreatePosition = createLoaderKey()

  const {
    poolKeyData,
    lowerTick,
    upperTick,
    spotSqrtPrice,
    tokenXAmount,
    tokenYAmount,
    liquidityDelta,
    initPool,
    slippageTolerance
  } = action.payload

  const { tokenX, tokenY, feeTier } = poolKeyData

  try {
    yield put(
      snackbarsActions.add({
        message: 'Creating position...',
        variant: 'pending',
        persist: true,
        key: loaderCreatePosition
      })
    )

    const api = yield* getConnection()
    const network = yield* select(networkType)
    const walletAddress = yield* select(address)
    const adapter = yield* call(getAlephZeroWallet)

    const txs = []

    const wazero = yield* call(
      WrappedAZERO.load,
      api,
      network,
      TESTNET_WAZERO_ADDRESS,
      DEFAULT_WAZERO_OPTIONS
    )

    const depositTx = yield* call(
      [wazero, wazero.depositTx],
      tokenX === TESTNET_WAZERO_ADDRESS ? tokenXAmount : tokenYAmount
    )
    txs.push(depositTx)

    const psp22 = yield* call(PSP22.load, api, network, DEFAULT_PSP22_OPTIONS)

    const [xAmountWithSlippage, yAmountWithSlippage] = calculateTokenAmountsWithSlippage(
      feeTier.tickSpacing,
      spotSqrtPrice,
      liquidityDelta,
      lowerTick,
      upperTick,
      slippageTolerance,
      true
    )

    const XTokenTx = yield* call(
      [psp22, psp22.approveTx],
      TESTNET_INVARIANT_ADDRESS,
      xAmountWithSlippage,
      tokenX
    )
    txs.push(XTokenTx)

    const YTokenTx = yield* call(
      [psp22, psp22.approveTx],
      TESTNET_INVARIANT_ADDRESS,
      yAmountWithSlippage,
      tokenY
    )
    txs.push(YTokenTx)

    const invariant = yield* call(
      [Invariant, Invariant.load],
      api,
      network,
      TESTNET_INVARIANT_ADDRESS,
      DEFAULT_INVARIANT_OPTIONS
    )

    if (initPool) {
      const createPoolTx = yield* call(
        [invariant, invariant.createPoolTx],
        poolKeyData,
        spotSqrtPrice
      )
      txs.push(createPoolTx)

      yield* call(fetchAllPoolKeys)
    }

    const tx = yield* call(
      [invariant, invariant.createPositionTx],
      poolKeyData,
      lowerTick,
      upperTick,
      liquidityDelta,
      spotSqrtPrice,
      slippageTolerance
    )
    txs.push(tx)

    const batchedTx = api.tx.utility.batchAll(txs)
    const signedBatchedTx = yield* call([batchedTx, batchedTx.signAsync], walletAddress, {
      signer: adapter.signer as Signer
    })
    const txResult = yield* call(sendTx, signedBatchedTx)

    closeSnackbar(loaderCreatePosition)
    yield put(snackbarsActions.remove(loaderCreatePosition))

    yield* put(actions.setInitPositionSuccess(true))

    yield put(
      snackbarsActions.add({
        message: 'Position successfully created',
        variant: 'success',
        persist: false,
        txid: txResult.hash
      })
    )

    yield put(walletActions.getSelectedTokens([tokenX, tokenY]))

    closeSnackbar(loaderCreatePosition)
    yield put(snackbarsActions.remove(loaderCreatePosition))
  } catch (error) {
    console.log(error)

    yield* put(actions.setInitPositionSuccess(false))
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

export function* handleGetPositionsList() {
  try {
    const connection = yield* getConnection()
    const network = yield* select(networkType)
    const invariant = yield* call(
      Invariant.load,
      connection,
      network,
      TESTNET_INVARIANT_ADDRESS,
      DEFAULT_INVARIANT_OPTIONS
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

export function* handleGetCurrentPositionTicks(action: PayloadAction<bigint>) {
  const walletAddress = yield* select(address)
  const connection = yield* getConnection()
  const network = yield* select(networkType)
  const invariant = yield* call(
    Invariant.load,
    connection,
    network,
    TESTNET_INVARIANT_ADDRESS,
    DEFAULT_INVARIANT_OPTIONS
  )

  const position = yield* call([invariant, invariant.getPosition], walletAddress, action.payload)

  const [lowerTick, upperTick] = yield* all([
    call([invariant, invariant.getTick], position.poolKey, position.lowerTickIndex),
    call([invariant, invariant.getTick], position.poolKey, position.upperTickIndex)
  ])

  yield put(
    actions.setCurrentPositionTicks({
      lowerTick,
      upperTick
    })
  )
}

export function* handleClaimFee(action: PayloadAction<bigint>) {
  const loaderSigningTx = createLoaderKey()
  const loaderKey = createLoaderKey()

  try {
    const walletAddress = yield* select(address)
    const connection = yield* getConnection()
    const network = yield* select(networkType)
    const invariant = yield* call(
      Invariant.load,
      connection,
      network,
      TESTNET_INVARIANT_ADDRESS,
      DEFAULT_INVARIANT_OPTIONS
    )

    const position = yield* call([invariant, invariant.getPosition], walletAddress, action.payload)
    if (
      position.poolKey.tokenX === TESTNET_WAZERO_ADDRESS ||
      position.poolKey.tokenY === TESTNET_WAZERO_ADDRESS
    ) {
      yield* call(handleClaimFeeWithAZERO, action)
      return
    }

    const adapter = yield* call(getAlephZeroWallet)

    yield put(
      snackbarsActions.add({
        message: 'Signing transaction...',
        variant: 'pending',
        persist: true,
        key: loaderSigningTx
      })
    )

    const tx = yield* call([invariant, invariant.claimFeeTx], action.payload)
    const signedTx = yield* call([tx, tx.signAsync], walletAddress, {
      signer: adapter.signer as Signer
    })

    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))
    yield put(
      snackbarsActions.add({
        message: 'Claiming fee...',
        variant: 'pending',
        persist: true,
        key: loaderKey
      })
    )

    const txResult = yield* call(sendTx, signedTx)

    closeSnackbar(loaderKey)
    yield put(snackbarsActions.remove(loaderKey))
    yield put(
      snackbarsActions.add({
        message: 'Fee successfully created',
        variant: 'success',
        persist: false,
        txid: txResult.hash
      })
    )

    yield put(actions.getSinglePosition(action.payload))
  } catch (e) {
    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))
    closeSnackbar(loaderKey)
    yield put(snackbarsActions.remove(loaderKey))

    yield put(
      snackbarsActions.add({
        message: 'Failed to claim fee. Please try again.',
        variant: 'error',
        persist: false
      })
    )

    console.log(e)
  }
}

export function* handleClaimFeeWithAZERO(action: PayloadAction<bigint>) {
  const loaderSigningTx = createLoaderKey()
  const loaderKey = createLoaderKey()

  try {
    const walletAddress = yield* select(address)
    const connection = yield* getConnection()
    const network = yield* select(networkType)
    const invariant = yield* call(
      Invariant.load,
      connection,
      network,
      TESTNET_INVARIANT_ADDRESS,
      DEFAULT_INVARIANT_OPTIONS
    )
    const psp22 = yield* call(PSP22.load, connection, network, DEFAULT_PSP22_OPTIONS)
    const adapter = yield* call(getAlephZeroWallet)

    yield put(
      snackbarsActions.add({
        message: 'Signing transaction...',
        variant: 'pending',
        persist: true,
        key: loaderSigningTx
      })
    )

    const txs = []
    const claimTx = invariant.claimFeeTx(action.payload)
    txs.push(claimTx)

    const approveTx = psp22.approveTx(TESTNET_INVARIANT_ADDRESS, U128MAX, TESTNET_WAZERO_ADDRESS)
    txs.push(approveTx)

    const unwrapTx = invariant.withdrawAllWAZEROTx(TESTNET_WAZERO_ADDRESS)
    txs.push(unwrapTx)

    const batchedTx = connection.tx.utility.batchAll(txs)
    const signedBatchedTx = yield* call([batchedTx, batchedTx.signAsync], walletAddress, {
      signer: adapter.signer as Signer
    })

    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))
    yield put(
      snackbarsActions.add({
        message: 'Claiming fee...',
        variant: 'pending',
        persist: true,
        key: loaderKey
      })
    )

    const txResult = yield* call(sendTx, signedBatchedTx)

    closeSnackbar(loaderKey)
    yield put(snackbarsActions.remove(loaderKey))
    yield put(
      snackbarsActions.add({
        message: 'Fee successfully created',
        variant: 'success',
        persist: false,
        txid: txResult.hash
      })
    )

    yield put(actions.getSinglePosition(action.payload))
  } catch (e) {
    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))
    closeSnackbar(loaderKey)
    yield put(snackbarsActions.remove(loaderKey))

    yield put(
      snackbarsActions.add({
        message: 'Failed to claim fee. Please try again.',
        variant: 'error',
        persist: false
      })
    )

    console.log(e)
  }
}

export function* handleGetSinglePosition(action: PayloadAction<bigint>) {
  const walletAddress = yield* select(address)
  const connection = yield* getConnection()
  const network = yield* select(networkType)
  const invariant = yield* call(
    Invariant.load,
    connection,
    network,
    TESTNET_INVARIANT_ADDRESS,
    DEFAULT_INVARIANT_OPTIONS
  )

  const position = yield* call([invariant, invariant.getPosition], walletAddress, action.payload)
  yield put(
    actions.setSinglePosition({
      index: action.payload,
      position
    })
  )

  yield put(actions.getCurrentPositionTicks(action.payload))
}

export function* handleClosePosition(action: PayloadAction<ClosePositionData>) {
  const loaderSigningTx = createLoaderKey()
  const loaderKey = createLoaderKey()

  try {
    const walletAddress = yield* select(address)
    const connection = yield* getConnection()
    const network = yield* select(networkType)
    const invariant = yield* call(
      Invariant.load,
      connection,
      network,
      TESTNET_INVARIANT_ADDRESS,
      DEFAULT_INVARIANT_OPTIONS
    )
    const adapter = yield* call(getAlephZeroWallet)

    yield put(
      snackbarsActions.add({
        message: 'Signing transaction...',
        variant: 'pending',
        persist: true,
        key: loaderSigningTx
      })
    )

    const tx = yield* call([invariant, invariant.removePositionTx], action.payload.positionIndex)
    const signedTx = yield* call([tx, tx.signAsync], walletAddress, {
      signer: adapter.signer as Signer
    })

    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))
    const loaderKey = createLoaderKey()
    yield put(
      snackbarsActions.add({
        message: 'Removing position...',
        variant: 'pending',
        persist: true,
        key: loaderKey
      })
    )

    const txResult = yield* call(sendTx, signedTx)

    closeSnackbar(loaderKey)
    yield put(snackbarsActions.remove(loaderKey))
    yield put(
      snackbarsActions.add({
        message: 'Position successfully removed',
        variant: 'success',
        persist: false,
        txid: txResult.hash
      })
    )

    yield* put(actions.getPositionsList())
    action.payload.onSuccess()
  } catch (e) {
    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))
    closeSnackbar(loaderKey)
    yield put(snackbarsActions.remove(loaderKey))

    yield put(
      snackbarsActions.add({
        message: 'Failed to close position. Please try again.',
        variant: 'error',
        persist: false
      })
    )

    console.log(e)
  }
}

export function* initPositionHandler(): Generator {
  yield* takeEvery(actions.initPosition, handleInitPosition)
}

export function* getPositionsListHandler(): Generator {
  yield* takeLatest(actions.getPositionsList, handleGetPositionsList)
}

export function* getCurrentPositionTicksHandler(): Generator {
  yield* takeEvery(actions.getCurrentPositionTicks, handleGetCurrentPositionTicks)
}

export function* claimFeeHandler(): Generator {
  yield* takeEvery(actions.claimFee, handleClaimFee)
}

export function* getSinglePositionHandler(): Generator {
  yield* takeEvery(actions.getSinglePosition, handleGetSinglePosition)
}

export function* closePositionHandler(): Generator {
  yield* takeEvery(actions.closePosition, handleClosePosition)
}

export function* positionsSaga(): Generator {
  yield all(
    [
      initPositionHandler,
      getPositionsListHandler,
      getCurrentPositionTicksHandler,
      claimFeeHandler,
      getSinglePositionHandler,
      closePositionHandler
    ].map(spawn)
  )
}
