import { createSelector } from 'reselect'
import { IPositionsStore, positionsSliceName, PositionWithAddress } from '../reducers/positions'
import { AnyProps, keySelectors } from './helpers'
import { poolsArraySortedByFees } from './pools'
import { PoolWithPoolKey } from '@store/reducers/pools'
import { SwapToken, swapTokensDict } from './wallet'

const store = (s: AnyProps) => s[positionsSliceName] as IPositionsStore

export const { lastPage, positionsList, plotTicks, currentPositionRangeTicks, initPosition } =
  keySelectors(store, [
    'lastPage',
    'positionsList',
    'plotTicks',
    'currentPositionRangeTicks',
    'initPosition'
  ])

export const lastPageSelector = createSelector(lastPage, s => s)

export const isLoadingPositionsList = createSelector(positionsList, s => s.loading)

export interface PoolWithAddressAndIndex extends PoolWithPoolKey {
  poolIndex: number
}

export interface PositionWithPoolData extends PositionWithAddress {
  poolData: PoolWithAddressAndIndex
  tokenX: SwapToken
  tokenY: SwapToken
  positionIndex: number
}

// export const positionsWithPoolsData = createSelector(
//   poolsArraySortedByFees,
//   positionsList,
//   swapTokensDict,
//   (allPools, { list }, tokens) => {
//     const poolsByKey: Record<string, PoolWithAddressAndIndex> = {}
//     allPools.forEach((pool, index) => {
//       poolsByKey[pool.address.toString()] = {
//         ...pool,
//         poolIndex: index
//       }
//     })

//     //TODO check if this is correct
//     return list.map((position, index) => ({
//       ...position,
//       poolData: poolsByKey[position.toString()],
//       tokenX: tokens[poolsByKey[position.tokensOwedX.toString()].poolIndex.toString()],
//       tokenY: tokens[poolsByKey[position.tokensOwedY.toString()].poolIndex.toString()],
//       positionIndex: index
//     }))
//   }
// )

// export const singlePositionData = (id: string) =>
//   createSelector(positionsWithPoolsData, positions =>
//     // TODO check if this is correct
//     positions.find(
//       position => id === position.address.toString() + '_' + position.poolKey.toString()
//     )
//   )

export const positionsSelectors = {
  positionsList,
  plotTicks,
  currentPositionRangeTicks,
  initPosition
}

export default positionsSelectors
