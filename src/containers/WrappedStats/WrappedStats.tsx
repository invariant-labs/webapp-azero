import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import loader from '@static/gif/loader.gif'
import useStyles from './styles'
import { Grid, Typography } from '@mui/material'
import { EmptyPlaceholder } from '@components/EmptyPlaceholder/EmptyPlaceholder'
import {
  fees24,
  isLoading,
  liquidityPlot,
  poolsStatsWithTokensDetails,
  tokensStatsWithTokensDetails,
  tvl24,
  volume24,
  volumePlot
} from '@store/selectors/stats'
import { networkType } from '@store/selectors/connection'
import { actions } from '@store/reducers/stats'
import Volume from '@components/Stats/Volume/Volume'
import Liquidity from '@components/Stats/Liquidity/Liquidity'
import VolumeBar from '@components/Stats/volumeBar/VolumeBar'
import TokensList from '@components/Stats/TokensList/TokensList'
import PoolList from '@components/Stats/PoolList/PoolList'

export const WrappedStats: React.FC = () => {
  const { classes } = useStyles()

  const dispatch = useDispatch()

  const poolsList = useSelector(poolsStatsWithTokensDetails)
  const tokensList = useSelector(tokensStatsWithTokensDetails)
  const volume24h = useSelector(volume24)
  const tvl24h = useSelector(tvl24)
  const fees24h = useSelector(fees24)
  const volumePlotData = useSelector(volumePlot)
  const liquidityPlotData = useSelector(liquidityPlot)
  const isLoadingStats = useSelector(isLoading)
  const currentNetwork = useSelector(networkType)

  useEffect(() => {
    dispatch(actions.getCurrentStats())
  }, [])

  console.log(poolsList)

  return (
    <Grid container className={classes.wrapper} direction='column'>
      {isLoadingStats ? (
        <img src={loader} className={classes.loading} alt='Loading' />
      ) : liquidityPlotData.length === 0 ? (
        <Grid container direction='column' alignItems='center'>
          <EmptyPlaceholder desc={'We have not started collecting statistics yet'} />
        </Grid>
      ) : (
        <>
          <Typography className={classes.subheader}>Overview</Typography>
          <Grid container className={classes.plotsRow} wrap='nowrap'>
            <Volume
              volume={volume24h.value}
              percentVolume={volume24h.change}
              data={volumePlotData}
              className={classes.plot}
            />
            <Liquidity
              liquidityVolume={tvl24h.value}
              liquidityPercent={tvl24h.change}
              data={liquidityPlotData}
              className={classes.plot}
            />
          </Grid>
          <Grid className={classes.row}>
            <VolumeBar
              volume={volume24h.value}
              percentVolume={volume24h.change}
              tvlVolume={tvl24h.value}
              percentTvl={tvl24h.change}
              feesVolume={fees24h.value}
              percentFees={fees24h.change}
            />
          </Grid>
          <Typography className={classes.subheader}>Top tokens</Typography>
          <Grid container className={classes.row}>
            <TokensList
              data={tokensList.map(tokenData => ({
                icon: tokenData.tokenDetails?.logoURI,
                name: tokenData.tokenDetails?.name,
                symbol: tokenData.tokenDetails?.symbol,
                price: tokenData.price,
                // priceChange: tokenData.priceChange,
                volume: tokenData.volume24,
                TVL: tokenData.tvl,
                isUnknown: tokenData.tokenDetails?.isUnknown ?? false
              }))}
            />
          </Grid>
          <Typography className={classes.subheader}>Top pools</Typography>
          <PoolList
            data={poolsList.map(poolData => ({
              symbolFrom: poolData.tokenXDetails?.symbol,
              symbolTo: poolData.tokenYDetails?.symbol,
              iconFrom: poolData.tokenXDetails?.logoURI,
              iconTo: poolData.tokenYDetails?.logoURI,
              volume: poolData.volume24,
              TVL: poolData.tvl,
              fee: poolData.fee,
              addressFrom: poolData.tokenX,
              addressTo: poolData.tokenY,
              // apy: poolData.apy,
              // apyData: {
              //   fees: poolData.apy,
              //   accumulatedFarmsSingleTick: 0,
              //   accumulatedFarmsAvg: 0
              // }
              // apy:
              //   poolData.apy + (accumulatedSingleTickAPY?.[poolData.poolAddress.toString()] ?? 0),
              // apyData: {
              //   fees: poolData.apy,
              //   accumulatedFarmsSingleTick:
              //     accumulatedSingleTickAPY?.[poolData.poolAddress.toString()] ?? 0,
              //   accumulatedFarmsAvg: accumulatedAverageAPY?.[poolData.poolAddress.toString()] ?? 0
              // },
              isUnknownFrom: poolData.tokenXDetails?.isUnknown ?? false,
              isUnknownTo: poolData.tokenYDetails?.isUnknown ?? false
            }))}
            network={currentNetwork}
          />
        </>
      )}
    </Grid>
  )
}

export default WrappedStats
