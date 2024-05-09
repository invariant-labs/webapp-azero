import { createSelector } from '@reduxjs/toolkit'
import { IPoolsStore, poolsSliceName } from '../reducers/pools'
import { keySelectors, AnyProps } from './helpers'

const store = (s: AnyProps) => s[poolsSliceName] as IPoolsStore

export const {
  pools,
  tokens,
  poolTicks,
  isLoadingLatestPoolsForTransaction,
  tickMaps,
  volumeRanges,
  nearestPoolTicksForPair
} = keySelectors(store, [
  'pools',
  'tokens',
  'poolTicks',
  'isLoadingLatestPoolsForTransaction',
  'tickMaps',
  'volumeRanges',
  'nearestPoolTicksForPair'
])

export const poolsArraySortedByFees = createSelector(pools, allPools =>
  // TODO check if this is correct
  Object.values(allPools).sort((a, b) => Number(a.feeReceiver) - Number(b.feeReceiver))
)

export const hasTokens = createSelector(tokens, allTokens => !!Object.values(allTokens).length)

export const poolsSelectors = {
  pools,
  tokens,
  poolTicks,
  isLoadingLatestPoolsForTransaction,
  tickMaps,
  volumeRanges,
  nearestPoolTicksForPair
}

export default poolsSelectors
