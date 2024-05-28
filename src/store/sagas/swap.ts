import {
  Invariant,
  PSP22,
  QuoteResult,
  TESTNET_INVARIANT_ADDRESS,
  TESTNET_WAZERO_ADDRESS,
  WrappedAZERO,
  calculateSqrtPriceAfterSlippage,
  sendTx
} from '@invariant-labs/a0-sdk'
import { Signer } from '@polkadot/api/types'
import { PayloadAction } from '@reduxjs/toolkit'
import {
  DEFAULT_INVARIANT_OPTIONS,
  DEFAULT_PSP22_OPTIONS,
  DEFAULT_WAZERO_OPTIONS
} from '@store/consts/static'
import { createLoaderKey, findPairs, poolKeyToString } from '@store/consts/utils'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { Simulate, actions } from '@store/reducers/swap'
import { networkType } from '@store/selectors/connection'
import { pools, poolsArraySortedByFees, tokens } from '@store/selectors/pools'
import { simulateResult, swap } from '@store/selectors/swap'
import { address } from '@store/selectors/wallet'
import { getAlephZeroWallet } from '@utils/web3/wallet'
import { closeSnackbar } from 'notistack'
import { all, call, put, select, spawn, takeEvery } from 'typed-redux-saga'
import { getConnection } from './connection'

export function* handleSwap(): Generator {
  const loaderSwappingTokens = createLoaderKey()

  try {
    const allTokens = yield* select(tokens)
    const allPools = yield* select(pools)
    const { poolKey, tokenFrom, slippage, amountIn, byAmountIn } = yield* select(swap)

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

    const pool = allPools[poolKeyToString(poolKey)]
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

    const psp22 = yield* call(PSP22.load, api, network, DEFAULT_PSP22_OPTIONS)
    const invariant = yield* call(
      Invariant.load,
      api,
      network,
      TESTNET_INVARIANT_ADDRESS,
      DEFAULT_INVARIANT_OPTIONS
    )

    if (xToY) {
      const approveTx = psp22.approveTx(
        TESTNET_INVARIANT_ADDRESS,
        amountIn,
        tokenX.address.toString()
      )
      txs.push(approveTx)
    } else {
      const approveTx = psp22.approveTx(
        TESTNET_INVARIANT_ADDRESS,
        amountIn,
        tokenY.address.toString()
      )
      txs.push(approveTx)
    }

    const sqrtPriceLimit = calculateSqrtPriceAfterSlippage(pool.sqrtPrice, slippage, !xToY)
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
    const allPools = yield* select(pools)
    const { poolKey, tokenFrom, slippage, amountIn, byAmountIn } = yield* select(swap)

    if (!poolKey) {
      return
    }

    const api = yield* getConnection()
    const network = yield* select(networkType)
    const walletAddress = yield* select(address)
    const adapter = yield* call(getAlephZeroWallet)
    const swapSimulateResult = yield* select(simulateResult)

    const pool = allPools[poolKeyToString(poolKey)]
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
      WrappedAZERO.load,
      api,
      network,
      TESTNET_WAZERO_ADDRESS,
      DEFAULT_WAZERO_OPTIONS
    )
    const psp22 = yield* call(PSP22.load, api, network, DEFAULT_PSP22_OPTIONS)
    const invariant = yield* call(
      Invariant.load,
      api,
      network,
      TESTNET_INVARIANT_ADDRESS,
      DEFAULT_INVARIANT_OPTIONS
    )

    if (
      (xToY && poolKey.tokenX === TESTNET_WAZERO_ADDRESS) ||
      (!xToY && poolKey.tokenY === TESTNET_WAZERO_ADDRESS)
    ) {
      const depositTx = wazero.depositTx(amountIn)
      txs.push(depositTx)
    }

    if (xToY) {
      const approveTx = psp22.approveTx(
        TESTNET_INVARIANT_ADDRESS,
        amountIn,
        tokenX.address.toString()
      )
      txs.push(approveTx)
    } else {
      const approveTx = psp22.approveTx(
        TESTNET_INVARIANT_ADDRESS,
        amountIn,
        tokenY.address.toString()
      )
      txs.push(approveTx)
    }

    const sqrtPriceLimit = calculateSqrtPriceAfterSlippage(pool.sqrtPrice, slippage, !xToY)
    const swapTx = invariant.swapTx(poolKey, xToY, amountIn, byAmountIn, sqrtPriceLimit)
    txs.push(swapTx)

    if (
      (!xToY && poolKey.tokenX === TESTNET_WAZERO_ADDRESS) ||
      (xToY && poolKey.tokenY === TESTNET_WAZERO_ADDRESS)
    ) {
      const withdrawTx = wazero.withdrawTx(swapSimulateResult.amountOut)
      txs.push(withdrawTx)
    }

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

export function* handleGetSimulateResult(action: PayloadAction<Simulate>) {
  const connection = yield* getConnection()
  const network = yield* select(networkType)
  const allPools = yield* select(poolsArraySortedByFees)
  const allTokens = yield* select(tokens)

  const { fromToken, toToken, amount, byAmountIn } = action.payload

  if (amount === 0n) {
    return {
      amountOut: 0n,
      fee: 0n,
      priceImpact: 0
    }
  }

  const filteredPools = findPairs(fromToken.toString(), toToken.toString(), allPools)
  if (!filteredPools) {
    return {
      amountOut: 0n,
      fee: 0n,
      priceImpact: 0
    }
  }

  const invariant = yield* call(
    Invariant.load,
    connection,
    network,
    TESTNET_INVARIANT_ADDRESS,
    DEFAULT_INVARIANT_OPTIONS
  )
  let poolKey = null
  let amountOut = 0n
  let fee = 0n
  let priceImpact = 0
  let targetSqrtPrice = 0n

  const quotePromises: Promise<QuoteResult>[] = []
  for (const pool of filteredPools) {
    quotePromises.push(
      invariant.quote(pool.poolKey, pool.poolKey.tokenX === fromToken, amount, byAmountIn)
    )
  }

  const quoteResults = yield* call(() => Promise.allSettled(quotePromises))

  filteredPools.forEach((pool, index) => {
    const quoteResult = quoteResults[index]
    if (quoteResult.status === 'rejected') {
      return
    }

    const tokenX = allTokens[pool.poolKey.tokenX]
    const tokenY = allTokens[pool.poolKey.tokenY]
    if (!tokenX || !tokenY) {
      return
    }

    if (quoteResult.value.amountOut > amountOut) {
      poolKey = pool.poolKey

      amountOut = quoteResult.value.amountOut
      fee = pool.poolKey.feeTier.fee

      const parsedPoolSqrtPrice = Number(pool.sqrtPrice)
      const parsedTargetSqrtPrice = Number(quoteResult.value.targetSqrtPrice)
      priceImpact =
        parsedPoolSqrtPrice > parsedTargetSqrtPrice
          ? 1 - parsedTargetSqrtPrice / parsedPoolSqrtPrice
          : 1 - parsedPoolSqrtPrice / parsedTargetSqrtPrice

      targetSqrtPrice = quoteResult.value.targetSqrtPrice
    }
  })

  yield put(
    actions.setSimulateResult({
      poolKey,
      amountOut,
      fee,
      priceImpact,
      targetSqrtPrice
    })
  )
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
