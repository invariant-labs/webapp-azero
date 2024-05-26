import { Invariant, QuoteResult, TESTNET_INVARIANT_ADDRESS } from '@invariant-labs/a0-sdk'
import { PayloadAction } from '@reduxjs/toolkit'
import { DEFAULT_CONTRACT_OPTIONS } from '@store/consts/static'
import { findPairs } from '@store/consts/utils'
import { Simulate, actions } from '@store/reducers/swap'
import { networkType } from '@store/selectors/connection'
import { poolsArraySortedByFees, tokens } from '@store/selectors/pools'
import { all, call, put, select, spawn, takeEvery } from 'typed-redux-saga'
import { getConnection } from './connection'

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
    DEFAULT_CONTRACT_OPTIONS
  )
  let amountOut = 0n
  let fee = 0n
  let priceImpact = 0

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
      amountOut = quoteResult.value.amountOut
      fee = pool.poolKey.feeTier.fee

      const parsedPoolSqrtPrice = Number(pool.sqrtPrice)
      const parsedTargetSqrtPrice = Number(quoteResult.value.targetSqrtPrice)
      priceImpact =
        parsedPoolSqrtPrice > parsedTargetSqrtPrice
          ? 1 - parsedTargetSqrtPrice / parsedPoolSqrtPrice
          : 1 - parsedPoolSqrtPrice / parsedTargetSqrtPrice
    }
  })

  yield put(
    actions.setSimulateResult({
      amountOut,
      fee,
      priceImpact
    })
  )
}

export function* getSimulateResultHandler(): Generator {
  yield* takeEvery(actions.getSimulateResult, handleGetSimulateResult)
}

export function* swapSaga(): Generator {
  yield all([getSimulateResultHandler].map(spawn))
}
