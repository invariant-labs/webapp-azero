import { PositionsList } from '@components/PositionsList/PositionsList'
import { calculateTokenAmounts } from '@invariant-labs/a0-sdk'
import { PERCENTAGE_SCALE } from '@invariant-labs/a0-sdk/src/consts'
import { POSITIONS_PER_PAGE } from '@store/consts/static'
import { calcYPerXPriceByTickIndex, printBigint } from '@store/consts/utils'
import { actions } from '@store/reducers/positions'
import { Status } from '@store/reducers/wallet'
import {
  isLoadingPositionsList,
  lastPageSelector,
  positionsWithPoolsData
} from '@store/selectors/positions'
import { address, status } from '@store/selectors/wallet'
import { openWalletSelectorModal } from '@utils/web3/selector'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

export const WrappedPositionsList: React.FC = () => {
  const walletAddress = useSelector(address)
  const list = useSelector(positionsWithPoolsData)
  const isLoading = useSelector(isLoadingPositionsList)
  const lastPage = useSelector(lastPageSelector)
  const walletStatus = useSelector(status)
  const navigate = useNavigate()
  const dispatch = useDispatch()

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
    .map((position, index) => {
      const lowerPrice = Number(
        calcYPerXPriceByTickIndex(
          position.lowerTickIndex,
          position.tokenX.decimals,
          position.tokenY.decimals
        )
      )
      const upperPrice = Number(
        calcYPerXPriceByTickIndex(
          position.upperTickIndex,
          position.tokenX.decimals,
          position.tokenY.decimals
        )
      )

      const min = Math.min(lowerPrice, upperPrice)
      const max = Math.max(lowerPrice, upperPrice)

      let tokenXLiq, tokenYLiq

      let x = 0n
      let y = 0n
      if (position.poolData) {
        ;[x, y] = calculateTokenAmounts(position.poolData, position)
      }

      try {
        tokenXLiq = +printBigint(x, position.tokenX.decimals)
      } catch (error) {
        tokenXLiq = 0
      }

      try {
        tokenYLiq = +printBigint(y, position.tokenY.decimals)
      } catch (error) {
        tokenYLiq = 0
      }

      const currentPrice = calcYPerXPriceByTickIndex(
        position.poolData?.currentTickIndex ?? 0n,
        position.tokenX.decimals,
        position.tokenY.decimals
      )

      const valueX = tokenXLiq + tokenYLiq / currentPrice
      const valueY = tokenYLiq + tokenXLiq * currentPrice

      return {
        tokenXName: position.tokenX.symbol,
        tokenYName: position.tokenY.symbol,
        tokenXIcon: position.tokenX.logoURI,
        tokenYIcon: position.tokenY.logoURI,
        fee: +printBigint(position.poolKey.feeTier.fee, PERCENTAGE_SCALE - 2n),
        min,
        max,
        tokenXLiq,
        tokenYLiq,
        valueX,
        valueY,
        address: walletAddress,
        id: index,
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
