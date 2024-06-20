import ClosePositionWarning from '@components/Modals/ClosePositionWarning/ClosePositionWarning'
import { Button, Grid, Hidden, Typography } from '@mui/material'
import icons from '@static/icons'
import { TokenPriceData } from '@store/consts/static'
import { blurContent, unblurContent } from '@utils/uiUtils'
import classNames from 'classnames'
import React, { useState } from 'react'
import { BoxInfo } from './BoxInfo'
import { ILiquidityToken } from './consts'
import useStyles from './style'
import { addressToTicker } from '@store/consts/uiUtiils'
import { useNavigate } from 'react-router-dom'

interface IProp {
  fee: number
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
  isBalanceLoading: boolean
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
  userHasStakes = false,
  isBalanceLoading
}) => {
  const navigate = useNavigate()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const { classes } = useStyles()

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
          <Hidden smUp>
            {' '}
            <Button
              className={classes.button}
              variant='contained'
              onClick={() => {
                const address1 = addressToTicker(tokenX.name)
                const address2 = addressToTicker(tokenY.name)

                navigate(`/newPosition/${address1}/${address2}/${fee}`)
              }}>
              <span className={classes.buttonText}>+ Add Liquidity</span>
            </Button>
          </Hidden>
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
          isBalanceLoading={isBalanceLoading}
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
          isBalanceLoading={isBalanceLoading}
        />
      </Grid>
    </Grid>
  )
}

export default SinglePositionInfo
