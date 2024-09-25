import React from 'react'
import useStyles from './style'
import { ISelectNetwork } from '@store/consts/types'
import { blurContent, unblurContent } from '@utils/uiUtils'
import { Button } from '@mui/material'
import SelectTestnetRPC from '@components/Modals/SelectTestnetRPC/SelectTestnetRPC'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { Network } from '@invariant-labs/a0-sdk'
import SelectMainnetRPC from '@components/Modals/SelectMainnetRPC/SelectMainnetRPC'
import { RpcStatus } from '@store/reducers/connection'
import { RECOMMENDED_RPC_ADDRESS } from '@store/consts/static'
import icons from '@static/icons'

export interface IProps {
  rpc: string
  networks: ISelectNetwork[]
  onSelect: (networkType: Network, rpcAddress: string, rpcName?: string) => void
  disabled?: boolean
  network: Network
  rpcStatus: RpcStatus
}
export const SelectRPCButton: React.FC<IProps> = ({
  rpc,
  networks,
  onSelect,
  disabled = false,
  network,
  rpcStatus
}) => {
  const { classes } = useStyles()
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)
  const [openTestnetRpcs, setOpenTestnetRpcs] = React.useState<boolean>(false)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
    blurContent()
    setOpenTestnetRpcs(true)
  }

  const handleClose = () => {
    unblurContent()
    setOpenTestnetRpcs(false)
  }

  return (
    <>
      <Button
        className={classes.headerButton}
        variant='contained'
        classes={{ disabled: classes.disabled }}
        disabled={disabled}
        endIcon={<KeyboardArrowDownIcon id='downIcon' />}
        onClick={handleClick}>
        {rpcStatus === RpcStatus.IgnoredWithError && rpc !== RECOMMENDED_RPC_ADDRESS[network] && (
          <img className={classes.warningIcon} src={icons.warningIcon} alt='Warning icon' />
        )}
        RPC
      </Button>
      {network === Network.Testnet ? (
        <SelectTestnetRPC
          networks={networks}
          open={openTestnetRpcs}
          anchorEl={anchorEl}
          onSelect={onSelect}
          handleClose={handleClose}
          activeRPC={rpc}
          rpcStatus={rpcStatus}
        />
      ) : (
        <SelectMainnetRPC
          networks={networks}
          open={openTestnetRpcs}
          anchorEl={anchorEl}
          onSelect={onSelect}
          handleClose={handleClose}
          activeRPC={rpc}
          rpcStatus={rpcStatus}
        />
      )}
    </>
  )
}
export default SelectRPCButton
