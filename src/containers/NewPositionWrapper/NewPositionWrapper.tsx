import NewPosition from '@components/NewPosition/NewPosition'
import { ProgressState } from '@components/AnimatedButton/AnimatedButton'
import {
  PoolKey,
  TokenAmount,
  calculateSqrtPrice,
  getLiquidityByX,
  getLiquidityByY,
  priceToSqrtPrice,
  sqrtPriceToPrice,
  toSqrtPrice
} from '@invariant-labs/a0-sdk'
import { AddressOrPair } from '@polkadot/api/types'
import {
  PositionOpeningMethod,
  TokenList,
  TokenPriceData,
  bestTiers,
  commonTokensForNetworks
} from '@store/consts/static'
import {
  calcPrice,
  calcYPerXPrice,
  createPlaceholderLiquidityPlot,
  getCoingeckoTokenPrice,
  getMockedTokenPrice,
  printBN,
  stringifyPoolKey
} from '@store/consts/utils'
import { actions as positionsActions, TickPlotPositionData } from '@store/reducers/positions'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { Status } from '@store/reducers/wallet'
import { actions as poolsActions } from '@store/reducers/pools'
import { networkType } from '@store/selectors/connection'
import {
  isLoadingLatestPoolsForTransaction,
  poolsArraySortedByFees,
  volumeRanges,
  feeTiers,
  poolKeys,
  pools
} from '@store/selectors/pools'
import { initPosition, plotTicks } from '@store/selectors/positions'
import { canCreateNewPool, canCreateNewPosition, status, swapTokens } from '@store/selectors/wallet'
import { getCurrentAlephZeroConnection } from '@utils/web3/connection'
import { VariantType } from 'notistack'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { set } from 'remeda'
import { openWalletSelectorModal } from '@utils/web3/selector'

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
  const feeTiersArray = useSelector(feeTiers)
  const allPoolKeys = useSelector(poolKeys)
  const poolsData = useSelector(pools)

  const { success, inProgress } = useSelector(initPosition)
  const { data: ticksData, loading: ticksLoading, hasError: hasTicksError } = useSelector(plotTicks)
  const isFetchingNewPool = useSelector(isLoadingLatestPoolsForTransaction)
  const currentNetwork = useSelector(networkType)
  console.log(inProgress)
  const canUserCreateNewPool = useSelector(canCreateNewPool(currentNetwork))
  const canUserCreateNewPosition = useSelector(canCreateNewPosition(currentNetwork))

  const [poolIndex, setPoolIndex] = useState<bigint | null>(null)

  const [poolKey, setPoolKey] = useState<string>('')
  const [progress, setProgress] = useState<ProgressState>('none')
  console.log(progress)
  const [tokenAIndex, setTokenAIndex] = useState<number | null>(null)
  const [tokenBIndex, setTokenBIndex] = useState<number | null>(null)

  const [tokenAAmount, setTokenAAmount] = useState(0n)
  const [tokenBAmount, setTokenBAmount] = useState(0n)

  const [currentPairReversed, setCurrentPairReversed] = useState<boolean | null>(null)

  const isMountedRef = useRef(false)
  const [openPosition, setOpenPosition] = useState(false)

  const [leftTick, setLeftTick] = useState(0n)
  const [rightTick, setRightTick] = useState(0n)

  useEffect(() => {
    dispatch(poolsActions.getFeeTiers())
    dispatch(poolsActions.getPoolKeys())
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const liquidityRef = useRef<any>(0n)

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
    if (
      tokenAIndex !== null &&
      tokenBIndex !== null &&
      tokens[tokenAIndex] &&
      tokens[tokenBIndex]
    ) {
      return (
        tokens[tokenAIndex].assetAddress.toString() < tokens[tokenBIndex].assetAddress.toString()
      )
    }
    return true
  }, [tokenAIndex, tokenBIndex])

  const xDecimal = useMemo(() => {
    if (
      tokenAIndex !== null &&
      tokenBIndex !== null &&
      tokens[tokenAIndex] &&
      tokens[tokenBIndex]
    ) {
      return tokens[tokenAIndex].assetAddress.toString() <
        tokens[tokenBIndex].assetAddress.toString()
        ? tokens[tokenAIndex].decimals
        : tokens[tokenBIndex].decimals
    }
    return 0n
  }, [tokenAIndex, tokenBIndex, tokens])

  const yDecimal = useMemo(() => {
    if (
      tokenAIndex !== null &&
      tokenBIndex !== null &&
      tokens[tokenAIndex] &&
      tokens[tokenBIndex]
    ) {
      return tokens[tokenAIndex].assetAddress.toString() <
        tokens[tokenBIndex].assetAddress.toString()
        ? tokens[tokenBIndex].decimals
        : tokens[tokenAIndex].decimals
    }
    return 0n
  }, [tokenAIndex, tokenBIndex, tokens])

  const [feeIndex, setFeeIndex] = useState(0)

  const fee = useMemo(
    () => (feeTiersArray[feeIndex] ? feeTiersArray[feeIndex].tier.fee : 1n),
    [feeIndex]
  )

  const tickSpacing = useMemo(
    () => (feeTiersArray[feeIndex] ? feeTiersArray[feeIndex].tier.tickSpacing : 1n),
    [feeIndex]
  )

  const [midPrice, setMidPrice] = useState<TickPlotPositionData>({
    index: 0n,
    x: 1
  })

  const isWaitingForNewPool = useMemo(() => {
    if (poolKey !== '') {
      return false
    }

    return isFetchingNewPool
  }, [isFetchingNewPool, poolIndex])

  console.log(poolKey)

  useEffect(() => {
    if (!isWaitingForNewPool && tokenAIndex !== null && tokenBIndex !== null) {
      const keyStringified = stringifyPoolKey({
        tokenX: tokens[tokenAIndex].assetAddress.toString(),
        tokenY: tokens[tokenBIndex].assetAddress.toString(),
        feeTier: feeTiersArray[feeIndex].tier
      })

      if (allPoolKeys[keyStringified]) {
        setPoolKey(keyStringified)
      } else {
        setPoolKey('')
      }
      // const index = allPools.findIndex( //TODO check if its better to leave pool index or replace it with pool key?
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
  }, [isWaitingForNewPool, tokenAIndex, tokenBIndex, feeIndex])

  useEffect(() => {
    if (poolsData[poolKey]) {
      setMidPrice({
        index: poolsData[poolKey].currentTickIndex,
        x: calcYPerXPrice(poolsData[poolKey].sqrtPrice, xDecimal, yDecimal) ** (isXtoY ? 1 : -1)
      })
    }
  }, [poolIndex, isXtoY, xDecimal, yDecimal, poolsData])

  useEffect(() => {
    if (poolKey === '') {
      setMidPrice({
        index: 0n,
        x: calcPrice(0n, isXtoY, xDecimal, yDecimal)
      })
    }
  }, [poolIndex, isXtoY, xDecimal, yDecimal])

  const data = useMemo(() => {
    if (ticksLoading) {
      return createPlaceholderLiquidityPlot(isXtoY, 10, tickSpacing, xDecimal, yDecimal)
    }

    if (currentPairReversed === true) {
      return ticksData.map(tick => ({ ...tick, x: 1 / tick.x })).reverse()
    }

    // return ticksData
    return [
      { x: 23325447974241, y: 3515456564642, index: -221800n },
      { x: 17696332924783316, y: 3515456564642, index: -86400n },
      { x: 17874175093441211, y: 2888272708564642, index: -86300n },
      { x: 24614628971423147, y: 2888272708564642, index: -83100n },
      { x: 24861997676075247, y: 3122015160670114, index: -83000n },
      { x: 4058164786085533, y: 3122015160670114, index: -78100n },
      { x: 4098947970918356, y: 6798120298419236, index: -78000n },
      { x: 7104318581585853, y: 6798120298419236, index: -72500n },
      { x: 7175714582302408, y: 63116616687826810, index: -72400n },
      { x: 7247828089487176, y: 103118211463775000, index: -72300n },
      { x: 7320666312581503, y: 40008392896246605, index: -72200n },
      { x: 73942365351944686, y: 6798120298419236, index: -72100n },
      { x: 1092093240067303, y: 6798120298419236, index: -68200n },
      { x: 11030684080775426, y: 18316683272818106, index: -68100n },
      { x: 11141538728478760, y: 18478125267812714, index: -68000n },
      { x: 12944524133192408, y: 18478125267812714, index: -66500n },
      { x: 13074612226521648, y: 18441364216435223, index: -66400n },
      { x: 28520791689232563, y: 18441364216435223, index: -58600n },
      { x: 28807416008258230, y: 18412833034915223, index: -58500n },
      { x: 29096920804689200, y: 20589212878235222, index: -58400n },
      { x: 36988992006560494, y: 20589212878235222, index: -56000n },
      { x: 3736071887797880, y: 23015275657525220, index: -55900n },
      { x: 39670857703556180, y: 23015275657525220, index: -55300n },
      { x: 40069536418195060, y: 23012938233004166, index: -55200n },
      { x: 43842859027650400, y: 23012938233004166, index: -54300n },
      { x: 44283464945971560, y: 23030260840727626, index: -54200n },
      { x: 53016456010412410, y: 23030260840727626, index: -52400n },
      { x: 53549253478749060, y: 20604198061437625, index: -52300n },
      { x: 172525208100713830, y: 20604198061437625, index: -40600n },
      { x: 174259028142590950, y: 20636237842975731, index: -40500n },
      { x: 176010272492480940, y: 20636402425062337, index: -40400n },
      { x: 177779116254074920, y: 23877003552284246, index: -40300n },
      { x: 179565736299052840, y: 22320329676469790, index: -40200n },
      { x: 464282806208369300, y: 22320329676469790, index: -30700n },
      { x: 468948691525652000, y: 5565312432697905, index: -30600n },
      { x: 633005026986115800, y: 5565312432697905, index: -27600n },
      { x: 639366513607153000, y: 5586383981129444, index: -27500n },
      { x: 665458225183307600, y: 5586383981129444, index: -27100n },
      { x: 672145855477764700, y: 7299842445839966, index: -27000n },
      { x: 706605744005512500, y: 7299842445839966, index: -26500n },
      { x: 713706892963306500, y: 5567581673494276, index: -26400n },
      { x: 765453802791292800, y: 5567581673494276, index: -25700n },
      { x: 773146354850896500, y: 3854123208783754, index: -25600n },
      { x: 780916214466242200, y: 3833051660352215, index: -25500n },
      { x: 982849853121744800, y: 3833051660352215, index: -23200n },
      { x: 992727162034295100, y: 3847037112753617, index: -23100n },
      { x: 2466142252901906000, y: 3847037112753617, index: -14000n },
      { x: 2490926149202678500, y: 5463588577173167, index: -13900n },
      { x: 2780550943345723000, y: 5463588577173167, index: -12800n },
      { x: 2808494540741882200, y: 2259610423362562, index: -12700n },
      { x: 2836718961863780400, y: 2243152214701856, index: -12600n },
      { x: 2865227028872610400, y: 2243152214701856, index: -12500n },
      { x: 2894021592325372200, y: 1665691473385594, index: -12400n },
      { x: 8958390621002090000, y: 1665691473385594, index: -1100n },
      { x: 9048419419599340000, y: 4740153550385594, index: -1000n },
      { x: 10941693602297531000, y: 4740153550385594, index: 900n },
      { x: 11051653925679804000, y: 1665691473385594, index: 1000n },
      { x: 15840375539103381000, y: 1665691473385594, index: 4600n },
      { x: 15999565960643864000, y: 1651706020984192, index: 4700n },
      { x: 39746273853169480000, y: 1651706020984192, index: 13800n },
      { x: 40145710474677010000, y: 3515456564642, index: 13900n },
      { x: 4244507227635403000000, y: 3515456564642, index: 221700n },
      { x: 4287163091019355000000, y: 0, index: 221800n }
    ]
  }, [ticksData, ticksLoading, isXtoY, tickSpacing, xDecimal, yDecimal, currentPairReversed])

  useEffect(() => {
    if (
      tokenAIndex !== null &&
      tokenBIndex !== null &&
      poolIndex === null &&
      progress === 'approvedWithSuccess'
    ) {
      dispatch(
        poolsActions.getPoolData({
          tokenX: tokens[tokenAIndex].assetAddress.toString(),
          tokenY: tokens[tokenBIndex].assetAddress.toString(),
          feeTier: feeTiersArray[feeIndex].tier
        })
      )
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
    if (poolKey === '') {
      return undefined
    }

    // const poolAddress = poolsData[Number(poolIndex)].poolKey.toString()

    // if (!poolsVolumeRanges[poolAddress]) {
    //   return undefined
    // }

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

    const lowerTick = BigInt(Math.min(left, right))
    const upperTick = BigInt(Math.max(left, right))

    setLeftTick(lowerTick)
    setRightTick(upperTick)

    try {
      if (byX) {
        const { amount: tokenYAmount, l: positionLiquidity } = getLiquidityByX(
          amount,
          lowerTick,
          upperTick,
          // toSqrtPrice(1n, 0n),
          poolsData[poolKey] ? poolsData[poolKey].sqrtPrice : calculateSqrtPrice(midPrice.index),
          true
        )

        if (isMountedRef.current) {
          liquidityRef.current = positionLiquidity
        }
        setTokenAAmount(amount)
        setTokenBAmount(tokenYAmount)
        return tokenYAmount
      }

      const { amount: tokenXAmount, l: positionLiquidity } = getLiquidityByY(
        amount,
        lowerTick,
        upperTick,
        // toSqrtPrice(1n, 0n),
        poolsData[poolKey] ? poolsData[poolKey].sqrtPrice : calculateSqrtPrice(midPrice.index),
        true
      )

      if (isMountedRef.current) {
        liquidityRef.current = positionLiquidity
      }
      setTokenAAmount(tokenXAmount)
      setTokenBAmount(amount)
      return tokenXAmount
    } catch (error) {
      const result = (byX ? getLiquidityByY : getLiquidityByX)(
        amount,
        lowerTick,
        upperTick,
        poolsData[poolKey] ? poolsData[poolKey].sqrtPrice : calculateSqrtPrice(midPrice.index),
        true
      )
      if (isMountedRef.current) {
        liquidityRef.current = result.liquidity
      }
    }

    return BigInt(0)
  }

  useEffect(() => {
    if (openPosition && tokenAIndex !== null && tokenBIndex !== null) {
      dispatch(
        positionsActions.initPosition({
          poolKeyData: {
            tokenX: tokens[tokenAIndex].assetAddress.toString(),
            tokenY: tokens[tokenBIndex].assetAddress.toString(),
            feeTier: feeTiersArray[feeIndex].tier
          },
          lowerTick: leftTick,
          upperTick: rightTick,
          liquidityDelta: liquidityRef.current,
          spotSqrtPrice: poolsData[poolKey]
            ? poolsData[poolKey].sqrtPrice
            : calculateSqrtPrice(midPrice.index),
          // spotSqrtPrice: toSqrtPrice(1n, 0n),
          slippageTolerance: 0n,
          tokenXAmount: tokenAAmount,
          tokenYAmount: tokenBAmount,
          initPool: poolKey === ''
        })
      )
    }
    setOpenPosition(false)
  }, [openPosition])

  return (
    <NewPosition
      initialTokenFrom={initialTokenFrom}
      initialTokenTo={initialTokenTo}
      initialFee={initialFee}
      poolAddress='' // TODO - add real data
      tokens={tokens}
      data={data}
      midPrice={midPrice}
      setMidPrice={setMidPrice}
      onChangePositionTokens={(tokenA, tokenB, feeTierIndex) => {
        // if (
        //   tokenA !== null &&
        //   tokenB !== null &&
        //   tokenA !== tokenB &&
        //   !(
        //     tokenAIndex === tokenA &&
        //     tokenBIndex === tokenB &&
        //     fee === feeTiersArray[feeTierIndex].tier.fee
        //   )
        // ) {
        //   const index = poolsData.findIndex(
        //     pool =>
        //       pool.fee.v.eq(feeTiersArray[feeTierIndex].tier.fee) &&
        //       ((pool.tokenX.equals(tokens[tokenA].assetAddress) &&
        //         pool.tokenY.equals(tokens[tokenB].assetAddress)) ||
        //         (pool.tokenX.equals(tokens[tokenB].assetAddress) &&
        //           pool.tokenY.equals(tokens[tokenA].assetAddress)))
        //   )
        //   if (
        //     index !== poolIndex &&
        //     !(
        //       tokenAIndex === tokenB &&
        //       tokenBIndex === tokenA &&
        //       fee.eq(feeTiersArray[feeTierIndex].tier.fee)
        //     )
        //   ) {
        //     if (isMountedRef.current) {
        //       setPoolIndex(index !== -1 ? index : null)
        //       setCurrentPairReversed(null)
        //     }
        //   } else if (
        //     tokenAIndex === tokenB &&
        //     tokenBIndex === tokenA &&
        //     fee === feeTiersArray[feeTierIndex].tier.fee
        //   ) {
        //     if (isMountedRef.current) {
        //       setCurrentPairReversed(currentPairReversed === null ? true : !currentPairReversed)
        //     }
        //   }
        //   if (index !== -1 && index !== poolIndex) {
        //     // dispatch(
        //     //   actions.getCurrentPlotTicks({
        //     //     poolIndex: index,
        //     //     isXtoY: allPools[index].tokenX.equals(tokens[tokenA].assetAddress)
        //     //   })
        //     // )
        //   } else if (
        //     !(
        //       tokenAIndex === tokenB &&
        //       tokenBIndex === tokenA &&
        //       fee === feeTiersArray[feeTierIndex].tier.fee &&
        //     )
        //   ) {
        //     dispatch(
        //       poolsActions.getPoolData({
        //         tokenX: tokens[tokenAIndex].assetAddress.toString(),
        //         tokenY: tokens[tokenBIndex].assetAddress.toString(),
        //         feeTier: feeTiersArray[feeIndex].tier
        //       })
        //     )
        //   }
        // }
        if (
          // tokenAIndex === tokenB &&
          // tokenBIndex === tokenA &&
          // fee === feeTiersArray[feeTierIndex].tier.fee &&
          // tokenA !== null &&
          // tokenB !== null &&
          // tokenA !== tokenB &&
          tokenAIndex !== null &&
          tokenBIndex !== null
        ) {
          dispatch(
            poolsActions.getPoolData({
              tokenX: tokens[tokenAIndex].assetAddress.toString(),
              tokenY: tokens[tokenBIndex].assetAddress.toString(),
              feeTier: feeTiersArray[feeIndex].tier
            })
          )
        }

        setTokenAIndex(tokenA)
        setTokenBIndex(tokenB)
        setFeeIndex(feeTierIndex)
      }}
      isCurrentPoolExisting={poolKey !== ''}
      calcAmount={calcAmount}
      feeTiers={feeTiersArray.map(tier => {
        return {
          feeValue: +printBN(tier.tier.fee, 10n) //TODO replace 10n with DECIMAL - n
        }
      })}
      ticksLoading={ticksLoading}
      isXtoY={isXtoY}
      xDecimal={xDecimal}
      yDecimal={yDecimal}
      tickSpacing={tickSpacing}
      isWaitingForNewPool={isWaitingForNewPool}
      poolIndex={poolIndex}
      currentPairReversed={null}
      bestTiers={bestTiers[currentNetwork]}
      initialIsDiscreteValue={initialIsDiscreteValue}
      onDiscreteChange={setIsDiscreteValue}
      currentPriceSqrt={
        poolsData[poolKey] ? poolsData[poolKey].sqrtPrice : calculateSqrtPrice(midPrice.index) /////////////////////////////////////////////////////////
        // toSqrtPrice(1n, 0n)
      }
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
      reloadHandler={() => {
        if (poolKey !== '' && tokenAIndex !== null && tokenBIndex !== null) {
          // dispatch(
          //   actions.getCurrentPlotTicks({
          //     poolIndex,
          //     isXtoY: allPools[poolIndex].tokenX.equals(
          //       tokens[currentPairReversed === true ? tokenBIndex : tokenAIndex].assetAddress
          //     )
          //   })
          // )
        }
      }}
      plotVolumeRange={currentVolumeRange}
      currentFeeIndex={feeIndex}
      onSlippageChange={onSlippageChange}
      initialSlippage={initialSlippage}
      progress={progress}
      addLiquidityHandler={(leftTickIndex, rightTickIndex, xAmount, yAmount, slippage) => {
        if (tokenAIndex === null || tokenBIndex === null) {
          return
        }

        if (progress === 'none') {
          setProgress('progress')
        }
        if (tokenAIndex !== null) {
          console.log()
        }
        const lowerTick = Math.min(Number(leftTickIndex), Number(rightTickIndex))
        const upperTick = Math.max(Number(leftTickIndex), Number(rightTickIndex))

        // dispatch(
        //   poolsActions.initPool({
        //     tokenX: tokens[tokenAIndex].assetAddress.toString(),
        //     tokenY: tokens[tokenBIndex].assetAddress.toString(),
        //     feeTier: feeTiersArray[feeIndex].tier
        //   })
        // )

        // dispatch(
        //   positionsActions.initPosition({
        //     poolKeyData: {
        //       tokenX: tokens[tokenAIndex].assetAddress.toString(),
        //       tokenY: tokens[tokenBIndex].assetAddress.toString(),
        //       feeTier: feeTiersArray[feeIndex].tier
        //     },
        //     lowerTick: -10n,
        //     upperTick: 10n,
        //     liquidityDelta: liquidityRef.current,
        //     // spotSqrtPrice: poolKey
        //     //   ? poolsData[poolKey].sqrtPrice
        //     //   : priceToSqrtPrice(BigInt(midPrice.x)),
        //     spotSqrtPrice:  poolsData[poolKey] ? poolsData[poolKey].sqrtPrice : calculateSqrtPrice(midPrice.index),
        //     slippageTolerance: 500n,
        //     tokenXAmount: tokenAAmount,
        //     tokenYAmount: tokenBAmount,
        //     initPool: poolKey === ''
        //   })
        // )
        setOpenPosition(true)
      }}
      showNoConnected={walletStatus !== Status.Initialized}
      noConnectedBlockerProps={{
        onConnect: openWalletSelectorModal,
        descCustomText: 'Cannot add any liquidity.'
      }}
      poolKey={poolKey}
    />
  )
}

export default NewPositionWrapper
