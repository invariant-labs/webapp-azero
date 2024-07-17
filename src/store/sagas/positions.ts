import {
  LiquidityTick,
  Pool,
  Position,
  TESTNET_WAZERO_ADDRESS,
  sendTx
} from '@invariant-labs/a0-sdk'
import { Signer } from '@polkadot/api/types'
import { PayloadAction } from '@reduxjs/toolkit'
import {
  EMPTY_POSITION,
  ErrorMessage,
  INVARIANT_CLAIM_FEE_OPTIONS,
  INVARIANT_CREATE_POOL_OPTIONS,
  INVARIANT_CREATE_POSITION_OPTIONS,
  INVARIANT_REMOVE_POSITION_OPTIONS,
  INVARIANT_WITHDRAW_ALL_WAZERO,
  POSITIONS_PER_QUERY,
  PSP22_APPROVE_OPTIONS,
  U128MAX,
  WAZERO_DEPOSIT_OPTIONS
} from '@store/consts/static'
import {
  createLiquidityPlot,
  createLoaderKey,
  createPlaceholderLiquidityPlot,
  deserializeTickmap,
  ensureError,
  isErrorMessage,
  poolKeyToString
} from '@utils/utils'
import { FetchTicksAndTickMaps, ListType, actions as poolsActions } from '@store/reducers/pools'
import {
  ClosePositionData,
  GetCurrentTicksData,
  GetPositionTicks,
  HandleClaimFee,
  InitPositionData,
  actions
} from '@store/reducers/positions'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { actions as walletActions } from '@store/reducers/wallet'
import { invariantAddress } from '@store/selectors/connection'
import { poolsArraySortedByFees, tickMaps, tokens } from '@store/selectors/pools'
import { address, balance } from '@store/selectors/wallet'
import { getAlephZeroWallet } from '@utils/web3/wallet'
import { closeSnackbar } from 'notistack'
import { all, call, fork, join, put, select, spawn, takeEvery, takeLatest } from 'typed-redux-saga'
import { fetchTicksAndTickMaps, fetchTokens } from './pools'
import { fetchBalances } from './wallet'
import { SubmittableExtrinsic } from '@polkadot/api/promise/types'
import { calculateTokenAmountsWithSlippage } from '@invariant-labs/a0-sdk/target/utils'
import { positionsList } from '@store/selectors/positions'
import { getApi, getInvariant, getPSP22, getWrappedAZERO } from './connection'

function* handleInitPosition(action: PayloadAction<InitPositionData>): Generator {
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

  const loaderCreatePosition = createLoaderKey()
  const loaderSigningTx = createLoaderKey()

  try {
    yield put(
      snackbarsActions.add({
        message: 'Creating position...',
        variant: 'pending',
        persist: true,
        key: loaderCreatePosition
      })
    )

    const api = yield* getApi()
    const walletAddress = yield* select(address)
    const adapter = yield* call(getAlephZeroWallet)
    const invAddress = yield* select(invariantAddress)

    const txs = []

    const psp22 = yield* getPSP22()

    const [xAmountWithSlippage, yAmountWithSlippage] = calculateTokenAmountsWithSlippage(
      feeTier.tickSpacing,
      spotSqrtPrice,
      liquidityDelta,
      lowerTick,
      upperTick,
      slippageTolerance,
      true
    )

    const XTokenTx = psp22.approveTx(invAddress, xAmountWithSlippage, tokenX, PSP22_APPROVE_OPTIONS)
    txs.push(XTokenTx)

    const YTokenTx = psp22.approveTx(invAddress, yAmountWithSlippage, tokenY, PSP22_APPROVE_OPTIONS)
    txs.push(YTokenTx)

    const invariant = yield* getInvariant()

    if (initPool) {
      const createPoolTx = invariant.createPoolTx(
        poolKeyData,
        spotSqrtPrice,
        INVARIANT_CREATE_POOL_OPTIONS
      )
      txs.push(createPoolTx)
    }

    const tx = invariant.createPositionTx(
      poolKeyData,
      lowerTick,
      upperTick,
      liquidityDelta,
      spotSqrtPrice,
      slippageTolerance,
      INVARIANT_CREATE_POSITION_OPTIONS
    )
    txs.push(tx)

    const batchedTx = api.tx.utility.batchAll(txs)

    yield put(
      snackbarsActions.add({
        message: 'Signing transaction...',
        variant: 'pending',
        persist: true,
        key: loaderSigningTx
      })
    )

    let signedBatchedTx: SubmittableExtrinsic
    try {
      signedBatchedTx = yield* call([batchedTx, batchedTx.signAsync], walletAddress, {
        signer: adapter.signer as Signer
      })
    } catch (e) {
      throw new Error(ErrorMessage.TRANSACTION_SIGNING_ERROR)
    }

    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))

    const txResult = yield* call(sendTx, signedBatchedTx)

    yield* put(actions.setInitPositionSuccess(true))

    closeSnackbar(loaderCreatePosition)
    yield put(snackbarsActions.remove(loaderCreatePosition))

    yield put(
      snackbarsActions.add({
        message: 'Position successfully created',
        variant: 'success',
        persist: false,
        txid: txResult.hash
      })
    )

    const { length } = yield* select(positionsList)
    const position = yield* call([invariant, invariant.getPosition], walletAddress, length)
    yield* put(actions.addPosition(position))

    yield* call(fetchBalances, [tokenX, tokenY])

    yield* put(poolsActions.getPoolKeys())
  } catch (e: unknown) {
    const error = ensureError(e)
    console.log(error)

    yield* put(actions.setInitPositionSuccess(false))

    closeSnackbar(loaderCreatePosition)
    yield put(snackbarsActions.remove(loaderCreatePosition))
    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))

    if (isErrorMessage(error.message)) {
      yield put(
        snackbarsActions.add({
          message: error.message,
          variant: 'error',
          persist: false
        })
      )
    } else {
      yield put(
        snackbarsActions.add({
          message: 'Failed to send. Please try again.',
          variant: 'error',
          persist: false
        })
      )
    }
  }
}

function* handleInitPositionWithAZERO(action: PayloadAction<InitPositionData>): Generator {
  const loaderCreatePosition = createLoaderKey()
  const loaderSigningTx = createLoaderKey()

  const {
    poolKeyData,
    lowerTick,
    upperTick,
    spotSqrtPrice,
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

    const api = yield* getApi()
    const walletAddress = yield* select(address)
    const adapter = yield* call(getAlephZeroWallet)
    const invAddress = yield* select(invariantAddress)
    const azeroBalance = yield* select(balance)

    const txs = []

    const wazero = yield* getWrappedAZERO()

    const psp22 = yield* getPSP22()

    const [xAmountWithSlippage, yAmountWithSlippage] = calculateTokenAmountsWithSlippage(
      feeTier.tickSpacing,
      spotSqrtPrice,
      liquidityDelta,
      lowerTick,
      upperTick,
      slippageTolerance,
      true
    )

    let azeroAmount = 0n
    if (tokenX === TESTNET_WAZERO_ADDRESS) {
      azeroAmount = azeroBalance > xAmountWithSlippage ? xAmountWithSlippage : azeroBalance
    } else {
      azeroAmount = azeroBalance > yAmountWithSlippage ? yAmountWithSlippage : azeroBalance
    }
    const depositTx = wazero.depositTx(azeroAmount, WAZERO_DEPOSIT_OPTIONS)
    txs.push(depositTx)

    const XTokenTx = psp22.approveTx(invAddress, xAmountWithSlippage, tokenX, PSP22_APPROVE_OPTIONS)
    txs.push(XTokenTx)

    const YTokenTx = psp22.approveTx(invAddress, yAmountWithSlippage, tokenY, PSP22_APPROVE_OPTIONS)
    txs.push(YTokenTx)

    const invariant = yield* getInvariant()

    if (initPool) {
      const createPoolTx = invariant.createPoolTx(
        poolKeyData,
        spotSqrtPrice,
        INVARIANT_CREATE_POOL_OPTIONS
      )
      txs.push(createPoolTx)
    }

    const tx = invariant.createPositionTx(
      poolKeyData,
      lowerTick,
      upperTick,
      liquidityDelta,
      spotSqrtPrice,
      slippageTolerance,
      INVARIANT_CREATE_POSITION_OPTIONS
    )
    txs.push(tx)

    const approveTx = psp22.approveTx(
      invAddress,
      U128MAX,
      TESTNET_WAZERO_ADDRESS,
      PSP22_APPROVE_OPTIONS
    )
    txs.push(approveTx)

    const unwrapTx = invariant.withdrawAllWAZEROTx(
      TESTNET_WAZERO_ADDRESS,
      INVARIANT_WITHDRAW_ALL_WAZERO
    )
    txs.push(unwrapTx)

    const resetApproveTx = psp22.approveTx(
      invAddress,
      0n,
      TESTNET_WAZERO_ADDRESS,
      PSP22_APPROVE_OPTIONS
    )
    txs.push(resetApproveTx)

    const batchedTx = api.tx.utility.batchAll(txs)

    yield put(
      snackbarsActions.add({
        message: 'Signing transaction...',
        variant: 'pending',
        persist: true,
        key: loaderSigningTx
      })
    )

    let signedBatchedTx: SubmittableExtrinsic

    try {
      signedBatchedTx = yield* call([batchedTx, batchedTx.signAsync], walletAddress, {
        signer: adapter.signer as Signer
      })
    } catch (e) {
      throw new Error(ErrorMessage.TRANSACTION_SIGNING_ERROR)
    }

    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))

    const txResult = yield* call(sendTx, signedBatchedTx)

    yield* put(actions.setInitPositionSuccess(true))

    closeSnackbar(loaderCreatePosition)
    yield put(snackbarsActions.remove(loaderCreatePosition))

    yield put(
      snackbarsActions.add({
        message: 'Position successfully created',
        variant: 'success',
        persist: false,
        txid: txResult.hash
      })
    )

    yield put(walletActions.getBalances([tokenX, tokenY]))

    const { length } = yield* select(positionsList)
    const position = yield* call([invariant, invariant.getPosition], walletAddress, length)
    yield* put(actions.addPosition(position))

    yield* call(fetchBalances, [tokenX === TESTNET_WAZERO_ADDRESS ? tokenY : tokenX])

    yield* put(poolsActions.getPoolKeys())
  } catch (e: unknown) {
    const error = ensureError(e)
    console.log(error)

    yield* put(actions.setInitPositionSuccess(false))

    closeSnackbar(loaderCreatePosition)
    yield put(snackbarsActions.remove(loaderCreatePosition))
    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))

    if (isErrorMessage(error.message)) {
      yield put(
        snackbarsActions.add({
          message: error.message,
          variant: 'error',
          persist: false
        })
      )
    } else {
      yield put(
        snackbarsActions.add({
          message: 'Failed to send. Please try again.',
          variant: 'error',
          persist: false
        })
      )
    }
  }
}

export function* handleGetCurrentPositionTicks(action: PayloadAction<GetPositionTicks>) {
  const { poolKey, lowerTickIndex, upperTickIndex } = action.payload

  const invariant = yield* getInvariant()

  const [lowerTick, upperTick] = yield* all([
    call([invariant, invariant.getTick], poolKey, lowerTickIndex),
    call([invariant, invariant.getTick], poolKey, upperTickIndex)
  ])

  yield put(
    actions.setCurrentPositionTicks({
      lowerTick,
      upperTick
    })
  )
}

export function* handleGetCurrentPlotTicks(action: PayloadAction<GetCurrentTicksData>): Generator {
  const { poolKey, isXtoY, fetchTicksAndTickmap, onlyUserPositions } = action.payload
  let allTickmaps = yield* select(tickMaps)
  const allTokens = yield* select(tokens)
  const allPools = yield* select(poolsArraySortedByFees)

  const xDecimal = allTokens[poolKey.tokenX].decimals
  const yDecimal = allTokens[poolKey.tokenY].decimals

  try {
    const invariant = yield* getInvariant()

    if (!allTickmaps[poolKeyToString(poolKey)] || fetchTicksAndTickmap) {
      const fetchTicksAndTickMapsAction: PayloadAction<FetchTicksAndTickMaps> = {
        type: poolsActions.getTicksAndTickMaps.type,
        payload: {
          tokenFrom: allTokens[poolKey.tokenX].address,
          tokenTo: allTokens[poolKey.tokenY].address,
          allPools
        }
      }

      const fetchTask = yield* fork(fetchTicksAndTickMaps, fetchTicksAndTickMapsAction)

      yield* join(fetchTask)
      allTickmaps = yield* select(tickMaps)
    }

    if (!allTickmaps[poolKeyToString(poolKey)]) {
      const data = createPlaceholderLiquidityPlot(
        action.payload.isXtoY,
        0,
        poolKey.feeTier.tickSpacing,
        xDecimal,
        yDecimal
      )
      yield* put(actions.setPlotTicks(data))
      return
    }

    let rawTicks: LiquidityTick[] = []

    if (onlyUserPositions) {
      yield* call(handleGetRemainingPositions)
      const { list } = yield* select(positionsList)

      const ticks: { [key: number]: { liquidityChange: bigint; sign: boolean } } = {}

      list.forEach(position => {
        if (poolKeyToString(position.poolKey) !== poolKeyToString(poolKey)) {
          return
        }

        if (!ticks[Number(position.lowerTickIndex)]) {
          ticks[Number(position.lowerTickIndex)] = {
            liquidityChange: position.liquidity,
            sign: true
          }
        }

        if (!ticks[Number(position.upperTickIndex)]) {
          ticks[Number(position.upperTickIndex)] = {
            liquidityChange: position.liquidity,
            sign: false
          }
        }

        if (ticks[Number(position.lowerTickIndex)].sign) {
          ticks[Number(position.lowerTickIndex)].liquidityChange += position.liquidity
        } else {
          if (ticks[Number(position.lowerTickIndex)].liquidityChange - position.liquidity < 0) {
            ticks[Number(position.lowerTickIndex)] = {
              liquidityChange:
                ticks[Number(position.lowerTickIndex)].liquidityChange - position.liquidity,
              sign: true
            }
          } else {
            ticks[Number(position.lowerTickIndex)].liquidityChange - position.liquidity
          }
        }

        if (!ticks[Number(position.upperTickIndex)].sign) {
          ticks[Number(position.upperTickIndex)].liquidityChange += position.liquidity
        } else {
          if (ticks[Number(position.upperTickIndex)].liquidityChange - position.liquidity < 0) {
            ticks[Number(position.upperTickIndex)] = {
              liquidityChange:
                ticks[Number(position.upperTickIndex)].liquidityChange - position.liquidity,
              sign: false
            }
          } else {
            ticks[Number(position.upperTickIndex)].liquidityChange - position.liquidity
          }
        }
      })

      rawTicks = Object.entries(ticks).map(([index, { liquidityChange, sign }]) => ({
        index: BigInt(index),
        liquidityChange,
        sign
      }))
    } else {
      rawTicks = yield* call(
        [invariant, invariant.getAllLiquidityTicks],
        poolKey,
        deserializeTickmap(allTickmaps[poolKeyToString(poolKey)])
      )
    }

    if (rawTicks.length === 0) {
      const data = createPlaceholderLiquidityPlot(
        action.payload.isXtoY,
        0,
        poolKey.feeTier.tickSpacing,
        xDecimal,
        yDecimal
      )
      yield* put(actions.setPlotTicks(data))
      return
    }

    const ticksData = createLiquidityPlot(
      rawTicks,
      poolKey.feeTier.tickSpacing,
      isXtoY,
      xDecimal,
      yDecimal
    )
    yield put(actions.setPlotTicks(ticksData))
  } catch (error) {
    console.log(error)
    const data = createPlaceholderLiquidityPlot(
      action.payload.isXtoY,
      10,
      poolKey.feeTier.tickSpacing,
      xDecimal,
      yDecimal
    )
    yield* put(actions.setErrorPlotTicks(data))
  }
}

export function* handleClaimFee(action: PayloadAction<HandleClaimFee>) {
  const { index, addressTokenX, addressTokenY } = action.payload

  if (addressTokenX === TESTNET_WAZERO_ADDRESS || addressTokenY === TESTNET_WAZERO_ADDRESS) {
    yield* call(handleClaimFeeWithAZERO, action)
    return
  }

  const loaderKey = createLoaderKey()
  const loaderSigningTx = createLoaderKey()
  try {
    yield put(
      snackbarsActions.add({
        message: 'Claiming fee...',
        variant: 'pending',
        persist: true,
        key: loaderKey
      })
    )
    const walletAddress = yield* select(address)

    const invariant = yield* getInvariant()

    const adapter = yield* call(getAlephZeroWallet)

    const tx = invariant.claimFeeTx(index, INVARIANT_CLAIM_FEE_OPTIONS)

    yield put(
      snackbarsActions.add({
        message: 'Signing transaction...',
        variant: 'pending',
        persist: true,
        key: loaderSigningTx
      })
    )

    let signedTx: SubmittableExtrinsic
    try {
      signedTx = yield* call([tx, tx.signAsync], walletAddress, {
        signer: adapter.signer as Signer
      })
    } catch (e) {
      throw new Error(ErrorMessage.TRANSACTION_SIGNING_ERROR)
    }

    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))

    const txResult = yield* call(sendTx, signedTx)

    closeSnackbar(loaderKey)
    yield put(snackbarsActions.remove(loaderKey))
    yield put(
      snackbarsActions.add({
        message: 'Fee successfully claimed',
        variant: 'success',
        persist: false,
        txid: txResult.hash
      })
    )

    yield put(actions.getSinglePosition(index))

    yield* call(fetchBalances, [
      addressTokenX === TESTNET_WAZERO_ADDRESS ? addressTokenY : addressTokenX
    ])
  } catch (e: unknown) {
    const error = ensureError(e)
    console.log(error)

    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))
    closeSnackbar(loaderKey)
    yield put(snackbarsActions.remove(loaderKey))

    if (isErrorMessage(error.message)) {
      yield put(
        snackbarsActions.add({
          message: error.message,
          variant: 'error',
          persist: false
        })
      )
    } else {
      yield put(
        snackbarsActions.add({
          message: 'Failed to claim fee. Please try again.',
          variant: 'error',
          persist: false
        })
      )
    }
  }
}

export function* handleClaimFeeWithAZERO(action: PayloadAction<HandleClaimFee>) {
  const loaderKey = createLoaderKey()
  const loaderSigningTx = createLoaderKey()

  try {
    yield put(
      snackbarsActions.add({
        message: 'Claiming fee...',
        variant: 'pending',
        persist: true,
        key: loaderKey
      })
    )

    const walletAddress = yield* select(address)
    const api = yield* getApi()
    const invAddress = yield* select(invariantAddress)
    const { index, addressTokenX, addressTokenY } = action.payload

    const invariant = yield* getInvariant()
    const psp22 = yield* getPSP22()
    const adapter = yield* call(getAlephZeroWallet)

    const txs = []
    const claimTx = invariant.claimFeeTx(index, INVARIANT_CLAIM_FEE_OPTIONS)
    txs.push(claimTx)

    const approveTx = psp22.approveTx(
      invAddress,
      U128MAX,
      TESTNET_WAZERO_ADDRESS,
      PSP22_APPROVE_OPTIONS
    )
    txs.push(approveTx)

    const unwrapTx = invariant.withdrawAllWAZEROTx(
      TESTNET_WAZERO_ADDRESS,
      INVARIANT_WITHDRAW_ALL_WAZERO
    )
    txs.push(unwrapTx)

    const resetApproveTx = psp22.approveTx(
      invAddress,
      0n,
      TESTNET_WAZERO_ADDRESS,
      PSP22_APPROVE_OPTIONS
    )
    txs.push(resetApproveTx)

    const batchedTx = api.tx.utility.batchAll(txs)

    yield put(
      snackbarsActions.add({
        message: 'Signing transaction...',
        variant: 'pending',
        persist: true,
        key: loaderSigningTx
      })
    )

    let signedBatchedTx: SubmittableExtrinsic
    try {
      signedBatchedTx = yield* call([batchedTx, batchedTx.signAsync], walletAddress, {
        signer: adapter.signer as Signer
      })
    } catch (e) {
      throw new Error(ErrorMessage.TRANSACTION_SIGNING_ERROR)
    }

    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))

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

    yield put(actions.getSinglePosition(index))

    yield* call(fetchBalances, [addressTokenX, addressTokenY])
  } catch (e: unknown) {
    const error = ensureError(e)
    console.log(error)

    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))
    closeSnackbar(loaderKey)
    yield put(snackbarsActions.remove(loaderKey))

    if (isErrorMessage(error.message)) {
      yield put(
        snackbarsActions.add({
          message: error.message,
          variant: 'error',
          persist: false
        })
      )
    } else {
      yield put(
        snackbarsActions.add({
          message: 'Failed to close position. Please try again.',
          variant: 'error',
          persist: false
        })
      )
    }
  }
}

export function* handleGetSinglePosition(action: PayloadAction<bigint>) {
  try {
    const walletAddress = yield* select(address)
    const invariant = yield* getInvariant()
    const position = yield* call([invariant, invariant.getPosition], walletAddress, action.payload)
    yield* put(
      actions.setSinglePosition({
        index: action.payload,
        position
      })
    )
    yield* put(
      actions.getCurrentPositionTicks({
        poolKey: position.poolKey,
        lowerTickIndex: position.lowerTickIndex,
        upperTickIndex: position.upperTickIndex
      })
    )
    yield* put(
      poolsActions.getPoolsDataForList({
        poolKeys: [position.poolKey],
        listType: ListType.POSITIONS
      })
    )
  } catch (e) {
    console.log(e)
  }
}

export function* handleClosePosition(action: PayloadAction<ClosePositionData>) {
  const { addressTokenX, addressTokenY, onSuccess, positionIndex } = action.payload

  if (addressTokenX === TESTNET_WAZERO_ADDRESS || addressTokenY === TESTNET_WAZERO_ADDRESS) {
    yield* call(handleClosePositionWithAZERO, action)
    return
  }

  const loaderKey = createLoaderKey()
  const loaderSigningTx = createLoaderKey()

  try {
    yield put(
      snackbarsActions.add({
        message: 'Removing position...',
        variant: 'pending',
        persist: true,
        key: loaderKey
      })
    )

    const walletAddress = yield* select(address)

    const invariant = yield* getInvariant()
    const adapter = yield* call(getAlephZeroWallet)

    const allPositions = yield* select(positionsList)
    const getPositionsListPagePayload: PayloadAction<{ index: number; refresh: boolean }> = {
      type: actions.getPositionsListPage.type,
      payload: {
        index: Math.floor(Number(allPositions.length) / POSITIONS_PER_QUERY),
        refresh: false
      }
    }
    const fetchTask = yield* fork(handleGetPositionsListPage, getPositionsListPagePayload)
    yield* join(fetchTask)

    const tx = invariant.removePositionTx(positionIndex, INVARIANT_REMOVE_POSITION_OPTIONS)

    yield put(
      snackbarsActions.add({
        message: 'Signing transaction...',
        variant: 'pending',
        persist: true,
        key: loaderSigningTx
      })
    )

    let signedTx: SubmittableExtrinsic
    try {
      signedTx = yield* call([tx, tx.signAsync], walletAddress, {
        signer: adapter.signer as Signer
      })
    } catch (e) {
      throw new Error(ErrorMessage.TRANSACTION_SIGNING_ERROR)
    }

    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))

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

    yield* put(actions.removePosition(positionIndex))
    onSuccess()

    yield* call(fetchBalances, [addressTokenX, addressTokenY])
  } catch (e: unknown) {
    const error = ensureError(e)
    console.log(error)

    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))
    closeSnackbar(loaderKey)
    yield put(snackbarsActions.remove(loaderKey))

    if (isErrorMessage(error.message)) {
      yield put(
        snackbarsActions.add({
          message: error.message,
          variant: 'error',
          persist: false
        })
      )
    } else {
      yield put(
        snackbarsActions.add({
          message: 'Failed to close position. Please try again.',
          variant: 'error',
          persist: false
        })
      )
    }
  }
}

export function* handleClosePositionWithAZERO(action: PayloadAction<ClosePositionData>) {
  const loaderSigningTx = createLoaderKey()
  const loaderKey = createLoaderKey()

  try {
    yield put(
      snackbarsActions.add({
        message: 'Removing position...',
        variant: 'pending',
        persist: true,
        key: loaderKey
      })
    )

    const { addressTokenX, addressTokenY, positionIndex, onSuccess } = action.payload
    const walletAddress = yield* select(address)
    const api = yield* getApi()
    const invAddress = yield* select(invariantAddress)
    const invariant = yield* getInvariant()
    const psp22 = yield* getPSP22()
    const adapter = yield* call(getAlephZeroWallet)

    const allPositions = yield* select(positionsList)
    const getPositionsListPagePayload: PayloadAction<{ index: number; refresh: boolean }> = {
      type: actions.getPositionsListPage.type,
      payload: {
        index: Math.floor(Number(allPositions.length) / POSITIONS_PER_QUERY),
        refresh: false
      }
    }
    const fetchTask = yield* fork(handleGetPositionsListPage, getPositionsListPagePayload)
    yield* join(fetchTask)

    const txs = []

    const removePositionTx = invariant.removePositionTx(positionIndex)
    txs.push(removePositionTx)

    const approveTx = psp22.approveTx(invAddress, U128MAX, TESTNET_WAZERO_ADDRESS)
    txs.push(approveTx)

    const unwrapTx = invariant.withdrawAllWAZEROTx(TESTNET_WAZERO_ADDRESS)
    txs.push(unwrapTx)

    const resetApproveTx = psp22.approveTx(invAddress, 0n, TESTNET_WAZERO_ADDRESS)
    txs.push(resetApproveTx)

    const batchedTx = api.tx.utility.batchAll(txs)

    yield put(
      snackbarsActions.add({
        message: 'Signing transaction...',
        variant: 'pending',
        persist: true,
        key: loaderSigningTx
      })
    )

    let signedBatchedTx: SubmittableExtrinsic
    try {
      signedBatchedTx = yield* call([batchedTx, batchedTx.signAsync], walletAddress, {
        signer: adapter.signer as Signer
      })
    } catch (e) {
      throw new Error(ErrorMessage.TRANSACTION_SIGNING_ERROR)
    }

    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))

    const txResult = yield* call(sendTx, signedBatchedTx)

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

    yield* put(actions.removePosition(positionIndex))
    onSuccess()

    yield* call(fetchBalances, [addressTokenX, addressTokenY])
  } catch (e: unknown) {
    const error = ensureError(e)
    console.log(error)

    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))
    closeSnackbar(loaderKey)
    yield put(snackbarsActions.remove(loaderKey))

    if (isErrorMessage(error.message)) {
      yield put(
        snackbarsActions.add({
          message: error.message,
          variant: 'error',
          persist: false
        })
      )
    } else {
      yield put(
        snackbarsActions.add({
          message: 'Failed to close position. Please try again.',
          variant: 'error',
          persist: false
        })
      )
    }
  }
}

export function* handleGetRemainingPositions(): Generator {
  const walletAddress = yield* select(address)
  const { length, list, loadedPages } = yield* select(positionsList)

  const invariant = yield* getInvariant()

  const pages = yield* call(
    [invariant, invariant.getAllPositions],
    walletAddress,
    length,
    Object.entries(loadedPages)
      .filter(([_, isLoaded]) => isLoaded)
      .map(([index]) => Number(index)),
    BigInt(POSITIONS_PER_QUERY)
  )

  const allList = [...list]
  for (const { index, entries } of pages) {
    for (let i = 0; i < entries.length; i++) {
      allList[i + index * Number(POSITIONS_PER_QUERY)] = entries[i][0]
    }
  }

  yield* put(actions.setPositionsList(allList))
  yield* put(
    actions.setPositionsListLoadedStatus({
      indexes: pages.map(({ index }: { index: number }) => index),
      isLoaded: true
    })
  )
}

export function* handleGetPositionsListPage(
  action: PayloadAction<{ index: number; refresh: boolean }>
) {
  const { index, refresh } = action.payload

  const walletAddress = yield* select(address)
  const { length, list, loadedPages } = yield* select(positionsList)

  const invariant = yield* getInvariant()

  let entries: [Position, Pool][] = []
  let positionsLength = 0n

  if (refresh) {
    yield* put(
      actions.setPositionsListLoadedStatus({
        indexes: Object.keys(loadedPages)
          .map(key => Number(key))
          .filter(keyIndex => keyIndex !== index),
        isLoaded: false
      })
    )
  }

  if (!length || refresh) {
    console.log('call', index)
    const result = yield* call(
      [invariant, invariant.getPositions],
      walletAddress,
      BigInt(POSITIONS_PER_QUERY),
      BigInt(index * POSITIONS_PER_QUERY)
    )
    entries = result[0]
    positionsLength = result[1]

    const poolsWithPoolKeys = entries.map(entry => ({
      poolKey: entry[0].poolKey,
      ...entry[1]
    }))

    yield* put(
      poolsActions.addPoolsForList({ data: poolsWithPoolKeys, listType: ListType.POSITIONS })
    )
    yield* call(fetchTokens, poolsWithPoolKeys)

    yield* put(actions.setPositionsListLength(positionsLength))
  }

  const allList = length ? [...list] : Array(Number(positionsLength)).fill(EMPTY_POSITION)

  const isPageLoaded = loadedPages[index]

  if (!isPageLoaded || refresh) {
    if (length && !refresh) {
      console.log('call', index)
      const result = yield* call(
        [invariant, invariant.getPositions],
        walletAddress,
        BigInt(POSITIONS_PER_QUERY),
        BigInt(index * POSITIONS_PER_QUERY)
      )
      entries = result[0]
      positionsLength = result[1]

      const poolsWithPoolKeys = entries.map(entry => ({
        poolKey: entry[0].poolKey,
        ...entry[1]
      }))

      yield* put(
        poolsActions.addPoolsForList({ data: poolsWithPoolKeys, listType: ListType.POSITIONS })
      )
      yield* call(fetchTokens, poolsWithPoolKeys)
    }

    for (let i = 0; i < entries.length; i++) {
      allList[i + index * POSITIONS_PER_QUERY] = entries[i][0]
    }
  }

  yield* put(actions.setPositionsList(allList))
  yield* put(actions.setPositionsListLoadedStatus({ indexes: [index], isLoaded: true }))
}

export function* initPositionHandler(): Generator {
  yield* takeEvery(actions.initPosition, handleInitPosition)
}

export function* getCurrentPositionTicksHandler(): Generator {
  yield* takeEvery(actions.getCurrentPositionTicks, handleGetCurrentPositionTicks)
}

export function* getCurrentPlotTicksHandler(): Generator {
  yield* takeLatest(actions.getCurrentPlotTicks, handleGetCurrentPlotTicks)
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

export function* getPositionsListPage(): Generator {
  yield* takeLatest(actions.getPositionsListPage, handleGetPositionsListPage)
}

export function* getRemainingPositions(): Generator {
  yield* takeLatest(actions.getRemainingPositions, handleGetRemainingPositions)
}

export function* positionsSaga(): Generator {
  yield all(
    [
      initPositionHandler,
      getCurrentPositionTicksHandler,
      getCurrentPlotTicksHandler,
      claimFeeHandler,
      getSinglePositionHandler,
      closePositionHandler,
      getPositionsListPage,
      getRemainingPositions
    ].map(spawn)
  )
}
