import { Box, CardMedia, Grid, IconButton } from '@mui/material'
import { Link } from 'react-router-dom'
import useStyles from './style'
import { useState } from 'react'
import NavbarButton from '@components/common/Navbar/Button'
import icons from '@static/icons'
import RoutesModal from '@components/Modals/RoutesModal'
import Hamburger from '@static/svg/Hamburger.svg'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import { blurContent, unblurContent } from '@utils/uiUtils'
import ChangeWalletButton from './HeaderButton/ChangeWalletButton'

export interface IHeader {
  // address: PublicKey
  // onNetworkSelect: (networkType: NetworkType, rpcAddress: string, rpcName?: string) => void
  onConnectWallet: () => void
  walletConnected: boolean
  // landing: string
  // typeOfNetwork: NetworkType
  // rpc: string
  // onFaucet?: () => void
  onDisconnectWallet: () => void
  // defaultMainnetRPC: string
  // recentPriorityFee: string
  // onPrioritySave: () => void
}

export const Header: React.FC<IHeader> = ({
  // // address,
  // // onNetworkSelect,
  onConnectWallet,
  walletConnected,
  // // landing,
  // // typeOfNetwork,
  // // rpc,
  // // onFaucet,
  onDisconnectWallet
  // // defaultMainnetRPC,
  // // recentPriorityFee,
  // // onPrioritySave
}) => {
  const { classes } = useStyles()

  const routes = ['swap', 'pool', 'stats']

  const [activePath, setActive] = useState('swap')

  const [routesModalOpen, setRoutesModalOpen] = useState(false)

  const [routesModalAnchor, setRoutesModalAnchor] = useState<HTMLButtonElement | null>(null)

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

        <Grid container item className={classes.buttons} wrap='nowrap'>
          {/* <Hidden xsDown>
            {typeOfNetwork === NetworkType.DEVNET || typeOfNetwork === NetworkType.TESTNET ? (
              <Button
                className={buttonClasses.headerButton}
                variant='contained'
                classes={{ label: buttonClasses.label }}
                onClick={onFaucet}>
                Faucet
              </Button>
            ) : null}
          </Hidden>
          <Hidden xsDown>
            {typeOfNetwork === NetworkType.MAINNET ? (
              <SelectPriorityButton
                recentPriorityFee={recentPriorityFee}
                onPrioritySave={onPrioritySave}
              />
            ) : null}
          </Hidden>
          <Hidden xsDown>
            {typeOfNetwork === NetworkType.MAINNET ? (
              <SelectRPCButton rpc={rpc} networks={mainnetRPCs} onSelect={onNetworkSelect} />
            ) : null}
          </Hidden>
          <SelectNetworkButton
            name={typeOfNetwork}
            networks={[
              {
                networkType: NetworkType.MAINNET,
                rpc: defaultMainnetRPC,
                rpcName:
                  mainnetRPCs.find(data => data.rpc === defaultMainnetRPC)?.rpcName ?? 'Custom'
              },
              { networkType: NetworkType.DEVNET, rpc: SolanaNetworks.DEV }
            ]}
            onSelect={onNetworkSelect}
          /> */}
          <ChangeWalletButton
            name='Connect wallet Mock'
            // name={
            //   walletConnected
            //     ? `${address.toString().slice(0, 4)}...${
            //         !isXsDown
            //           ? address
            //               .toString()
            //               .slice(address.toString().length - 4, address.toString().length)
            //           : ''
            //       }`
            //     : 'Connect wallet'
            // }
            onConnect={onConnectWallet}
            connected={walletConnected}
            onDisconnect={onDisconnectWallet}
            startIcon={
              walletConnected ? (
                <FiberManualRecordIcon className={classes.connectedWalletIcon} />
              ) : undefined
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
              // unblurContent()
            }}
            // onFaucet={
            //   (typeOfNetwork === NetworkType.DEVNET || typeOfNetwork === NetworkType.TESTNET) &&
            //   isXsDown
            //     ? onFaucet
            //     : undefined
            // }
            // onRPC={
            //   typeOfNetwork === NetworkType.MAINNET && isXsDown
            //     ? () => {
            //         setRoutesModalOpen(false)
            //         setMainnetRpcsOpen(true)
            //       }
            //     : undefined
            // }
            // onPriority={
            //   typeOfNetwork === NetworkType.MAINNET && isXsDown
            //     ? () => {
            //         setRoutesModalOpen(false)
            //         setPriorityModal(true)
            //       }
            //     : undefined
            // }
          />
          {/* {typeOfNetwork === NetworkType.MAINNET ? (
            <Priority
              open={priorityModal}
              anchorEl={routesModalAnchor}
              recentPriorityFee={recentPriorityFee}
              handleClose={() => {
                unblurContent()
                setPriorityModal(false)
              }}
              onPrioritySave={onPrioritySave}
            />
          ) : null}
          {typeOfNetwork === NetworkType.MAINNET ? (
            <SelectMainnetRPC
              networks={mainnetRPCs}
              open={mainnetRpcsOpen}
              anchorEl={routesModalAnchor}
              onSelect={onNetworkSelect}
              handleClose={() => {
                setMainnetRpcsOpen(false)
                unblurContent()
              }}
              activeRPC={rpc}
            />
          ) : null} */}
        </Grid>
      </Grid>
    </Grid>
  )
}
export default Header
