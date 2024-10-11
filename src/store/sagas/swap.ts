import {
  calculatePriceImpact,
  calculateSqrtPriceAfterSlippage,
  sendTx,
  simulateInvariantSwap
} from '@invariant-labs/a0-sdk'
import {
  MAX_SQRT_PRICE,
  MIN_SQRT_PRICE,
  PERCENTAGE_SCALE
} from '@invariant-labs/a0-sdk/target/consts'
import { Signer } from '@polkadot/api/types'
import { PayloadAction } from '@reduxjs/toolkit'
import {
  ErrorMessage,
  INVARIANT_SWAP_OPTIONS,
  PSP22_APPROVE_OPTIONS,
  SWAP_SAFE_TRANSACTION_FEE,
  MAX,
  WAZERO_DEPOSIT_OPTIONS,
  WAZERO_WITHDRAW_OPTIONS
} from '@store/consts/static'
import {
  calculateAmountInWithSlippage,
  createLoaderKey,
  deserializeTickmap,
  ensureError,
  findPairs,
  isErrorMessage,
  poolKeyToString,
  printBigint
} from '@utils/utils'
import { actions as poolActions } from '@store/reducers/pools'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { actions as positionsActions } from '@store/reducers/positions'
import { Simulate, Swap, actions } from '@store/reducers/swap'
import { invariantAddress, wrappedAZEROAddress } from '@store/selectors/connection'
import { poolTicks, pools, tickMaps, tokens } from '@store/selectors/pools'
import { address, balance } from '@store/selectors/wallet'
import { getAlephZeroWallet } from '@utils/web3/wallet'
import { closeSnackbar } from 'notistack'
import { all, call, put, select, spawn, takeEvery } from 'typed-redux-saga'
import { fetchBalances } from './wallet'
import { SubmittableExtrinsic } from '@polkadot/api/promise/types'
import { getApi, getInvariant, getPSP22, getWrappedAZERO } from './connection'
import { getWithdrawAllWAZEROTxs } from './positions'

export function* handleSwap(action: PayloadAction<Omit<Swap, 'txid'>>): Generator {
  const {
    poolKey,
    tokenFrom,
    slippage,
    amountIn,
    amountOut,
    byAmountIn,
    estimatedPriceAfterSwap,
    tokenTo
  } = action.payload

  if (!poolKey) {
    return
  }

  const loaderSwappingTokens = createLoaderKey()
  const loaderSigningTx = createLoaderKey()

  try {
    yield put(
      snackbarsActions.add({
        message: 'Exchanging tokens...',
        variant: 'pending',
        persist: true,
        key: loaderSwappingTokens
      })
    )

    const walletAddress = yield* select(address)
    const adapter = yield* call(getAlephZeroWallet)
    const allTokens = yield* select(tokens)
    const invAddress = yield* select(invariantAddress)
    const wazeroAddress = yield* select(wrappedAZEROAddress)

    const api = yield* getApi()
    const invariant = yield* getInvariant()
    const psp22 = yield* getPSP22()
    const wazero = yield* getWrappedAZERO()

    const tokenX = allTokens[poolKey.tokenX]
    const tokenY = allTokens[poolKey.tokenY]
    const xToY = tokenFrom.toString() === poolKey.tokenX

    let txs = []

    const sqrtPriceLimit = calculateSqrtPriceAfterSlippage(estimatedPriceAfterSwap, slippage, !xToY)
    const calculatedAmountIn = slippage
      ? calculateAmountInWithSlippage(amountOut, sqrtPriceLimit, xToY, poolKey.feeTier.fee)
      : amountIn

    if ((xToY && poolKey.tokenX === wazeroAddress) || (!xToY && poolKey.tokenY === wazeroAddress)) {
      const azeroBalance = yield* select(balance)
      const azeroAmountInWithSlippage =
        azeroBalance - SWAP_SAFE_TRANSACTION_FEE > calculatedAmountIn
          ? calculatedAmountIn
          : amountIn

      const depositTx = wazero.depositTx(azeroAmountInWithSlippage, WAZERO_DEPOSIT_OPTIONS)
      txs.push(depositTx)
    }

    const tokenAddress = xToY ? tokenX.address.toString() : tokenY.address.toString()
    const approveTx = psp22.approveTx(
      invAddress,
      calculatedAmountIn,
      tokenAddress,
      PSP22_APPROVE_OPTIONS
    )
    txs.push(approveTx)

    const swapTx = invariant.swapWithSlippageTx(
      poolKey,
      xToY,
      byAmountIn ? amountIn : amountOut,
      byAmountIn,
      estimatedPriceAfterSwap,
      slippage,
      INVARIANT_SWAP_OPTIONS
    )
    txs.push(swapTx)

    if ((!xToY && poolKey.tokenX === wazeroAddress) || (xToY && poolKey.tokenY === wazeroAddress)) {
      const withdrawTx = wazero.withdrawTx(amountOut, WAZERO_WITHDRAW_OPTIONS)
      txs.push(withdrawTx)
    }

    if (poolKey.tokenX === wazeroAddress || poolKey.tokenX === wazeroAddress) {
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

    closeSnackbar(loaderSwappingTokens)
    yield put(snackbarsActions.remove(loaderSwappingTokens))

    yield put(
      snackbarsActions.add({
        message: 'Tokens exchanged.',
        variant: 'success',
        persist: false,
        txid: txResult.hash
      })
    )

    yield* call(fetchBalances, [poolKey.tokenX, poolKey.tokenY])

    yield put(actions.setSwapSuccess(true))

    yield put(
      poolActions.getAllPoolsForPairData({
        first: tokenFrom,
        second: tokenTo
      })
    )

    yield put(
      positionsActions.getCurrentPlotTicks({
        poolKey,
        isXtoY: xToY
      })
    )
  } catch (e: unknown) {
    const error = ensureError(e)
    console.log(error)

    yield put(actions.setSwapSuccess(false))

    closeSnackbar(loaderSwappingTokens)
    yield put(snackbarsActions.remove(loaderSwappingTokens))
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
          message: 'Tokens exchange failed. Please try again.',
          variant: 'error',
          persist: false
        })
      )
    }

    yield put(
      poolActions.getAllPoolsForPairData({
        first: tokenFrom,
        second: tokenTo
      })
    )
  }
}

export enum SwapError {
  InsufficientLiquidity,
  AmountIsZero,
  NoRouteFound,
  MaxSwapStepsReached,
  StateOutdated,
  Unknown
}

export function* handleGetSimulateResult(action: PayloadAction<Simulate>) {
  try {
    const allPools = yield* select(pools)
    const allTickmaps = yield* select(tickMaps)
    const allTicks = yield* select(poolTicks)

    const { fromToken, toToken, amount, byAmountIn } = action.payload

    if (amount === 0n) {
      yield put(
        actions.setSimulateResult({
          poolKey: null,
          amountOut: 0n,
          priceImpact: 0,
          targetSqrtPrice: 0n,
          fee: 0n,
          errors: [SwapError.AmountIsZero]
        })
      )
      return
    }

    const filteredPools = findPairs(
      fromToken.toString(),
      toToken.toString(),
      Object.values(allPools)
    )
    if (!filteredPools) {
      yield put(
        actions.setSimulateResult({
          poolKey: null,
          amountOut: 0n,
          priceImpact: 0,
          targetSqrtPrice: 0n,
          fee: 0n,
          errors: [SwapError.NoRouteFound]
        })
      )
      return
    }

    let poolKey = null
    let amountOut = byAmountIn ? 0n : MAX
    let insufficientLiquidityAmountOut = 0n
    let priceImpact = 0
    let targetSqrtPrice = 0n
    let fee = 0n

    let swapPossible = false

    const errors = []

    for (const pool of filteredPools) {
      const xToY = fromToken.toString() === pool.poolKey.tokenX

      try {
        const result = simulateInvariantSwap(
          deserializeTickmap(allTickmaps[poolKeyToString(pool.poolKey)]),
          pool.poolKey.feeTier,
          allPools[poolKeyToString(pool.poolKey)],
          allTicks[poolKeyToString(pool.poolKey)],
          xToY,
          amount,
          byAmountIn,
          xToY ? MIN_SQRT_PRICE : MAX_SQRT_PRICE
        )

        if (result.maxSwapStepsReached || result.globalInsufficientLiquidity) {
          if (
            byAmountIn
              ? result.amountOut > insufficientLiquidityAmountOut
              : result.amountIn > insufficientLiquidityAmountOut
          ) {
            insufficientLiquidityAmountOut = byAmountIn ? result.amountOut : result.amountIn
            fee = pool.poolKey.feeTier.fee
            errors.push(SwapError.MaxSwapStepsReached)
          }

          continue
        }

        if (result.stateOutdated) {
          errors.push(SwapError.StateOutdated)
          continue
        }

        if (result.amountOut === 0n) {
          errors.push(SwapError.AmountIsZero)
          continue
        }

        if (byAmountIn ? result.amountOut > amountOut : result.amountIn < amountOut) {
          swapPossible = true
          amountOut = byAmountIn ? result.amountOut : result.amountIn
          poolKey = pool.poolKey
          priceImpact = +printBigint(
            calculatePriceImpact(pool.sqrtPrice, result.targetSqrtPrice),
            PERCENTAGE_SCALE
          )
          targetSqrtPrice = result.targetSqrtPrice
        }
      } catch (e) {
        console.log(e)
        errors.push(SwapError.Unknown)
      }
    }

    const validatedAmountOut = swapPossible ? amountOut : insufficientLiquidityAmountOut

    yield put(
      actions.setSimulateResult({
        poolKey: swapPossible ? poolKey : null,
        amountOut: validatedAmountOut,
        priceImpact: swapPossible ? priceImpact : 1,
        targetSqrtPrice,
        fee,
        errors
      })
    )
  } catch (error) {
    console.log(error)
  }
}

export function* swapHandler(): Generator {
  yield* takeEvery(actions.swap, handleSwap)
}

export function* getSimulateResultHandler(): Generator {
  yield* takeEvery(actions.getSimulateResult, handleGetSimulateResult)
}

export function* swapSaga(): Generator {
  yield all([swapHandler, getSimulateResultHandler].map(spawn))
}
