import React from 'react'

import loadingAnimation from '@static/gif/loading.gif'
import { useStyles } from './styles'
import { Percentage } from '@invariant-labs/a0-sdk'
import { Grid, Typography } from '@mui/material'

interface IProps {
  open: boolean
  fee: { v: bigint }
  exchangeRate: { val: number; symbol: string; decimal: number }
  slippage: number
  // minimumReceived: { val: BN; symbol: string; decimal: number }
  priceImpact: Percentage
  isLoadingRate?: boolean
}

// const percentValueDisplay = (amount: Percentage): { value: BigInt; decimal: BigInt } => {
//   const amountLength = amount.v.toString().length - 1
//   const amountDec = DECIMAL - amountLength - 2
//   const amountValue = amount.v.div(new BN(10).pow(new BN(amountLength)))
//   return {
//     value: amountValue,
//     decimal: amountDec
//   }
// }

const TransactionDetailsBox: React.FC<IProps> = ({
  open,
  fee,
  exchangeRate,
  slippage,
  // minimumReceived,
  priceImpact,
  isLoadingRate = false
}) => {
  const { classes } = useStyles({ open })

  // const feePercent = percentValueDisplay(fee)
  // const impact = +printBN(priceImpact, DECIMAL - 2)

  return (
    <Grid container className={classes.wrapper}>
      <Grid container direction='column' wrap='nowrap' className={classes.innerWrapper}>
        <Grid container justifyContent='space-between' className={classes.row}>
          <Typography className={classes.label}>Exchange rate:</Typography>
          {isLoadingRate ? (
            <img src={loadingAnimation} className={classes.loading} />
          ) : (
            <Typography className={classes.value}>
              {exchangeRate.val === Infinity
                ? '-'
                : `${exchangeRate.val.toFixed(exchangeRate.decimal)} ${exchangeRate.symbol}`}
            </Typography>
          )}
        </Grid>

        <Grid container justifyContent='space-between' className={classes.row}>
          <Typography className={classes.label}>Fee:</Typography>
          <Typography className={classes.value}>
            {/* {printBN(feePercent.value, feePercent.decimal)}% */}
            {'0.3%'}
          </Typography>
        </Grid>

        <Grid container justifyContent='space-between' className={classes.row}>
          <Typography className={classes.label}>Price impact:</Typography>
          <Typography className={classes.value}>
            {/* {impact < 0.01 ? '<0.01%' : `${impact.toFixed(2)}%`} */}
            {'<0.01%'}
          </Typography>
        </Grid>

        {/* <Grid container justifyContent='space-between' className={classes.row}>
          <Typography className={classes.label}>Minimum received:</Typography>
          <Typography className={classes.value}>
            {printBN(minimumReceived.val, minimumReceived.decimal)} {minimumReceived.symbol}
          </Typography>
        </Grid> */}

        <Grid container justifyContent='space-between' className={classes.row}>
          <Typography className={classes.label}>Slippage tolerance:</Typography>
          <Typography className={classes.value}>{slippage}%</Typography>
        </Grid>
      </Grid>
    </Grid>
  )
}

export default TransactionDetailsBox
