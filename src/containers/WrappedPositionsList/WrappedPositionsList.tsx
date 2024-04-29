import { PositionsList } from '@components/PositionsList/PositionsList'
import { POSITIONS_PER_PAGE } from '@store/consts/static'
import { Status } from '@store/reducers/wallet'
import { status } from '@store/selectors/wallet'
import { openWalletSelectorModal } from '@utils/web3/selector'

import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

export const WrappedPositionsList: React.FC = () => {
  // const list = useSelector(positionsWithPoolsData)
  // const isLoading = useSelector(isLoadingPositionsList)
  // const lastPage = useSelector(lastPageSelector)
  const list: any = []
  const isLoading = false
  const lastPage = 0

  const navigate = useNavigate()

  const walletStatus = useSelector(status)

  // const dispatch = useDispatch()

  const [value, setValue] = useState<string>('')

  const handleSearchValue = (value: string) => {
    setValue(value)
  }

  const setLastPage = (page: number) => {
    // dispatch(actions.setLastPage(page))
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
    // dispatch(actions.getPositionsList())
  }

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
      // data={list
      //   .map(position => {
      //     const lowerPrice = calcYPerXPrice(
      //       calculatePriceSqrt(position.lowerTickIndex).v,
      //       position.tokenX.decimals,
      //       position.tokenY.decimals
      //     )
      //     const upperPrice = calcYPerXPrice(
      //       calculatePriceSqrt(position.upperTickIndex).v,
      //       position.tokenX.decimals,
      //       position.tokenY.decimals
      //     )

      //     const min = Math.min(lowerPrice, upperPrice)
      //     const max = Math.max(lowerPrice, upperPrice)

      //     let tokenXLiq, tokenYLiq

      //     try {
      //       tokenXLiq = +printAmount(
      //         getX(
      //           position.liquidity.v,
      //           calculatePriceSqrt(position.upperTickIndex).v,
      //           position.poolData.sqrtPrice.v,
      //           calculatePriceSqrt(position.lowerTickIndex).v
      //         ),
      //         position.tokenX.decimals
      //       )
      //     } catch (error) {
      //       tokenXLiq = 0
      //     }

      //     try {
      //       tokenYLiq = +printAmount(
      //         getY(
      //           position.liquidity.v,
      //           calculatePriceSqrt(position.upperTickIndex).v,
      //           position.poolData.sqrtPrice.v,
      //           calculatePriceSqrt(position.lowerTickIndex).v
      //         ),
      //         position.tokenY.decimals
      //       )
      //     } catch (error) {
      //       tokenYLiq = 0
      //     }

      //     const currentPrice = calcYPerXPrice(
      //       position.poolData.sqrtPrice.v,
      //       position.tokenX.decimals,
      //       position.tokenY.decimals
      //     )

      //     const valueX = tokenXLiq + tokenYLiq / currentPrice
      //     const valueY = tokenYLiq + tokenXLiq * currentPrice

      //     return {
      //       tokenXName: position.tokenX.symbol,
      //       tokenYName: position.tokenY.symbol,
      //       tokenXIcon: position.tokenX.logoURI,
      //       tokenYIcon: position.tokenY.logoURI,
      //       fee: +printAmount(position.poolData.fee.v, DECIMAL - 2),
      //       min,
      //       max,
      //       tokenXLiq,
      //       tokenYLiq,
      //       valueX,
      //       valueY,
      //       // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      //       id: position.id.toString() + '_' + position.pool.toString(),
      //       isActive: currentPrice >= min && currentPrice <= max
      //     }
      //   })
      //   .filter(item => {
      //     return (
      //       item.tokenXName.toLowerCase().includes(value) ||
      //       item.tokenYName.toLowerCase().includes(value)
      //     )
      //   })}
      data={[]}
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
