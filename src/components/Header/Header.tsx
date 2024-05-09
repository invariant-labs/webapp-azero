import { Box, Button, CardMedia, Grid, IconButton, useMediaQuery } from '@mui/material'
import { Link } from 'react-router-dom'
import useStyles from './style'
import { useEffect, useState } from 'react'
import NavbarButton from '@components/Navbar/Button'
import icons from '@static/icons'
import RoutesModal from '@components/Modals/RoutesModal'
import Hamburger from '@static/svg/Hamburger.svg'
import DotIcon from '@mui/icons-material/FiberManualRecordRounded'
import { blurContent, unblurContent } from '@utils/uiUtils'
import ChangeWalletButton from './HeaderButton/ChangeWalletButton'
import { AlephZeroNetworks, NetworkType } from '@store/consts/static'
import SelectNetworkButton from './HeaderButton/SelectNetworkButton'
import { AddressOrPair } from '@polkadot/api-base/types'
import SelectRPCButton from './HeaderButton/SelectRPCButton'
import useButtonStyles from './HeaderButton/style'
import { theme } from '@static/theme'
import SelectMainnetRPC from '@components/Modals/SelectMainnetRPC/SelectMainnetRPC'

export interface IHeader {
  address: AddressOrPair
  onNetworkSelect: (networkType: NetworkType, rpcAddress: string, rpcName?: string) => void
  onConnectWallet: () => void
  walletConnected: boolean
  landing: string
  typeOfNetwork: NetworkType
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

  const routes = ['swap', 'pool'] // TODO add 'stats' later

  const [activePath, setActive] = useState('swap')

  const [routesModalOpen, setRoutesModalOpen] = useState(false)
  const [testnetRpcsOpen, setTestnetRpcsOpen] = useState(false)
  const [routesModalAnchor, setRoutesModalAnchor] = useState<HTMLButtonElement | null>(null)

  useEffect(() => {
    // if there will be no redirects, get rid of this
    setActive(landing)
  }, [landing])

  const testnetRPCs = [
    {
      networkType: NetworkType.TESTNET,
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
          sx={{ display: { xs: 'none', lg: 'block' } }}>
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
            sx={{ display: { xs: 'block', lg: 'none' } }}>
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
          sx={{ display: { xs: 'none', lg: 'block' } }}>
          {routes.map(path => (
            <Link key={`path-${path}`} to={`/${path}`} className={classes.link}>
              <NavbarButton
                name={path}
                onClick={() => {
                  setActive(path)
                }}
                active={path === activePath}
              />
            </Link>
          ))}
        </Grid>

        <Grid container item className={classes.buttons} wrap='nowrap' gap={1.5}>
          {typeOfNetwork === NetworkType.DEVNET || typeOfNetwork === NetworkType.TESTNET ? (
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
          {typeOfNetwork === NetworkType.TESTNET ? (
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <SelectRPCButton rpc={rpc} networks={testnetRPCs} onSelect={onNetworkSelect} />
            </Box>
          ) : null}
          <SelectNetworkButton
            name={typeOfNetwork}
            networks={[
              {
                networkType: NetworkType.TESTNET,
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

        <Grid sx={{ display: { xs: 'block', lg: 'none' } }}>
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
            onFaucet={
              (typeOfNetwork === NetworkType.DEVNET || typeOfNetwork === NetworkType.TESTNET) &&
              isXsDown
                ? onFaucet
                : undefined
            }
            onRPC={
              typeOfNetwork === NetworkType.TESTNET && isXsDown
                ? () => {
                    setRoutesModalOpen(false)
                    setTestnetRpcsOpen(true)
                  }
                : undefined
            }
          />
          {typeOfNetwork === NetworkType.TESTNET ? (
            <SelectMainnetRPC
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
