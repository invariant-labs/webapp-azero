import loader from '@static/gif/loader.gif'
import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useStyles from './style'
import { networkType } from '@store/selectors/connection'
import {
  currentPositionRangeTicks,
  isLoadingPositionsList,
  plotTicks,
  singlePositionData
} from '@store/selectors/positions'
import { volumeRanges } from '@store/selectors/pools'
import { status } from '@store/selectors/wallet'
import { calcPrice, calcYPerXPrice, printBN } from '@store/consts/utils'
import { TokenPriceData } from '@store/consts/static'
import { Grid } from '@mui/material'
import { EmptyPlaceholder } from '@components/EmptyPlaceholder/EmptyPlaceholder'
import { Status } from '@store/reducers/wallet'
import { Navigate } from 'react-router-dom'
import { VariantType } from 'notistack'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import PositionDetails from '@components/PositionDetails/PositionDetails'
// import { hasFarms, hasUserStakes, stakesForPosition } from '@selectors/farms'
// import { actions as farmsActions } from '@reducers/farms'
// import { Status } from '@reducers/solanaWallet'

export interface IProps {
  id: string
}

export const SinglePositionWrapper: React.FC<IProps> = ({ id }) => {
  const { classes } = useStyles()

  const dispatch = useDispatch()

  const currentNetwork = useSelector(networkType)
  const position = useSelector(singlePositionData(id))
  const isLoadingList = useSelector(isLoadingPositionsList)
  const { data: ticksData, loading: ticksLoading, hasError: hasTicksError } = useSelector(plotTicks)
  const {
    lowerTick,
    upperTick,
    loading: rangeTicksLoading
  } = useSelector(currentPositionRangeTicks)
  const poolsVolumeRanges = useSelector(volumeRanges)
  const walletStatus = useSelector(status)

  const [waitingForTicksData, setWaitingForTicksData] = useState<boolean | null>(null)

  const [showFeesLoader, setShowFeesLoader] = useState(true)

  const [isFinishedDelayRender, setIsFinishedDelayRender] = useState(false)

  // useEffect(() => {
  //   if (position?.id && waitingForTicksData === null) {
  //     setWaitingForTicksData(true)
  //     dispatch(actions.getCurrentPositionRangeTicks(id))
  //     dispatch(
  //       actions.getCurrentPlotTicks({
  //         poolIndex: position.poolData.poolIndex,
  //         isXtoY: true
  //       })
  //     )
  //   }
  // }, [position?.id])

  useEffect(() => {
    if (waitingForTicksData === true && !rangeTicksLoading) {
      setWaitingForTicksData(false)
    }
  }, [rangeTicksLoading])

  const midPrice = useMemo(() => {
    if (position) {
      return {
        index: position.poolData.currentTickIndex,
        x: calcYPerXPrice(
          position.poolData.sqrtPrice,
          position.tokenX.decimals,
          position.tokenY.decimals
        )
      }
    }

    return {
      index: 0n,
      x: 0n
    }
  }, [position?.poolKey])

  const leftRange = useMemo(() => {
    if (position) {
      return {
        index: position.lowerTickIndex,
        x: calcPrice(
          position.lowerTickIndex,
          true,
          position.tokenX.decimals,
          position.tokenY.decimals
        )
      }
    }

    return {
      index: 0n,
      x: 0n
    }
  }, [position?.poolKey])

  const rightRange = useMemo(() => {
    if (position) {
      return {
        index: position.upperTickIndex,
        x: calcPrice(
          position.upperTickIndex,
          true,
          position.tokenX.decimals,
          position.tokenY.decimals
        )
      }
    }

    return {
      index: 0n,
      x: 0n
    }
  }, [position?.poolKey])

  // const min = useMemo(
  //   () =>
  //     position
  //       ? calcYPerXPrice(
  //           calculatePriceSqrt(position.lowerTickIndex).v,
  //           position.tokenX.decimals,
  //           position.tokenY.decimals
  //         )
  //       : 0,
  //   [position?.lowerTickIndex]
  // )
  // const max = useMemo(
  //   () =>
  //     position
  //       ? calcYPerXPrice(
  //           calculatePriceSqrt(position.upperTickIndex).v,
  //           position.tokenX.decimals,
  //           position.tokenY.decimals
  //         )
  //       : 0,
  //   [position?.upperTickIndex]
  // )
  const current = useMemo(
    () =>
      position
        ? calcYPerXPrice(
            position.poolData.sqrtPrice,
            position.tokenX.decimals,
            position.tokenY.decimals
          )
        : 0n,
    [position]
  )

  // const tokenXLiquidity = useMemo(() => {
  //   if (position) {
  //     try {
  //       return +printBN(
  //         getX(
  //           position.liquidity.v,
  //           calculatePriceSqrt(position.upperTickIndex).v,
  //           position.poolData.sqrtPrice.v,
  //           calculatePriceSqrt(position.lowerTickIndex).v
  //         ),
  //         position.tokenX.decimals
  //       )
  //     } catch (error) {
  //       return 0
  //     }
  //   }

  //   return 0
  // }, [position])

  // const tokenYLiquidity = useMemo(() => {
  //   if (position) {
  //     try {
  //       return +printBN(
  //         getY(
  //           position.liquidity.v,
  //           calculatePriceSqrt(position.upperTickIndex).v,
  //           position.poolData.sqrtPrice.v,
  //           calculatePriceSqrt(position.lowerTickIndex).v
  //         ),
  //         position.tokenY.decimals
  //       )
  //     } catch (error) {
  //       return 0
  //     }
  //   }

  //   return 0
  // }, [position])

  // const [tokenXClaim, tokenYClaim] = useMemo(() => {
  //   if (
  //     waitingForTicksData === false &&
  //     position &&
  //     typeof lowerTick !== 'undefined' &&
  //     typeof upperTick !== 'undefined'
  //   ) {
  //     const [bnX, bnY] = calculateClaimAmount({
  //       position,
  //       tickLower: lowerTick,
  //       tickUpper: upperTick,
  //       tickCurrent: position.poolData.currentTickIndex,
  //       feeGrowthGlobalX: position.poolData.feeGrowthGlobalX,
  //       feeGrowthGlobalY: position.poolData.feeGrowthGlobalY
  //     })

  //     setShowFeesLoader(false)

  //     return [+printBN(bnX, position.tokenX.decimals), +printBN(bnY, position.tokenY.decimals)]
  //   }

  //   return [0, 0]
  // }, [position, lowerTick, upperTick, waitingForTicksData])

  // const data = useMemo(() => {
  //   if (ticksLoading && position) {
  //     return createPlaceholderLiquidityPlot(
  //       true,
  //       10,
  //       position.poolData.tickSpacing,
  //       position.tokenX.decimals,
  //       position.tokenY.decimals
  //     )
  //   }

  //   return ticksData
  // }, [ticksData, ticksLoading, position?.id])

  const initialIsDiscreteValue = localStorage.getItem('IS_PLOT_DISCRETE')
    ? localStorage.getItem('IS_PLOT_DISCRETE') === 'true'
    : true

  const setIsDiscreteValue = (val: boolean) => {
    localStorage.setItem('IS_PLOT_DISCRETE', val ? 'true' : 'false')
  }

  const [tokenXPriceData, setTokenXPriceData] = useState<TokenPriceData | undefined>(undefined)
  const [tokenYPriceData, setTokenYPriceData] = useState<TokenPriceData | undefined>(undefined)

  // const currentVolumeRange = useMemo(() => {
  //   if (!position?.poolData.address) {
  //     return undefined
  //   }

  //   const poolAddress = position.poolData.address.toString()

  //   if (!poolsVolumeRanges[poolAddress]) {
  //     return undefined
  //   }

  //   const lowerTicks: number[] = poolsVolumeRanges[poolAddress]
  //     .map(range => (range.tickLower === null ? undefined : range.tickLower))
  //     .filter(tick => typeof tick !== 'undefined') as number[]
  //   const upperTicks: number[] = poolsVolumeRanges[poolAddress]
  //     .map(range => (range.tickUpper === null ? undefined : range.tickUpper))
  //     .filter(tick => typeof tick !== 'undefined') as number[]

  //   const lowerPrice = calcPrice(
  //     !lowerTicks.length || !upperTicks.length
  //       ? position.poolData.currentTickIndex
  //       : Math.min(...lowerTicks),
  //     true,
  //     position.tokenX.decimals,
  //     position.tokenY.decimals
  //   )

  //   const upperPrice = calcPrice(
  //     !lowerTicks.length || !upperTicks.length
  //       ? Math.min(position.poolData.currentTickIndex + position.poolData.tickSpacing, MAX_TICK)
  //       : Math.max(...upperTicks),
  //     true,
  //     position.tokenX.decimals,
  //     position.tokenY.decimals
  //   )

  //   return {
  //     min: Math.min(lowerPrice, upperPrice),
  //     max: Math.max(lowerPrice, upperPrice)
  //   }
  // }, [poolsVolumeRanges, position])

  // useEffect(() => {
  //   if (!position) {
  //     return
  //   }

  //   const xId = position.tokenX.coingeckoId ?? ''
  //   if (xId.length) {
  //     getCoingeckoTokenPrice(xId)
  //       .then(data => setTokenXPriceData(data))
  //       .catch(() =>
  //         setTokenXPriceData(getMockedTokenPrice(position.tokenX.symbol, currentNetwork))
  //       )
  //   } else {
  //     setTokenXPriceData(undefined)
  //   }

  //   const yId = position.tokenY.coingeckoId ?? ''
  //   if (yId.length) {
  //     getCoingeckoTokenPrice(yId)
  //       .then(data => setTokenYPriceData(data))
  //       .catch(() =>
  //         setTokenYPriceData(getMockedTokenPrice(position.tokenY.symbol, currentNetwork))
  //       )
  //   } else {
  //     setTokenYPriceData(undefined)
  //   }
  // }, [position?.id])

  const copyPoolAddressHandler = (message: string, variant: VariantType) => {
    dispatch(
      snackbarsActions.add({
        message,
        variant,
        persist: false
      })
    )
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFinishedDelayRender(true)
    }, 1000)

    return () => {
      clearTimeout(timer)
    }
  }, [walletStatus])

  useEffect(() => {
    if (isFinishedDelayRender) {
      setIsFinishedDelayRender(false)
    }
  }, [walletStatus])

  if (position) {
    return (
      <PositionDetails
        tokenXAddress={position.tokenX.assetAddress}
        tokenYAddress={position.tokenY.assetAddress}
        poolAddress={position.poolData.address}
        copyPoolAddressHandler={copyPoolAddressHandler}
        detailsData={[{ x: 12n, y: 123n, index: -44364n }]}
        midPrice={midPrice}
        leftRange={leftRange}
        rightRange={rightRange}
        currentPrice={current}
        onClickClaimFee={() => {}} // add real data
        closePosition={() => {}} // add real data
        ticksLoading={ticksLoading}
        tickSpacing={1} // add real data
        tokenX={{
          name: position.tokenX.symbol,
          icon: position.tokenX.logoURI,
          decimal: position.tokenX.decimals,
          balance: +printBN(position.tokenX.balance, position.tokenX.decimals),
          liqValue: 5.123, // add real data
          claimValue: 1.23, // add real data
          usdValue:
            typeof tokenXPriceData?.price === 'undefined'
              ? undefined
              : tokenXPriceData.price * +printBN(position.tokenX.balance, position.tokenX.decimals)
        }}
        tokenXPriceData={tokenXPriceData}
        tokenY={{
          name: position.tokenY.symbol,
          icon: position.tokenY.logoURI,
          decimal: position.tokenY.decimals,
          balance: +printBN(position.tokenY.balance, position.tokenY.decimals),
          liqValue: 123.123, // add real data
          claimValue: 12.23, // add real data
          usdValue:
            typeof tokenYPriceData?.price === 'undefined'
              ? undefined
              : tokenYPriceData.price * +printBN(position.tokenY.balance, position.tokenY.decimals)
        }}
        tokenYPriceData={tokenYPriceData}
        fee={position.poolData.feeGrowthGlobalX} //TODO check if this is correct
        min={0.0118541383040056} // add real data
        max={1.23123} // add real data
        initialIsDiscreteValue={initialIsDiscreteValue}
        onDiscreteChange={setIsDiscreteValue}
        showFeesLoader={showFeesLoader}
        hasTicksError={hasTicksError}
        reloadHandler={() => {}} // add real data
        plotVolumeRange={undefined} // add real data
      />
    )
  }
  if (
    (isLoadingList && walletStatus === Status.Initialized) ||
    (!position && walletStatus === Status.Uninitialized && !isFinishedDelayRender)
  ) {
    return (
      <Grid
        container
        justifyContent='center'
        alignItems='center'
        className={classes.fullHeightContainer}>
        <img src={loader} className={classes.loading} />
      </Grid>
    )
  }
  if (!position && walletStatus === Status.Initialized && isFinishedDelayRender) {
    return <Navigate to='/pool' />
  }
  return (
    <Grid
      container
      justifyContent='center'
      alignItems='center'
      className={classes.fullHeightContainer}>
      <EmptyPlaceholder desc='Position does not exist in your list!' />
    </Grid>
  )
}
