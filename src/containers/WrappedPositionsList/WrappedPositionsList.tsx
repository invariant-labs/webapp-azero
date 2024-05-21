import { PositionsList } from '@components/PositionsList/PositionsList'
import { calculateSqrtPrice, getLiquidityByX, getLiquidityByY } from '@invariant-labs/a0-sdk'
import { PERCENTAGE_SCALE } from '@invariant-labs/a0-sdk/src/consts'
import { POSITIONS_PER_PAGE } from '@store/consts/static'
import { calcYPerXPrice, printBigint, stringifyPoolKey } from '@store/consts/utils'
import { actions } from '@store/reducers/positions'
import { Status } from '@store/reducers/wallet'
import { pools, tokens } from '@store/selectors/pools'
import { isLoadingPositionsList, lastPageSelector, positionsList } from '@store/selectors/positions'
import { status } from '@store/selectors/wallet'
import { openWalletSelectorModal } from '@utils/web3/selector'

import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

export const WrappedPositionsList: React.FC = () => {
  const { list } = useSelector(positionsList)
  const isLoading = useSelector(isLoadingPositionsList)
  const lastPage = useSelector(lastPageSelector)
  const walletStatus = useSelector(status)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const allTokens = useSelector(tokens)
  const allPools = useSelector(pools)

  const [value, setValue] = useState<string>('')

  const handleSearchValue = (value: string) => {
    setValue(value)
  }

  const setLastPage = (page: number) => {
    dispatch(actions.setLastPage(page))
  }

  useEffect(() => {
    if (list.length === 0) {
      setLastPage(1)
    }

    if (lastPage > Math.ceil(list.length / POSITIONS_PER_PAGE)) {
      setLastPage(lastPage - 1)
    }
  }, [list])

  const handleRefresh = () => {
    dispatch(actions.getPositionsList())
  }

  const data = list
    .map(position => {
      const pool = allPools[stringifyPoolKey(position.poolKey)]
      const tokenX = allTokens[position.poolKey.tokenX]
      const tokenY = allTokens[position.poolKey.tokenY]

      const lowerPrice = Number(
        calcYPerXPrice(
          calculateSqrtPrice(position.lowerTickIndex),
          allTokens[position.poolKey.tokenX].decimals,
          allTokens[position.poolKey.tokenY].decimals
        )
      )
      const upperPrice = Number(
        calcYPerXPrice(
          calculateSqrtPrice(position.upperTickIndex),
          allTokens[position.poolKey.tokenX].decimals,
          allTokens[position.poolKey.tokenY].decimals
        )
      )

      const min = Math.min(lowerPrice, upperPrice)
      const max = Math.max(lowerPrice, upperPrice)

      let tokenXLiq, tokenYLiq

      try {
        tokenXLiq = +printBigint(
          getLiquidityByX(
            position.liquidity,
            position.lowerTickIndex,
            position.upperTickIndex,
            pool.sqrtPrice,
            true
          ).amount,
          allTokens[position.poolKey.tokenX].decimals
        )
      } catch (error) {
        tokenXLiq = 0
      }

      try {
        tokenYLiq = +printBigint(
          getLiquidityByY(
            position.liquidity,
            position.lowerTickIndex,
            position.upperTickIndex,
            pool.sqrtPrice,
            true
          ).amount,
          allTokens[position.poolKey.tokenY].decimals
        )
      } catch (error) {
        tokenYLiq = 0
      }

      const currentPrice = calcYPerXPrice(
        pool?.sqrtPrice ?? 0n,
        allTokens[position.poolKey.tokenX].decimals,
        allTokens[position.poolKey.tokenY].decimals
      )

      const valueX = tokenXLiq + tokenYLiq / currentPrice
      const valueY = tokenYLiq + tokenXLiq * currentPrice

      return {
        tokenXName: tokenX.symbol,
        tokenYName: tokenY.symbol,
        tokenXIcon: tokenX.logoURI,
        tokenYIcon: tokenY.logoURI,
        fee: +printBigint(position.poolKey.feeTier.fee, PERCENTAGE_SCALE - 2n),
        min,
        max,
        tokenXLiq,
        tokenYLiq,
        valueX,
        valueY,
        id: stringifyPoolKey(position.poolKey),
        isActive: currentPrice >= min && currentPrice <= max
      }
    })
    .filter(item => {
      return (
        item.tokenXName.toLowerCase().includes(value) ||
        item.tokenYName.toLowerCase().includes(value)
      )
    })

  return (
    <PositionsList
      initialPage={lastPage}
      setLastPage={setLastPage}
      searchValue={value}
      searchSetValue={handleSearchValue}
      handleRefresh={handleRefresh}
      onAddPositionClick={() => {
        navigate('/newPosition')
      }}
      data={data}
      loading={isLoading}
      showNoConnected={walletStatus !== Status.Initialized}
      itemsPerPage={POSITIONS_PER_PAGE}
      noConnectedBlockerProps={{
        onConnect: openWalletSelectorModal,
        descCustomText: 'You have no positions.'
      }}
    />
  )
}

export default WrappedPositionsList
