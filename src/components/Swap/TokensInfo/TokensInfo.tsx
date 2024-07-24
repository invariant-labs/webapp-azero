import React from 'react'
import { Grid } from '@mui/material'
import { useWrapperStyles } from './styles'
import SingleToken from './SingleToken/SingleToken'
import { SwapToken } from '@store/selectors/wallet'
import { VariantType } from 'notistack'

interface IProps {
  tokenFrom?: SwapToken
  tokenTo?: SwapToken
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
  const { classes } = useWrapperStyles()

  return (
    <Grid
      container
      className={classes.wrapper}
      direction='row'
      justifyContent='center'
      alignItems='center'>
      <SingleToken
        token={tokenFrom}
        tokenPrice={tokenFromPrice}
        copyTokenAddressHandler={copyTokenAddressHandler}
      />
      <div className={classes.divider} />
      <SingleToken
        token={tokenTo}
        tokenPrice={tokenToPrice}
        copyTokenAddressHandler={copyTokenAddressHandler}
      />
    </Grid>
  )
}

export default TokensInfo
