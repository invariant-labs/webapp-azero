import RoutesModal from '@components/Modals/RoutesModal'
import SelectTestnetRPC from '@components/Modals/SelectTestnetRPC/SelectTestnetRPC'
import NavbarButton from '@components/Navbar/Button'
import { Network } from '@invariant-labs/a0-sdk/src'
import DotIcon from '@mui/icons-material/FiberManualRecordRounded'
import { Box, Button, CardMedia, Grid, IconButton, useMediaQuery } from '@mui/material'
import icons from '@static/icons'
import Hamburger from '@static/svg/Hamburger.svg'
import { theme } from '@static/theme'
import { AlephZeroNetworks } from '@store/consts/static'
import { blurContent, unblurContent } from '@utils/uiUtils'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ChangeWalletButton from './HeaderButton/ChangeWalletButton'
import SelectNetworkButton from './HeaderButton/SelectNetworkButton'
import SelectRPCButton from './HeaderButton/SelectRPCButton'
import useButtonStyles from './HeaderButton/style'
import useStyles from './style'

export interface IHeader {
  address: string
  onNetworkSelect: (networkType: Network, rpcAddress: string, rpcName?: string) => void
  onConnectWallet: () => void
  walletConnected: boolean
  landing: string
  typeOfNetwork: Network
  rpc: string
  onFaucet?: () => void
  onDisconnectWallet: () => void
  defaultTestnetRPC: string
}

export const Header: React.FC<IHeader> = ({
  address,
  onNetworkSelect,
  onConnectWallet,
  walletConnected,
  landing,
  typeOfNetwork,
  rpc,
  onFaucet,
  onDisconnectWallet,
  defaultTestnetRPC
}) => {
  const { classes } = useStyles()
  const buttonStyles = useButtonStyles()

  const isXsDown = useMediaQuery(theme.breakpoints.down('sm'))

  const routes = ['swap', 'pool', 'stats']

  const otherRoutesToHighlight: Record<string, RegExp[]> = {
    pool: [/^newPosition\/*/, /^position\/*/]
  }

  const [activePath, setActive] = useState('swap')

  const [routesModalOpen, setRoutesModalOpen] = useState(false)
  const [testnetRpcsOpen, setTestnetRpcsOpen] = useState(false)
  const [routesModalAnchor, setRoutesModalAnchor] = useState<HTMLButtonElement | null>(null)

  useEffect(() => {
    setActive(landing)
  }, [landing])

  const testnetRPCs = [
    {
      networkType: Network.Testnet,
      rpc: AlephZeroNetworks.TEST,
      rpcName: 'Aleph zero'
    }
  ]

  return (
    <Grid container>
      <Grid container className={classes.root} direction='row' alignItems='center' wrap='nowrap'>
        <Grid
          container
          item
          className={classes.leftSide}
          justifyContent='flex-start'
          sx={{ display: { xs: 'none', md: 'block' } }}>
          <Grid container>
            <CardMedia className={classes.logo} image={icons.LogoTitle} />
          </Grid>
        </Grid>
        <Box>
          <Grid
            container
            item
            className={classes.leftSide}
            justifyContent='flex-start'
            sx={{ display: { xs: 'block', md: 'none' } }}>
            <Grid container>
              <CardMedia className={classes.logoShort} image={icons.LogoShort} />
            </Grid>
          </Grid>
        </Box>
        <Grid
          container
          item
          className={classes.routers}
          wrap='nowrap'
          sx={{ display: { xs: 'none', md: 'block' } }}>
          {routes.map(path => (
            <Link key={`path-${path}`} to={`/${path}`} className={classes.link}>
              <NavbarButton
                name={path}
                onClick={() => {
                  setActive(path)
                }}
                active={
                  path === activePath ||
                  (!!otherRoutesToHighlight[path] &&
                    otherRoutesToHighlight[path].some(pathRegex => pathRegex.test(activePath)))
                }
              />
            </Link>
          ))}
        </Grid>

        <Grid container item className={classes.buttons} wrap='nowrap' gap={1.5}>
          {typeOfNetwork === Network.Testnet ? (
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Button
                className={buttonStyles.classes.headerButton}
                variant='contained'
                sx={{ '& .MuiButton-label': buttonStyles.classes.label }}
                onClick={onFaucet}>
                Faucet
              </Button>
            </Box>
          ) : null}
          {typeOfNetwork === Network.Testnet ? (
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <SelectRPCButton rpc={rpc} networks={testnetRPCs} onSelect={onNetworkSelect} />
            </Box>
          ) : null}
          <SelectNetworkButton
            name={typeOfNetwork}
            networks={[
              {
                networkType: Network.Testnet,
                rpc: defaultTestnetRPC,
                rpcName:
                  testnetRPCs.find(data => data.rpc === defaultTestnetRPC)?.rpcName ?? 'Custom'
              }
            ]}
            onSelect={onNetworkSelect}
          />
          <ChangeWalletButton
            name={
              walletConnected
                ? `${address.toString().slice(0, 4)}...${
                    !isXsDown
                      ? address
                          .toString()
                          .slice(address.toString().length - 4, address.toString().length)
                      : ''
                  }`
                : 'Connect wallet'
            }
            onConnect={onConnectWallet}
            connected={walletConnected}
            onDisconnect={onDisconnectWallet}
            startIcon={
              walletConnected ? <DotIcon className={classes.connectedWalletIcon} /> : undefined
            }
          />
        </Grid>

        <Grid sx={{ display: { xs: 'block', md: 'none' } }}>
          <IconButton
            className={classes.menuButton}
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
              setRoutesModalAnchor(event.currentTarget)
              setRoutesModalOpen(true)
              blurContent()
            }}>
            <CardMedia className={classes.menu} image={Hamburger} />
          </IconButton>
          <RoutesModal
            routes={routes}
            anchorEl={routesModalAnchor}
            open={routesModalOpen}
            current={activePath}
            onSelect={(selected: string) => {
              setActive(selected)
              setRoutesModalOpen(false)
              unblurContent()
            }}
            handleClose={() => {
              setRoutesModalOpen(false)
              unblurContent()
            }}
            onFaucet={typeOfNetwork === Network.Testnet && isXsDown ? onFaucet : undefined}
            onRPC={
              typeOfNetwork === Network.Testnet && isXsDown
                ? () => {
                    setRoutesModalOpen(false)
                    setTestnetRpcsOpen(true)
                  }
                : undefined
            }
          />
          {typeOfNetwork === Network.Testnet ? (
            <SelectTestnetRPC
              networks={testnetRPCs}
              open={testnetRpcsOpen}
              anchorEl={routesModalAnchor}
              onSelect={onNetworkSelect}
              handleClose={() => {
                setTestnetRpcsOpen(false)
                unblurContent()
              }}
              activeRPC={rpc}
            />
          ) : null}
        </Grid>
      </Grid>
    </Grid>
  )
}
export default Header
