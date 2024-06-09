import PlotTypeSwitch from '@components/PlotTypeSwitch/PlotTypeSwitch'
import LiquidationRangeInfo from '@components/PositionDetails/LiquidationRangeInfo/LiquidationRangeInfo'
import { Card, Grid, Tooltip, Typography } from '@mui/material'
import activeLiquidity from '@static/svg/activeLiquidity.svg'
import { PlotTickData, TickPlotPositionData } from '@store/reducers/positions'
import React, { useEffect, useState } from 'react'
import { ILiquidityToken } from '../SinglePositionInfo/consts'
import useStyles from './style'
import { calcPrice, calcTicksAmountInRange, spacingMultiplicityGte } from '@store/consts/utils'
import { getMinTick } from '@invariant-labs/a0-sdk'
import PriceRangePlot from '@components/PriceRangePlot/PriceRangePlot'

export interface ISinglePositionPlot {
  data: PlotTickData[]
  leftRange: TickPlotPositionData
  rightRange: TickPlotPositionData
  midPrice: TickPlotPositionData
  currentPrice: number
  tokenY: Pick<ILiquidityToken, 'name' | 'decimal'>
  tokenX: Pick<ILiquidityToken, 'name' | 'decimal'>
  ticksLoading: boolean
  tickSpacing: bigint
  min: number
  max: number
  xToY: boolean
  initialIsDiscreteValue: boolean
  onDiscreteChange: (val: boolean) => void
  hasTicksError?: boolean
  reloadHandler: () => void
}

const SinglePositionPlot: React.FC<ISinglePositionPlot> = ({
  data,
  leftRange,
  rightRange,
  midPrice,
  currentPrice,
  tokenY,
  tokenX,
  ticksLoading,
  tickSpacing,
  min,
  max,
  xToY,
  initialIsDiscreteValue,
  onDiscreteChange,
  hasTicksError,
  reloadHandler
}) => {
  const { classes } = useStyles()

  const [plotMin, setPlotMin] = useState(0)
  const [plotMax, setPlotMax] = useState(1)

  const [isPlotDiscrete, setIsPlotDiscrete] = useState(initialIsDiscreteValue)

  useEffect(() => {
    const initSideDist = Math.abs(
      leftRange.x -
        calcPrice(
          BigInt(
            Math.max(
              spacingMultiplicityGte(Number(getMinTick(tickSpacing)), Number(tickSpacing)),
              Number(leftRange.index) - Number(tickSpacing) * 15
            )
          ),
          xToY,
          tokenX.decimal,
          tokenY.decimal
        )
    )

    setPlotMin(leftRange.x - initSideDist)
    setPlotMax(rightRange.x + initSideDist)
  }, [ticksLoading, leftRange, rightRange])

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
        xToY,
        Number(tokenX.decimal),
        Number(tokenY.decimal)
      ) >= 4
    ) {
      setPlotMin(newMin)
      setPlotMax(newMax)
    }
  }

  return (
    <Grid item className={classes.root}>
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
        <Grid>
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
          <Typography className={classes.currentPrice}>Current price</Typography>
        </Grid>
      </Grid>
      <Grid className={classes.plotWrapper}>
        <PriceRangePlot
          data={data}
          plotMin={plotMin}
          plotMax={plotMax}
          zoomMinus={zoomMinus}
          zoomPlus={zoomPlus}
          disabled
          leftRange={leftRange}
          rightRange={rightRange}
          midPrice={midPrice}
          className={classes.plot}
          loading={ticksLoading}
          isXtoY={xToY}
          tickSpacing={tickSpacing}
          xDecimal={tokenX.decimal}
          yDecimal={tokenY.decimal}
          isDiscrete={isPlotDiscrete}
          coverOnLoading
          hasError={hasTicksError}
          reloadHandler={reloadHandler}
        />
      </Grid>
      <Grid className={classes.minMaxInfo}>
        <LiquidationRangeInfo
          label='min'
          amount={min}
          tokenX={xToY ? tokenX.name : tokenY.name}
          tokenY={xToY ? tokenY.name : tokenX.name}
        />
        <LiquidationRangeInfo
          label='max'
          amount={max}
          tokenX={xToY ? tokenX.name : tokenY.name}
          tokenY={xToY ? tokenY.name : tokenX.name}
        />
      </Grid>
      <Grid className={classes.currentPriceContainer}>
        <Card className={classes.currentPriceLabel}>
          <Typography component='p'>current price</Typography>
        </Card>
        <Card className={classes.currentPriceAmonut}>
          <Typography component='p'>
            <Typography component='span'>{currentPrice.toString()}</Typography>
            {xToY ? tokenY.name : tokenX.name} per {xToY ? tokenX.name : tokenY.name}
          </Typography>
        </Card>
      </Grid>
    </Grid>
  )
}

export default SinglePositionPlot
