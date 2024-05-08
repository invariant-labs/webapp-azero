import Header from '@components/Header'
import { Keyring, Network, PSP22, initPolkadotApi } from '@invariant-labs/a0-sdk'
import {
  AlephZeroNetworks,
  FAUCET_TOKEN_AMOUNT,
  FaucetDecimal,
  FaucetToken,
  NetworkType
} from '@store/consts/static'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { getAdapter } from '@utils/web3'
import React, { useMemo } from 'react'
import { useDispatch } from 'react-redux'
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
  const dispatch = useDispatch()

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

  const getAddress = async (): Promise<string | null> => {
    const adapter = await getAdapter()

    const accounts = await adapter.accounts.get()

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
      onFaucet={onFaucet}
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
