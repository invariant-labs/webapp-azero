import Header from '@components/Header'
import { Keyring, Network, PSP22, initPolkadotApi } from '@invariant-labs/a0-sdk'
import {
  AlephZeroNetworks,
  FAUCET_TOKEN_AMOUNT,
  FaucetDecimal,
  FaucetToken,
  NetworkType
} from '@store/consts/static'
import { actions } from '@store/reducers/connection'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { Status, actions as walletActions } from '@store/reducers/wallet'
import { network, rpcAddress } from '@store/selectors/connection'
import { address, status } from '@store/selectors/wallet'
import { openWalletSelectorModal } from '@utils/web3/selector'
import { getAlephZeroWallet } from '@utils/web3/wallet'
import React, { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

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

  const getAddress = async (): Promise<string | null> => {
    const wallet = await getAlephZeroWallet()

    const accounts = await wallet.accounts.get()

    if (accounts.length > 0) {
      return accounts[0].address
    } else {
      return null
    }
  }

  const onFaucet = async () => {
    const address = await getAddress()

    if (!address) {
      return dispatch(
        snackbarsActions.add({
          message: 'You have to connect your wallet before claiming the faucet',
          variant: 'error',
          persist: false
        })
      )
    }

    const api = await initPolkadotApi(Network.Testnet)

    const keyring = new Keyring({ type: 'sr25519' })
    const account = keyring.addFromUri('//Alice')

    const data = api.createType('Vec<u8>', [])

    const notRefilledTokens = []

    const psp22 = await PSP22.load(api, Network.Testnet, FaucetToken.BTC, {
      storageDepositLimit: 100000000000,
      refTime: 100000000000,
      proofSize: 100000000000
    })
    let balance = await psp22.balanceOf(account, address)
    let faucetAmount = FAUCET_TOKEN_AMOUNT * 10n ** BigInt(FaucetDecimal.BTC)
    if (balance < faucetAmount) {
      await psp22.mint(account, faucetAmount)
      await psp22.transfer(account, address, faucetAmount, data)

      dispatch(
        snackbarsActions.add({
          message: `Refilled BTC token.`,
          variant: 'success',
          persist: false
        })
      )
    } else {
      notRefilledTokens.push('BTC')
    }

    psp22.setContractAddress(FaucetToken.ETH)
    balance = await psp22.balanceOf(account, address)
    faucetAmount = FAUCET_TOKEN_AMOUNT * 10n ** BigInt(FaucetDecimal.ETH)
    if (balance < faucetAmount) {
      await psp22.mint(account, faucetAmount)
      await psp22.transfer(account, address, faucetAmount, data)

      dispatch(
        snackbarsActions.add({
          message: `Refilled ETH token.`,
          variant: 'success',
          persist: false
        })
      )
    } else {
      notRefilledTokens.push('ETH')
    }

    psp22.setContractAddress(FaucetToken.USDC)
    balance = await psp22.balanceOf(account, address)
    faucetAmount = FAUCET_TOKEN_AMOUNT * 10n ** BigInt(FaucetDecimal.USDC)
    if (balance < faucetAmount) {
      await psp22.mint(account, faucetAmount)
      await psp22.transfer(account, address, faucetAmount, data)

      dispatch(
        snackbarsActions.add({
          message: `Refilled USDC token.`,
          variant: 'success',
          persist: false
        })
      )
    } else {
      notRefilledTokens.push('USDC')
    }

    if (notRefilledTokens.length > 0) {
      return dispatch(
        snackbarsActions.add({
          message: `Didn't refill ${notRefilledTokens.join(', ')} ${notRefilledTokens.length === 1 ? 'token' : 'tokens'} due to high balance.`,
          variant: 'error',
          persist: false
        })
      )
    }
  }

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
      onFaucet={onFaucet}
      typeOfNetwork={currentNetwork}
      rpc={currentRpc}
      defaultTestnetRPC={defaultTestnetRPC}
    />
  )
}

export default HeaderWrapper
