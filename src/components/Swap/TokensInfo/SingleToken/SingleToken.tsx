import React from 'react'
import { Grid, Typography } from '@mui/material'
import { useStyles } from './../styles'
import { SwapToken } from '@store/selectors/wallet'
import icons from '@static/icons'
import { formatNumber } from '@utils/utils'
import { VariantType } from 'notistack'
import { TooltipHover } from '@components/TooltipHover/TooltipHover'
interface IProps {
  token?: SwapToken
  tokenPrice?: number
  copyTokenAddressHandler: (message: string, variant: VariantType) => void
}

const SingleToken: React.FC<IProps> = ({ token, tokenPrice, copyTokenAddressHandler }) => {
  const { classes } = useStyles({ isToken: !!token })

  const copyToClipboard = () => {
    if (!token) return
    navigator.clipboard
      .writeText(token.assetAddress)
      .then(() => {
        copyTokenAddressHandler('Address copied to Clipboard', 'success')
      })
      .catch(() => {
        copyTokenAddressHandler('Failed to copy address to Clipboard', 'error')
      })
  }

  return (
    <Grid className={classes.token}>
      <Grid container direction='row' justifyContent='flex-start' alignItems='center' wrap='nowrap'>
        {token?.logoURI ? (
          <img
            className={classes.tokenIcon}
            src={token.logoURI}
            loading='lazy'
            alt={token.name + 'logo'}
          />
        ) : (
          <img className={classes.tokenIcon} src={icons.selectToken} alt={'Select token'} />
        )}

        <Grid>
          <Grid container direction='row' alignItems='center' gap='6px' wrap='nowrap' pr={1}>
            <Typography className={classes.tokenName}>
              {token?.symbol ? token.symbol : 'Select a token'}{' '}
            </Typography>

            {token && (
              <a
                href={`https://ascan.alephzero.org/testnet/account/${token.assetAddress}`}
                target='_blank'
                rel='noopener noreferrer'
                onClick={event => {
                  event.stopPropagation()
                }}
                className={classes.link}>
                <img width={8} height={8} src={icons.newTab} alt={'Token address'} />
              </a>
            )}
          </Grid>
          <Typography className={classes.tokenDescription}>
            {token?.name ? token.name : '--'}
          </Typography>
        </Grid>
      </Grid>

      <Grid className={classes.rightItems}>
        <Typography className={classes.price}>
          {token ? (tokenPrice ? '$' + formatNumber(tokenPrice) : 'No data') : '--'}
        </Typography>
        <TooltipHover text='Copy'>
          <Grid className={classes.tokenAddress} onClick={copyToClipboard}>
            <Typography>
              {token
                ? token.assetAddress.slice(0, 4) + '...' + token.assetAddress.slice(-5, -1)
                : '--'}
            </Typography>
            <img
              width={8}
              height={8}
              src={icons.copyAddress}
              alt={'Copy address'}
              className={classes.clipboardIcon}
            />
          </Grid>
        </TooltipHover>
      </Grid>
    </Grid>
  )
}

export default SingleToken
