import { ProgressState } from '@components/AnimatedButton/AnimatedButton'
import Slippage from '@components/Modals/Slippage/Slippage'
import Refresher from '@components/Refresher/Refresher'
import { getMaxTick, getMinTick, Network } from '@invariant-labs/a0-sdk'
import { PERCENTAGE_DENOMINATOR } from '@invariant-labs/a0-sdk/target/consts'
import { Box, Button, Grid, Hidden, Typography } from '@mui/material'
import backIcon from '@static/svg/back-arrow.svg'
import settingIcon from '@static/svg/settings.svg'
import { ALL_FEE_TIERS_DATA, PositionTokenBlock, REFRESHER_INTERVAL } from '@store/consts/static'
import {
  addressToTicker,
  calcPriceBySqrtPrice,
  calculateConcentrationRange,
  convertBalanceToBigint,
  determinePositionTokenBlock,
  parseFeeToPathFee,
  printBigint,
  trimLeadingZeros,
  validConcentrationMidPriceTick
} from '@utils/utils'
import { PlotTickData, InitMidPrice } from '@store/reducers/positions'
import { SwapToken } from '@store/selectors/wallet'
import { blurContent, unblurContent } from '@utils/uiUtils'
import { VariantType } from 'notistack'
import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ConcentrationTypeSwitch from './ConcentrationTypeSwitch/ConcentrationTypeSwitch'
import DepositSelector from './DepositSelector/DepositSelector'
import MarketIdLabel from './MarketIdLabel/MarketIdLabel'
import PoolInit from './PoolInit/PoolInit'
import RangeSelector from './RangeSelector/RangeSelector'
import useStyles from './style'
import { BestTier, PositionOpeningMethod, TokenPriceData } from '@store/consts/types'
import { getConcentrationArray } from '@invariant-labs/a0-sdk/target/utils'
import { TooltipHover } from '@components/TooltipHover/TooltipHover'
import { Status } from '@store/reducers/wallet'

export interface INewPosition {
  initialTokenFrom: string
  initialTokenTo: string
  initialFee: string
  copyPoolAddressHandler: (message: string, variant: VariantType) => void
  tokens: Record<string, SwapToken>
  data: PlotTickData[]
  midPrice: InitMidPrice
  setMidPrice: (mid: InitMidPrice) => void
  addLiquidityHandler: (
    leftTickIndex: bigint,
    rightTickIndex: bigint,
    xAmount: bigint,
    yAmount: bigint,
    slippage: bigint
  ) => void
  onChangePositionTokens: (
    tokenAAddress: string | null,
    tokenBAddress: string | null,
    feeTierIndex: number
  ) => void
  isCurrentPoolExisting: boolean
  calcAmount: (
    amount: bigint,
    leftRangeTickIndex: number,
    rightRangeTickIndex: number,
    tokenAddress: string
  ) => bigint
  feeTiers: Array<{
    feeValue: number
  }>
  ticksLoading: boolean
  loadingTicksAndTickMaps: boolean
  progress: ProgressState
  isXtoY: boolean
  xDecimal: bigint
  yDecimal: bigint
  tickSpacing: bigint
  isWaitingForNewPool: boolean
  poolIndex: number | null
  currentPairReversed: boolean | null
  bestTiers: BestTier[]
  currentPriceSqrt: bigint
  handleAddToken: (address: string) => void
  commonTokens: string[]
  initialOpeningPositionMethod: PositionOpeningMethod
  onPositionOpeningMethodChange: (val: PositionOpeningMethod) => void
  initialHideUnknownTokensValue: boolean
  onHideUnknownTokensChange: (val: boolean) => void
  tokenAPriceData?: TokenPriceData
  tokenBPriceData?: TokenPriceData
  priceALoading?: boolean
  priceBLoading?: boolean
  hasTicksError?: boolean
  reloadHandler: () => void
  currentFeeIndex: number
  onSlippageChange: (slippage: string) => void
  initialSlippage: string
  poolKey: string
  onRefresh: () => void
  isBalanceLoading: boolean
  shouldNotUpdatePriceRange: boolean
  unblockUpdatePriceRange: () => void
  isGetLiquidityError: boolean
  onlyUserPositions: boolean
  setOnlyUserPositions: (val: boolean) => void
  network: Network
  isLoadingTokens: boolean
  azeroBalance: bigint
  walletStatus: Status
  onConnectWallet: () => void
  onDisconnectWallet: () => void
}

export const NewPosition: React.FC<INewPosition> = ({
  initialTokenFrom,
  initialTokenTo,
  initialFee,
  copyPoolAddressHandler,
  tokens,
  data,
  midPrice,
  setMidPrice,
  addLiquidityHandler,
  progress = 'progress',
  onChangePositionTokens,
  isCurrentPoolExisting,
  calcAmount,
  feeTiers,
  ticksLoading,
  isXtoY,
  xDecimal,
  yDecimal,
  tickSpacing,
  isWaitingForNewPool,
  poolIndex,
  currentPairReversed,
  bestTiers,
  handleAddToken,
  commonTokens,
  initialOpeningPositionMethod,
  onPositionOpeningMethodChange,
  initialHideUnknownTokensValue,
  onHideUnknownTokensChange,
  tokenAPriceData,
  tokenBPriceData,
  priceALoading,
  priceBLoading,
  hasTicksError,
  reloadHandler,
  currentFeeIndex,
  onSlippageChange,
  initialSlippage,
  poolKey,
  currentPriceSqrt,
  onRefresh,
  isBalanceLoading,
  shouldNotUpdatePriceRange,
  unblockUpdatePriceRange,
  isGetLiquidityError,
  onlyUserPositions,
  setOnlyUserPositions,
  network,
  isLoadingTokens,
  azeroBalance,
  walletStatus,
  onConnectWallet,
  onDisconnectWallet
}) => {
  const { classes } = useStyles()
  const navigate = useNavigate()

  const [positionOpeningMethod, setPositionOpeningMethod] = useState<PositionOpeningMethod>(
    initialOpeningPositionMethod
  )

  const [leftRange, setLeftRange] = useState(getMinTick(tickSpacing))
  const [rightRange, setRightRange] = useState(getMaxTick(tickSpacing))

  const [tokenA, setTokenA] = useState<string | null>(null)
  const [tokenB, setTokenB] = useState<string | null>(null)

  const [tokenADeposit, setTokenADeposit] = useState<string>('')
  const [tokenBDeposit, setTokenBDeposit] = useState<string>('')

  const [settings, setSettings] = React.useState<boolean>(false)
  const [slippTolerance, setSlippTolerance] = React.useState<string>(initialSlippage)
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)

  const [concentrationIndex, setConcentrationIndex] = useState(0)

  const [minimumSliderIndex, setMinimumSliderIndex] = useState<number>(0)
  const [refresherTime, setRefresherTime] = React.useState<number>(REFRESHER_INTERVAL)

  const [shouldReversePlot, setShouldReversePlot] = useState(false)

  const concentrationArray = useMemo(() => {
    const validatedMidPrice = validConcentrationMidPriceTick(midPrice.index, isXtoY, tickSpacing)

    return getConcentrationArray(Number(tickSpacing), 2, Number(validatedMidPrice)).sort(
      (a, b) => a - b
    )
  }, [tickSpacing, midPrice.index])

  const setRangeBlockerInfo = () => {
    if (tokenA === null || tokenB === null) {
      return 'Select tokens to set price range.'
    }

    if (tokenA === tokenB) {
      return "Token A can't be the same as token B"
    }

    if (isWaitingForNewPool) {
      return 'Loading pool info...'
    }

    return ''
  }

  const noRangePlaceholderProps = {
    data: Array(100)
      .fill(1)
      .map((_e, index) => ({ x: 0, y: 0, index: BigInt(index) })),
    midPrice: {
      x: 50,
      index: 0n
    },
    tokenASymbol: 'ABC',
    tokenBSymbol: 'XYZ'
  }

  const getOtherTokenAmount = (amount: bigint, left: number, right: number, byFirst: boolean) => {
    const [printAddress, calcAddress] = byFirst ? [tokenB, tokenA] : [tokenA, tokenB]
    if (printAddress === null || calcAddress === null) {
      return '0.0'
    }

    const result = calcAmount(amount, left, right, tokens[calcAddress].assetAddress)

    return trimLeadingZeros(printBigint(result, tokens[printAddress].decimals))
  }

  const getTicksInsideRange = (left: bigint, right: bigint, isXtoY: boolean) => {
    const leftMax = isXtoY ? getMinTick(tickSpacing) : getMaxTick(tickSpacing)
    const rightMax = isXtoY ? getMaxTick(tickSpacing) : getMinTick(tickSpacing)

    let leftInRange
    let rightInRange

    if (isXtoY) {
      leftInRange = left < leftMax ? leftMax : left
      rightInRange = right > rightMax ? rightMax : right
    } else {
      leftInRange = left > leftMax ? leftMax : left
      rightInRange = right < rightMax ? rightMax : right
    }

    return { leftInRange, rightInRange }
  }

  const onChangeRange = (left: bigint, right: bigint) => {
    let leftRange: bigint
    let rightRange: bigint

    if (positionOpeningMethod === 'range') {
      const { leftInRange, rightInRange } = getTicksInsideRange(left, right, isXtoY)
      leftRange = leftInRange
      rightRange = rightInRange
    } else {
      leftRange = left
      rightRange = right
    }
    leftRange = left
    rightRange = right

    setLeftRange(left)
    setRightRange(right)

    if (tokenA !== null && (isXtoY ? rightRange > midPrice.index : rightRange < midPrice.index)) {
      const deposit = tokenADeposit
      const amount = getOtherTokenAmount(
        convertBalanceToBigint(deposit, Number(tokens[tokenA].decimals)),
        Number(leftRange),
        Number(rightRange),
        true
      )

      if (tokenB !== null && +deposit !== 0) {
        setTokenADeposit(deposit)
        setTokenBDeposit(amount)
        return
      }
    }

    if (tokenB !== null && (isXtoY ? leftRange < midPrice.index : leftRange > midPrice.index)) {
      const deposit = tokenBDeposit
      const amount = getOtherTokenAmount(
        convertBalanceToBigint(deposit, Number(tokens[tokenB].decimals)),
        Number(leftRange),
        Number(rightRange),
        false
      )

      if (tokenA !== null && +deposit !== 0) {
        setTokenBDeposit(deposit)
        setTokenADeposit(amount)
      }
    }
  }

  const onChangeMidPrice = (tickIndex: bigint, sqrtPrice: bigint) => {
    setMidPrice({
      index: tickIndex,
      x: calcPriceBySqrtPrice(sqrtPrice, isXtoY, xDecimal, yDecimal),
      sqrtPrice: sqrtPrice
    })

    if (tokenA !== null && (isXtoY ? rightRange > tickIndex : rightRange < tickIndex)) {
      const deposit = tokenADeposit
      const amount = getOtherTokenAmount(
        convertBalanceToBigint(deposit, Number(tokens[tokenA].decimals)),
        Number(leftRange),
        Number(rightRange),
        true
      )
      if (tokenB !== null && +deposit !== 0) {
        setTokenADeposit(deposit)
        setTokenBDeposit(amount)
        return
      }
    }
    if (tokenB !== null && (isXtoY ? leftRange < tickIndex : leftRange > tickIndex)) {
      const deposit = tokenBDeposit
      const amount = getOtherTokenAmount(
        convertBalanceToBigint(deposit, Number(tokens[tokenB].decimals)),
        Number(leftRange),
        Number(rightRange),
        false
      )
      if (tokenA !== null && +deposit !== 0) {
        setTokenBDeposit(deposit)
        setTokenADeposit(amount)
      }
    }
  }

  const bestTierIndex =
    tokenA === null || tokenB === null
      ? undefined
      : bestTiers.find(tier => {
          return (
            (tier.tokenX === tokenA && tier.tokenY === tokenB) ||
            (tier.tokenX === tokenB && tier.tokenY === tokenA)
          )
        })?.bestTierIndex ?? undefined

  const getMinSliderIndex = () => {
    let minimumSliderIndex = 0

    for (let index = 0; index < concentrationArray.length; index++) {
      const value = concentrationArray[index]

      const { leftRange, rightRange } = calculateConcentrationRange(
        tickSpacing,
        value,
        2,
        midPrice.index,
        isXtoY
      )

      const { leftInRange, rightInRange } = getTicksInsideRange(
        BigInt(leftRange),
        BigInt(rightRange),
        isXtoY
      )

      if (leftInRange !== leftRange || rightInRange !== rightRange) {
        minimumSliderIndex = index + 1
      } else {
        break
      }
    }

    return minimumSliderIndex
  }

  useEffect(() => {
    if (positionOpeningMethod === 'concentration') {
      const minimumSliderIndex = getMinSliderIndex()

      setMinimumSliderIndex(minimumSliderIndex)
    }
  }, [poolIndex, positionOpeningMethod, midPrice.index])

  useEffect(() => {
    if (!ticksLoading && positionOpeningMethod === 'range') {
      onChangeRange(leftRange, rightRange)
    }
  }, [midPrice.index, leftRange, rightRange])

  useEffect(() => {
    if (positionOpeningMethod === 'range') {
      onChangeRange(leftRange, rightRange)
    }
  }, [currentPriceSqrt])

  const handleClickSettings = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
    blurContent()
    setSettings(true)
  }

  const handleCloseSettings = () => {
    unblurContent()
    setSettings(false)
  }

  const setSlippage = (slippage: string): void => {
    setSlippTolerance(slippage)
    onSlippageChange(slippage)
  }

  const updatePath = (address1: string | null, address2: string | null, fee: number) => {
    const parsedFee = parseFeeToPathFee(ALL_FEE_TIERS_DATA[fee].tier.fee)

    if (address1 != null && address2 != null) {
      const token1Symbol = addressToTicker(network, address1)
      const token2Symbol = addressToTicker(network, address2)
      navigate(`/newPosition/${token1Symbol}/${token2Symbol}/${parsedFee}`, { replace: true })
    } else if (address1 != null) {
      const tokenSymbol = addressToTicker(network, address1)
      navigate(`/newPosition/${tokenSymbol}/${parsedFee}`, { replace: true })
    } else if (address2 != null) {
      const tokenSymbol = addressToTicker(network, address2)
      navigate(`/newPosition/${tokenSymbol}/${parsedFee}`, { replace: true })
    } else if (fee != null) {
      navigate(`/newPosition/${parsedFee}`, { replace: true })
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (refresherTime > 0 && isCurrentPoolExisting) {
        setRefresherTime(refresherTime - 1)
      } else if (isCurrentPoolExisting) {
        onRefresh()
        setRefresherTime(REFRESHER_INTERVAL)
      }
    }, 1000)

    return () => clearTimeout(timeout)
  }, [refresherTime, poolKey])

  const [lastPoolKey, setLastPoolKey] = useState<string | null>(poolKey)

  useEffect(() => {
    if (poolKey != lastPoolKey) {
      setLastPoolKey(lastPoolKey)
      setRefresherTime(REFRESHER_INTERVAL)
    }
  }, [poolKey])

  const blockedToken = useMemo(
    () =>
      positionOpeningMethod === 'range'
        ? determinePositionTokenBlock(
            currentPriceSqrt,
            BigInt(Math.min(Number(leftRange), Number(rightRange))),
            BigInt(Math.max(Number(leftRange), Number(rightRange))),
            isXtoY
          )
        : false,
    [leftRange, rightRange, currentPriceSqrt]
  )

  return (
    <Grid container className={classes.wrapper} direction='column'>
      <Link to='/liquidity' style={{ textDecoration: 'none', maxWidth: 'fit-content' }}>
        <Grid className={classes.back} container item alignItems='center'>
          <img className={classes.backIcon} src={backIcon} alt='back' />
          <Typography className={classes.backText}>Positions</Typography>
        </Grid>
      </Link>

      <Grid
        container
        justifyContent='space-between'
        alignItems='center'
        className={classes.headerContainer}>
        <Box className={classes.titleContainer}>
          <Typography className={classes.title}>Add new position</Typography>
          {poolKey !== '' && tokenA !== tokenB && (
            <TooltipHover text='Refresh'>
              <Box>
                <Refresher
                  currentIndex={refresherTime}
                  maxIndex={REFRESHER_INTERVAL}
                  onClick={() => {
                    onRefresh()
                    setRefresherTime(REFRESHER_INTERVAL)
                  }}
                />
              </Box>
            </TooltipHover>
          )}
        </Box>
        {tokenA !== null && tokenB !== null && (
          <Grid container item alignItems='center' className={classes.options}>
            {poolKey !== '' ? (
              <MarketIdLabel
                displayLength={4}
                marketId={poolKey}
                copyPoolAddressHandler={copyPoolAddressHandler}
              />
            ) : null}
            <Grid className={classes.optionsWrapper}>
              <Hidden mdDown>
                {tokenA !== null && tokenB !== null && (
                  <ConcentrationTypeSwitch
                    onSwitch={val => {
                      if (val) {
                        setPositionOpeningMethod('concentration')
                        onPositionOpeningMethodChange('concentration')
                      } else {
                        setPositionOpeningMethod('range')
                        onPositionOpeningMethodChange('range')
                      }
                    }}
                    className={classes.switch}
                    currentValue={positionOpeningMethod === 'concentration' ? 0 : 1}
                  />
                )}
              </Hidden>
              {poolKey !== '' && (
                <TooltipHover text='Settings'>
                  <Button
                    onClick={handleClickSettings}
                    className={classes.settingsIconBtn}
                    disableRipple>
                    <img src={settingIcon} className={classes.settingsIcon} alt='settings' />
                  </Button>
                </TooltipHover>
              )}
            </Grid>
          </Grid>
        )}
      </Grid>

      <Slippage
        open={settings}
        setSlippage={setSlippage}
        handleClose={handleCloseSettings}
        anchorEl={anchorEl}
        initialSlippage={initialSlippage}
        infoText='Slippage tolerance is a pricing difference between the price at the confirmation time and the actual price of the transaction users are willing to accept when initializing position.'
        headerText='Position Settings'
      />

      <Grid container className={classes.row} alignItems='stretch'>
        <DepositSelector
          initialTokenFrom={initialTokenFrom}
          initialTokenTo={initialTokenTo}
          initialFee={initialFee}
          className={classes.deposit}
          tokens={tokens}
          setPositionTokens={(address1, address2, fee) => {
            setTokenA(address1)
            setTokenB(address2)
            onChangePositionTokens(address1, address2, fee)

            if (!isLoadingTokens) {
              updatePath(address1, address2, fee)
            }
          }}
          onAddLiquidity={() => {
            if (tokenA !== null && tokenB !== null) {
              const tokenADecimals = tokens[tokenA].decimals
              const tokenBDecimals = tokens[tokenB].decimals

              addLiquidityHandler(
                leftRange,
                rightRange,
                isXtoY
                  ? convertBalanceToBigint(tokenADeposit, tokenADecimals)
                  : convertBalanceToBigint(tokenBDeposit, tokenBDecimals),
                isXtoY
                  ? convertBalanceToBigint(tokenBDeposit, tokenBDecimals)
                  : convertBalanceToBigint(tokenADeposit, tokenADecimals),
                BigInt(+slippTolerance * Number(PERCENTAGE_DENOMINATOR)) / 100n
              )
            }
          }}
          tokenAInputState={{
            value:
              tokenA !== null &&
              tokenB !== null &&
              !isWaitingForNewPool &&
              blockedToken === PositionTokenBlock.A
                ? '0'
                : tokenADeposit,
            setValue: value => {
              if (tokenA === null) {
                return
              }

              setTokenADeposit(value)
              setTokenBDeposit(
                getOtherTokenAmount(
                  convertBalanceToBigint(value, tokens[tokenA].decimals),
                  Number(leftRange),
                  Number(rightRange),
                  true
                )
              )
            },
            blocked:
              tokenA !== null &&
              tokenB !== null &&
              !isWaitingForNewPool &&
              blockedToken === PositionTokenBlock.A,

            blockerInfo: 'Range only for single-asset deposit.',
            decimalsLimit: tokenA !== null ? Number(tokens[tokenA].decimals) : 0
          }}
          tokenBInputState={{
            value:
              tokenA !== null &&
              tokenB !== null &&
              !isWaitingForNewPool &&
              blockedToken === PositionTokenBlock.B
                ? '0'
                : tokenBDeposit,
            setValue: value => {
              if (tokenB === null) {
                return
              }
              setTokenBDeposit(value)
              setTokenADeposit(
                getOtherTokenAmount(
                  convertBalanceToBigint(value, Number(tokens[tokenB].decimals)),
                  Number(leftRange),
                  Number(rightRange),
                  false
                )
              )
            },
            blocked:
              tokenA !== null &&
              tokenB !== null &&
              !isWaitingForNewPool &&
              blockedToken === PositionTokenBlock.B,
            blockerInfo: 'Range only for single-asset deposit.',
            decimalsLimit: tokenB !== null ? Number(tokens[tokenB].decimals) : 0
          }}
          feeTiers={feeTiers.map(tier => tier.feeValue)}
          progress={progress}
          onReverseTokens={() => {
            if (tokenA === null || tokenB === null) {
              return
            }
            setShouldReversePlot(true)
            const pom = tokenA
            setTokenA(tokenB)
            setTokenB(pom)
            onChangePositionTokens(tokenB, tokenA, currentFeeIndex)

            if (!isLoadingTokens) {
              updatePath(tokenB, tokenA, currentFeeIndex)
            }
          }}
          poolIndex={poolIndex}
          bestTierIndex={bestTierIndex}
          handleAddToken={handleAddToken}
          commonTokens={commonTokens}
          initialHideUnknownTokensValue={initialHideUnknownTokensValue}
          onHideUnknownTokensChange={onHideUnknownTokensChange}
          priceA={tokenAPriceData?.price}
          priceB={tokenBPriceData?.price}
          priceALoading={priceALoading}
          priceBLoading={priceBLoading}
          feeTierIndex={currentFeeIndex}
          concentrationArray={concentrationArray}
          concentrationIndex={concentrationIndex}
          minimumSliderIndex={minimumSliderIndex}
          positionOpeningMethod={positionOpeningMethod}
          isBalanceLoading={isBalanceLoading}
          isGetLiquidityError={isGetLiquidityError}
          ticksLoading={ticksLoading}
          network={network}
          azeroBalance={azeroBalance}
          walletStatus={walletStatus}
          onConnectWallet={onConnectWallet}
          onDisconnectWallet={onDisconnectWallet}
        />
        <Hidden mdUp>
          <Grid container justifyContent='end' mb={2}>
            {poolKey !== '' && (
              <ConcentrationTypeSwitch
                onSwitch={val => {
                  if (val) {
                    setPositionOpeningMethod('concentration')
                    onPositionOpeningMethodChange('concentration')
                  } else {
                    setPositionOpeningMethod('range')
                    onPositionOpeningMethodChange('range')
                  }
                }}
                className={classes.switch}
                currentValue={positionOpeningMethod === 'concentration' ? 0 : 1}
              />
            )}
          </Grid>
        </Hidden>
        {isCurrentPoolExisting ||
        tokenA === null ||
        tokenB === null ||
        tokenA === tokenB ||
        isWaitingForNewPool ? (
          <RangeSelector
            poolIndex={poolIndex}
            onChangeRange={onChangeRange}
            blocked={
              tokenA === null ||
              tokenB === null ||
              tokenA === tokenB ||
              data.length === 0 ||
              isWaitingForNewPool
            }
            blockerInfo={setRangeBlockerInfo()}
            {...(tokenA === null ||
            tokenB === null ||
            !isCurrentPoolExisting ||
            data.length === 0 ||
            isWaitingForNewPool
              ? noRangePlaceholderProps
              : {
                  data,
                  midPrice,
                  tokenASymbol: tokens[tokenA].symbol,
                  tokenBSymbol: tokens[tokenB].symbol
                })}
            ticksLoading={ticksLoading}
            isXtoY={isXtoY}
            tickSpacing={tickSpacing}
            xDecimal={xDecimal}
            yDecimal={yDecimal}
            currentPairReversed={currentPairReversed}
            positionOpeningMethod={positionOpeningMethod}
            hasTicksError={hasTicksError}
            reloadHandler={reloadHandler}
            concentrationArray={concentrationArray}
            setConcentrationIndex={setConcentrationIndex}
            concentrationIndex={concentrationIndex}
            minimumSliderIndex={minimumSliderIndex}
            getTicksInsideRange={getTicksInsideRange}
            poolKey={poolKey}
            shouldReversePlot={shouldReversePlot}
            setShouldReversePlot={setShouldReversePlot}
            shouldNotUpdatePriceRange={shouldNotUpdatePriceRange}
            unblockUpdatePriceRange={unblockUpdatePriceRange}
            onlyUserPositions={onlyUserPositions}
            setOnlyUserPositions={setOnlyUserPositions}
          />
        ) : (
          <PoolInit
            onChangeRange={onChangeRange}
            isXtoY={isXtoY}
            tickSpacing={tickSpacing}
            xDecimal={xDecimal}
            yDecimal={yDecimal}
            tokenASymbol={tokenA !== null && tokens[tokenA] ? tokens[tokenA].symbol : 'ABC'}
            tokenBSymbol={tokenB !== null && tokens[tokenB] ? tokens[tokenB].symbol : 'XYZ'}
            midPriceIndex={midPrice.index}
            onChangeMidPrice={onChangeMidPrice}
            currentPairReversed={currentPairReversed}
            positionOpeningMethod={positionOpeningMethod}
            concentrationArray={concentrationArray}
            concentrationIndex={concentrationIndex}
            setConcentrationIndex={setConcentrationIndex}
            minimumSliderIndex={minimumSliderIndex}
          />
        )}
      </Grid>
    </Grid>
  )
}

export default NewPosition
