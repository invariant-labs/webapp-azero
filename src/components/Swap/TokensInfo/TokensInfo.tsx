import React from 'react'
import { Grid } from '@mui/material'
import { useStyles } from './styles'
import SingleToken from './SingleToken/SingleToken'
import { SwapToken } from '@store/selectors/wallet'
import { VariantType } from 'notistack'

interface IProps {
  tokenFrom: SwapToken
  tokenTo: SwapToken
  tokenToPrice?: number
  tokenFromPrice?: number
  copyTokenAddressHandler: (message: string, variant: VariantType) => void
}

const TokensInfo: React.FC<IProps> = ({
  tokenFrom,
  tokenTo,
  tokenToPrice,
  tokenFromPrice,
  copyTokenAddressHandler
}) => {
  const { classes } = useStyles()

  return (
    <Grid
      container
      className={classes.wrapper}
      direction='row'
      justifyContent='center'
      alignItems='center'>
      <SingleToken
        token={tokenFrom}
        tokenPrice={tokenToPrice}
        copyTokenAddressHandler={copyTokenAddressHandler}
      />
      <div className={classes.divider} />
      <SingleToken
        token={tokenTo}
        tokenPrice={tokenFromPrice}
        copyTokenAddressHandler={copyTokenAddressHandler}
      />
    </Grid>
  )
}

export default TokensInfo
