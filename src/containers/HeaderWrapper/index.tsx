import Header from '@components/Header'
import { AlephZeroNetworks, NetworkType } from '@store/consts/static'
import React, { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { actions } from '@store/reducers/connection'
import { Status, actions as walletActions } from '@store/reducers/wallet'
import { useDispatch, useSelector } from 'react-redux'
import { status, address } from '@store/selectors/wallet'
import { network, rpcAddress } from '@store/selectors/connection'
import { openWalletSelectorModal } from '@utils/web3/selector'
import { getAlephZeroWallet } from '@utils/web3/wallet'
export interface IPriorityFeeOptions {
  label: string
  value: number
  saveValue: number
  description: string
}

export const HeaderWrapper: React.FC = () => {
  const dispatch = useDispatch()
  const walletStatus = useSelector(status)
  const currentNetwork = useSelector(network)
  const currentRpc = useSelector(rpcAddress)
  const location = useLocation()
  const walletAddress = useSelector(address)

  useEffect(() => {
    const fetchWallet = async () => {
      const wallet = await getAlephZeroWallet()
      wallet.addListener('connect', () => {
        dispatch(walletActions.connect())
      })
      // if (wallet.connected) {
      //   dispatch(walletActions.connect())
      // }

      await wallet.canEagerConnect().then(
        async canEagerConnect => {
          if (canEagerConnect) {
            // await wallet.connect()

            dispatch(walletActions.connect())
          }
        },
        error => {
          console.log(error)
        }
      )
    }

    fetchWallet()
  }, [])

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
      onNetworkSelect={(network, rpcAddress, rpcName) => {
        if (network !== currentNetwork || rpcAddress !== currentRpc) {
          if (network === NetworkType.TESTNET) {
            localStorage.setItem('INVARIANT_TESTNET_RPC', rpcAddress)
          }

          dispatch(actions.setNetwork({ network, rpcAddress, rpcName }))
        }
      }}
      onConnectWallet={openWalletSelectorModal}
      landing={location.pathname.substring(1)}
      walletConnected={walletStatus === Status.Initialized}
      // onFaucet={() => {
      //   dispatch(walletActions.airdrop())
      // }}
      onDisconnectWallet={() => {
        dispatch(walletActions.disconnect())
      }}
      onFaucet={() => {}}
      typeOfNetwork={currentNetwork}
      rpc={currentRpc}
      defaultTestnetRPC={defaultTestnetRPC}
      recentPriorityFee={recentPriorityFee}
      onPrioritySave={() => {
        dispatch(
          snackbarsActions.add({
            message: 'Priority fee updated',
            variant: 'success',
            persist: false
          })
        )
      }}
    />
  )
}

export default HeaderWrapper
