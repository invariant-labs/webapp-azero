import MarketIdLabel from '@components/NewPosition/MarketIdLabel/MarketIdLabel'
import SinglePositionInfo from '@components/PositionDetails/SinglePositionInfo/SinglePositionInfo'
import SinglePositionPlot from '@components/PositionDetails/SinglePositionPlot/SinglePositionPlot'
import { TickPlotPositionData } from '@components/PriceRangePlot/PriceRangePlot'
import { PERCENTAGE_SCALE } from '@invariant-labs/a0-sdk/target/consts'
import { Box, Button, Grid, Typography } from '@mui/material'
import { AddressOrPair } from '@polkadot/api/types'
import backIcon from '@static/svg/back-arrow.svg'
import { TokenPriceData } from '@store/consts/static'
import { addressToTicker, initialXtoY } from '@store/consts/uiUtiils'
import { parseFeeToPathFee, printBigint } from '@store/consts/utils'
import { PlotTickData } from '@store/reducers/positions'
import { VariantType } from 'notistack'
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ILiquidityToken } from './SinglePositionInfo/consts'
import { useStyles } from './style'

interface IProps {
  tokenXAddress: AddressOrPair
  tokenYAddress: AddressOrPair
  poolAddress: AddressOrPair
  copyPoolAddressHandler: (message: string, variant: VariantType) => void
  detailsData: PlotTickData[]
  leftRange: TickPlotPositionData
  rightRange: TickPlotPositionData
  midPrice: TickPlotPositionData
  currentPrice: number
  tokenX: ILiquidityToken
  tokenY: ILiquidityToken
  tokenXPriceData?: TokenPriceData
  tokenYPriceData?: TokenPriceData
  onClickClaimFee: () => void
  closePosition: (claimFarmRewards?: boolean) => void
  ticksLoading: boolean
  tickSpacing: bigint
  fee: bigint
  min: number
  max: number
  initialIsDiscreteValue: boolean
  onDiscreteChange: (val: boolean) => void
  showFeesLoader?: boolean
  hasTicksError?: boolean
  reloadHandler: () => void
  userHasStakes?: boolean
}

const PositionDetails: React.FC<IProps> = ({
  tokenXAddress,
  tokenYAddress,
  poolAddress,
  copyPoolAddressHandler,
  detailsData,
  leftRange,
  rightRange,
  midPrice,
  currentPrice,
  tokenY,
  tokenX,
  tokenXPriceData,
  tokenYPriceData,
  onClickClaimFee,
  closePosition,
  ticksLoading,
  tickSpacing,
  fee,
  min,
  max,
  initialIsDiscreteValue,
  onDiscreteChange,
  showFeesLoader = false,
  hasTicksError,
  reloadHandler,
  userHasStakes = false
}) => {
  const { classes } = useStyles()

  const navigate = useNavigate()

  const [xToY, setXToY] = useState<boolean>(
    initialXtoY(tokenXAddress.toString(), tokenYAddress.toString())
  )

  return (
    <Grid container className={classes.wrapperContainer} wrap='nowrap'>
      <Grid className={classes.positionDetails} container item direction='column'>
        <Link to='/pool' style={{ textDecoration: 'none' }}>
          <Grid className={classes.back} container item alignItems='center'>
            <img className={classes.backIcon} src={backIcon} />
            <Typography className={classes.backText}>Back to Liquidity Positions List</Typography>
          </Grid>
        </Link>

        <SinglePositionInfo
          fee={+printBigint(fee, PERCENTAGE_SCALE - 2n)}
          onClickClaimFee={onClickClaimFee}
          closePosition={closePosition}
          tokenX={tokenX}
          tokenY={tokenY}
          tokenXPriceData={tokenXPriceData}
          tokenYPriceData={tokenYPriceData}
          xToY={xToY}
          swapHandler={() => setXToY(!xToY)}
          showFeesLoader={showFeesLoader}
          userHasStakes={userHasStakes}
        />
      </Grid>

      <Grid
        container
        item
        direction='column'
        alignItems='flex-end'
        className={classes.right}
        wrap='nowrap'>
        <Grid
          container
          item
          direction='row'
          alignItems='flex-end'
          // justifyContent='space-between'
          style={{ paddingLeft: 20, flexDirection: 'row-reverse' }}
          className={classes.right}
          wrap='nowrap'>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Button
              className={classes.button}
              variant='contained'
              onClick={() => {
                const parsedFee = parseFeeToPathFee(fee)
                const address1 = addressToTicker(tokenXAddress.toString())
                const address2 = addressToTicker(tokenYAddress.toString())

                navigate(`/newPosition/${address1}/${address2}/${parsedFee}`)
              }}>
              <span className={classes.buttonText}>+ Add Liquidity</span>
            </Button>
          </Box>
          <MarketIdLabel
            marketId={poolAddress.toString()}
            displayLength={9}
            copyPoolAddressHandler={copyPoolAddressHandler}
            style={{ paddingBottom: 20, paddingRight: 10 }}
          />
        </Grid>

        <SinglePositionPlot
          data={
            detailsData.length
              ? xToY
                ? detailsData
                : detailsData.map(tick => ({ ...tick, x: 1 / tick.x })).reverse()
              : Array(100)
                  .fill(1)
                  .map((_e, index) => ({ x: index, y: index, index: BigInt(index) }))
          }
          leftRange={xToY ? leftRange : { ...rightRange, x: 1 / rightRange.x }}
          rightRange={xToY ? rightRange : { ...leftRange, x: 1 / leftRange.x }}
          midPrice={{
            ...midPrice,
            x: midPrice.x ** (xToY ? 1 : -1)
          }}
          currentPrice={currentPrice ** (xToY ? 1 : -1)}
          tokenY={tokenY}
          tokenX={tokenX}
          ticksLoading={ticksLoading}
          tickSpacing={tickSpacing}
          min={xToY ? min : 1 / max}
          max={xToY ? max : 1 / min}
          xToY={xToY}
          initialIsDiscreteValue={initialIsDiscreteValue}
          onDiscreteChange={onDiscreteChange}
          hasTicksError={hasTicksError}
          reloadHandler={reloadHandler}
        />
      </Grid>
    </Grid>
  )
}

export default PositionDetails
