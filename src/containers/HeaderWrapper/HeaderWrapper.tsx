import Header from '@components/Header/Header'
import { Network } from '@invariant-labs/a0-sdk'
import { RPC, CHAINS } from '@store/consts/static'
import { actions } from '@store/reducers/connection'
import { Status, actions as walletActions } from '@store/reducers/wallet'
import { networkType, rpcAddress } from '@store/selectors/connection'
import { address, status } from '@store/selectors/wallet'
import { openWalletSelectorModal } from '@utils/web3/selector'
import { getAlephZeroWallet } from '@utils/web3/wallet'
import React, { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { Chain } from '@store/consts/types'

export const HeaderWrapper: React.FC = () => {
  const dispatch = useDispatch()
  const walletStatus = useSelector(status)
  const currentNetwork = useSelector(networkType)
  const currentRpc = useSelector(rpcAddress)
  const location = useLocation()
  const walletAddress = useSelector(address)

  useEffect(() => {
    const fetchWallet = async () => {
      const wallet = await getAlephZeroWallet()

      await wallet.canEagerConnect().then(
        async canEagerConnect => {
          if (canEagerConnect) {
            await openWalletSelectorModal()
            dispatch(walletActions.connect(true))
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
    const lastRPC = localStorage.getItem(`INVARIANT_RPC_AlephZero_${currentNetwork}`)

    if (lastRPC === null) {
      localStorage.setItem(`INVARIANT_RPC_AlephZero_${currentNetwork}`, RPC.TEST)
    }

    return lastRPC === null ? RPC.TEST : lastRPC
  }, [])

  const activeChain = CHAINS.find(chain => chain.name === Chain.AlephZero) ?? CHAINS[0]

  return (
    <Header
      address={walletAddress}
      onNetworkSelect={(network, rpcAddress, rpcName) => {
        if (network !== currentNetwork || rpcAddress !== currentRpc) {
          if (network === Network.Testnet) {
            localStorage.setItem(`INVARIANT_RPC_AlephZero_${network}`, rpcAddress)
          }

          dispatch(actions.setNetwork({ networkType: network, rpcAddress, rpcName }))
        }
      }}
      onConnectWallet={async () => {
        await openWalletSelectorModal()
        dispatch(walletActions.connect(false))
      }}
      landing={location.pathname.substring(1)}
      walletConnected={walletStatus === Status.Initialized}
      onDisconnectWallet={() => {
        dispatch(walletActions.disconnect())
      }}
      onFaucet={() => dispatch(walletActions.airdrop())}
      typeOfNetwork={currentNetwork}
      rpc={currentRpc}
      defaultTestnetRPC={defaultTestnetRPC}
      onCopyAddress={() => {
        navigator.clipboard.writeText(walletAddress)

        dispatch(
          snackbarsActions.add({
            message: 'Wallet address copied.',
            variant: 'success',
            persist: false
          })
        )
      }}
      onChangeWallet={() => {
        dispatch(walletActions.reconnect())
      }}
      activeChain={activeChain}
      onChainSelect={chain => {
        if (chain.name !== activeChain.name) {
          window.location.replace(chain.address)
        }
      }}
    />
  )
}

export default HeaderWrapper
