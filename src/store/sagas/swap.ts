import {
  TESTNET_WAZERO_ADDRESS,
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
  INVARIANT_WITHDRAW_ALL_WAZERO,
  PSP22_APPROVE_OPTIONS,
  U128MAX,
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
import { Simulate, Swap, actions } from '@store/reducers/swap'
import { invariantAddress, networkType } from '@store/selectors/connection'
import { poolTicks, pools, tickMaps, tokens } from '@store/selectors/pools'
import { simulateResult } from '@store/selectors/swap'
import { address, balance } from '@store/selectors/wallet'
import invariantSingleton from '@store/services/invariantSingleton'
import psp22Singleton from '@store/services/psp22Singleton'
import wrappedAZEROSingleton from '@store/services/wrappedAZEROSingleton'
import { getAlephZeroWallet } from '@utils/web3/wallet'
import { closeSnackbar } from 'notistack'
import { all, call, put, select, spawn, takeEvery } from 'typed-redux-saga'
import { getConnection } from './connection'
import { fetchBalances } from './wallet'
import { SubmittableExtrinsic } from '@polkadot/api/promise/types'

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

  if (poolKey.tokenX === TESTNET_WAZERO_ADDRESS || poolKey.tokenY === TESTNET_WAZERO_ADDRESS) {
    return yield* call(handleSwapWithAZERO, action)
  }

  const loaderSwappingTokens = createLoaderKey()
  const loaderSigningTx = createLoaderKey()

  try {
    const allTokens = yield* select(tokens)

    yield put(
      snackbarsActions.add({
        message: 'Swapping tokens...',
        variant: 'pending',
        persist: true,
        key: loaderSwappingTokens
      })
    )

    const api = yield* getConnection()
    const network = yield* select(networkType)
    const walletAddress = yield* select(address)
    const adapter = yield* call(getAlephZeroWallet)
    const invAddress = yield* select(invariantAddress)

    const tokenX = allTokens[poolKey.tokenX]
    const tokenY = allTokens[poolKey.tokenY]
    const xToY = tokenFrom.toString() === poolKey.tokenX

    const txs = []

    const psp22 = yield* call([psp22Singleton, psp22Singleton.loadInstance], api, network)
    const invariant = yield* call(
      [invariantSingleton, invariantSingleton.loadInstance],
      api,
      network,
      invAddress
    )
    const sqrtPriceLimit = calculateSqrtPriceAfterSlippage(estimatedPriceAfterSwap, slippage, !xToY)
    const calculatedAmountIn = slippage
      ? calculateAmountInWithSlippage(amountOut, sqrtPriceLimit, xToY, poolKey.feeTier.fee)
      : amountIn

    if (xToY) {
      const approveTx = psp22.approveTx(
        invAddress,
        calculatedAmountIn,
        tokenX.address.toString(),
        PSP22_APPROVE_OPTIONS
      )
      txs.push(approveTx)
    } else {
      const approveTx = psp22.approveTx(
        invAddress,
        calculatedAmountIn,
        tokenY.address.toString(),
        PSP22_APPROVE_OPTIONS
      )
      txs.push(approveTx)
    }

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
        message: 'Tokens swapped successfully.',
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
          message: 'Tokens swapping failed. Please try again.',
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

export function* handleSwapWithAZERO(action: PayloadAction<Omit<Swap, 'txid'>>): Generator {
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
    const allTokens = yield* select(tokens)

    yield put(
      snackbarsActions.add({
        message: 'Swapping tokens...',
        variant: 'pending',
        persist: true,
        key: loaderSwappingTokens
      })
    )

    const api = yield* getConnection()
    const network = yield* select(networkType)
    const walletAddress = yield* select(address)
    const adapter = yield* call(getAlephZeroWallet)
    const swapSimulateResult = yield* select(simulateResult)
    const invAddress = yield* select(invariantAddress)

    const tokenX = allTokens[poolKey.tokenX]
    const tokenY = allTokens[poolKey.tokenY]
    const xToY = tokenFrom.toString() === poolKey.tokenX

    const txs = []

    const wazero = yield* call(
      [wrappedAZEROSingleton, wrappedAZEROSingleton.loadInstance],
      api,
      network
    )
    const psp22 = yield* call([psp22Singleton, psp22Singleton.loadInstance], api, network)
    const invariant = yield* call(
      [invariantSingleton, invariantSingleton.loadInstance],
      api,
      network,
      invAddress
    )
    const sqrtPriceLimit = calculateSqrtPriceAfterSlippage(estimatedPriceAfterSwap, slippage, !xToY)
    const calculatedAmountIn = slippage
      ? calculateAmountInWithSlippage(amountOut, sqrtPriceLimit, xToY, poolKey.feeTier.fee)
      : amountIn

    if (
      (xToY && poolKey.tokenX === TESTNET_WAZERO_ADDRESS) ||
      (!xToY && poolKey.tokenY === TESTNET_WAZERO_ADDRESS)
    ) {
      const azeroBalance = yield* select(balance)
      const azeroAmountInWithSlippage =
        azeroBalance > calculatedAmountIn ? calculatedAmountIn : azeroBalance
      const depositTx = wazero.depositTx(azeroAmountInWithSlippage, WAZERO_DEPOSIT_OPTIONS)
      txs.push(depositTx)
    }

    if (xToY) {
      const approveTx = psp22.approveTx(
        invAddress,
        calculatedAmountIn,
        tokenX.address.toString(),
        PSP22_APPROVE_OPTIONS
      )
      txs.push(approveTx)
    } else {
      const approveTx = psp22.approveTx(
        invAddress,
        calculatedAmountIn,
        tokenY.address.toString(),
        PSP22_APPROVE_OPTIONS
      )
      txs.push(approveTx)
    }

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

    if (
      (!xToY && poolKey.tokenX === TESTNET_WAZERO_ADDRESS) ||
      (xToY && poolKey.tokenY === TESTNET_WAZERO_ADDRESS)
    ) {
      const withdrawTx = wazero.withdrawTx(swapSimulateResult.amountOut, WAZERO_WITHDRAW_OPTIONS)
      txs.push(withdrawTx)
    }

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
        message: 'Tokens swapped successfully.',
        variant: 'success',
        persist: false,
        txid: txResult.hash
      })
    )

    yield* call(fetchBalances, [
      poolKey.tokenX === TESTNET_WAZERO_ADDRESS ? poolKey.tokenY : poolKey.tokenX
    ])

    yield put(actions.setSwapSuccess(true))

    yield put(
      poolActions.getAllPoolsForPairData({
        first: tokenFrom,
        second: tokenTo
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
          message: 'Tokens swapping failed. Please try again.',
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
  MaxTicksCrossed,
  StateOutdated
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
    let amountOut = byAmountIn ? 0n : U128MAX
    let insufficientLiquidityAmountOut = byAmountIn ? 0n : U128MAX
    let priceImpact = 0
    let targetSqrtPrice = 0n
    let fee = 0n
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

        if (result.globalInsufficientLiquidity) {
          if (
            byAmountIn
              ? result.amountOut > insufficientLiquidityAmountOut
              : result.amountIn < insufficientLiquidityAmountOut
          ) {
            insufficientLiquidityAmountOut = byAmountIn ? result.amountOut : result.amountIn
            fee = pool.poolKey.feeTier.fee
            errors.push(SwapError.InsufficientLiquidity)
          }
          continue
        }

        if (result.maxTicksCrossed) {
          errors.push(SwapError.MaxTicksCrossed)
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
      }
    }

    yield put(
      actions.setSimulateResult({
        poolKey,
        amountOut: amountOut ? amountOut : insufficientLiquidityAmountOut,
        priceImpact,
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
