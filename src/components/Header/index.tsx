import { Box, Button, CardMedia, Grid } from '@mui/material'
import { Link } from 'react-router-dom'
import useStyles from './style'
import { useState } from 'react'
import NavbarButton from '@components/common/Navbar/Button'
import icons from '@static/icons'

export interface IHeader {}

export const Header: React.FC<IHeader> = () => {
  const { classes } = useStyles()

  // const [activePath, setActive] = useState(landing)
  const [activePath, setActive] = useState('')

  const routes = ['swap', 'pool', 'stats']

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

        {/* <Box sx={{ display: { xs: 'none', lg: 'block' } }}> */}
        <Box>
          <Grid container item className={classes.routers} wrap='nowrap'>
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
        </Box>

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
          {/* <ChangeWalletButton
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
          /> */}
          <Button
            variant='contained'
            onClick={() => {
              'wallet connected'
            }}>
            Mock button
          </Button>
        </Grid>

        {/* <Hidden lgUp>
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
              typeOfNetwork === NetworkType.MAINNET && isXsDown
                ? () => {
                    setRoutesModalOpen(false)
                    setMainnetRpcsOpen(true)
                  }
                : undefined
            }
            onPriority={
              typeOfNetwork === NetworkType.MAINNET && isXsDown
                ? () => {
                    setRoutesModalOpen(false)
                    setPriorityModal(true)
                  }
                : undefined
            }
          />
          {typeOfNetwork === NetworkType.MAINNET ? (
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
          ) : null}
        </Hidden> */}
      </Grid>
    </Grid>
  )
}
export default Header
