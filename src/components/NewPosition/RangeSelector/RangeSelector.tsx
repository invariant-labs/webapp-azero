import React, { useState, useEffect, useRef } from 'react'
import ConcentrationSlider from '../ConcentrationSlider/ConcentrationSlider'
import loader from '@static/gif/loader.gif'
import useStyles from './style'
import activeLiquidity from '@static/svg/activeLiquidity.svg'
import { PositionOpeningMethod } from '@store/consts/static'
import { Button, Grid, Tooltip, Typography } from '@mui/material'
import PlotTypeSwitch from '@components/PlotTypeSwitch/PlotTypeSwitch'
import PriceRangePlot from '@components/PriceRangePlot/PriceRangePlot'
import RangeInput from '@components/Inputs/RangeInput/RangeInput'

export interface IRangeSelector {
  // data: PlotTickData[]
  data: any[]
  // midPrice: TickPlotPositionData
  midPrice: any
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
  initialIsDiscreteValue: boolean
  onDiscreteChange: (val: boolean) => void
  positionOpeningMethod?: PositionOpeningMethod
  poolIndex: bigint | null
  hasTicksError?: boolean
  reloadHandler: () => void
  volumeRange?: {
    min: bigint
    max: bigint
  }
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
  initialIsDiscreteValue,
  onDiscreteChange,
  positionOpeningMethod,
  poolIndex,
  hasTicksError,
  reloadHandler,
  volumeRange,
  concentrationArray,
  minimumSliderIndex,
  concentrationIndex,
  setConcentrationIndex,
  getTicksInsideRange
}) => {
  const { classes } = useStyles()

  // const [leftRange, setLeftRange] = useState(getMinTick(tickSpacing))
  // const [rightRange, setRightRange] = useState(getMaxTick(tickSpacing))
  const [leftRange, setLeftRange] = useState(123n)
  const [rightRange, setRightRange] = useState(12334n)

  const [leftInput, setLeftInput] = useState('')
  const [rightInput, setRightInput] = useState('')

  const [leftInputRounded, setLeftInputRounded] = useState('')
  const [rightInputRounded, setRightInputRounded] = useState('')

  const [plotMin, setPlotMin] = useState(0)
  const [plotMax, setPlotMax] = useState(1)

  const [isPlotDiscrete, setIsPlotDiscrete] = useState(initialIsDiscreteValue)

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

  const zoomPlus = () => {}

  const setLeftInputValues = (val: string) => {
    setLeftInput(val)
    // setLeftInputRounded(toMaxNumericPlaces(+val, 5))
  }

  const setRightInputValues = (val: string) => {
    setRightInput(val)
    // setRightInputRounded(toMaxNumericPlaces(+val, 5))
  }

  const onLeftInputChange = (val: string) => {
    setLeftInput(val)
    setLeftInputRounded(val)
  }

  const onRightInputChange = (val: string) => {
    setRightInput(val)
    setRightInputRounded(val)
  }

  const changeRangeHandler = (left: number, right: number) => {}

  const resetPlot = () => {}

  const reversePlot = () => {}

  return (
    <Grid container className={classes.wrapper} direction='column'>
      <Grid className={classes.headerContainer} container justifyContent='space-between'>
        <Typography className={classes.header}>Price range</Typography>
        <PlotTypeSwitch
          onSwitch={val => {
            setIsPlotDiscrete(val)
            onDiscreteChange(val)
          }}
          initialValue={isPlotDiscrete ? 1 : 0}
        />
      </Grid>
      <Grid className={classes.infoRow} container justifyContent='flex-end'>
        <Grid container direction='column' alignItems='flex-end'>
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
                  <img className={classes.liquidityImg} src={activeLiquidity} />
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
            <Typography className={classes.currentPrice}>Current price</Typography>
          </Grid>
        </Grid>
      </Grid>
      <Grid container className={classes.innerWrapper}>
        {/* TODO check how to fix price range plot */}
        {/* <PriceRangePlot
          className={classes.plot}
          parsedData={data}
          onChangeRange={changeRangeHandler}
          // leftRange={{
          //   index: leftRange,
          //   x: calcPrice(BigInt(leftRange), isXtoY, xDecimal, yDecimal) // TODO check if this is correct
          // }}
          // rightRange={{
          //   index: rightRange,
          //   x: calcPrice(BigInt(rightRange), isXtoY, xDecimal, yDecimal) // TODO check if this is correct
          // }}
          parsedLeftRange={{
            index: leftRange,
            x: 12n
          }}
          parsedRightRange={{
            index: rightRange,
            x: 12334n
          }}
          parsedMidPrice={midPrice}
          plotMin={plotMin}
          plotMax={plotMax}
          zoomMinus={zoomMinus}
          zoomPlus={zoomPlus}
          loading={ticksLoading}
          isXtoY={isXtoY}
          tickSpacing={Number(tickSpacing)} // TODO check correct type
          xDecimal={Number(xDecimal)}
          yDecimal={Number(yDecimal)}
          isDiscrete={isPlotDiscrete}
          disabled={positionOpeningMethod === 'concentration'}
          hasError={hasTicksError}
          reloadHandler={reloadHandler}
          volumeRange={undefined} // TODO check correct type
        /> */}
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
              // const newLeft = isXtoY
              //   ? Math.max(getMinTick(tickSpacing), leftRange - tickSpacing)
              //   : Math.min(getMaxTick(tickSpacing), leftRange + tickSpacing)
              // changeRangeHandler(newLeft, rightRange)
              // autoZoomHandler(newLeft, rightRange)
            }}
            increaseValue={() => {
              // const newLeft = isXtoY
              //   ? Math.min(rightRange - tickSpacing, leftRange + tickSpacing)
              //   : Math.max(rightRange + tickSpacing, leftRange - tickSpacing)
              // changeRangeHandler(newLeft, rightRange)
              // autoZoomHandler(newLeft, rightRange)
            }}
            onBlur={() => {
              // const newLeft = isXtoY
              //   ? Math.min(
              //       rightRange - tickSpacing,
              //       nearestTickIndex(+leftInput, tickSpacing, isXtoY, xDecimal, yDecimal)
              //     )
              //   : Math.max(
              //       rightRange + tickSpacing,
              //       nearestTickIndex(+leftInput, tickSpacing, isXtoY, xDecimal, yDecimal)
              //     )
              // changeRangeHandler(newLeft, rightRange)
              // autoZoomHandler(newLeft, rightRange)
            }}
            diffLabel='Min - Current price'
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
              // const newRight = isXtoY
              //   ? Math.max(rightRange - tickSpacing, leftRange + tickSpacing)
              //   : Math.min(rightRange + tickSpacing, leftRange - tickSpacing)
              // changeRangeHandler(leftRange, newRight)
              // autoZoomHandler(leftRange, newRight)
            }}
            increaseValue={() => {
              // const newRight = isXtoY
              //   ? Math.min(getMaxTick(tickSpacing), rightRange + tickSpacing)
              //   : Math.max(getMinTick(tickSpacing), rightRange - tickSpacing)
              // changeRangeHandler(leftRange, newRight)
              // autoZoomHandler(leftRange, newRight)
            }}
            onBlur={() => {
              // const newRight = isXtoY
              //   ? Math.max(
              //       leftRange + tickSpacing,
              //       nearestTickIndex(+rightInput, tickSpacing, isXtoY, xDecimal, yDecimal)
              //     )
              //   : Math.min(
              //       leftRange - tickSpacing,
              //       nearestTickIndex(+rightInput, tickSpacing, isXtoY, xDecimal, yDecimal)
              //     )
              // changeRangeHandler(leftRange, newRight)
              // autoZoomHandler(leftRange, newRight)
            }}
            diffLabel='Max - Current price'
            percentDiff={((+rightInput - midPrice.x) / midPrice.x) * 100}
          />
        </Grid>
        {positionOpeningMethod === 'concentration' ? (
          <Grid container className={classes.sliderWrapper}>
            <ConcentrationSlider
              key={poolIndex ?? -1}
              valueIndex={concentrationIndex}
              values={concentrationArray}
              valueChangeHandler={() => {}}
              dragHandler={value => {
                setConcentrationIndex(value)
              }}
              minimumSliderIndex={minimumSliderIndex}
            />

            <span>Slider</span>
          </Grid>
        ) : (
          <Grid container className={classes.buttons}>
            <Button className={classes.button} onClick={resetPlot}>
              Reset range
            </Button>
            <Button className={classes.button} onClick={() => {}}>
              Set full range
            </Button>
          </Grid>
        )}
      </Grid>

      {blocked && (
        <Grid className={classes.blocker}>
          {blockerInfo === 'Loading pool info...' ? (
            <Grid container style={{ height: '100%' }}>
              <img src={loader} className={classes.loader} />
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
