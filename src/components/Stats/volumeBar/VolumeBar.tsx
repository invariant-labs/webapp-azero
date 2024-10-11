import React from 'react'
import classNames from 'classnames'
import { theme } from '@static/theme'
import { useStyles } from './style'
import { Box, Grid, Typography, useMediaQuery } from '@mui/material'
import { formatNumber } from '@utils/utils'

interface Iprops {
  percentVolume: number
  volume: number
  tvlVolume: number
  percentTvl: number
  feesVolume: number
  percentFees: number
}

const VolumeBar: React.FC<Iprops> = ({
  percentVolume,
  volume,
  tvlVolume,
  percentTvl,
  feesVolume,
  percentFees
}) => {
  const { classes } = useStyles()

  const isXDown = useMediaQuery(theme.breakpoints.down('xs'))

  return (
    <Grid container classes={{ container: classes.container }}>
      <Box className={classes.tokenName}>
        <Typography className={classes.tokenHeader}>Volume 24H:</Typography>
        <Typography className={classes.tokenContent}>${formatNumber(volume)}</Typography>
        {!isXDown && (
          <Typography
            className={classNames(
              classes.tokenContent,
              percentVolume < 0 ? classes.tokenLow : classes.tokenUp
            )}>
            {percentVolume < 0
              ? `(${percentVolume.toFixed(2)}%)`
              : `(+${percentVolume.toFixed(2)}%)`}
          </Typography>
        )}
      </Box>
      <Box className={classes.tokenName}>
        <Typography className={classes.tokenHeader}>TVL 24H:</Typography>
        <Typography className={classes.tokenContent}>${formatNumber(tvlVolume)}</Typography>
        {!isXDown && (
          <Typography
            className={classNames(
              classes.tokenContent,
              percentTvl < 0 ? classes.tokenLow : classes.tokenUp
            )}>
            {percentTvl < 0 ? `(${percentTvl.toFixed(2)}%)` : `(+${percentTvl.toFixed(2)}%)`}
          </Typography>
        )}
      </Box>
      <Box className={classes.tokenName}>
        <Typography className={classes.tokenHeader}>Fees 24H:</Typography>
        <Typography className={classes.tokenContent}>${formatNumber(feesVolume)}</Typography>
        {!isXDown && (
          <Typography
            className={classNames(
              classes.tokenContent,
              percentFees < 0 ? classes.tokenLow : classes.tokenUp
            )}>
            {percentFees < 0 ? `(${percentFees.toFixed(2)}%)` : `(+${percentFees.toFixed(2)}%)`}
          </Typography>
        )}
      </Box>
    </Grid>
  )
}

export default VolumeBar
