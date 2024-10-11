import { Pool, Position, sendTx, Invariant, PSP22 } from '@invariant-labs/a0-sdk'
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
  POOL_SAFE_TRANSACTION_FEE,
  POSITIONS_PER_QUERY,
  PSP22_APPROVE_OPTIONS,
  MAX,
  WAZERO_DEPOSIT_OPTIONS
} from '@store/consts/static'
import {
  createLiquidityPlot,
  createLoaderKey,
  createPlaceholderLiquidityPlot,
  ensureError,
  getLiquidityTicksByPositionsList,
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
import { invariantAddress, wrappedAZEROAddress } from '@store/selectors/connection'
import { poolsArraySortedByFees, poolTicks, tickMaps, tokens } from '@store/selectors/pools'
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

export function getWithdrawAllWAZEROTxs(
  invariant: Invariant,
  psp22: PSP22,
  invariantAddress: string,
  wazeroAddress: string
): SubmittableExtrinsic[] {
  const txs: SubmittableExtrinsic[] = []

  const approveTx = psp22.approveTx(invariantAddress, MAX, wazeroAddress, PSP22_APPROVE_OPTIONS)
  txs.push(approveTx)

  const unwrapTx = invariant.withdrawAllWAZEROTx(wazeroAddress, INVARIANT_WITHDRAW_ALL_WAZERO)
  txs.push(unwrapTx)

  const resetApproveTx = psp22.approveTx(invariantAddress, 0n, wazeroAddress, PSP22_APPROVE_OPTIONS)
  txs.push(resetApproveTx)

  return txs
}

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

    const walletAddress = yield* select(address)
    const adapter = yield* call(getAlephZeroWallet)
    const azeroBalance = yield* select(balance)
    const invAddress = yield* select(invariantAddress)
    const wazeroAddress = yield* select(wrappedAZEROAddress)

    const api = yield* getApi()
    const invariant = yield* getInvariant()
    const psp22 = yield* getPSP22()
    const wazero = yield* getWrappedAZERO()

    let txs = []

    const [xAmountWithSlippage, yAmountWithSlippage] = calculateTokenAmountsWithSlippage(
      feeTier.tickSpacing,
      spotSqrtPrice,
      liquidityDelta,
      lowerTick,
      upperTick,
      slippageTolerance,
      true
    )

    if (
      (tokenX === wazeroAddress && tokenXAmount !== 0n) ||
      (tokenY === wazeroAddress && tokenYAmount !== 0n)
    ) {
      const isTokenX = tokenX === wazeroAddress
      const azeroInputAmount = isTokenX ? tokenXAmount : tokenYAmount

      const slippageAmount = isTokenX ? xAmountWithSlippage : yAmountWithSlippage
      const azeroAmount =
        azeroBalance - POOL_SAFE_TRANSACTION_FEE > slippageAmount
          ? slippageAmount
          : azeroInputAmount

      const depositTx = wazero.depositTx(azeroAmount, WAZERO_DEPOSIT_OPTIONS)
      txs.push(depositTx)
    }

    const XTokenTx = psp22.approveTx(invAddress, xAmountWithSlippage, tokenX, PSP22_APPROVE_OPTIONS)
    txs.push(XTokenTx)

    const YTokenTx = psp22.approveTx(invAddress, yAmountWithSlippage, tokenY, PSP22_APPROVE_OPTIONS)
    txs.push(YTokenTx)

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

    if (
      (tokenX === wazeroAddress && tokenXAmount !== 0n) ||
      (tokenY === wazeroAddress && tokenYAmount !== 0n)
    ) {
      txs = [...txs, ...getWithdrawAllWAZEROTxs(invariant, psp22, invAddress, wazeroAddress)]
    }

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
        message: 'Position created.',
        variant: 'success',
        persist: false,
        txid: txResult.hash
      })
    )

    yield put(walletActions.getBalances([tokenX, tokenY]))

    const { length } = yield* select(positionsList)
    const position = yield* call([invariant, invariant.getPosition], walletAddress, length)
    yield* put(actions.addPosition(position))

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
          message: 'Failed to create position. Please try again.',
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
  const { poolKey, isXtoY, fetchTicksAndTickmap } = action.payload
  let allTickmaps = yield* select(tickMaps)
  let allTicks = yield* select(poolTicks)
  const allTokens = yield* select(tokens)
  const allPools = yield* select(poolsArraySortedByFees)

  const xDecimal = allTokens[poolKey.tokenX].decimals
  const yDecimal = allTokens[poolKey.tokenY].decimals

  try {
    if (!allTickmaps[poolKeyToString(poolKey)] || fetchTicksAndTickmap) {
      const fetchTicksAndTickMapsAction: PayloadAction<FetchTicksAndTickMaps> = {
        type: poolsActions.getTicksAndTickMaps.type,
        payload: {
          tokenFrom: allTokens[poolKey.tokenX].address,
          tokenTo: allTokens[poolKey.tokenY].address,
          allPools,
          poolKey
        }
      }

      const fetchTask = yield* fork(fetchTicksAndTickMaps, fetchTicksAndTickMapsAction)

      yield* join(fetchTask)
      allTickmaps = yield* select(tickMaps)
      allTicks = yield* select(poolTicks)
    }

    if (!allTickmaps[poolKeyToString(poolKey)]) {
      const data = createPlaceholderLiquidityPlot(
        action.payload.isXtoY,
        0,
        poolKey.feeTier.tickSpacing,
        xDecimal,
        yDecimal
      )
      yield* put(actions.setPlotTicks({ allPlotTicks: data, userPlotTicks: data }))
      return
    }

    if (!allTicks[poolKeyToString(poolKey)]) {
      const data = createPlaceholderLiquidityPlot(
        action.payload.isXtoY,
        0,
        poolKey.feeTier.tickSpacing,
        xDecimal,
        yDecimal
      )
      yield* put(actions.setPlotTicks({ allPlotTicks: data, userPlotTicks: data }))
      return
    }

    const allPlotTicks =
      allTicks[poolKeyToString(poolKey)].length === 0
        ? createPlaceholderLiquidityPlot(
            action.payload.isXtoY,
            0,
            poolKey.feeTier.tickSpacing,
            xDecimal,
            yDecimal
          )
        : createLiquidityPlot(
            [...allTicks[poolKeyToString(poolKey)]],
            poolKey.feeTier.tickSpacing,
            isXtoY,
            xDecimal,
            yDecimal
          )

    yield* put(actions.getRemainingPositions({ setLoaded: false }))

    const { list } = yield* select(positionsList)
    const userRawTicks = getLiquidityTicksByPositionsList(poolKey, list)

    const userPlotTicks =
      userRawTicks.length === 0
        ? createPlaceholderLiquidityPlot(
            action.payload.isXtoY,
            0,
            poolKey.feeTier.tickSpacing,
            xDecimal,
            yDecimal
          )
        : createLiquidityPlot(userRawTicks, poolKey.feeTier.tickSpacing, isXtoY, xDecimal, yDecimal)

    yield* put(actions.setPlotTicks({ allPlotTicks, userPlotTicks }))
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
    const adapter = yield* call(getAlephZeroWallet)
    const invAddress = yield* select(invariantAddress)
    const wazeroAddress = yield* select(wrappedAZEROAddress)

    const api = yield* getApi()
    const invariant = yield* getInvariant()
    const psp22 = yield* getPSP22()

    let txs = []

    const claimTx = invariant.claimFeeTx(index, INVARIANT_CLAIM_FEE_OPTIONS)
    txs.push(claimTx)

    if (addressTokenX === wazeroAddress || addressTokenY === wazeroAddress) {
      txs = [...txs, ...getWithdrawAllWAZEROTxs(invariant, psp22, invAddress, wazeroAddress)]
    }

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
        message: 'Fee claimed.',
        variant: 'success',
        persist: false,
        txid: txResult.hash
      })
    )

    yield put(actions.getSinglePosition(index))

    yield* call(fetchBalances, [addressTokenX === wazeroAddress ? addressTokenY : addressTokenX])
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

export function* handleGetSinglePosition(action: PayloadAction<bigint>) {
  try {
    const walletAddress = yield* select(address)
    const invariant = yield* getInvariant()
    const [position, pool, lowerTick, upperTick] = yield* call(
      [invariant, invariant.getPositionWithAssociates],
      walletAddress,
      action.payload
    )
    yield* put(
      actions.setSinglePosition({
        index: action.payload,
        position
      })
    )
    yield put(
      actions.setCurrentPositionTicks({
        lowerTick,
        upperTick
      })
    )
    yield* put(
      poolsActions.addPoolsForList({
        data: [{ poolKey: position.poolKey, ...pool }],
        listType: ListType.POSITIONS
      })
    )
  } catch (e) {
    console.log(e)
    yield* put(actions.setCurrentPositionTickLoading(false))
    yield* put(actions.setPositionsList([]))
  }
}

export function* handleClosePosition(action: PayloadAction<ClosePositionData>) {
  const { addressTokenX, addressTokenY, onSuccess, positionIndex } = action.payload

  const loaderKey = createLoaderKey()
  const loaderSigningTx = createLoaderKey()

  try {
    yield put(
      snackbarsActions.add({
        message: 'Closing position...',
        variant: 'pending',
        persist: true,
        key: loaderKey
      })
    )

    const walletAddress = yield* select(address)
    const adapter = yield* call(getAlephZeroWallet)
    const allPositions = yield* select(positionsList)
    const invAddress = yield* select(invariantAddress)
    const wazeroAddress = yield* select(wrappedAZEROAddress)

    const api = yield* getApi()
    const invariant = yield* getInvariant()
    const psp22 = yield* getPSP22()

    const getPositionsListPagePayload: PayloadAction<{ index: number; refresh: boolean }> = {
      type: actions.getPositionsListPage.type,
      payload: {
        index: Math.floor(Number(allPositions.length) / POSITIONS_PER_QUERY),
        refresh: false
      }
    }
    const fetchTask = yield* fork(handleGetPositionsListPage, getPositionsListPagePayload)
    yield* join(fetchTask)

    let txs = []

    const removePositionTx = invariant.removePositionTx(
      positionIndex,
      INVARIANT_REMOVE_POSITION_OPTIONS
    )
    txs.push(removePositionTx)

    if (addressTokenX === wazeroAddress || addressTokenY === wazeroAddress) {
      txs = [...txs, ...getWithdrawAllWAZEROTxs(invariant, psp22, invAddress, wazeroAddress)]
    }

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
        message: 'Position closed.',
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

export function* handleGetRemainingPositions(
  action: PayloadAction<{ setLoaded: boolean }>
): Generator {
  const walletAddress = yield* select(address)
  const { length, list, loadedPages } = yield* select(positionsList)

  if (!walletAddress) {
    return
  }

  try {
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
        isLoaded: action.payload.setLoaded
      })
    )
  } catch (error) {
    console.log(error)
    yield* put(actions.setPositionsList([]))
  }
}

export function* handleGetPositionsListPage(
  action: PayloadAction<{ index: number; refresh: boolean }>
) {
  const { index, refresh } = action.payload

  const walletAddress = yield* select(address)
  const { length, list, loadedPages } = yield* select(positionsList)

  try {
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

    const poolsWithTokensToFetch = []

    if (!length || refresh) {
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
      poolsWithTokensToFetch.push(...poolsWithPoolKeys)

      yield* put(actions.setPositionsListLength(positionsLength))
    }

    const allList = length ? [...list] : Array(Number(positionsLength)).fill(EMPTY_POSITION)

    const isPageLoaded = loadedPages[index]

    if (!isPageLoaded || refresh) {
      if (length && !refresh) {
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

        poolsWithTokensToFetch.push(...poolsWithPoolKeys)
      }

      yield* call(fetchTokens, poolsWithTokensToFetch)

      for (let i = 0; i < entries.length; i++) {
        allList[i + index * POSITIONS_PER_QUERY] = entries[i][0]
      }

      allList.splice(
        entries.length + index * POSITIONS_PER_QUERY,
        POSITIONS_PER_QUERY - entries.length
      )
    }

    yield* put(actions.setPositionsList(allList))
    yield* put(actions.setPositionsListLoadedStatus({ indexes: [index], isLoaded: true }))
  } catch (error) {
    console.log(error)
    yield* put(actions.setPositionsList([]))
    yield* put(actions.setPositionsListLoadedStatus({ indexes: [index], isLoaded: true }))
  }
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
