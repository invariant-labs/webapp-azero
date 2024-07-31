import { Network } from '@invariant-labs/a0-sdk'
import DotIcon from '@mui/icons-material/FiberManualRecord'
import { Button, Grid, Input, Popover, Typography } from '@mui/material'
import icons from '@static/icons'
import { ISelectNetwork } from '@store/consts/types'
import classNames from 'classnames'
import React, { useState } from 'react'
import useStyles from './styles'

export interface ISelectTestnetRPC {
  networks: ISelectNetwork[]
  open: boolean
  anchorEl: HTMLButtonElement | null
  onSelect: (networkType: Network, rpcAddress: string, rpcName?: string) => void
  handleClose: () => void
  activeRPC: string
}
export const SelectTestnetRPC: React.FC<ISelectTestnetRPC> = ({
  networks,
  anchorEl,
  open,
  onSelect,
  handleClose,
  activeRPC
}) => {
  const { classes } = useStyles()

  const [activeCustom, setActiveCustom] = useState(false)
  const [customApplied, setCustomApplied] = useState(false)
  const [buttonApplied, setButtonApplied] = useState(false)
  const [address, setAddress] = useState(
    networks.some(net => net.rpc === activeRPC) ? '' : activeRPC
  )

  const isAddressValid = () => {
    const urlRegex = /^wss?:\/\/[^.]+\.[^.]+/

    return urlRegex.test(address)
  }

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      classes={{ paper: classes.paper }}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center'
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center'
      }}>
      <Grid className={classes.root}>
        <Typography className={classes.title}>Select testnet RPC to use</Typography>
        <Grid className={classes.list} container alignContent='space-around' direction='column'>
          {networks.map(({ networkType, rpc, rpcName }) => (
            <Grid
              className={classNames(
                classes.listItem,
                rpc === activeRPC && !customApplied ? classes.active : null
              )}
              item
              key={`networks-${networkType}-${rpc}`}
              onClick={() => {
                console.log(rpc)
                onSelect(networkType, rpc, rpcName)
                setActiveCustom(false)
                setCustomApplied(false)
                handleClose()
              }}>
              <Typography className={classes.name}>{rpcName}</Typography>
              <DotIcon className={classes.dotIcon} />
            </Grid>
          ))}
          <Grid
            className={classNames(
              classes.listItem,
              activeCustom && customApplied ? classes.active : null,
              activeCustom ? classes.activeBackground : null
            )}
            item
            key={`custom-rpc`}
            onClick={() => {
              setActiveCustom(true)
              setButtonApplied(false)
            }}>
            <Typography className={classes.name}>Custom</Typography>
            <DotIcon className={classes.dotIcon} />
          </Grid>
        </Grid>
        <Grid
          className={classes.lowerRow}
          container
          direction='row'
          justifyContent='space-between'
          wrap='nowrap'>
          <Input
            className={classNames(classes.input, activeCustom ? classes.activePlaceholder : null)}
            classes={{
              input: classes.innerInput
            }}
            placeholder='Custom RPC address'
            onChange={e => {
              setButtonApplied(false)
              setAddress(e.target.value)
            }}
            value={address}
            disableUnderline
            disabled={!activeCustom}
          />
          <Button
            className={classNames(classes.add, buttonApplied ? classes.applied : null)}
            onClick={() => {
              onSelect(Network.Testnet, address, 'Custom')
              setCustomApplied(true)
              setButtonApplied(true)
              handleClose()
            }}
            disableRipple
            disabled={!isAddressValid()}
            style={{ opacity: !activeCustom ? '0.5' : '1' }}>
            {buttonApplied ? 'Applied' : 'Apply'}
          </Button>
        </Grid>
      </Grid>
    </Popover>
  )
}
export default SelectTestnetRPC
