import React from 'react'
import icons from '@static/icons'
import classNames from 'classnames'
import useStyles from './style'
import { blurContent, unblurContent } from '@utils/uiUtils'
import { Button } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

export interface ISelectModal {
  name?: string
  centered?: boolean
  // current: SwapToken | null
  // tokens: SwapToken[]
  current: null
  tokens: any[]
  onSelect: (index: number) => void
  className?: string
  hideBalancesInModal?: boolean
  handleAddToken: (address: string) => void
  sliceName?: boolean
  // commonTokens: PublicKey[]
  commonTokens: any[]
  initialHideUnknownTokensValue: boolean
  onHideUnknownTokensChange: (val: boolean) => void
}

export const Select: React.FC<ISelectModal> = ({
  name = 'Select',
  current,
  centered,
  tokens,
  onSelect,
  className,
  hideBalancesInModal = false,
  handleAddToken,
  sliceName = false,
  commonTokens,
  initialHideUnknownTokensValue,
  onHideUnknownTokensChange
}) => {
  const { classes } = useStyles()
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)
  const [open, setOpen] = React.useState<boolean>(false)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
    blurContent()
    setOpen(true)
  }

  const handleClose = () => {
    unblurContent()
    setOpen(false)
  }

  // const displayName = !current ? name : current.symbol
  const displayName = 'mockName'
  return (
    <>
      <Button
        className={classNames(classes.button, className)}
        color='primary'
        variant='contained'
        onClick={handleClick}
        // startIcon={
        //   !current ? null : <img className={classes.icon} src={current.logoURI ?? icons.SNY} />
        // }
        startIcon={!current ? null : <img className={classes.icon} src={icons.SNY} />}
        endIcon={<ExpandMoreIcon className={classes.endIcon} />}
        classes={{
          endIcon: 'selectArrow'
        }}
        disableRipple>
        <span style={{ whiteSpace: 'nowrap' }} className={classes.tokenName}>
          {sliceName && displayName.length > 10 ? displayName.slice(0, 8) + '...' : displayName}
        </span>
      </Button>
      {/* <SelectTokenModal
        tokens={tokens}
        // commonTokens={tokens ? tokens.slice(0, 4)
        //   : [{ symbol: 'SOL', name: 'Solana', logoURI: 'solana' }]}
        open={open}
        centered={centered}
        anchorEl={anchorEl}
        onSelect={onSelect}
        handleClose={handleClose}
        hideBalances={hideBalancesInModal}
        handleAddToken={handleAddToken}
        commonTokens={commonTokens}
        initialHideUnknownTokensValue={initialHideUnknownTokensValue}
        onHideUnknownTokensChange={onHideUnknownTokensChange}
      /> */}
    </>
  )
}
export default Select
