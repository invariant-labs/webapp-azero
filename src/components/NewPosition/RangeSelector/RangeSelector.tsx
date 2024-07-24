import RangeInput from '@components/Inputs/RangeInput/RangeInput'
import PriceRangePlot from '@components/PriceRangePlot/PriceRangePlot'
import { getMaxTick, getMinTick } from '@invariant-labs/a0-sdk'
import { Button, Grid, Tooltip, Typography } from '@mui/material'
import loader from '@static/gif/loader.gif'
import activeLiquidity from '@static/svg/activeLiquidity.svg'
import {
  calcPriceByTickIndex,
  calcTicksAmountInRange,
  calculateConcentrationRange,
  findClosestIndexByValue,
  nearestTickIndex,
  toMaxNumericPlaces
} from '@utils/utils'
import { PlotTickData, TickPlotPositionData } from '@store/reducers/positions'
import React, { useEffect, useRef, useState } from 'react'
import ConcentrationSlider from '../ConcentrationSlider/ConcentrationSlider'
import useStyles from './style'
import { PositionOpeningMethod } from '@store/consts/types'
export interface IRangeSelector {
  data: PlotTickData[]
  midPrice: TickPlotPositionData
  tokenASymbol: string
  tokenBSymbol: string
  onChangeRange: (leftIndex: bigint, rightIndex: bigint) => void
  blocked?: boolean
  blockerInfo?: string
  ticksLoading: boolean
  isXtoY: boolean
  xDecimal: bigint
  yDecimal: bigint
  tickSpacing: bigint
  currentPairReversed: boolean | null
  positionOpeningMethod?: PositionOpeningMethod
  poolIndex: number | null
  hasTicksError?: boolean
  reloadHandler: () => void
  concentrationArray: number[]
  minimumSliderIndex: number
  concentrationIndex: number
  setConcentrationIndex: (val: number) => void
  getTicksInsideRange: (
    left: bigint,
    right: bigint,
    isXtoY: boolean
  ) => {
    leftInRange: bigint
    rightInRange: bigint
  }
  poolKey: string
  shouldReversePlot: boolean
  setShouldReversePlot: (val: boolean) => void
  shouldNotUpdatePriceRange: boolean
  unblockUpdatePriceRange: () => void
}

export const RangeSelector: React.FC<IRangeSelector> = ({
  data,
  midPrice,
  tokenASymbol,
  tokenBSymbol,
  onChangeRange,
  blocked = false,
  blockerInfo,
  ticksLoading,
  isXtoY,
  xDecimal,
  yDecimal,
  tickSpacing,
  currentPairReversed,
  positionOpeningMethod,
  hasTicksError,
  reloadHandler,
  concentrationArray,
  minimumSliderIndex,
  concentrationIndex,
  setConcentrationIndex,
  getTicksInsideRange,
  poolKey,
  shouldReversePlot,
  setShouldReversePlot,
  shouldNotUpdatePriceRange,
  unblockUpdatePriceRange
}) => {
  const { classes } = useStyles()

  const [leftRange, setLeftRange] = useState(getMinTick(tickSpacing))
  const [rightRange, setRightRange] = useState(getMaxTick(tickSpacing))

  const [leftInput, setLeftInput] = useState('')
  const [rightInput, setRightInput] = useState('')

  const [leftInputRounded, setLeftInputRounded] = useState('')
  const [rightInputRounded, setRightInputRounded] = useState('')

  const [plotMin, setPlotMin] = useState(0)
  const [plotMax, setPlotMax] = useState(1)

  const [currentMidPrice, setCurrentMidPrice] = useState(midPrice)
  const [triggerReset, setTriggerReset] = useState(false)

  const [previousConcentration, setPreviousConcentration] = useState(0)

  const isMountedRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const zoomMinus = () => {
    const diff = plotMax - plotMin
    const newMin = plotMin - diff / 4
    const newMax = plotMax + diff / 4
    setPlotMin(newMin)
    setPlotMax(newMax)
  }

  const zoomPlus = () => {
    const diff = plotMax - plotMin
    const newMin = plotMin + diff / 6
    const newMax = plotMax - diff / 6
    if (
      calcTicksAmountInRange(
        Math.max(newMin, 0),
        newMax,
        Number(tickSpacing),
        isXtoY,
        Number(xDecimal),
        Number(yDecimal)
      ) >= 4
    ) {
      setPlotMin(newMin)
      setPlotMax(newMax)
    }
  }

  const setLeftInputValues = (val: string) => {
    setLeftInput(val)
    setLeftInputRounded(toMaxNumericPlaces(+val, 5))
  }

  const setRightInputValues = (val: string) => {
    setRightInput(val)
    setRightInputRounded(toMaxNumericPlaces(+val, 5))
  }

  const onLeftInputChange = (val: string) => {
    setLeftInput(val)
    setLeftInputRounded(val)
  }

  const onRightInputChange = (val: string) => {
    setRightInput(val)
    setRightInputRounded(val)
  }

  const changeRangeHandler = (left: bigint, right: bigint) => {
    const { leftInRange, rightInRange } = getTicksInsideRange(left, right, isXtoY)

    setLeftRange(leftInRange)
    setRightRange(rightInRange)
    setLeftInputValues(calcPriceByTickIndex(leftInRange, isXtoY, xDecimal, yDecimal).toString())
    setRightInputValues(calcPriceByTickIndex(rightInRange, isXtoY, xDecimal, yDecimal).toString())
    onChangeRange(leftInRange, rightInRange)
  }

  const resetPlot = () => {
    if (positionOpeningMethod === 'range') {
      const initSideDist = Math.abs(
        midPrice.x -
          calcPriceByTickIndex(
            BigInt(
              Math.max(Number(getMinTick(tickSpacing)), Number(midPrice.index - tickSpacing * 15n))
            ),
            isXtoY,
            xDecimal,
            yDecimal
          )
      )
      const higherTick = BigInt(
        Math.max(Number(getMinTick(tickSpacing)), Number(midPrice.index) - Number(tickSpacing) * 10)
      )
      const lowerTick = BigInt(
        Math.min(Number(getMaxTick(tickSpacing)), Number(midPrice.index) + Number(tickSpacing) * 10)
      )
      changeRangeHandler(isXtoY ? higherTick : lowerTick, isXtoY ? lowerTick : higherTick)
      setPlotMin(midPrice.x - initSideDist)
      setPlotMax(midPrice.x + initSideDist)
    } else {
      const newConcentrationIndex = findClosestIndexByValue(
        concentrationArray,
        previousConcentration
      )

      setConcentrationIndex(newConcentrationIndex)
      setPreviousConcentration(concentrationArray[newConcentrationIndex])
      const { leftRange, rightRange } = calculateConcentrationRange(
        tickSpacing,
        concentrationArray[newConcentrationIndex],
        2,
        midPrice.index,
        isXtoY
      )
      changeRangeHandler(leftRange, rightRange)
      autoZoomHandler(leftRange, rightRange, true)
    }
  }

  const reversePlot = () => {
    changeRangeHandler(rightRange, leftRange)
    if (plotMin > 0) {
      const pom = 1 / plotMin
      setPlotMin(1 / plotMax)
      setPlotMax(pom)
    } else {
      const initSideDist = Math.abs(
        midPrice.x -
          calcPriceByTickIndex(
            BigInt(
              Math.max(Number(getMinTick(tickSpacing)), Number(midPrice.index - tickSpacing * 15n))
            ),
            isXtoY,
            xDecimal,
            yDecimal
          )
      )

      setPlotMin(midPrice.x - initSideDist)
      setPlotMax(midPrice.x + initSideDist)
    }
  }
  useEffect(() => {
    if (currentPairReversed !== null && isMountedRef.current) {
      reversePlot()
    }
  }, [currentPairReversed])

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldReversePlot(false)
    }, 600)

    return () => {
      clearTimeout(timer)
    }
  }, [shouldReversePlot])

  useEffect(() => {
    if (
      !ticksLoading &&
      isMountedRef.current &&
      poolKey !== '' &&
      currentMidPrice !== midPrice &&
      !shouldReversePlot
    ) {
      if (!shouldNotUpdatePriceRange) {
        resetPlot()
        setCurrentMidPrice(midPrice)
      }
    }
  }, [triggerReset])

  useEffect(() => {
    if (
      !ticksLoading &&
      isMountedRef.current &&
      poolKey !== '' &&
      currentMidPrice !== midPrice &&
      !shouldReversePlot
    ) {
      if (!shouldNotUpdatePriceRange) {
        setTriggerReset(prev => !prev)
      }

      unblockUpdatePriceRange()
    }
  }, [ticksLoading, isMountedRef, midPrice.index, poolKey])

  useEffect(() => {
    const newConcentrationIndex = findClosestIndexByValue(concentrationArray, previousConcentration)

    setConcentrationIndex(newConcentrationIndex)
    setPreviousConcentration(concentrationArray[newConcentrationIndex])
  }, [concentrationArray])

  const autoZoomHandler = (left: bigint, right: bigint, canZoomCloser: boolean = false) => {
    const { leftInRange, rightInRange } = getTicksInsideRange(left, right, isXtoY)

    const leftX = calcPriceByTickIndex(leftInRange, isXtoY, xDecimal, yDecimal)
    const rightX = calcPriceByTickIndex(rightInRange, isXtoY, xDecimal, yDecimal)

    const higherLeftIndex = BigInt(
      Math.max(Number(getMinTick(tickSpacing)), Number(leftInRange - tickSpacing * 15n))
    )

    const lowerLeftIndex = BigInt(
      Math.min(Number(getMaxTick(tickSpacing)), Number(leftInRange + tickSpacing * 15n))
    )

    const lowerRightIndex = BigInt(
      Math.min(Number(getMaxTick(tickSpacing)), Number(rightInRange + tickSpacing * 15n))
    )

    const higherRightIndex = BigInt(
      Math.max(Number(getMinTick(tickSpacing)), Number(rightInRange - tickSpacing * 15n))
    )

    if (leftX < plotMin || rightX > plotMax || canZoomCloser) {
      const leftDist = Math.abs(
        leftX -
          calcPriceByTickIndex(
            isXtoY ? higherLeftIndex : lowerLeftIndex,
            isXtoY,
            xDecimal,
            yDecimal
          )
      )
      const rightDist = Math.abs(
        rightX -
          calcPriceByTickIndex(
            isXtoY ? lowerRightIndex : higherRightIndex,
            isXtoY,
            xDecimal,
            yDecimal
          )
      )

      let dist

      if (leftX < plotMin && rightX > plotMax) {
        dist = Math.max(leftDist, rightDist)
      } else if (leftX < plotMin) {
        dist = leftDist
      } else {
        dist = rightDist
      }

      setPlotMin(leftX - dist)
      setPlotMax(rightX + dist)
    }
  }

  useEffect(() => {
    if (positionOpeningMethod === 'concentration' && isMountedRef.current && !ticksLoading) {
      setConcentrationIndex(0)
      const { leftRange, rightRange } = calculateConcentrationRange(
        tickSpacing,
        concentrationArray[0],
        2,
        midPrice.index,
        isXtoY
      )

      changeRangeHandler(leftRange, rightRange)
      autoZoomHandler(leftRange, rightRange, true)
    } else {
      changeRangeHandler(leftRange, rightRange)
    }
  }, [positionOpeningMethod])

  useEffect(() => {
    if (positionOpeningMethod === 'concentration' && !ticksLoading && isMountedRef.current) {
      const index =
        concentrationIndex > concentrationArray.length - 1
          ? concentrationArray.length - 1
          : concentrationIndex
      setConcentrationIndex(index)
      console.log('test')
      const { leftRange, rightRange } = calculateConcentrationRange(
        tickSpacing,
        concentrationArray[index],
        2,
        midPrice.index,
        isXtoY
      )

      changeRangeHandler(leftRange, rightRange)
      autoZoomHandler(leftRange, rightRange, true)
    }
  }, [midPrice.index])

  useEffect(() => {
    if (shouldReversePlot) {
      return
    }

    setConcentrationIndex(0)
    const { leftRange, rightRange } = calculateConcentrationRange(
      tickSpacing,
      concentrationArray[0],
      2,
      midPrice.index,
      isXtoY
    )

    changeRangeHandler(leftRange, rightRange)
    autoZoomHandler(leftRange, rightRange, true)
  }, [tokenASymbol, tokenBSymbol])

  return (
    <Grid container className={classes.wrapper} direction='column'>
      <Grid className={classes.topInnerWrapper}>
        <Grid className={classes.headerContainer} container justifyContent='space-between'>
          <Typography className={classes.header}>Price range</Typography>
          <Grid className={classes.activeLiquidityContainer} container direction='column'>
            <Tooltip
              title={
                <>
                  <Typography className={classes.liquidityTitle}>Active liquidity</Typography>
                  <Typography className={classes.liquidityDesc} style={{ marginBottom: 12 }}>
                    While selecting the price range, note where active liquidity is located. Your
                    liquidity can be inactive and, as a consequence, not generate profits.
                  </Typography>
                  <Grid
                    container
                    direction='row'
                    wrap='nowrap'
                    alignItems='center'
                    style={{ marginBottom: 12 }}>
                    <Typography className={classes.liquidityDesc}>
                      The active liquidity range is represented by white, dashed lines in the
                      liquidity chart. Active liquidity is determined by the maximum price range
                      resulting from the statistical volume of swaps for the last 7 days.
                    </Typography>
                    <img className={classes.liquidityImg} src={activeLiquidity} alt='Liquidity' />
                  </Grid>
                  <Typography className={classes.liquidityNote}>
                    Note: active liquidity borders are always aligned to the nearest initialized
                    ticks.
                  </Typography>
                </>
              }
              placement='bottom'
              classes={{
                tooltip: classes.liquidityTooltip
              }}>
              <Typography className={classes.activeLiquidity}>
                Active liquidity <span className={classes.activeLiquidityIcon}>i</span>
              </Typography>
            </Tooltip>
            <Grid>
              <Typography className={classes.currentPrice}>Current price ━━━</Typography>
            </Grid>
          </Grid>
        </Grid>
        <PriceRangePlot
          className={classes.plot}
          data={data}
          onChangeRange={changeRangeHandler}
          leftRange={{
            index: leftRange,
            x: calcPriceByTickIndex(leftRange, isXtoY, xDecimal, yDecimal)
          }}
          rightRange={{
            index: rightRange,
            x: calcPriceByTickIndex(rightRange, isXtoY, xDecimal, yDecimal)
          }}
          midPrice={midPrice}
          plotMin={plotMin}
          plotMax={plotMax}
          zoomMinus={zoomMinus}
          zoomPlus={zoomPlus}
          loading={ticksLoading}
          isXtoY={isXtoY}
          tickSpacing={tickSpacing}
          xDecimal={xDecimal}
          yDecimal={yDecimal}
          disabled={positionOpeningMethod === 'concentration'}
          hasError={hasTicksError}
          reloadHandler={reloadHandler}
        />
      </Grid>
      <Grid container className={classes.innerWrapper}>
        <Typography className={classes.subheader}>Set price range</Typography>
        <Grid container className={classes.inputs}>
          <RangeInput
            disabled={positionOpeningMethod === 'concentration'}
            className={classes.input}
            label='Min price'
            tokenFromSymbol={tokenASymbol}
            tokenToSymbol={tokenBSymbol}
            currentValue={leftInputRounded}
            setValue={onLeftInputChange}
            decreaseValue={() => {
              const newLeft = isXtoY
                ? Math.max(Number(getMinTick(tickSpacing)), Number(leftRange - tickSpacing))
                : Math.min(Number(getMaxTick(tickSpacing)), Number(leftRange + tickSpacing))
              changeRangeHandler(BigInt(newLeft), rightRange)
              autoZoomHandler(BigInt(newLeft), rightRange)
            }}
            increaseValue={() => {
              const newLeft = isXtoY
                ? Math.min(Number(rightRange - tickSpacing), Number(leftRange + tickSpacing))
                : Math.max(Number(rightRange + tickSpacing), Number(leftRange - tickSpacing))
              changeRangeHandler(BigInt(newLeft), rightRange)
              autoZoomHandler(BigInt(newLeft), rightRange)
            }}
            onBlur={() => {
              const newLeft = isXtoY
                ? Math.min(
                    Number(rightRange - tickSpacing),
                    Number(nearestTickIndex(+leftInput, tickSpacing, isXtoY, xDecimal, yDecimal))
                  )
                : Math.max(
                    Number(rightRange + tickSpacing),
                    Number(nearestTickIndex(+leftInput, tickSpacing, isXtoY, xDecimal, yDecimal))
                  )

              changeRangeHandler(BigInt(newLeft), rightRange)
              autoZoomHandler(BigInt(newLeft), rightRange)
            }}
            diffLabel='Min - Current'
            percentDiff={((+leftInput - midPrice.x) / midPrice.x) * 100}
          />
          <RangeInput
            disabled={positionOpeningMethod === 'concentration'}
            className={classes.input}
            label='Max price'
            tokenFromSymbol={tokenASymbol}
            tokenToSymbol={tokenBSymbol}
            currentValue={rightInputRounded}
            setValue={onRightInputChange}
            decreaseValue={() => {
              const newRight = isXtoY
                ? Math.max(Number(rightRange - tickSpacing), Number(leftRange + tickSpacing))
                : Math.min(Number(rightRange + tickSpacing), Number(leftRange - tickSpacing))
              changeRangeHandler(leftRange, BigInt(newRight))
              autoZoomHandler(leftRange, BigInt(newRight))
            }}
            increaseValue={() => {
              const newRight = isXtoY
                ? Math.min(Number(getMaxTick(tickSpacing)), Number(rightRange + tickSpacing))
                : Math.max(Number(getMinTick(tickSpacing)), Number(rightRange - tickSpacing))
              changeRangeHandler(leftRange, BigInt(newRight))
              autoZoomHandler(leftRange, BigInt(newRight))
            }}
            onBlur={() => {
              const newRight = isXtoY
                ? Math.max(
                    Number(leftRange + tickSpacing),
                    Number(nearestTickIndex(+rightInput, tickSpacing, isXtoY, xDecimal, yDecimal))
                  )
                : Math.min(
                    Number(leftRange - tickSpacing),
                    Number(nearestTickIndex(+rightInput, tickSpacing, isXtoY, xDecimal, yDecimal))
                  )

              changeRangeHandler(leftRange, BigInt(newRight))
              autoZoomHandler(leftRange, BigInt(newRight))
            }}
            diffLabel='Max - Current'
            percentDiff={((+rightInput - midPrice.x) / midPrice.x) * 100}
          />
        </Grid>
        {positionOpeningMethod === 'concentration' ? (
          <Grid container className={classes.sliderWrapper}>
            <ConcentrationSlider
              valueIndex={concentrationIndex}
              values={concentrationArray}
              valueChangeHandler={value => {
                setPreviousConcentration(concentrationArray[value])
                setConcentrationIndex(value)
                const { leftRange, rightRange } = calculateConcentrationRange(
                  tickSpacing,
                  concentrationArray[value],
                  2,
                  midPrice.index,
                  isXtoY
                )

                changeRangeHandler(leftRange, rightRange)
                autoZoomHandler(leftRange, rightRange, true)
              }}
              dragHandler={value => {
                setConcentrationIndex(value)
              }}
              minimumSliderIndex={minimumSliderIndex}
            />
          </Grid>
        ) : (
          <Grid container className={classes.buttons}>
            <Button className={classes.button} onClick={resetPlot}>
              Reset range
            </Button>
            <Button
              className={classes.button}
              onClick={() => {
                const left = isXtoY ? getMinTick(tickSpacing) : getMaxTick(tickSpacing)
                const right = isXtoY ? getMaxTick(tickSpacing) : getMinTick(tickSpacing)
                changeRangeHandler(left, right)
                autoZoomHandler(left, right)
              }}>
              Set full range
            </Button>
          </Grid>
        )}
      </Grid>

      {blocked && (
        <Grid className={classes.blocker}>
          {blockerInfo === 'Loading pool info...' ? (
            <Grid container style={{ height: '100%' }}>
              <img src={loader} className={classes.loader} alt='Loader' />
            </Grid>
          ) : (
            <Typography className={classes.blockedInfo}>{blockerInfo}</Typography>
          )}
        </Grid>
      )}
    </Grid>
  )
}

export default RangeSelector
