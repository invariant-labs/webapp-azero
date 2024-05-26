import React from 'react'

import { PERCENTAGE_SCALE } from '@invariant-labs/a0-sdk/target/consts'
import { Grid, Typography } from '@mui/material'
import loadingAnimation from '@static/gif/loading.gif'
import { printBigint } from '@store/consts/utils'
import { useStyles } from './styles'

interface IProps {
  open: boolean
  fee: bigint
  exchangeRate: { val: number; symbol: string; decimal: number }
  slippage: number
  // minimumReceived: { val: BN; symbol: string; decimal: number }
  priceImpact: number
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

  const feePercent = Number(printBigint(fee, PERCENTAGE_SCALE - 2n))
  const impact = priceImpact * 100

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
          <Typography className={classes.value}>{`${feePercent}%`}</Typography>
        </Grid>

        <Grid container justifyContent='space-between' className={classes.row}>
          <Typography className={classes.label}>Price impact:</Typography>
          <Typography className={classes.value}>
            {impact < 0.01 ? '<0.01%' : `${impact.toFixed(2)}%`}
          </Typography>
        </Grid>

        {/* <Grid container justifyContent='space-between' className={classes.row}>
          <Typography className={classes.label}>Minimum received:</Typography>
          <Typography className={classes.value}>
            {printBigint(minimumReceived.val, minimumReceived.decimal)} {minimumReceived.symbol}
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
