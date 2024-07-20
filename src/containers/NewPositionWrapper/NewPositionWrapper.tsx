import { ProgressState } from '@components/AnimatedButton/AnimatedButton'
import NewPosition from '@components/NewPosition/NewPosition'
import {
  calculateSqrtPrice,
  getLiquidityByX,
  getLiquidityByY,
  newPoolKey
} from '@invariant-labs/a0-sdk'
import { PERCENTAGE_SCALE } from '@invariant-labs/a0-sdk/target/consts'
import {
  ALL_FEE_TIERS_DATA,
  DEFAULT_NEW_POSITION_SLIPPAGE,
  U128MAX,
  bestTiers,
  commonTokensForNetworks
} from '@store/consts/static'
import { PositionOpeningMethod, TokenPriceData } from '@store/consts/types'
import {
  addNewTokenToLocalStorage,
  calcPriceBySqrtPrice,
  calcPriceByTickIndex,
  createPlaceholderLiquidityPlot,
  getCoinGeckoTokenPrice,
  getMockedTokenPrice,
  getNewTokenOrThrow,
  poolKeyToString,
  printBigint
} from '@utils/utils'
import { actions as poolsActions } from '@store/reducers/pools'
import { InitMidPrice, actions as positionsActions } from '@store/reducers/positions'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { Status, actions as walletActions } from '@store/reducers/wallet'
import { networkType } from '@store/selectors/connection'
import {
  isLoadingLatestPoolsForTransaction,
  isLoadingTicksAndTickMaps,
  poolKeys,
  pools,
  poolsArraySortedByFees
} from '@store/selectors/pools'
import { initPosition, plotTicks, shouldNotUpdateRange } from '@store/selectors/positions'
import { address, balanceLoading, status, swapTokens } from '@store/selectors/wallet'
import SingletonPSP22 from '@store/services/psp22Singleton'
import { openWalletSelectorModal } from '@utils/web3/selector'
import { VariantType } from 'notistack'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

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
  const walletAddress = useSelector(address)
  const tokens = useSelector(swapTokens)
  const walletStatus = useSelector(status)
  const allPools = useSelector(poolsArraySortedByFees)
  const allPoolKeys = useSelector(poolKeys)
  const poolsData = useSelector(pools)
  const loadingTicksAndTickMaps = useSelector(isLoadingTicksAndTickMaps)
  const isBalanceLoading = useSelector(balanceLoading)
  const shouldNotUpdatePriceRange = useSelector(shouldNotUpdateRange)

  const { success, inProgress } = useSelector(initPosition)
  const { data: ticksData, loading: ticksLoading, hasError: hasTicksError } = useSelector(plotTicks)
  const isFetchingNewPool = useSelector(isLoadingLatestPoolsForTransaction)
  const currentNetwork = useSelector(networkType)

  const tokensList = useSelector(swapTokens)

  const [poolIndex, setPoolIndex] = useState<number | null>(null)

  const [poolKey, setPoolKey] = useState<string>('')
  const [progress, setProgress] = useState<ProgressState>('none')

  const [tokenAIndex, setTokenAIndex] = useState<number | null>(null)
  const [tokenBIndex, setTokenBIndex] = useState<number | null>(null)

  const [currentPairReversed, setCurrentPairReversed] = useState<boolean | null>(null)

  const [initialLoader, setInitialLoader] = useState(true)

  const [isGetLiquidityError, setIsGetLiquidityError] = useState(false)

  const isMountedRef = useRef(false)

  useEffect(() => {
    dispatch(poolsActions.getPoolKeys())
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const liquidityRef = useRef<bigint>(0n)

  useEffect(() => {
    setProgress('none')
  }, [poolIndex])

  useEffect(() => {
    let timeoutId1: NodeJS.Timeout
    let timeoutId2: NodeJS.Timeout

    if (!inProgress && progress === 'progress') {
      setProgress(success ? 'approvedWithSuccess' : 'approvedWithFail')

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

  useEffect(() => {
    if (
      success &&
      poolKey !== '' &&
      tokenAIndex !== null &&
      tokenBIndex !== null &&
      poolIndex !== null &&
      !loadingTicksAndTickMaps
    ) {
      dispatch(
        positionsActions.getCurrentPlotTicks({
          poolKey: allPoolKeys[poolKey],
          isXtoY:
            allPools[poolIndex].poolKey.tokenX ===
            tokens[currentPairReversed === true ? tokenBIndex : tokenAIndex].assetAddress,
          disableLoading: true
        })
      )
    }
  }, [success, poolKey, tokenAIndex, tokenBIndex, poolIndex, loadingTicksAndTickMaps])

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
  }, [tokenAIndex, tokenBIndex, tokens])

  const yDecimal = useMemo(() => {
    if (tokenAIndex !== null && tokenBIndex !== null) {
      return tokens[tokenAIndex].assetAddress.toString() <
        tokens[tokenBIndex].assetAddress.toString()
        ? tokens[tokenBIndex].decimals
        : tokens[tokenAIndex].decimals
    }
    return 0n
  }, [tokenAIndex, tokenBIndex, tokens])

  const [feeIndex, setFeeIndex] = useState(0)

  const fee = useMemo(
    () => (ALL_FEE_TIERS_DATA[feeIndex] ? ALL_FEE_TIERS_DATA[feeIndex].tier.fee : 1n),
    [feeIndex]
  )

  const tickSpacing = useMemo(
    () => (ALL_FEE_TIERS_DATA[feeIndex] ? ALL_FEE_TIERS_DATA[feeIndex].tier.tickSpacing : 1n),
    [feeIndex]
  )

  const [midPrice, setMidPrice] = useState<InitMidPrice>({
    index: 0n,
    x: 1,
    sqrtPrice: 0n
  })

  const isWaitingForNewPool = useMemo(() => {
    if (poolKey !== '') {
      return false
    }

    return isFetchingNewPool
  }, [isFetchingNewPool, poolKey])

  useEffect(() => {
    if (initialLoader && !isWaitingForNewPool) {
      setInitialLoader(false)
    }
  }, [isWaitingForNewPool])

  useEffect(() => {
    if (tokenAIndex !== null && tokenBIndex !== null && tokenAIndex !== tokenBIndex) {
      const tokenA = tokens[tokenAIndex].assetAddress.toString()
      const tokenB = tokens[tokenBIndex].assetAddress.toString()

      const keyStringified = poolKeyToString({
        tokenX: isXtoY ? tokenA : tokenB,
        tokenY: isXtoY ? tokenB : tokenA,
        feeTier: ALL_FEE_TIERS_DATA[feeIndex].tier
      })

      if (allPoolKeys[keyStringified]) {
        setPoolKey(keyStringified)
      } else {
        setPoolKey('')
      }

      const index = allPools.findIndex(pool => {
        return (
          pool.poolKey.feeTier.fee === fee &&
          ((pool.poolKey.tokenX === tokens[tokenAIndex].assetAddress &&
            pool.poolKey.tokenY === tokens[tokenBIndex].assetAddress) ||
            (pool.poolKey.tokenX === tokens[tokenBIndex].assetAddress &&
              pool.poolKey.tokenY === tokens[tokenAIndex].assetAddress))
        )
      })

      setPoolIndex(index !== -1 ? index : null)

      if (poolKey !== '') {
        dispatch(
          positionsActions.getCurrentPlotTicks({
            poolKey: allPoolKeys[poolKey],
            isXtoY,
            fetchTicksAndTickmap: true
          })
        )
      }
    }
  }, [
    isWaitingForNewPool,
    tokenAIndex,
    tokenBIndex,
    feeIndex,
    poolKey,
    walletStatus,
    allPoolKeys,
    allPools
  ])

  useEffect(() => {
    if (poolsData[poolKey]) {
      setMidPrice({
        index: poolsData[poolKey].currentTickIndex,
        x: calcPriceBySqrtPrice(poolsData[poolKey].sqrtPrice, isXtoY, xDecimal, yDecimal),
        sqrtPrice: poolsData[poolKey].sqrtPrice
      })
    }
  }, [poolKey, isXtoY, xDecimal, yDecimal, poolsData])

  useEffect(() => {
    if (poolKey === '') {
      setMidPrice({
        index: 0n,
        x: calcPriceByTickIndex(0n, isXtoY, xDecimal, yDecimal),
        sqrtPrice: 0n
      })
    }
  }, [poolIndex, isXtoY, xDecimal, yDecimal, poolKey])

  const data = useMemo(() => {
    if (ticksLoading) {
      return createPlaceholderLiquidityPlot(isXtoY, 10, tickSpacing, xDecimal, yDecimal)
    }

    return ticksData
  }, [ticksData, ticksLoading, isXtoY, tickSpacing, xDecimal, yDecimal])

  useEffect(() => {
    if (
      tokenAIndex !== null &&
      tokenBIndex !== null &&
      poolIndex === null &&
      progress === 'approvedWithSuccess'
    ) {
      dispatch(
        poolsActions.getPoolData(
          newPoolKey(
            tokens[tokenAIndex].assetAddress.toString(),
            tokens[tokenBIndex].assetAddress.toString(),
            ALL_FEE_TIERS_DATA[feeIndex].tier
          )
        )
      )
    }
  }, [progress])

  useEffect(() => {
    if (tokenAIndex !== null && tokenBIndex !== null && !poolsData[poolKey]) {
      dispatch(
        poolsActions.getPoolData(
          newPoolKey(
            tokens[tokenAIndex].assetAddress.toString(),
            tokens[tokenBIndex].assetAddress.toString(),
            ALL_FEE_TIERS_DATA[feeIndex].tier
          )
        )
      )
    }
  }, [poolKey])

  const addTokenHandler = async (address: string) => {
    const psp22 = SingletonPSP22.getInstance()

    if (psp22 && tokensList.findIndex(token => token.address.toString() === address) === -1) {
      getNewTokenOrThrow(address, psp22, walletAddress)
        .then(data => {
          dispatch(poolsActions.addTokens(data))
          dispatch(walletActions.getBalances(Object.keys(data)))
          addNewTokenToLocalStorage(address, currentNetwork)
          dispatch(
            snackbarsActions.add({
              message: 'Token added to your list',
              variant: 'success',
              persist: false
            })
          )
        })
        .catch(() => {
          dispatch(
            snackbarsActions.add({
              message: 'Token adding failed',
              variant: 'error',
              persist: false
            })
          )
        })
    } else {
      dispatch(
        snackbarsActions.add({
          message: 'Token already exists on your list',
          variant: 'info',
          persist: false
        })
      )
    }
  }

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
      getCoinGeckoTokenPrice(id)
        .then(data => setTokenAPriceData({ price: data ?? 0 }))
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
      getCoinGeckoTokenPrice(id)
        .then(data => setTokenBPriceData({ price: data ?? 0 }))
        .catch(() =>
          setTokenBPriceData(getMockedTokenPrice(tokens[tokenBIndex].symbol, currentNetwork))
        )
        .finally(() => setPriceBLoading(false))
    } else {
      setTokenBPriceData(undefined)
    }
  }, [tokenBIndex])

  const initialSlippage =
    localStorage.getItem('INVARIANT_NEW_POSITION_SLIPPAGE') ?? DEFAULT_NEW_POSITION_SLIPPAGE

  const onSlippageChange = (slippage: string) => {
    localStorage.setItem('INVARIANT_NEW_POSITION_SLIPPAGE', slippage)
  }

  const calcAmount = (amount: bigint, left: number, right: number, tokenAddress: string) => {
    if (tokenAIndex === null || tokenBIndex === null || isNaN(left) || isNaN(right)) {
      return BigInt(0)
    }

    const byX =
      tokenAddress ===
      (isXtoY ? tokens[tokenAIndex].assetAddress : tokens[tokenBIndex].assetAddress)

    const lowerTick = BigInt(Math.min(left, right))
    const upperTick = BigInt(Math.max(left, right))

    try {
      if (byX) {
        const { amount: tokenYAmount, l: positionLiquidity } = getLiquidityByX(
          amount,
          lowerTick,
          upperTick,
          poolsData[poolKey] ? poolsData[poolKey].sqrtPrice : midPrice.sqrtPrice,
          true
        )

        if (isMountedRef.current) {
          liquidityRef.current = positionLiquidity
        }
        setIsGetLiquidityError(false)
        return tokenYAmount
      }
    } catch (error) {
      setIsGetLiquidityError(true)
      return printBigint(U128MAX, tokens[tokenAIndex].decimals)
    }

    try {
      const { amount: tokenXAmount, l: positionLiquidity } = getLiquidityByY(
        amount,
        lowerTick,
        upperTick,
        poolsData[poolKey] ? poolsData[poolKey].sqrtPrice : midPrice.sqrtPrice,
        true
      )

      if (isMountedRef.current) {
        liquidityRef.current = positionLiquidity
      }
      setIsGetLiquidityError(false)
      return tokenXAmount
    } catch (error) {
      setIsGetLiquidityError(true)
      return printBigint(U128MAX, tokens[tokenBIndex].decimals)
    }

    return BigInt(0)
  }

  const unblockUpdatePriceRange = () => {
    dispatch(positionsActions.setShouldNotUpdateRange(false))
  }
  const onRefresh = () => {
    if (!success) {
      dispatch(positionsActions.setShouldNotUpdateRange(true))
    }

    if (tokenAIndex !== null && tokenBIndex !== null) {
      dispatch(
        walletActions.getBalances([
          tokens[tokenAIndex].assetAddress.toString(),
          tokens[tokenBIndex].assetAddress.toString()
        ])
      )

      dispatch(
        poolsActions.getPoolData(
          newPoolKey(
            tokens[tokenAIndex].assetAddress.toString(),
            tokens[tokenBIndex].assetAddress.toString(),
            ALL_FEE_TIERS_DATA[feeIndex].tier
          )
        )
      )

      if (poolKey !== '' && poolIndex !== null) {
        dispatch(
          positionsActions.getCurrentPlotTicks({
            poolKey: allPoolKeys[poolKey],
            isXtoY:
              allPools[poolIndex].poolKey.tokenX ===
              tokens[currentPairReversed === true ? tokenBIndex : tokenAIndex].assetAddress,
            fetchTicksAndTickmap: true
          })
        )
      }
    }
  }

  return (
    <NewPosition
      initialTokenFrom={initialTokenFrom}
      initialTokenTo={initialTokenTo}
      initialFee={initialFee}
      copyPoolAddressHandler={copyPoolAddressHandler}
      tokens={tokens}
      data={data}
      midPrice={midPrice}
      setMidPrice={setMidPrice}
      onChangePositionTokens={(tokenA, tokenB, feeTierIndex) => {
        if (
          tokenA !== null &&
          tokenB !== null &&
          tokenA !== tokenB &&
          !(
            tokenAIndex === tokenA &&
            tokenBIndex === tokenB &&
            fee === ALL_FEE_TIERS_DATA[feeTierIndex].tier.fee
          )
        ) {
          const index = allPools.findIndex(
            pool =>
              pool.poolKey.feeTier.fee === fee &&
              ((pool.poolKey.tokenX === tokens[tokenA].assetAddress &&
                pool.poolKey.tokenY === tokens[tokenB].assetAddress) ||
                (pool.poolKey.tokenX === tokens[tokenA].assetAddress &&
                  pool.poolKey.tokenY === tokens[tokenB].assetAddress))
          )

          if (
            index !== poolIndex &&
            !(
              tokenAIndex === tokenB &&
              tokenBIndex === tokenA &&
              fee === ALL_FEE_TIERS_DATA[feeTierIndex].tier.fee
            )
          ) {
            if (isMountedRef.current) {
              setPoolIndex(index !== -1 ? index : null)
              setCurrentPairReversed(null)
            }
          } else if (
            tokenAIndex === tokenB &&
            tokenBIndex === tokenA &&
            fee === ALL_FEE_TIERS_DATA[feeTierIndex].tier.fee
          ) {
            if (isMountedRef.current) {
              setCurrentPairReversed(currentPairReversed === null ? true : !currentPairReversed)
            }
          }
          if (poolKey.length > 0 && index !== poolIndex && tokenAIndex !== null) {
            dispatch(
              positionsActions.getCurrentPlotTicks({
                poolKey: allPoolKeys[poolKey],
                isXtoY: allPoolKeys[poolKey].tokenX === tokens[tokenAIndex].assetAddress.toString()
              })
            )
          } else if (
            !(
              tokenAIndex === tokenB &&
              tokenBIndex === tokenA &&
              fee === ALL_FEE_TIERS_DATA[feeTierIndex].tier.fee
            )
          ) {
            dispatch(
              poolsActions.getPoolData(
                newPoolKey(
                  tokens[tokenA].address.toString(),
                  tokens[tokenB].address.toString(),
                  ALL_FEE_TIERS_DATA[feeTierIndex].tier
                )
              )
            )
          }
        }

        setTokenAIndex(tokenA)
        setTokenBIndex(tokenB)
        setFeeIndex(feeTierIndex)
      }}
      isCurrentPoolExisting={!!allPoolKeys[poolKey] || poolKey !== ''}
      calcAmount={calcAmount}
      feeTiers={ALL_FEE_TIERS_DATA.map(tier => {
        return {
          feeValue: +printBigint(tier.tier.fee, PERCENTAGE_SCALE - 2n)
        }
      })}
      ticksLoading={ticksLoading}
      loadingTicksAndTickMaps={loadingTicksAndTickMaps}
      isXtoY={isXtoY}
      xDecimal={xDecimal}
      yDecimal={yDecimal}
      tickSpacing={tickSpacing}
      isWaitingForNewPool={isWaitingForNewPool || initialLoader}
      poolIndex={poolIndex}
      currentPairReversed={currentPairReversed}
      bestTiers={bestTiers[currentNetwork]}
      currentPriceSqrt={
        poolsData[poolKey] ? poolsData[poolKey].sqrtPrice : calculateSqrtPrice(midPrice.index)
      }
      handleAddToken={addTokenHandler}
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
        if (poolKey !== '' && tokenAIndex !== null && tokenBIndex !== null && poolIndex !== null) {
          dispatch(
            positionsActions.getCurrentPlotTicks({
              poolKey: allPoolKeys[poolKey],
              isXtoY:
                allPools[poolIndex].poolKey.tokenX ===
                tokens[currentPairReversed === true ? tokenBIndex : tokenAIndex].assetAddress
            })
          )
        }
      }}
      currentFeeIndex={feeIndex}
      onSlippageChange={onSlippageChange}
      initialSlippage={initialSlippage}
      progress={progress}
      addLiquidityHandler={(leftTickIndex, rightTickIndex, xAmount, yAmount, slippage) => {
        if (tokenAIndex === null || tokenBIndex === null) {
          return
        }
        if (poolKey !== '') {
          dispatch(positionsActions.setShouldNotUpdateRange(true))
        }
        if (progress === 'none') {
          setProgress('progress')
        }

        const lowerTickIndex = leftTickIndex < rightTickIndex ? leftTickIndex : rightTickIndex
        const upperTickIndex = rightTickIndex > leftTickIndex ? rightTickIndex : leftTickIndex

        dispatch(
          positionsActions.initPosition({
            poolKeyData: newPoolKey(
              tokens[tokenAIndex].assetAddress.toString(),
              tokens[tokenBIndex].assetAddress.toString(),
              ALL_FEE_TIERS_DATA[feeIndex].tier
            ),
            lowerTick: lowerTickIndex,
            upperTick: upperTickIndex,
            liquidityDelta: liquidityRef.current,
            spotSqrtPrice: poolsData[poolKey] ? poolsData[poolKey].sqrtPrice : midPrice.sqrtPrice,
            slippageTolerance: slippage,
            tokenXAmount: xAmount,
            tokenYAmount: yAmount,
            initPool: poolKey === ''
          })
        )
      }}
      showNoConnected={walletStatus !== Status.Initialized}
      noConnectedBlockerProps={{
        onConnect: openWalletSelectorModal,
        descCustomText: 'Cannot add any liquidity.'
      }}
      poolKey={poolKey}
      onRefresh={onRefresh}
      isBalanceLoading={isBalanceLoading}
      shouldNotUpdatePriceRange={shouldNotUpdatePriceRange}
      unblockUpdatePriceRange={unblockUpdatePriceRange}
      isGetLiquidityError={isGetLiquidityError}
    />
  )
}

export default NewPositionWrapper
