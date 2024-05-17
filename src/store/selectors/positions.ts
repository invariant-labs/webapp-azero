import { Position } from '@invariant-labs/a0-sdk'
import { Token } from '@store/consts/static'
import { poolKeyToString } from '@store/consts/utils'
import { PoolWithPoolKey } from '@store/reducers/pools'
import { createSelector } from 'reselect'
import { IPositionsStore, positionsSliceName } from '../reducers/positions'
import { AnyProps, keySelectors } from './helpers'
import { poolsArraySortedByFees, tokens } from './pools'

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

export interface PoolWithPoolKeyAndIndex extends PoolWithPoolKey {
  poolIndex: number
}

export interface PositionWithPoolData extends Position {
  poolData: PoolWithPoolKeyAndIndex
  tokenX: Token
  tokenY: Token
  positionIndex: number
}

export const positionsWithPoolsData = createSelector(
  poolsArraySortedByFees,
  positionsList,
  tokens,
  (allPools, { list }, tokens) => {
    const poolsByKey: Record<string, PoolWithPoolKeyAndIndex> = {}
    allPools.forEach((pool, index) => {
      poolsByKey[poolKeyToString(pool.poolKey)] = {
        ...pool,
        poolIndex: index
      }
    })

    return list.map((position, index) => ({
      ...position,
      poolData: poolsByKey[poolKeyToString(position.poolKey)],
      tokenX: tokens[position.poolKey.tokenX],
      tokenY: tokens[position.poolKey.tokenY],
      positionIndex: index
    }))
  }
)

export const singlePositionData = (id: number) =>
  createSelector(positionsWithPoolsData, positions =>
    positions.find(position => id === position.positionIndex)
  )

export const positionsSelectors = {
  positionsList,
  plotTicks,
  currentPositionRangeTicks,
  initPosition
}

export default positionsSelectors
