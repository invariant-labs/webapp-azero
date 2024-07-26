import { Grid, Hidden, Tooltip, Typography, useMediaQuery } from '@mui/material'
import SwapList from '@static/svg/swap-list.svg'
import { theme } from '@static/theme'
import { formatNumber, initialXtoY, tickerToAddress } from '@utils/utils'
import classNames from 'classnames'
import { useMemo, useState } from 'react'
import { useStyles } from './style'

export interface IPositionItem {
  tokenXName: string
  tokenYName: string
  tokenXIcon: string
  tokenYIcon: string
  tokenXLiq: number
  tokenYLiq: number
  fee: number
  min: number
  max: number
  valueX: number
  valueY: number
  address: string
  id: number
  isActive?: boolean
}

export const PositionItem: React.FC<IPositionItem> = ({
  tokenXName,
  tokenYName,
  tokenXIcon,
  tokenYIcon,
  tokenXLiq,
  tokenYLiq,
  fee,
  min,
  max,
  valueX,
  valueY,
  isActive = false
}) => {
  const { classes } = useStyles()

  const isXs = useMediaQuery(theme.breakpoints.down('xs'))
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'))

  const [xToY, setXToY] = useState<boolean>(
    initialXtoY(tickerToAddress(tokenXName), tickerToAddress(tokenYName))
  )

  const feeFragment = useMemo(
    () => (
      <Tooltip
        enterTouchDelay={0}
        leaveTouchDelay={Number.MAX_SAFE_INTEGER}
        onClick={e => e.stopPropagation()}
        title={
          isActive
            ? 'Position active. Current price is inside range'
            : 'Position inactive. Current price is outside range'
        }
        placement='top'
        classes={{
          tooltip: classes.tooltip
        }}>
        <Grid
          container
          item
          className={classNames(classes.fee, isActive ? classes.activeFee : undefined)}
          justifyContent='center'
          alignItems='center'>
          <Typography
            className={classNames(classes.infoText, isActive ? classes.activeInfoText : undefined)}>
            {fee}% fee
          </Typography>
        </Grid>
      </Tooltip>
    ),
    [fee, classes, isActive]
  )

  const valueFragment = useMemo(
    () => (
      <Grid
        container
        item
        className={classes.value}
        justifyContent='space-between'
        alignItems='center'
        wrap='nowrap'>
        <Typography className={classNames(classes.infoText, classes.label)}>Value</Typography>
        <Grid className={classes.infoCenter} container item justifyContent='center'>
          <Typography className={classes.greenText}>
            {formatNumber(xToY ? valueX : valueY)} {xToY ? tokenXName : tokenYName}
          </Typography>
        </Grid>
      </Grid>
    ),
    [valueX, valueY, tokenXName, classes, isXs, isDesktop, tokenYName, xToY]
  )

  return (
    <Grid
      className={classes.root}
      container
      direction='row'
      alignItems='center'
      justifyContent='space-between'>
      <Grid container item className={classes.mdTop} direction='row' wrap='nowrap'>
        <Grid container item className={classes.iconsAndNames} alignItems='center' wrap='nowrap'>
          <Grid container item className={classes.icons} alignItems='center' wrap='nowrap'>
            <img
              className={classes.tokenIcon}
              src={xToY ? tokenXIcon : tokenYIcon}
              alt={xToY ? tokenXName : tokenYName}
            />
            <img
              className={classes.arrows}
              src={SwapList}
              alt='Arrow'
              onClick={e => {
                e.stopPropagation()
                setXToY(!xToY)
              }}
            />
            <img
              className={classes.tokenIcon}
              src={xToY ? tokenYIcon : tokenXIcon}
              alt={xToY ? tokenYName : tokenXName}
            />
          </Grid>

          <Typography className={classes.names}>
            {xToY ? tokenXName : tokenYName} - {xToY ? tokenYName : tokenXName}
          </Typography>
        </Grid>

        <Hidden mdUp>{feeFragment}</Hidden>
      </Grid>

      <Grid container item className={classes.mdInfo} direction='row'>
        <Hidden mdDown>{feeFragment}</Hidden>

        <Grid
          container
          item
          className={classes.liquidity}
          justifyContent='center'
          alignItems='center'>
          <Typography className={classes.infoText}>
            {formatNumber(xToY ? tokenXLiq : tokenYLiq)} {xToY ? tokenXName : tokenYName} {' - '}
            {formatNumber(xToY ? tokenYLiq : tokenXLiq)} {xToY ? tokenYName : tokenXName}
          </Typography>
        </Grid>

        <Hidden mdUp>{valueFragment}</Hidden>

        <Grid
          container
          item
          className={classes.minMax}
          justifyContent='space-between'
          alignItems='center'
          wrap='nowrap'>
          <Typography className={classNames(classes.greenText, classes.label)}>
            MIN - MAX
          </Typography>
          <Grid className={classes.infoCenter} container item justifyContent='center'>
            <Typography className={classes.infoText}>
              {formatNumber(xToY ? min : 1 / max)} - {formatNumber(xToY ? max : 1 / min)}{' '}
              {xToY ? tokenYName : tokenXName} per {xToY ? tokenXName : tokenYName}
            </Typography>
          </Grid>
        </Grid>

        <Hidden mdDown>{valueFragment}</Hidden>
      </Grid>
    </Grid>
  )
}
