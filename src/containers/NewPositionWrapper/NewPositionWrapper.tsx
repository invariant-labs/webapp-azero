import NewPosition from '@components/NewPosition/NewPosition'
import { ProgressState } from '@components/AnimatedButton/AnimatedButton'
import {
  calcPrice,
  calcYPerXPrice,
  createPlaceholderLiquidityPlot,
  getCoingeckoTokenPrice,
  getMockedTokenPrice
} from '@store/consts/utils'
import { TickPlotPositionData } from '@store/reducers/positions'
import { network } from '@store/selectors/connection'
import {
  isLoadingLatestPoolsForTransaction,
  poolsArraySortedByFees,
  volumeRanges
} from '@store/selectors/pools'
import { initPosition, plotTicks } from '@store/selectors/positions'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { canCreateNewPool, canCreateNewPosition, status, swapTokens } from '@store/selectors/wallet'
import { getCurrentAlephZeroConnection } from '@utils/web3/connection'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { VariantType } from 'notistack'
import {
  PositionOpeningMethod,
  TokenPriceData,
  bestTiers,
  commonTokensForNetworks
} from '@store/consts/static'
import {
  TokenAmount,
  getLiquidityByX,
  getLiquidityByY,
  priceToSqrtPrice
} from '@invariant-labs/a0-sdk/src'
import { AddressOrPair } from '@polkadot/api/types'
import { Status } from '@store/reducers/wallet'

export interface IProps {
  initialTokenFrom: string
  initialTokenTo: string
  initialFee: string
}

export const NewPositionWrapper: React.FC<IProps> = ({
  initialTokenFrom,
  initialTokenTo,
  initialFee
}) => {
  const dispatch = useDispatch()

  const connection = getCurrentAlephZeroConnection()
  const tokens = useSelector(swapTokens)
  const walletStatus = useSelector(status)
  const allPools = useSelector(poolsArraySortedByFees)
  const poolsVolumeRanges = useSelector(volumeRanges)

  const { success, inProgress } = useSelector(initPosition)
  const { data: ticksData, loading: ticksLoading, hasError: hasTicksError } = useSelector(plotTicks)
  const isFetchingNewPool = useSelector(isLoadingLatestPoolsForTransaction)
  const currentNetwork = useSelector(network)

  const canUserCreateNewPool = useSelector(canCreateNewPool(currentNetwork))
  const canUserCreateNewPosition = useSelector(canCreateNewPosition(currentNetwork))

  const [poolIndex, setPoolIndex] = useState<bigint | null>(null)

  const [progress, setProgress] = useState<ProgressState>('none')

  const [tokenAIndex, setTokenAIndex] = useState<number | null>(null)
  const [tokenBIndex, setTokenBIndex] = useState<number | null>(null)

  const [currentPairReversed, setCurrentPairReversed] = useState<boolean | null>(null)

  const isMountedRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const liquidityRef = useRef<any>({ v: BigInt(0) })

  useEffect(() => {
    setProgress('none')
  }, [poolIndex])

  useEffect(() => {
    let timeoutId1: NodeJS.Timeout
    let timeoutId2: NodeJS.Timeout

    if (!inProgress && progress === 'progress') {
      setProgress(success ? 'approvedWithSuccess' : 'approvedWithFail')

      if (poolIndex !== null && tokenAIndex !== null && tokenBIndex !== null) {
        // dispatch(
        //   actions.getCurrentPlotTicks({
        //     poolIndex,
        //     isXtoY: allPools[poolIndex].tokenX.equals(
        //       tokens[currentPairReversed === true ? tokenBIndex : tokenAIndex].assetAddress
        //     ),
        //     disableLoading: true
        //   })
        // )
      }

      timeoutId1 = setTimeout(() => {
        setProgress(success ? 'success' : 'failed')
      }, 1500)

      timeoutId2 = setTimeout(() => {
        setProgress('none')
      }, 3000)
    }

    return () => {
      clearTimeout(timeoutId1)
      clearTimeout(timeoutId2)
    }
  }, [success, inProgress])

  const isXtoY = useMemo(() => {
    if (tokenAIndex !== null && tokenBIndex !== null) {
      return (
        tokens[tokenAIndex].assetAddress.toString() < tokens[tokenBIndex].assetAddress.toString()
      )
    }
    return true
  }, [tokenAIndex, tokenBIndex])

  const xDecimal = useMemo(() => {
    if (tokenAIndex !== null && tokenBIndex !== null) {
      return tokens[tokenAIndex].assetAddress.toString() <
        tokens[tokenBIndex].assetAddress.toString()
        ? tokens[tokenAIndex].decimals
        : tokens[tokenBIndex].decimals
    }
    return 0n
  }, [tokenAIndex, tokenBIndex])

  const yDecimal = useMemo(() => {
    if (tokenAIndex !== null && tokenBIndex !== null) {
      return tokens[tokenAIndex].assetAddress.toString() <
        tokens[tokenBIndex].assetAddress.toString()
        ? tokens[tokenBIndex].decimals
        : tokens[tokenAIndex].decimals
    }
    return 0n
  }, [tokenAIndex, tokenBIndex])

  const [feeIndex, setFeeIndex] = useState(0)

  // const fee = useMemo(() => ALL_FEE_TIERS_DATA[feeIndex].tier.fee, [feeIndex])
  const tickSpacing = useMemo(
    () =>
      // ALL_FEE_TIERS_DATA[feeIndex].tier.tickSpacing ??
      // feeToTickSpacing(ALL_FEE_TIERS_DATA[feeIndex].tier.fee),
      1n,
    [feeIndex]
  )

  const [midPrice, setMidPrice] = useState<TickPlotPositionData>({
    index: 0n,
    x: 1n
  })

  const isWaitingForNewPool = useMemo(() => {
    if (poolIndex !== null) {
      return false
    }

    return isFetchingNewPool
  }, [isFetchingNewPool, poolIndex])

  useEffect(() => {
    if (!isWaitingForNewPool && tokenAIndex !== null && tokenBIndex !== null) {
      // const index = allPools.findIndex(
      //   pool =>
      //     pool.fee.v.eq(fee) &&
      //     ((pool.tokenX.equals(tokens[tokenAIndex].assetAddress) &&
      //       pool.tokenY.equals(tokens[tokenBIndex].assetAddress)) ||
      //       (pool.tokenX.equals(tokens[tokenBIndex].assetAddress) &&
      //         pool.tokenY.equals(tokens[tokenAIndex].assetAddress)))
      // )
      // setPoolIndex(index !== -1 ? index : null)
      // if (index !== -1) {
      //   dispatch(
      //     actions.getCurrentPlotTicks({
      //       poolIndex: index,
      //       isXtoY: allPools[index].tokenX.equals(tokens[tokenAIndex].assetAddress)
      //     })
      //   )
      // }
    }
  }, [isWaitingForNewPool])
  // useEffect(() => {
  //   if (poolIndex !== null) {
  //     setMidPrice({
  //       index: allPools[poolIndex].currentTickIndex,
  //       x:
  //         calcYPerXPrice(allPools[poolIndex].sqrtPrice.toString(), xDecimal, yDecimal) **
  //         (isXtoY ? 1 : -1)
  //     })
  //   }
  // }, [poolIndex, isXtoY, xDecimal, yDecimal, allPools])

  // useEffect(() => {
  //   if (poolIndex === null) {
  //     setMidPrice({
  //       index: 0,
  //       x: calcPrice(0n, isXtoY, xDecimal, yDecimal)
  //     })
  //   }
  // }, [poolIndex, isXtoY, xDecimal, yDecimal])

  const data = useMemo(() => {
    // if (ticksLoading) {
    //   return createPlaceholderLiquidityPlot(isXtoY, 10, tickSpacing, xDecimal, yDecimal)
    // }

    if (currentPairReversed === true) {
      return ticksData.map(tick => ({ ...tick, x: 1n / tick.x })).reverse()
    }

    return ticksData
  }, [ticksData, ticksLoading, isXtoY, tickSpacing, xDecimal, yDecimal, currentPairReversed])

  useEffect(() => {
    if (
      tokenAIndex !== null &&
      tokenBIndex !== null &&
      poolIndex === null &&
      progress === 'approvedWithSuccess'
    ) {
      // dispatch(
      //   poolsActions.getPoolData(
      //     new Pair(tokens[tokenAIndex].assetAddress, tokens[tokenBIndex].assetAddress, {
      //       fee
      //     })
      //   )
      // )
    }
  }, [progress])

  const initialIsDiscreteValue = localStorage.getItem('IS_PLOT_DISCRETE')
    ? localStorage.getItem('IS_PLOT_DISCRETE') === 'true'
    : true

  const setIsDiscreteValue = (val: boolean) => {
    localStorage.setItem('IS_PLOT_DISCRETE', val ? 'true' : 'false')
  }

  // const addTokenHandler = (address: string) => {
  //   if (
  //     connection !== null &&
  //     tokens.findIndex(token => token.address.toString() === address) === -1
  //   ) {
  //     getNewTokenOrThrow(address, connection)
  //       .then(data => {
  //         dispatch(poolsActions.addTokens(data))
  //         addNewTokenToLocalStorage(address, currentNetwork)
  //         dispatch(
  //           snackbarsActions.add({
  //             message: 'Token added to your list',
  //             variant: 'success',
  //             persist: false
  //           })
  //         )
  //       })
  //       .catch(() => {
  //         dispatch(
  //           snackbarsActions.add({
  //             message: 'Token adding failed,
  //             variant: 'error',
  //             persist: false
  //           })
  //         )
  //       })
  //   } else {
  //     dispatch(
  //       snackbarsActions.add({
  //         message: 'Token already exists on your list',
  //         variant: 'info',
  //         persist: false
  //       })
  //     )
  //   }
  // }

  const copyPoolAddressHandler = (message: string, variant: VariantType) => {
    dispatch(
      snackbarsActions.add({
        message,
        variant,
        persist: false
      })
    )
  }

  const initialIsConcentrationOpening =
    localStorage.getItem('OPENING_METHOD') === 'concentration' ||
    localStorage.getItem('OPENING_METHOD') === null

  const setPositionOpeningMethod = (val: PositionOpeningMethod) => {
    localStorage.setItem('OPENING_METHOD', val)
  }

  const initialHideUnknownTokensValue =
    localStorage.getItem('HIDE_UNKNOWN_TOKENS') === 'true' ||
    localStorage.getItem('HIDE_UNKNOWN_TOKENS') === null

  const setHideUnknownTokensValue = (val: boolean) => {
    localStorage.setItem('HIDE_UNKNOWN_TOKENS', val ? 'true' : 'false')
  }

  const [tokenAPriceData, setTokenAPriceData] = useState<TokenPriceData | undefined>(undefined)
  const [priceALoading, setPriceALoading] = useState(false)
  useEffect(() => {
    if (tokenAIndex === null) {
      return
    }

    const id = tokens[tokenAIndex].coingeckoId ?? ''
    if (id.length) {
      setPriceALoading(true)
      getCoingeckoTokenPrice(id)
        .then(data => setTokenAPriceData(data))
        .catch(() =>
          setTokenAPriceData(getMockedTokenPrice(tokens[tokenAIndex].symbol, currentNetwork))
        )
        .finally(() => setPriceALoading(false))
    } else {
      setTokenAPriceData(undefined)
    }
  }, [tokenAIndex])

  const [tokenBPriceData, setTokenBPriceData] = useState<TokenPriceData | undefined>(undefined)
  const [priceBLoading, setPriceBLoading] = useState(false)
  useEffect(() => {
    if (tokenBIndex === null) {
      return
    }

    const id = tokens[tokenBIndex].coingeckoId ?? ''
    if (id.length) {
      setPriceBLoading(true)
      getCoingeckoTokenPrice(id)
        .then(data => setTokenBPriceData(data))
        .catch(() =>
          setTokenBPriceData(getMockedTokenPrice(tokens[tokenBIndex].symbol, currentNetwork))
        )
        .finally(() => setPriceBLoading(false))
    } else {
      setTokenBPriceData(undefined)
    }
  }, [tokenBIndex])

  const currentVolumeRange = useMemo(() => {
    if (poolIndex === null) {
      return undefined
    }

    const poolAddress = allPools[Number(poolIndex)].address.toString()

    if (!poolsVolumeRanges[poolAddress]) {
      return undefined
    }

    // const lowerTicks: number[] = poolsVolumeRanges[poolAddress]
    //   .map(range => (range.tickLower === null ? undefined : range.tickLower))
    //   .filter(tick => typeof tick !== 'undefined') as number[]
    // const upperTicks: number[] = poolsVolumeRanges[poolAddress]
    //   .map(range => (range.tickUpper === null ? undefined : range.tickUpper))
    //   .filter(tick => typeof tick !== 'undefined') as number[]

    // const lowerPrice = calcPrice(
    //   !lowerTicks.length || !upperTicks.length
    //     ? allPools[poolIndex].currentTickIndex
    //     : Math.min(...lowerTicks),
    //   isXtoY,
    //   xDecimal,
    //   yDecimal
    // )

    // const upperPrice = calcPrice(
    //   !lowerTicks.length || !upperTicks.length
    //     ? Math.min(
    //         allPools[poolIndex].currentTickIndex + allPools[poolIndex].tickSpacing,
    //         getMaxTick(tickSpacing)
    //       )
    //     : Math.max(...upperTicks),
    //   isXtoY,
    //   xDecimal,
    //   yDecimal
    // )

    // return {
    //   min: Math.min(lowerPrice, upperPrice),
    //   max: Math.max(lowerPrice, upperPrice)
    // }
  }, [poolsVolumeRanges, poolIndex, isXtoY, xDecimal, yDecimal])

  const initialSlippage = localStorage.getItem('INVARIANT_NEW_POSITION_SLIPPAGE') ?? '1'

  const onSlippageChange = (slippage: string) => {
    localStorage.setItem('INVARIANT_NEW_POSITION_SLIPPAGE', slippage)
  }

  const calcAmount = (
    amount: TokenAmount,
    left: number,
    right: number,
    tokenAddress: AddressOrPair
  ) => {
    if (tokenAIndex === null || tokenBIndex === null || isNaN(left) || isNaN(right)) {
      return BigInt(0)
    }

    const byX =
      tokenAddress ===
      (isXtoY ? tokens[tokenAIndex].assetAddress : tokens[tokenBIndex].assetAddress)

    const lowerTick = Math.min(left, right)
    const upperTick = Math.max(left, right)

    //TODO check if this is correct
    try {
      if (byX) {
        const result = getLiquidityByX(
          amount,
          lowerTick,
          upperTick,
          poolIndex !== null
            ? allPools[Number(poolIndex)].sqrtPrice
            : priceToSqrtPrice(BigInt(midPrice.x)),
          true
        )
        if (isMountedRef.current) {
          liquidityRef.current = result.liquidity
        }
        return result.y
      }
      const result = getLiquidityByY(
        amount,
        lowerTick,
        upperTick,
        poolIndex !== null
          ? allPools[Number(poolIndex)].sqrtPrice
          : priceToSqrtPrice(BigInt(midPrice.x)),
        true
      )
      if (isMountedRef.current) {
        liquidityRef.current = result.liquidity
      }
      return result.x
    } catch (error) {
      const result = (byX ? getLiquidityByY : getLiquidityByX)(
        amount,
        lowerTick,
        upperTick,
        poolIndex !== null
          ? allPools[Number(poolIndex)].sqrtPrice
          : priceToSqrtPrice(BigInt(midPrice.x)),
        true
      )
      if (isMountedRef.current) {
        liquidityRef.current = result.liquidity
      }
    }

    return BigInt(0)
  }
  return (
    <NewPosition
      initialTokenFrom={initialTokenFrom}
      initialTokenTo={initialTokenTo}
      initialFee={initialFee}
      poolAddress='' // TODO - add real data
      calculatePoolAddress={async () => ''} // TODO - add real data
      copyPoolAddressHandler={copyPoolAddressHandler}
      tokens={tokens}
      data={data}
      midPrice={midPrice}
      setMidPrice={setMidPrice}
      onChangePositionTokens={(
        tokenAIndex,
        tokenBindex,
        feeTierIndex // TODO - add real data
      ) => {
        setTokenAIndex(tokenAIndex)
        setTokenBIndex(tokenBindex)
        setFeeIndex(feeTierIndex)
        console.log(tokenAIndex, tokenBindex, feeTierIndex)
      }}
      isCurrentPoolExisting={poolIndex !== null}
      feeTiers={[
        { feeValue: 0.1 },
        { feeValue: 0.3 },
        { feeValue: 0.5 },
        { feeValue: 0.75 },
        { feeValue: 1 },
        { feeValue: 2 },
        { feeValue: 5 },
        { feeValue: 10 }
      ]} // TODO - add real data
      ticksLoading={ticksLoading}
      isXtoY={isXtoY}
      xDecimal={xDecimal}
      yDecimal={yDecimal}
      tickSpacing={tickSpacing}
      isWaitingForNewPool={false}
      poolIndex={poolIndex}
      currentPairReversed={null}
      bestTiers={bestTiers[currentNetwork]}
      initialIsDiscreteValue={initialIsDiscreteValue}
      onDiscreteChange={setIsDiscreteValue}
      currentPriceSqrt={BigInt(5)} // TODO - add real data
      canCreateNewPool={canUserCreateNewPool}
      canCreateNewPosition={canUserCreateNewPosition}
      handleAddToken={address => console.log(address)} // TODO - add real data
      commonTokens={commonTokensForNetworks[currentNetwork]}
      initialOpeningPositionMethod={initialIsConcentrationOpening ? 'concentration' : 'range'}
      onPositionOpeningMethodChange={setPositionOpeningMethod}
      initialHideUnknownTokensValue={initialHideUnknownTokensValue}
      onHideUnknownTokensChange={setHideUnknownTokensValue}
      tokenAPriceData={tokenAPriceData}
      tokenBPriceData={tokenBPriceData}
      priceALoading={priceALoading}
      priceBLoading={priceBLoading}
      hasTicksError={hasTicksError}
      reloadHandler={() => console.log('Reloading data')} // TODO - add real data
      plotVolumeRange={currentVolumeRange}
      currentFeeIndex={feeIndex}
      onSlippageChange={onSlippageChange}
      initialSlippage={initialSlippage}
      progress={progress}
      addLiquidityHandler={() => console.log('Adding liquidity')} // TODO - add real data
      showNoConnected={walletStatus !== Status.Initialized}
    />
  )
}

export default NewPositionWrapper
