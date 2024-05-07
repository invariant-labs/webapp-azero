import icons from '@static/icons'
import classNames from 'classnames'
import React, { useState } from 'react'
import { BoxInfo } from './BoxInfo'
import { ILiquidityToken } from './consts'
import useStyles from './style'
import { TokenPriceData } from '@store/consts/static'
import { Box, Button, Grid, Typography } from '@mui/material'
import { blurContent, unblurContent } from '@utils/uiUtils'
import { useNavigate } from 'react-router-dom'
import ClosePositionWarning from '@components/Modals/ClosePositionWarning/ClosePositionWarning'
import { Percentage } from '@invariant-labs/a0-sdk/src'

interface IProp {
  fee: Percentage
  onClickClaimFee: () => void
  closePosition: (claimFarmRewards?: boolean) => void
  tokenX: ILiquidityToken
  tokenY: ILiquidityToken
  tokenXPriceData?: TokenPriceData
  tokenYPriceData?: TokenPriceData
  xToY: boolean
  swapHandler: () => void
  showFeesLoader?: boolean
  userHasStakes?: boolean
}

const SinglePositionInfo: React.FC<IProp> = ({
  fee,
  onClickClaimFee,
  closePosition,
  tokenX,
  tokenY,
  tokenXPriceData,
  tokenYPriceData,
  xToY,
  swapHandler,
  showFeesLoader = false,
  userHasStakes = false
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { classes } = useStyles()

  const navigate = useNavigate()
  return (
    <Grid className={classes.root}>
      <ClosePositionWarning
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          unblurContent()
        }}
        onClose={() => {
          closePosition()
          setIsModalOpen(false)
          unblurContent()
        }}
        onClaim={() => {
          closePosition(true)
          setIsModalOpen(false)
          unblurContent()
        }}
      />
      <Grid className={classes.header}>
        <Grid className={classes.iconsGrid}>
          <img
            className={classes.icon}
            src={xToY ? tokenX.icon : tokenY.icon}
            alt={xToY ? tokenX.name : tokenY.name}
          />
          <img className={classes.arrowIcon} src={icons.ArrowIcon} alt={'Arrow'} />
          <img
            className={classes.icon}
            src={xToY ? tokenY.icon : tokenX.icon}
            alt={xToY ? tokenY.name : tokenX.name}
          />
          <Grid className={classes.namesGrid}>
            <Typography className={classes.name}>{xToY ? tokenX.name : tokenY.name}</Typography>
            <Typography id='pause' className={classes.name}>
              -
            </Typography>
            <Typography className={classes.name}>{xToY ? tokenY.name : tokenX.name}</Typography>
          </Grid>
          <Grid className={classes.rangeGrid}>
            <Typography className={classNames(classes.text, classes.feeText)}>
              {fee.toString()}% fee
            </Typography>
          </Grid>
        </Grid>

        <Grid className={classes.headerButtons}>
          <Button
            className={classes.closeButton}
            variant='contained'
            onClick={() => {
              if (!userHasStakes) {
                closePosition()
              } else {
                setIsModalOpen(true)
                blurContent()
              }
            }}>
            Close position
          </Button>
          {/* Test it */}
          <Box sx={{ display: { sm: 'none', md: 'block' } }}>
            {' '}
            <Button
              className={classes.button}
              variant='contained'
              onClick={() => {
                navigate('/newPosition')
              }}>
              <span className={classes.buttonText}>+ Add Liquidity</span>
            </Button>
          </Box>
        </Grid>
      </Grid>
      <Grid className={classes.bottomGrid}>
        <BoxInfo
          title={'Liquidity'}
          tokenA={
            xToY
              ? { ...tokenX, value: tokenX.liqValue, price: tokenXPriceData?.price }
              : { ...tokenY, value: tokenY.liqValue, price: tokenYPriceData?.price }
          }
          tokenB={
            xToY
              ? { ...tokenY, value: tokenY.liqValue, price: tokenYPriceData?.price }
              : { ...tokenX, value: tokenX.liqValue, price: tokenXPriceData?.price }
          }
          showBalance
          swapHandler={swapHandler}
        />
        <BoxInfo
          title={'Unclaimed fees'}
          tokenA={
            xToY ? { ...tokenX, value: tokenX.claimValue } : { ...tokenY, value: tokenY.claimValue }
          }
          tokenB={
            xToY ? { ...tokenY, value: tokenY.claimValue } : { ...tokenX, value: tokenX.claimValue }
          }
          onClickButton={onClickClaimFee}
          showLoader={showFeesLoader}
        />
      </Grid>
    </Grid>
  )
}

export default SinglePositionInfo
