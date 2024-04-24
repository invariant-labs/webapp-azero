import Header from '@components/Header'
import { AlephZeroNetworks, NetworkType } from '@store/consts/static'
import React, { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

export interface IPriorityFeeOptions {
  label: string
  value: number
  saveValue: number
  description: string
}

export const HeaderWrapper: React.FC = () => {
  // const dispatch = useDispatch()
  // const walletAddress = useSelector(address)
  // const walletStatus = useSelector(status)
  // const currentNetwork = useSelector(network)
  // const currentRpc = useSelector(rpcAddress)
  const location = useLocation()
  const walletAddress = '0x1234567890'
  const currentNetwork = NetworkType.TESTNET
  const currentRpc = AlephZeroNetworks.TEST

  // useEffect(() => {
  //   nightlyConnectAdapter.addListener('connect', () => {
  //     dispatch(walletActions.connect())
  //   })

  //   if (nightlyConnectAdapter.connected) {
  //     dispatch(walletActions.connect())
  //   }

  //   nightlyConnectAdapter.canEagerConnect().then(
  //     async canEagerConnect => {
  //       if (canEagerConnect) {
  //         await nightlyConnectAdapter.connect()
  //       }
  //     },
  //     error => {
  //       console.log(error)
  //     }
  //   )
  // }, [])

  const defaultTestnetRPC = useMemo(() => {
    const lastRPC = localStorage.getItem('INVARIANT_TESTNET_RPC')

    return lastRPC === null ? AlephZeroNetworks.TEST : lastRPC
  }, [])

  const recentPriorityFee = useMemo(() => {
    const lastFee = localStorage.getItem('INVARIANT_MAINNET_PRIORITY_FEE')

    return lastFee === null ? '' : lastFee
  }, [])

  return (
    <Header
      address={walletAddress}
      onNetworkSelect={(network, rpcAddress) => {
        if (network !== currentNetwork || rpcAddress !== currentRpc) {
          if (network === NetworkType.TESTNET) {
            localStorage.setItem('INVARIANT_TESTNET_RPC', rpcAddress)
          }

          // dispatch(actions.setNetwork({ network, rpcAddress, rpcName }))
        }
      }}
      // onConnectWallet={openWalletSelectorModal}
      onConnectWallet={() => {}}
      landing={location.pathname.substring(1)}
      // walletConnected={walletStatus === Status.Initialized}
      // onFaucet={() => {
      //   dispatch(walletActions.airdrop())
      // }}
      // onDisconnectWallet={() => {
      //   dispatch(walletActions.disconnect())
      // }}
      walletConnected={true}
      onFaucet={() => {}}
      onDisconnectWallet={() => {}}
      typeOfNetwork={currentNetwork}
      rpc={currentRpc}
      defaultTestnetRPC={defaultTestnetRPC}
      recentPriorityFee={recentPriorityFee}
      // onPrioritySave={() => {
      //   dispatch(
      //     snackbarsActions.add({
      //       message: 'Priority fee updated',
      //       variant: 'success',
      //       persist: false
      //     })
      //   )
      // }}
      onPrioritySave={() => {}}
    />
  )
}

export default HeaderWrapper
