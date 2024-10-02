import { PositionsList } from '@components/PositionsList/PositionsList'
import { calculateTokenAmounts, getMaxTick, getMinTick, Network } from '@invariant-labs/a0-sdk'
import { PERCENTAGE_SCALE } from '@invariant-labs/a0-sdk/target/consts'
import { POSITIONS_PER_PAGE } from '@store/consts/static'
import {
  calcYPerXPriceByTickIndex,
  positionListPageToQueryPage,
  calcPriceBySqrtPrice,
  printBigint
} from '@utils/utils'
import { actions } from '@store/reducers/positions'
import { actions as walletActions } from '@store/reducers/wallet'
import { Status } from '@store/reducers/wallet'
import {
  isLoadingPositionsList,
  lastPageSelector,
  positionsList,
  positionsWithPoolsData
} from '@store/selectors/positions'
import { address, status } from '@store/selectors/wallet'
import { openWalletSelectorModal } from '@utils/web3/selector'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { IPositionItem } from '@components/PositionsList/PositionItem/PositionItem'

export const WrappedPositionsList: React.FC = () => {
  const walletAddress = useSelector(address)
  const list = useSelector(positionsWithPoolsData)
  const isLoading = useSelector(isLoadingPositionsList)
  const lastPage = useSelector(lastPageSelector)
  const walletStatus = useSelector(status)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { loadedPages, length } = useSelector(positionsList)

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
      setLastPage(lastPage === 1 ? 1 : lastPage - 1)
    }
  }, [list])

  const handleRefresh = () => {
    dispatch(
      actions.getPositionsListPage({
        index: positionListPageToQueryPage(lastPage),
        refresh: true
      })
    )
  }

  const data: IPositionItem[] = list
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
      const minTick = getMinTick(position.poolKey.feeTier.tickSpacing)
      const maxTick = getMaxTick(position.poolKey.feeTier.tickSpacing)

      const min = Math.min(lowerPrice, upperPrice)
      const max = Math.max(lowerPrice, upperPrice)

      let tokenXLiq, tokenYLiq

      let x = 0n
      let y = 0n
      if (position.poolData) {
        const [amountX, amountY] = calculateTokenAmounts(position.poolData, position)
        x = amountX
        y = amountY
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

      const currentPrice = calcPriceBySqrtPrice(
        position.poolData?.sqrtPrice ?? 0n,
        true,
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
        valueX,
        valueY,
        address: walletAddress,
        id: index,
        isActive: currentPrice >= min && currentPrice <= max,
        currentPrice,
        tokenXLiq,
        tokenYLiq,
        network: Network.Testnet,
        isFullRange: position.lowerTickIndex === minTick && position.upperTickIndex === maxTick
      }
    })
    .filter(item => {
      return (
        item.tokenXName.toLowerCase().includes(value.toLowerCase()) ||
        item.tokenYName.toLowerCase().includes(value.toLowerCase())
      )
    })

  useEffect(() => {
    if (walletStatus === Status.Initialized && walletAddress && !loadedPages[0] && !length) {
      dispatch(actions.getPositionsListPage({ index: 0, refresh: false }))
    }
  }, [walletStatus, loadedPages])

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
        onConnect: async () => {
          await openWalletSelectorModal()
          dispatch(walletActions.connect(false))
        },
        title: 'Start exploring liquidity pools right now!',
        descCustomText: 'Or, connect your wallet to see existing positions, and create a new one!'
      }}
      pageChanged={page => {
        const index = positionListPageToQueryPage(page)

        if (walletStatus === Status.Initialized && walletAddress && !loadedPages[index] && length) {
          dispatch(
            actions.getPositionsListPage({
              index,
              refresh: false
            })
          )
        }
      }}
      length={length}
      loadedPages={loadedPages}
      getRemainingPositions={() => {
        dispatch(actions.getRemainingPositions({ setLoaded: true }))
      }}
      noInitialPositions={list.length === 0}
    />
  )
}

export default WrappedPositionsList
