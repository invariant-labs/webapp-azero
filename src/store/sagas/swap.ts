import {
  TESTNET_WAZERO_ADDRESS,
  calculatePriceImpact,
  calculateSqrtPriceAfterSlippage,
  sendTx,
  simulateInvariantSwap
} from '@invariant-labs/a0-sdk'
import { MIN_SQRT_PRICE } from '@invariant-labs/a0-sdk/src/consts'
import {
  MAX_SQRT_PRICE,
  PERCENTAGE_DENOMINATOR,
  PERCENTAGE_SCALE
} from '@invariant-labs/a0-sdk/target/consts'
import { Signer } from '@polkadot/api/types'
import { PayloadAction } from '@reduxjs/toolkit'
import { U128MAX } from '@store/consts/static'
import {
  calculateAmountInWithSlippage,
  createLoaderKey,
  deserializeTickmap,
  findPairs,
  poolKeyToString,
  printBigint
} from '@store/consts/utils'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { Simulate, actions } from '@store/reducers/swap'
import { actions as walletActions } from '@store/reducers/wallet'
import { invariantAddress, networkType } from '@store/selectors/connection'
import { poolTicks, pools, tickMaps, tokens } from '@store/selectors/pools'
import { simulateResult, swap } from '@store/selectors/swap'
import { address, balance } from '@store/selectors/wallet'
import invariantSingleton from '@store/services/invariantSingleton'
import psp22Singleton from '@store/services/psp22Singleton'
import wrappedAZEROSingleton from '@store/services/wrappedAZEROSingleton'
import { getAlephZeroWallet } from '@utils/web3/wallet'
import { closeSnackbar } from 'notistack'
import { all, call, put, select, spawn, takeEvery } from 'typed-redux-saga'
import { getConnection } from './connection'

export function* handleSwap(): Generator {
  const loaderSwappingTokens = createLoaderKey()

  try {
    const allTokens = yield* select(tokens)
    const { poolKey, tokenFrom, slippage, amountIn, byAmountIn, estimatedPriceAfterSwap } =
      yield* select(swap)

    if (!poolKey) {
      return
    }

    if (poolKey.tokenX === TESTNET_WAZERO_ADDRESS || poolKey.tokenY === TESTNET_WAZERO_ADDRESS) {
      return yield* call(handleSwapWithAZERO)
    }

    const api = yield* getConnection()
    const network = yield* select(networkType)
    const walletAddress = yield* select(address)
    const adapter = yield* call(getAlephZeroWallet)
    const invAddress = yield* select(invariantAddress)

    const tokenX = allTokens[poolKey.tokenX]
    const tokenY = allTokens[poolKey.tokenY]
    const xToY = tokenFrom.toString() === poolKey.tokenX

    yield put(
      snackbarsActions.add({
        message: 'Swapping tokens',
        variant: 'pending',
        persist: true,
        key: loaderSwappingTokens
      })
    )

    const txs = []

    const psp22 = yield* call([psp22Singleton, psp22Singleton.loadInstance], api, network)
    const invariant = yield* call(
      [invariantSingleton, invariantSingleton.loadInstance],
      api,
      network,
      invAddress
    )
    const sqrtPriceLimit = calculateSqrtPriceAfterSlippage(estimatedPriceAfterSwap, slippage, !xToY)

    let calculatedAmountIn = amountIn
    if (byAmountIn) {
      calculatedAmountIn = calculateAmountInWithSlippage(amountIn, sqrtPriceLimit, !xToY)
    }

    if (xToY) {
      const approveTx = psp22.approveTx(invAddress, calculatedAmountIn, tokenX.address.toString())
      txs.push(approveTx)
    } else {
      const approveTx = psp22.approveTx(invAddress, calculatedAmountIn, tokenY.address.toString())
      txs.push(approveTx)
    }

    const swapTx = invariant.swapTx(poolKey, xToY, amountIn, byAmountIn, sqrtPriceLimit)
    txs.push(swapTx)

    const batchedTx = api.tx.utility.batchAll(txs)
    const signedBatchedTx = yield* call([batchedTx, batchedTx.signAsync], walletAddress, {
      signer: adapter.signer as Signer
    })
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

    const tokenXBalance = yield* call(
      [psp22, psp22.balanceOf],
      walletAddress,
      tokenX.address.toString()
    )
    const tokenYBalance = yield* call(
      [psp22, psp22.balanceOf],
      walletAddress,
      tokenY.address.toString()
    )
    yield* put(
      walletActions.addTokenBalances([
        { address: tokenX.address.toString(), balance: tokenXBalance },
        { address: tokenY.address.toString(), balance: tokenYBalance }
      ])
    )

    yield put(actions.setSwapSuccess(true))
  } catch (error) {
    console.log(error)

    yield put(actions.setSwapSuccess(false))

    closeSnackbar(loaderSwappingTokens)
    yield put(snackbarsActions.remove(loaderSwappingTokens))

    yield put(
      snackbarsActions.add({
        message: 'Tokens swapping failed. Please try again.',
        variant: 'error',
        persist: false
      })
    )
  }
}

export function* handleSwapWithAZERO(): Generator {
  const loaderSwappingTokens = createLoaderKey()

  try {
    const allTokens = yield* select(tokens)
    const { poolKey, tokenFrom, slippage, amountIn, byAmountIn, estimatedPriceAfterSwap } =
      yield* select(swap)

    if (!poolKey) {
      return
    }

    const api = yield* getConnection()
    const network = yield* select(networkType)
    const walletAddress = yield* select(address)
    const adapter = yield* call(getAlephZeroWallet)
    const swapSimulateResult = yield* select(simulateResult)
    const invAddress = yield* select(invariantAddress)

    const tokenX = allTokens[poolKey.tokenX]
    const tokenY = allTokens[poolKey.tokenY]
    const xToY = tokenFrom.toString() === poolKey.tokenX

    yield put(
      snackbarsActions.add({
        message: 'Swapping tokens',
        variant: 'pending',
        persist: true,
        key: loaderSwappingTokens
      })
    )

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
    let calculatedAmountIn = amountIn
    if (byAmountIn) {
      calculatedAmountIn = calculateAmountInWithSlippage(amountIn, sqrtPriceLimit, !xToY)
    }

    if (
      (xToY && poolKey.tokenX === TESTNET_WAZERO_ADDRESS) ||
      (!xToY && poolKey.tokenY === TESTNET_WAZERO_ADDRESS)
    ) {
      const azeroBalance = yield* select(balance)
      const azeroAmountInWithSlippage =
        azeroBalance > calculatedAmountIn ? calculatedAmountIn : azeroBalance
      const depositTx = wazero.depositTx(byAmountIn ? amountIn : azeroAmountInWithSlippage)
      txs.push(depositTx)
    }

    if (xToY) {
      const approveTx = psp22.approveTx(invAddress, calculatedAmountIn, tokenX.address.toString())
      txs.push(approveTx)
    } else {
      const approveTx = psp22.approveTx(invAddress, calculatedAmountIn, tokenY.address.toString())
      txs.push(approveTx)
    }

    const swapTx = invariant.swapTx(poolKey, xToY, amountIn, byAmountIn, sqrtPriceLimit)
    txs.push(swapTx)

    if (
      (!xToY && poolKey.tokenX === TESTNET_WAZERO_ADDRESS) ||
      (xToY && poolKey.tokenY === TESTNET_WAZERO_ADDRESS)
    ) {
      const withdrawTx = wazero.withdrawTx(swapSimulateResult.amountOut)
      txs.push(withdrawTx)
    }

    const approveTx = psp22.approveTx(invAddress, U128MAX, TESTNET_WAZERO_ADDRESS)
    txs.push(approveTx)

    const unwrapTx = invariant.withdrawAllWAZEROTx(TESTNET_WAZERO_ADDRESS)
    txs.push(unwrapTx)

    const batchedTx = api.tx.utility.batchAll(txs)
    const signedBatchedTx = yield* call([batchedTx, batchedTx.signAsync], walletAddress, {
      signer: adapter.signer as Signer
    })
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

    const tokenXBalance = yield* call(
      [psp22, psp22.balanceOf],
      walletAddress,
      tokenX.address.toString()
    )
    const tokenYBalance = yield* call(
      [psp22, psp22.balanceOf],
      walletAddress,
      tokenY.address.toString()
    )
    yield* put(
      walletActions.addTokenBalances([
        { address: tokenX.address.toString(), balance: tokenXBalance },
        { address: tokenY.address.toString(), balance: tokenYBalance }
      ])
    )

    yield put(actions.setSwapSuccess(true))
  } catch (error) {
    console.log(error)

    yield put(actions.setSwapSuccess(false))

    closeSnackbar(loaderSwappingTokens)
    yield put(snackbarsActions.remove(loaderSwappingTokens))

    yield put(
      snackbarsActions.add({
        message: 'Tokens swapping failed. Please try again.',
        variant: 'error',
        persist: false
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
          errors: [SwapError.NoRouteFound]
        })
      )
      return
    }

    let poolKey = null
    let amountOut = 0n
    let priceImpact = 0
    let targetSqrtPrice = 0n
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
          byAmountIn
            ? amount - (amount * pool.poolKey.feeTier.fee) / PERCENTAGE_DENOMINATOR
            : amount,
          byAmountIn,
          xToY ? MIN_SQRT_PRICE : MAX_SQRT_PRICE
        )

        console.log(result)

        if (result.globalInsufficientLiquidity) {
          errors.push(SwapError.InsufficientLiquidity)
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

        const calculatedAmountOut = byAmountIn ? result.amountOut : result.amountOut + result.fee

        if (calculatedAmountOut === 0n) {
          errors.push(SwapError.AmountIsZero)
          continue
        }

        if (calculatedAmountOut > amountOut) {
          amountOut = calculatedAmountOut
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
        amountOut,
        priceImpact,
        targetSqrtPrice,
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
